from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from packages.engine.easyflow_engine import WorkflowEngine, WorkflowValidationError, load_workflow_definition
from packages.engine.easyflow_engine.models import WorkflowDefinition, WorkflowEdge, WorkflowNode


class WorkflowEngineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = WorkflowEngine()
        self.definition = load_workflow_definition(ROOT / "examples" / "procurement_workflow.json")

    def test_sample_definition_validates(self) -> None:
        self.engine.validate(self.definition)

    def test_simulation_visits_all_nodes(self) -> None:
        execution = self.engine.simulate_all(self.definition, payload={"sku": "A-100"})
        self.assertTrue(execution.completed)
        self.assertEqual(
            execution.visited_nodes,
            [
                "inventory-check",
                "manager-approval",
                "supplier-allocation",
                "shipment-create",
                "closeout",
            ],
        )

    def test_duplicate_node_ids_are_rejected(self) -> None:
        invalid = WorkflowDefinition(
            id="dup",
            tenant_id="tenant-1",
            name="Invalid",
            description="",
            nodes=[
                WorkflowNode(id="same", name="One", kind="approval"),
                WorkflowNode(id="same", name="Two", kind="shipment"),
            ],
            edges=[],
        )
        with self.assertRaises(WorkflowValidationError):
            self.engine.validate(invalid)

    def test_multiple_start_nodes_are_rejected(self) -> None:
        invalid = WorkflowDefinition(
            id="multi-start",
            tenant_id="tenant-1",
            name="Invalid",
            description="",
            nodes=[
                WorkflowNode(id="a", name="A", kind="approval"),
                WorkflowNode(id="b", name="B", kind="shipment"),
            ],
            edges=[],
        )
        with self.assertRaises(WorkflowValidationError):
            self.engine.validate(invalid)

    def test_cycles_are_rejected(self) -> None:
        invalid = WorkflowDefinition(
            id="cycle",
            tenant_id="tenant-1",
            name="Invalid",
            description="",
            nodes=[
                WorkflowNode(id="a", name="A", kind="approval"),
                WorkflowNode(id="b", name="B", kind="shipment"),
            ],
            edges=[WorkflowEdge(source="a", target="b"), WorkflowEdge(source="b", target="a")],
        )
        with self.assertRaises(WorkflowValidationError):
            self.engine.validate(invalid)


if __name__ == "__main__":
    unittest.main()
