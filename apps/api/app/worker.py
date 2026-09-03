from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from aio_pika import connect_robust, ExchangeType, Message
from prometheus_client import Counter, Gauge, start_http_server

from .config import get_settings
from .db import get_sessionmaker, get_tenant_sessionmaker
from .models import TenantModel, WorkflowDefinitionModel
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from packages.engine.easyflow_engine import WorkflowEngine

logger = logging.getLogger("easyflow.worker")

# Metrics
MESSAGES_CONSUMED = Counter("easyflow_worker_messages_consumed_total", "Messages consumed by the worker")
MESSAGES_FAILED = Counter("easyflow_worker_messages_failed_total", "Messages failed during processing")
MESSAGES_RETRIED = Counter("easyflow_worker_messages_retried_total", "Messages retried")
DLQ_COUNT = Counter("easyflow_worker_dlq_total", "Messages sent to DLQ")
PROCESSING_TIME = Gauge("easyflow_worker_processing_seconds", "Time spent processing messages")

# Retry/backoff configuration (ms)
RETRY_BACKOFF_MS = [5000, 15000, 60000]
MAX_RETRIES = len(RETRY_BACKOFF_MS)


async def process_business_message(payload: dict[str, Any]) -> None:
    """
    Replace this stub with real business logic (workflow execution, DB writes, etc).
    For now it just logs and simulates a transient failure when asked.
    """
    logger.info("Processing payload: %s", payload)
    # Support 'simulate' action which executes the workflow locally and emits a completion event
    tenant_id = payload.get("tenant_id")
    workflow_id = payload.get("workflow_id")
    action = payload.get("action", "simulate")

    if not tenant_id or not workflow_id:
        logger.info("Message missing tenant_id or workflow_id, skipping: %s", payload)
        return

    settings = get_settings()
    engine = WorkflowEngine()

    # find tenant DB URL from central registry
    sessionmaker = get_sessionmaker(settings)
    async with sessionmaker() as session:
        result = await session.execute(select(TenantModel).where(TenantModel.id == tenant_id))
        tenant = result.scalar_one_or_none()
        if tenant is None:
            raise RuntimeError(f"Unknown tenant: {tenant_id}")
        tenant_db_url = tenant.db_url

    # load workflow from tenant DB
    tenant_sessionmaker = get_tenant_sessionmaker(tenant_db_url)
    async with tenant_sessionmaker() as tenant_session:
        result = await tenant_session.execute(
            select(WorkflowDefinitionModel)
            .options(joinedload(WorkflowDefinitionModel.nodes), joinedload(WorkflowDefinitionModel.edges))
            .where(WorkflowDefinitionModel.id == workflow_id)
        )
        model = result.scalar_one_or_none()
        if model is None:
            raise RuntimeError(f"Unknown workflow '{workflow_id}' for tenant '{tenant_id}'")

        # convert model to engine definition
        definition = engine.validate.__self__ if False else None
        # manual conversion
        from packages.engine.easyflow_engine.models import WorkflowDefinition, WorkflowNode, WorkflowEdge

        definition = WorkflowDefinition(
            id=model.id,
            tenant_id=tenant_id,
            name=model.name,
            description=model.description,
            nodes=[WorkflowNode(id=n.node_id, name=n.name, kind=n.kind, config=n.config) for n in model.nodes],
            edges=[WorkflowEdge(source=e.source, target=e.target) for e in model.edges],
        )

        if action == "simulate":
            execution = engine.simulate_all(definition, payload=payload.get("payload"))
        else:
            # default to simulate for now
            execution = engine.simulate_all(definition, payload=payload.get("payload"))

        execution_data = engine.describe_execution(execution)

        # publish execution.completed event to exchange
        conn = await connect_robust(settings.rabbitmq_url)
        async with conn:
            ch = await conn.channel()
            ex = await ch.declare_exchange(settings.rabbitmq_exchange, ExchangeType.TOPIC, durable=True)
            body = json.dumps({"tenant_id": tenant_id, "workflow_id": workflow_id, "execution": execution_data})
            await ex.publish(Message(body.encode("utf-8"), content_type="application/json"), routing_key=f"{settings.rabbitmq_routing_prefix}.execution.completed")


async def _ensure_infrastructure(channel, settings):
    exchange = await channel.declare_exchange(settings.rabbitmq_exchange, ExchangeType.TOPIC, durable=True)

    # retry exchange + queues
    retry_exchange_name = f"{settings.rabbitmq_exchange}.retries"
    retry_exchange = await channel.declare_exchange(retry_exchange_name, ExchangeType.TOPIC, durable=True)

    for idx, ttl in enumerate(RETRY_BACKOFF_MS, start=1):
        qname = f"{settings.rabbitmq_exchange}.retry.{idx}"
        args = {
            "x-message-ttl": ttl,
            "x-dead-letter-exchange": settings.rabbitmq_exchange,
        }
        await channel.declare_queue(qname, durable=True, arguments=args)
        # bind retry queue to retry exchange so we can publish to it
        await channel.declare_queue(qname)  # ensure exists
        await retry_exchange.bind(qname, routing_key="#")

    # DLQ
    dlq_name = f"{settings.rabbitmq_exchange}.dlq"
    await channel.declare_queue(dlq_name, durable=True)

    return exchange, retry_exchange, dlq_name


async def _publish_with_headers(exchange, routing_key: str, payload: dict, headers: dict | None = None, expiration: int | None = None):
    body = json.dumps(payload, default=str).encode("utf-8")
    props = {}
    if headers:
        props["headers"] = headers
    if expiration:
        props["expiration"] = str(expiration)
    await exchange.publish(Message(body, **props), routing_key=routing_key)


async def _handle_message(message) -> None:  # aio-pika delivery wrapper
    async with message.process(requeue=False):
        MESSAGES_CONSUMED.inc()
        try:
            payload = json.loads(message.body.decode("utf-8")) if message.body else {}
            headers = message.headers or {}
            with PROCESSING_TIME.time():
                await process_business_message(payload)
        except Exception as exc:
            MESSAGES_FAILED.inc()
            logger.exception("Message processing failed: %s", exc)
            # implement retry logic based on header
            retries = int((message.headers or {}).get("x-retries", 0))
            settings = get_settings()
            connection = await connect_robust(settings.rabbitmq_url)
            async with connection:
                channel = await connection.channel()
                retry_exchange_name = f"{settings.rabbitmq_exchange}.retries"
                retry_exchange = await channel.declare_exchange(retry_exchange_name, ExchangeType.TOPIC, durable=True)

                if retries < MAX_RETRIES:
                    target_retry_idx = retries + 1
                    target_queue = f"{settings.rabbitmq_exchange}.retry.{target_retry_idx}"
                    MESSAGES_RETRIED.inc()
                    headers = dict(message.headers or {})
                    headers["x-retries"] = retries + 1
                    # publish to retry exchange with routing key matching original
                    await _publish_with_headers(retry_exchange, target_queue, json.loads(message.body.decode("utf-8")), headers=headers, expiration=RETRY_BACKOFF_MS[retries])
                    logger.info("Message scheduled for retry %d (queue=%s)", retries + 1, target_queue)
                else:
                    # send to DLQ
                    dlq_name = f"{settings.rabbitmq_exchange}.dlq"
                    dlq_exchange = await channel.declare_exchange(dlq_name, ExchangeType.FANOUT, durable=True)
                    DLQ_COUNT.inc()
                    await _publish_with_headers(dlq_exchange, dlq_name, json.loads(message.body.decode("utf-8")), headers={"x-retries": retries})
                    logger.info("Message moved to DLQ after %d retries", retries)


async def run_worker(loop: asyncio.AbstractEventLoop | None = None) -> None:
    settings = get_settings()
    loop = loop or asyncio.get_event_loop()

    # start metrics server in background
    start_http_server(8001)
    logger.info("Prometheus metrics exposed on :8001")

    connection = await connect_robust(settings.rabbitmq_url)
    async with connection:
        channel = await connection.channel()
        exchange, retry_exchange, dlq_name = await _ensure_infrastructure(channel, settings)

        queue_name = f"{settings.rabbitmq_exchange}.worker"
        queue = await channel.declare_queue(queue_name, durable=True)
        await queue.bind(exchange, routing_key=f"{settings.rabbitmq_routing_prefix}.#")

        logger.info("Worker is consuming from %s bound to exchange %s", queue_name, settings.rabbitmq_exchange)

        await queue.consume(_handle_message, no_ack=False)

        # keep running
        try:
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            logger.info("Worker cancelled, shutting down")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
