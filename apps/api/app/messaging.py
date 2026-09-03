from __future__ import annotations

import asyncio
import json

from aio_pika import ExchangeType, Message, connect_robust
from dataclasses import dataclass

from .config import Settings


@dataclass(slots=True)
class WorkflowMessage:
    exchange: str
    routing_key: str
    payload: dict


class RabbitMQEventPublisher:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

        self._connection = None
        self._channel = None
        self._lock = __import__("asyncio").Lock()

    def build_workflow_transition_message(self, event_name: str, payload: dict) -> WorkflowMessage:
        routing_key = f"{self.settings.rabbitmq_routing_prefix}.{event_name}"
        return WorkflowMessage(
            exchange=self.settings.rabbitmq_exchange,
            routing_key=routing_key,
            payload=payload,
        )

    def build_notification_message(self, notification_type: str, payload: dict) -> WorkflowMessage:
        routing_key = f"{self.settings.rabbitmq_routing_prefix}.notification.{notification_type}"
        return WorkflowMessage(
            exchange=self.settings.rabbitmq_exchange,
            routing_key=routing_key,
            payload=payload,
        )

    async def publish(self, message: WorkflowMessage) -> None:
        async with self._lock:
            if self._connection is None or self._connection.is_closed:
                self._connection = await connect_robust(self.settings.rabbitmq_url)
                self._channel = await self._connection.channel()

        assert self._channel is not None
        exchange = await self._channel.declare_exchange(
            message.exchange,
            ExchangeType.TOPIC,
            durable=True,
        )
        body = json.dumps(message.payload, default=str).encode("utf-8")
        await exchange.publish(
            Message(body, content_type="application/json"),
            routing_key=message.routing_key,
        )


def messaging_summary(settings: Settings) -> dict[str, str]:
    host_hint = settings.rabbitmq_url.split("@", maxsplit=1)[-1]
    return {
        "provider": "rabbitmq",
        "exchange": settings.rabbitmq_exchange,
        "url_hint": host_hint,
    }
