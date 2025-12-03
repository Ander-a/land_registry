import socketio
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Create Socket.IO server with async support
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Allow all origins for development
    logger=True,
    engineio_logger=True
)

# Create ASGI app
socket_app = socketio.ASGIApp(sio)


class WebSocketService:
    """
    WebSocket service for real-time updates.
    
    Features:
    - Real-time notification delivery
    - Live validation count updates
    - Live consensus percentage updates
    - Badge achievement notifications
    - Trust score updates
    """
    
    def __init__(self):
        self.sio = sio
        self.connected_users = {}  # Maps user_id to session_id
    
    async def emit_to_user(self, user_id: str, event: str, data: Dict[str, Any]):
        """
        Emit an event to a specific user.
        
        Args:
            user_id: Target user ID
            event: Event name
            data: Event data
        """
        try:
            session_id = self.connected_users.get(user_id)
            
            if session_id:
                await self.sio.emit(event, data, room=session_id)
                logger.info(f"Emitted {event} to user {user_id}")
            else:
                logger.debug(f"User {user_id} not connected, skipping event {event}")
        
        except Exception as e:
            logger.error(f"Error emitting to user {user_id}: {e}")
    
    async def emit_to_all(self, event: str, data: Dict[str, Any]):
        """
        Emit an event to all connected users.
        
        Args:
            event: Event name
            data: Event data
        """
        try:
            await self.sio.emit(event, data)
            logger.info(f"Emitted {event} to all users")
        except Exception as e:
            logger.error(f"Error emitting to all: {e}")
    
    async def notify_new_notification(self, user_id: str, notification: Dict[str, Any]):
        """
        Send real-time notification to user.
        
        Args:
            user_id: Target user ID
            notification: Notification data
        """
        await self.emit_to_user(user_id, 'new_notification', notification)
    
    async def notify_validation_received(
        self,
        user_id: str,
        validator_name: str,
        action: str,
        claim_id: str
    ):
        """
        Notify claim owner of new validation in real-time.
        """
        await self.emit_to_user(user_id, 'validation_received', {
            'validator_name': validator_name,
            'action': action,
            'claim_id': claim_id,
            'message': f'{validator_name} {action} your claim'
        })
    
    async def notify_consensus_reached(
        self,
        user_id: str,
        claim_id: str,
        consensus_action: str,
        percentage: float
    ):
        """
        Notify claim owner of consensus result in real-time.
        """
        await self.emit_to_user(user_id, 'consensus_reached', {
            'claim_id': claim_id,
            'action': consensus_action,
            'percentage': percentage,
            'message': f'Consensus reached: {consensus_action} ({percentage}%)'
        })
    
    async def update_validation_count(self, claim_id: str, count: int):
        """
        Broadcast updated validation count for a claim.
        """
        await self.emit_to_all('validation_count_update', {
            'claim_id': claim_id,
            'count': count
        })
    
    async def update_consensus_percentage(
        self,
        claim_id: str,
        vouch_percentage: float,
        dispute_percentage: float,
        unsure_percentage: float
    ):
        """
        Broadcast updated consensus percentages for a claim.
        """
        await self.emit_to_all('consensus_update', {
            'claim_id': claim_id,
            'vouch': vouch_percentage,
            'dispute': dispute_percentage,
            'unsure': unsure_percentage
        })
    
    async def notify_badge_earned(self, user_id: str, badge_name: str, badge_id: str):
        """
        Notify user of badge achievement in real-time.
        """
        await self.emit_to_user(user_id, 'badge_earned', {
            'badge_name': badge_name,
            'badge_id': badge_id,
            'message': f'🏆 You earned the {badge_name} badge!'
        })
    
    async def notify_trust_score_updated(
        self,
        user_id: str,
        old_score: float,
        new_score: float,
        change: float
    ):
        """
        Notify user of trust score change in real-time.
        """
        await self.emit_to_user(user_id, 'trust_score_update', {
            'old_score': old_score,
            'new_score': new_score,
            'change': change,
            'message': f'Trust score {"increased" if change > 0 else "decreased"} by {abs(change):.1f}'
        })
    
    def register_user(self, user_id: str, session_id: str):
        """
        Register a user's WebSocket connection.
        
        Args:
            user_id: User ID
            session_id: Socket.IO session ID
        """
        self.connected_users[user_id] = session_id
        logger.info(f"User {user_id} registered with session {session_id}")
    
    def unregister_user(self, user_id: str):
        """
        Unregister a user's WebSocket connection.
        
        Args:
            user_id: User ID
        """
        if user_id in self.connected_users:
            del self.connected_users[user_id]
            logger.info(f"User {user_id} unregistered")
    
    def get_connected_count(self) -> int:
        """Get count of connected users."""
        return len(self.connected_users)


# Create singleton instance
websocket_service = WebSocketService()


# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_established', {'session_id': sid}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {sid}")
    
    # Find and unregister user
    user_id = None
    for uid, session_id in websocket_service.connected_users.items():
        if session_id == sid:
            user_id = uid
            break
    
    if user_id:
        websocket_service.unregister_user(user_id)


@sio.event
async def authenticate(sid, data):
    """
    Authenticate user and register their connection.
    
    Client should send: { 'user_id': 'xxx', 'token': 'jwt_token' }
    """
    try:
        user_id = data.get('user_id')
        token = data.get('token')
        
        if not user_id:
            await sio.emit('auth_error', {'message': 'user_id required'}, room=sid)
            return
        
        # TODO: Verify JWT token
        # For now, we'll just register the user
        websocket_service.register_user(user_id, sid)
        
        await sio.emit('authenticated', {
            'user_id': user_id,
            'message': 'Successfully authenticated'
        }, room=sid)
        
        logger.info(f"User {user_id} authenticated with session {sid}")
    
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        await sio.emit('auth_error', {'message': str(e)}, room=sid)


@sio.event
async def ping(sid):
    """Handle ping requests for keep-alive."""
    await sio.emit('pong', {}, room=sid)


@sio.event
async def get_status(sid):
    """Get WebSocket service status."""
    await sio.emit('status', {
        'connected_users': websocket_service.get_connected_count(),
        'session_id': sid
    }, room=sid)
