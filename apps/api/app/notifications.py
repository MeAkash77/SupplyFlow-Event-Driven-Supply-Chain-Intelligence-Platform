from __future__ import annotations

from .access import AuthorizationError, Role, UserContext
from .messaging import RabbitMQEventPublisher


class NotificationService:
    def __init__(self, publisher: RabbitMQEventPublisher) -> None:
        self.publisher = publisher

    async def send_ping(self, actor: UserContext) -> dict[str, str]:
        message = self.publisher.build_notification_message(
            "ping",
            {
                "tenant_id": actor.tenant_id,
                "actor_id": actor.id,
                "actor_role": actor.role,
                "message": "Health ping from API gateway.",
            },
        )
        await self.publisher.publish(message)
        return {
            "status": "sent",
            "routing_key": message.routing_key,
            "tenant_id": actor.tenant_id,
        }

    async def publish_alert(self, alert_data: dict, actor: UserContext) -> dict[str, str]:
        if actor.role != Role.SUPERADMIN and actor.tenant_id != alert_data["tenant_id"]:
            raise AuthorizationError(
                "Only superadmins or same-tenant actors may publish tenant alerts."
            )

        message = self.publisher.build_notification_message(
            "alert",
            {
                "tenant_id": alert_data["tenant_id"],
                "level": alert_data["level"],
                "title": alert_data["title"],
                "message": alert_data["message"],
                "details": alert_data.get("details", {}),
                "sent_by": actor.id,
            },
        )
        await self.publisher.publish(message)
        return {
            "status": "sent",
            "routing_key": message.routing_key,
            "tenant_id": alert_data["tenant_id"],
        }
