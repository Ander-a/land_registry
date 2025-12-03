from datetime import datetime
from typing import Optional, List, Dict
import logging

from app.models.notification import (
    Notification, 
    NotificationPreference,
    NotificationCreate,
    NotificationType,
    NotificationPriority
)
from app.models.approval_action import ApprovalDecision

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for creating and managing notifications.
    
    Features:
    - Create notifications for various events
    - Check user preferences before sending
    - Batch notification creation
    - Notification templates
    - Real-time WebSocket delivery
    """
    
    def __init__(self):
        # Import websocket_service here to avoid circular imports
        from app.services.websocket_service import websocket_service
        self.websocket_service = websocket_service
    
    async def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        priority: str = NotificationPriority.MEDIUM,
        claim_id: Optional[str] = None,
        validation_id: Optional[str] = None,
        badge_id: Optional[str] = None,
        data: Optional[Dict] = None,
        action_url: Optional[str] = None
    ) -> Optional[Notification]:
        """
        Create a notification for a user.
        
        Checks user preferences before creating notification.
        Returns None if user has disabled this notification type.
        """
        try:
            # Check if user wants this notification type
            should_send = await self._check_user_preference(user_id, notification_type)
            
            if not should_send:
                logger.info(f"User {user_id} has disabled {notification_type} notifications")
                return None
            
            # Create notification
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                priority=priority,
                claim_id=claim_id,
                validation_id=validation_id,
                badge_id=badge_id,
                data=data or {},
                action_url=action_url,
                created_at=datetime.utcnow()
            )
            
            await notification.save()
            logger.info(f"Created {notification_type} notification for user {user_id}")
            
            # Send real-time notification via WebSocket
            try:
                await self.websocket_service.notify_new_notification(
                    user_id=user_id,
                    notification={
                        'id': str(notification.id),
                        'type': notification_type,
                        'title': title,
                        'message': message,
                        'priority': priority,
                        'claim_id': claim_id,
                        'validation_id': validation_id,
                        'badge_id': badge_id,
                        'action_url': action_url,
                        'created_at': notification.created_at.isoformat() if notification.created_at else None
                    }
                )
            except Exception as ws_error:
                # Don't fail notification creation if WebSocket fails
                logger.warning(f"Failed to send WebSocket notification: {ws_error}")
            
            return notification
        
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None
    
    async def _check_user_preference(self, user_id: str, notification_type: str) -> bool:
        """Check if user wants to receive this notification type."""
        try:
            preferences = await NotificationPreference.find_one(
                NotificationPreference.user_id == user_id
            )
            
            if not preferences:
                # No preferences set, default to enabled
                return True
            
            # Check if notification type is enabled
            type_field = notification_type
            if hasattr(preferences, type_field):
                return getattr(preferences, type_field)
            
            return True
        
        except Exception as e:
            logger.error(f"Error checking user preference: {e}")
            return True  # Default to sending on error
    
    # Template methods for common notification types
    
    async def notify_validation_received(
        self,
        claim_owner_id: str,
        validator_name: str,
        action: str,
        claim_id: str,
        validation_id: str
    ):
        """Notify claim owner that someone validated their claim."""
        action_map = {
            'vouch': 'vouched for',
            'dispute': 'disputed',
            'unsure': 'marked as unsure'
        }
        action_text = action_map.get(action, action)
        
        return await self.create_notification(
            user_id=claim_owner_id,
            notification_type=NotificationType.VALIDATION_RECEIVED,
            title=f"New Validation: {validator_name}",
            message=f"{validator_name} {action_text} your land claim",
            priority=NotificationPriority.MEDIUM,
            claim_id=claim_id,
            validation_id=validation_id,
            data={'validator_name': validator_name, 'action': action},
            action_url=f"/claim/{claim_id}"
        )
    
    async def notify_consensus_reached(
        self,
        claim_owner_id: str,
        claim_id: str,
        consensus_action: str,
        confidence_level: str,
        percentage: float
    ):
        """Notify claim owner that consensus has been reached."""
        is_validated = consensus_action == 'validated'
        
        title = "✅ Claim Validated!" if is_validated else "❌ Claim Rejected"
        message = (
            f"Your land claim has been {consensus_action} by the community with "
            f"{percentage}% consensus ({confidence_level} confidence)"
        )
        
        return await self.create_notification(
            user_id=claim_owner_id,
            notification_type=NotificationType.CONSENSUS_REACHED,
            title=title,
            message=message,
            priority=NotificationPriority.HIGH,
            claim_id=claim_id,
            data={
                'consensus_action': consensus_action,
                'confidence_level': confidence_level,
                'percentage': percentage
            },
            action_url=f"/claim/{claim_id}"
        )
    
    async def notify_badge_earned(
        self,
        user_id: str,
        badge_name: str,
        badge_description: str,
        badge_id: str
    ):
        """Notify user that they earned a badge."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.BADGE_EARNED,
            title=f"🏆 Badge Earned: {badge_name}",
            message=f"Congratulations! You've earned the '{badge_name}' badge. {badge_description}",
            priority=NotificationPriority.MEDIUM,
            badge_id=badge_id,
            data={'badge_name': badge_name, 'description': badge_description},
            action_url="/community/score"
        )
    
    async def notify_trust_score_updated(
        self,
        user_id: str,
        old_score: float,
        new_score: float,
        reason: str,
        validation_id: Optional[str] = None
    ):
        """Notify user of trust score change."""
        change = new_score - old_score
        direction = "increased" if change > 0 else "decreased"
        emoji = "📈" if change > 0 else "📉"
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.TRUST_SCORE_UPDATED,
            title=f"{emoji} Trust Score {direction.capitalize()}",
            message=f"Your trust score {direction} by {abs(change):.1f} points (now {new_score:.1f}). Reason: {reason}",
            priority=NotificationPriority.LOW,
            validation_id=validation_id,
            data={'old_score': old_score, 'new_score': new_score, 'change': change},
            action_url="/community/score"
        )
    
    async def notify_new_claim_nearby(
        self,
        user_id: str,
        claim_id: str,
        location: str,
        distance_km: float,
        claimant_name: str
    ):
        """Notify validators of new claims near them."""
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.NEW_CLAIM_NEARBY,
            title="📍 New Claim Near You",
            message=f"{claimant_name} submitted a claim in {location} ({distance_km:.1f} km away)",
            priority=NotificationPriority.LOW,
            claim_id=claim_id,
            data={'location': location, 'distance_km': distance_km, 'claimant_name': claimant_name},
            action_url=f"/community/validate/{claim_id}"
        )
    
    async def notify_dispute_raised(
        self,
        claim_owner_id: str,
        validator_name: str,
        reason: str,
        claim_id: str,
        validation_id: str
    ):
        """Notify claim owner that someone disputed their claim."""
        return await self.create_notification(
            user_id=claim_owner_id,
            notification_type=NotificationType.DISPUTE_RAISED,
            title="⚠️ Dispute Raised",
            message=f"{validator_name} disputed your claim. Reason: {reason}",
            priority=NotificationPriority.HIGH,
            claim_id=claim_id,
            validation_id=validation_id,
            data={'validator_name': validator_name, 'reason': reason},
            action_url=f"/claim/{claim_id}"
        )
    
    async def notify_validation_outcome(
        self,
        validator_id: str,
        was_correct: bool,
        claim_id: str,
        validation_id: str,
        trust_score_impact: float
    ):
        """Notify validator whether their validation was correct or incorrect."""
        if was_correct:
            return await self.create_notification(
                user_id=validator_id,
                notification_type=NotificationType.VALIDATION_CORRECT,
                title="✅ Validation Correct",
                message=f"Your validation matched the consensus! +{trust_score_impact:.1f} trust score",
                priority=NotificationPriority.LOW,
                claim_id=claim_id,
                validation_id=validation_id,
                data={'trust_score_impact': trust_score_impact},
                action_url="/community/score"
            )
        else:
            return await self.create_notification(
                user_id=validator_id,
                notification_type=NotificationType.VALIDATION_INCORRECT,
                title="❌ Validation Incorrect",
                message=f"Your validation did not match the consensus. {trust_score_impact:.1f} trust score",
                priority=NotificationPriority.MEDIUM,
                claim_id=claim_id,
                validation_id=validation_id,
                data={'trust_score_impact': trust_score_impact},
                action_url=f"/claim/{claim_id}"
            )
    
    async def batch_create_notifications(
        self,
        notifications: List[NotificationCreate]
    ) -> List[Notification]:
        """Create multiple notifications at once."""
        created = []
        
        for notif_data in notifications:
            notification = await self.create_notification(
                user_id=notif_data.user_id,
                notification_type=notif_data.type,
                title=notif_data.title,
                message=notif_data.message,
                priority=notif_data.priority,
                claim_id=notif_data.claim_id,
                validation_id=notif_data.validation_id,
                badge_id=notif_data.badge_id,
                data=notif_data.data,
                action_url=notif_data.action_url
            )
            
            if notification:
                created.append(notification)
        
        logger.info(f"Batch created {len(created)} notifications")
        return created
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark a notification as read."""
        try:
            notification = await Notification.get(notification_id)
            if not notification:
                return False
            
            notification.read = True
            notification.read_at = datetime.utcnow()
            await notification.save()
            
            return True
        
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications for a user as read."""
        try:
            notifications = await Notification.find(
                Notification.user_id == user_id,
                Notification.read == False
            ).to_list()
            
            count = 0
            for notification in notifications:
                notification.read = True
                notification.read_at = datetime.utcnow()
                await notification.save()
                count += 1
            
            logger.info(f"Marked {count} notifications as read for user {user_id}")
            return count
        
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return 0
    
    async def delete_notification(self, notification_id: str) -> bool:
        """Delete a notification."""
        try:
            notification = await Notification.get(notification_id)
            if not notification:
                return False
            
            await notification.delete()
            return True
        
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return False
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        skip: int = 0
    ) -> List[Notification]:
        """Get notifications for a user."""
        try:
            query = {"user_id": user_id}
            if unread_only:
                query["read"] = False
            
            notifications = await Notification.find(
                query
            ).sort("-created_at").skip(skip).limit(limit).to_list()
            
            return notifications
        
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []
    
    async def get_notification_stats(self, user_id: str) -> Dict:
        """Get notification statistics for a user."""
        try:
            all_notifications = await Notification.find(
                Notification.user_id == user_id
            ).to_list()
            
            unread = [n for n in all_notifications if not n.read]
            
            by_type = {}
            by_priority = {}
            
            for notification in all_notifications:
                by_type[notification.type] = by_type.get(notification.type, 0) + 1
                by_priority[notification.priority] = by_priority.get(notification.priority, 0) + 1
            
            return {
                'total': len(all_notifications),
                'unread': len(unread),
                'by_type': by_type,
                'by_priority': by_priority
            }
        
        except Exception as e:
            logger.error(f"Error getting notification stats: {e}")
            return {'total': 0, 'unread': 0, 'by_type': {}, 'by_priority': {}}
    
    async def get_or_create_preferences(self, user_id: str) -> NotificationPreference:
        """Get user's notification preferences or create default ones."""
        try:
            preferences = await NotificationPreference.find_one(
                NotificationPreference.user_id == user_id
            )
            
            if not preferences:
                preferences = NotificationPreference(user_id=user_id)
                await preferences.save()
                logger.info(f"Created default notification preferences for user {user_id}")
            
            return preferences
        
        except Exception as e:
            logger.error(f"Error getting/creating preferences: {e}")
            return None
    
    async def update_preferences(
        self,
        user_id: str,
        preferences_data: Dict
    ) -> Optional[NotificationPreference]:
        """Update user's notification preferences."""
        try:
            preferences = await self.get_or_create_preferences(user_id)
            
            if not preferences:
                return None
            
            # Update fields
            for key, value in preferences_data.items():
                if hasattr(preferences, key):
                    setattr(preferences, key, value)
            
            preferences.updated_at = datetime.utcnow()
            await preferences.save()
            
            logger.info(f"Updated notification preferences for user {user_id}")
            return preferences
        
        except Exception as e:
            logger.error(f"Error updating preferences: {e}")
            return None
    
    async def send_approval_notification(
        self,
        user_id: str,
        claim_id: str,
        decision: ApprovalDecision,
        reason: str,
        recommendations: Optional[str] = None
    ):
        """
        Send notification to claimant about approval decision.
        """
        try:
            # Create notification message based on decision
            if decision == ApprovalDecision.APPROVED:
                title = "Claim Approved! 🎉"
                message = f"Your land claim has been approved. {reason}"
                type_val = NotificationType.CLAIM_APPROVED
                priority = NotificationPriority.HIGH
            elif decision == ApprovalDecision.REJECTED:
                title = "Claim Rejected"
                message = f"Your land claim has been rejected. Reason: {reason}"
                type_val = NotificationType.CLAIM_REJECTED
                priority = NotificationPriority.HIGH
            elif decision == ApprovalDecision.CONDITIONAL:
                title = "Conditional Approval"
                message = f"Your land claim has been conditionally approved. {reason}"
                type_val = NotificationType.CLAIM_APPROVED
                priority = NotificationPriority.MEDIUM
            else:  # REFERRED
                title = "Claim Referred"
                message = f"Your land claim has been referred to higher authority. {reason}"
                type_val = NotificationType.CLAIM_APPROVED
                priority = NotificationPriority.MEDIUM
            
            # Add recommendations if provided
            if recommendations:
                message += f"\n\nRecommendations: {recommendations}"
            
            # Create notification using the existing method
            await self.create_notification(
                user_id=user_id,
                notification_type=type_val,
                title=title,
                message=message,
                priority=priority,
                claim_id=claim_id,
                data={'decision': decision, 'reason': reason, 'recommendations': recommendations},
                action_url=f"/claim/{claim_id}"
            )
            
            logger.info(f"Sent approval notification to user {user_id} for claim {claim_id}")
            
        except Exception as e:
            logger.error(f"Error sending approval notification: {e}")
            raise
