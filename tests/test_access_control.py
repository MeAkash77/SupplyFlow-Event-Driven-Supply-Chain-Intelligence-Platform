from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from apps.api.app.access import AuthorizationError
from apps.api.app.store import EasyFlowStore
from apps.api.app.config import Settings


class AccessControlTests(unittest.TestCase):
    def setUp(self) -> None:
        self.store = EasyFlowStore(settings=Settings())
        self.superadmin = self.store.get_actor("superadmin-1")
        self.acme_admin = self.store.get_actor("tenant-admin-acme")
        self.nova_admin = self.store.get_actor("tenant-admin-nova")

    def test_superadmin_can_see_all_tenants_and_workflows(self) -> None:
        self.assertIsNotNone(self.superadmin)
        tenants = self.store.list_tenants(self.superadmin)
        workflows = self.store.list_workflow_definitions(self.superadmin)
        self.assertEqual(len(tenants), 5)
        self.assertEqual(len(workflows), 5)

    def test_tenant_admin_is_scoped_to_own_tenant(self) -> None:
        self.assertIsNotNone(self.acme_admin)
        tenants = self.store.list_tenants(self.acme_admin)
        workflows = self.store.list_workflow_definitions(self.acme_admin)
        self.assertEqual([item["id"] for item in tenants], ["tenant-acme"])
        self.assertEqual([item["tenant_id"] for item in workflows], ["tenant-acme"])

    def test_tenant_admin_cannot_access_other_tenant_workflow(self) -> None:
        self.assertIsNotNone(self.acme_admin)
        with self.assertRaises(AuthorizationError):
            self.store.get_workflow_definition("wf-nova-replenishment", self.acme_admin)

    def test_tenant_admin_can_simulate_own_workflow(self) -> None:
        self.assertIsNotNone(self.nova_admin)
        response = self.store.simulate_workflow(
            "wf-nova-replenishment",
            self.nova_admin,
            payload={"sku": "N-200"},
        )
        self.assertEqual(response["access_scope"]["tenant_id"], "tenant-nova")
        self.assertEqual(response["access_scope"]["actor_role"], "tenant_admin")

    def test_new_tenant_admin_can_only_see_their_tenant(self) -> None:
        solstice_admin = self.store.get_actor("tenant-admin-solstice")
        self.assertIsNotNone(solstice_admin)
        tenants = self.store.list_tenants(solstice_admin)
        workflows = self.store.list_workflow_definitions(solstice_admin)
        self.assertEqual([item["id"] for item in tenants], ["tenant-solstice"])
        self.assertEqual([item["id"] for item in workflows], ["wf-solstice-launch-allocation"])


if __name__ == "__main__":
    unittest.main()
