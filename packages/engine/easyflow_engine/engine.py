from __future__ import annotations

import json
from collections import defaultdict, deque
from dataclasses import asdict
from pathlib import Path

from .models import WorkflowDefinition, WorkflowEdge, WorkflowEvent, WorkflowExecution, WorkflowNode


class WorkflowValidationError(ValueError):
    pass


def load_workflow_definition(path: str | Path) -> WorkflowDefinition:
    raw = json.loads(Path(path).read_text())
    return WorkflowDefinition(
        id=raw["id"],
        tenant_id=raw["tenant_id"],
        name=raw["name"],
        description=raw.get("description", ""),
        nodes=[WorkflowNode(**node) for node in raw["nodes"]],
        edges=[WorkflowEdge(**edge) for edge in raw["edges"]],
    )


class WorkflowEngine:
    def validate(self, definition: WorkflowDefinition) -> None:
        node_ids = [node.id for node in definition.nodes]
        if len(node_ids) != len(set(node_ids)):
            raise WorkflowValidationError("Workflow contains duplicate node ids.")

        node_lookup = {node.id: node for node in definition.nodes}
        if not node_lookup:
            raise WorkflowValidationError("Workflow must define at least one node.")

        inbound = defaultdict(int)
        adjacency = defaultdict(list)
        for edge in definition.edges:
            if edge.source not in node_lookup:
                raise WorkflowValidationError(f"Unknown edge source: {edge.source}")
            if edge.target not in node_lookup:
                raise WorkflowValidationError(f"Unknown edge target: {edge.target}")
            adjacency[edge.source].append(edge.target)
            inbound[edge.target] += 1

        starts = [node.id for node in definition.nodes if inbound[node.id] == 0]
        if len(starts) != 1:
            raise WorkflowValidationError(
                "Workflow must have exactly one start node with no inbound edges."
            )

        if self._has_cycle(node_ids, adjacency, inbound):
            raise WorkflowValidationError("Workflow graph must be acyclic for MVP execution.")

        reachable = self._reachable_nodes(starts[0], adjacency)
        if len(reachable) != len(node_lookup):
            unreachable = sorted(set(node_lookup) - reachable)
            raise WorkflowValidationError(
                f"Workflow contains unreachable nodes: {', '.join(unreachable)}"
            )

    def start(self, definition: WorkflowDefinition, payload: dict | None = None) -> WorkflowExecution:
        self.validate(definition)
        start_node = self._start_node_id(definition)
        execution = WorkflowExecution(
            workflow_id=definition.id,
            tenant_id=definition.tenant_id,
            current_node_id=start_node,
            visited_nodes=[start_node],
            payload=payload or {},
        )
        execution.events.append(
            WorkflowEvent(
                step=1,
                node_id=start_node,
                actor="system",
                action="entered",
                detail=f"Execution started at node '{start_node}'.",
            )
        )
        return execution

    def advance(
        self,
        definition: WorkflowDefinition,
        execution: WorkflowExecution,
        actor: str = "system",
        target_node_id: str | None = None,
    ) -> WorkflowExecution:
        if execution.completed:
            raise WorkflowValidationError("Execution is already complete.")

        self.validate(definition)
        transitions = self.available_transitions(definition, execution.current_node_id)
        if not transitions:
            execution.completed = True
            execution.events.append(
                WorkflowEvent(
                    step=len(execution.events) + 1,
                    node_id=execution.current_node_id,
                    actor=actor,
                    action="completed",
                    detail=f"Execution completed at node '{execution.current_node_id}'.",
                )
            )
            return execution

        if target_node_id is None:
            target_node_id = transitions[0]

        if target_node_id not in transitions:
            raise WorkflowValidationError(
                f"Invalid transition from '{execution.current_node_id}' to '{target_node_id}'."
            )

        execution.current_node_id = target_node_id
        execution.visited_nodes.append(target_node_id)
        execution.events.append(
            WorkflowEvent(
                step=len(execution.events) + 1,
                node_id=target_node_id,
                actor=actor,
                action="transitioned",
                detail=f"Moved execution to node '{target_node_id}'.",
            )
        )

        if not self.available_transitions(definition, target_node_id):
            execution.completed = True
            execution.events.append(
                WorkflowEvent(
                    step=len(execution.events) + 1,
                    node_id=target_node_id,
                    actor=actor,
                    action="completed",
                    detail=f"Execution completed at terminal node '{target_node_id}'.",
                )
            )

        return execution

    def simulate_all(
        self,
        definition: WorkflowDefinition,
        payload: dict | None = None,
        actor: str = "simulation",
    ) -> WorkflowExecution:
        execution = self.start(definition, payload=payload)
        while not execution.completed:
            execution = self.advance(definition, execution, actor=actor)
        return execution

    def available_transitions(self, definition: WorkflowDefinition, node_id: str) -> list[str]:
        return [edge.target for edge in definition.edges if edge.source == node_id]

    def describe_execution(self, execution: WorkflowExecution) -> dict:
        return {
            "workflow_id": execution.workflow_id,
            "tenant_id": execution.tenant_id,
            "current_node_id": execution.current_node_id,
            "visited_nodes": execution.visited_nodes,
            "completed": execution.completed,
            "events": [asdict(event) for event in execution.events],
            "payload": execution.payload,
        }

    def _start_node_id(self, definition: WorkflowDefinition) -> str:
        inbound = defaultdict(int)
        for edge in definition.edges:
            inbound[edge.target] += 1
        for node in definition.nodes:
            if inbound[node.id] == 0:
                return node.id
        raise WorkflowValidationError("Workflow has no start node.")

    def _reachable_nodes(self, start_node_id: str, adjacency: dict[str, list[str]]) -> set[str]:
        visited = set()
        queue = deque([start_node_id])
        while queue:
            node_id = queue.popleft()
            if node_id in visited:
                continue
            visited.add(node_id)
            for neighbor in adjacency[node_id]:
                queue.append(neighbor)
        return visited

    def _has_cycle(
        self,
        node_ids: list[str],
        adjacency: dict[str, list[str]],
        inbound: dict[str, int],
    ) -> bool:
        counts = {node_id: inbound[node_id] for node_id in node_ids}
        queue = deque([node_id for node_id in node_ids if counts[node_id] == 0])
        visited = 0
        while queue:
            node_id = queue.popleft()
            visited += 1
            for neighbor in adjacency[node_id]:
                counts[neighbor] -= 1
                if counts[neighbor] == 0:
                    queue.append(neighbor)
        return visited != len(node_ids)
