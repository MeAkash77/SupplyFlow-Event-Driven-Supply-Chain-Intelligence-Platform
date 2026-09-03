from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class WorkflowNode:
    id: str
    name: str
    kind: str
    config: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class WorkflowEdge:
    source: str
    target: str


@dataclass(slots=True)
class WorkflowDefinition:
    id: str
    tenant_id: str
    name: str
    description: str
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]


@dataclass(slots=True)
class WorkflowEvent:
    step: int
    node_id: str
    actor: str
    action: str
    detail: str


@dataclass(slots=True)
class WorkflowExecution:
    workflow_id: str
    tenant_id: str
    current_node_id: str
    visited_nodes: list[str] = field(default_factory=list)
    events: list[WorkflowEvent] = field(default_factory=list)
    completed: bool = False
    payload: dict[str, Any] = field(default_factory=dict)
