from datetime import datetime
from typing import Optional, Dict, List
import logging

from app.models.validation import Validation, ValidationConsensus
from app.models.claim import Claim
from app.models.user import User
from app.services.geolocation_service import GeolocationService
from app.services.notification_service import NotificationService
from app.services.activity_log_service import ActivityLogService

logger = logging.getLogger(__name__)


class ConsensusEngine:
    """
    Consensus engine for decentralized claim validation.
    
    Key Features:
    - Minimum 3 validators required for consensus
    - 70% threshold for consensus (weighted voting)
    - Trust score weighting (higher trust = more weight)
    - Distance weighting (closer validators = more weight)
    - Automatic claim status updates
    """
    
    # Configuration
    MINIMUM_VALIDATORS = 3
    CONSENSUS_THRESHOLD = 0.70  # 70%
    
    # Trust score weighting
    MIN_TRUST_SCORE = 0
    MAX_TRUST_SCORE = 100
    
    # Distance weighting (in kilometers)
    MAX_WEIGHTED_DISTANCE = 50  # Beyond this, weight decreases significantly
    
    def __init__(self):
        self.geo_service = GeolocationService()
        self.notification_service = NotificationService()
        # Import websocket_service here to avoid circular imports
        from app.services.websocket_service import websocket_service
        self.websocket_service = websocket_service
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula.
        Delegates to GeolocationService for consistency.
        """
        return self.geo_service.calculate_distance(lat1, lon1, lat2, lon2)
    
    def calculate_trust_weight(self, trust_score: float) -> float:
        """
        Calculate weight multiplier based on validator's trust score.
        
        Trust Score Range -> Weight Multiplier
        90-100: 2.0x
        80-89:  1.5x
        70-79:  1.25x
        60-69:  1.0x
        50-59:  0.75x
        <50:    0.5x
        """
        if trust_score >= 90:
            return 2.0
        elif trust_score >= 80:
            return 1.5
        elif trust_score >= 70:
            return 1.25
        elif trust_score >= 60:
            return 1.0
        elif trust_score >= 50:
            return 0.75
        else:
            return 0.5
    
    def calculate_distance_weight(self, distance_km: Optional[float] = None) -> float:
        """
        Calculate weight multiplier based on distance to claim.
        Delegates to GeolocationService for consistency.
        """
        if distance_km is None:
            return 1.0
        return self.geo_service.calculate_distance_weight(distance_km, weight_scheme="standard")
    
    def calculate_validation_weight(
        self, 
        trust_score: float, 
        distance_km: Optional[float] = None
    ) -> float:
        """
        Calculate total weight for a validation based on trust score and distance.
        
        Base weight = 1.0
        Final weight = base * trust_weight * distance_weight
        """
        base_weight = 1.0
        trust_weight = self.calculate_trust_weight(trust_score)
        
        if distance_km is not None:
            distance_weight = self.calculate_distance_weight(distance_km)
            return base_weight * trust_weight * distance_weight
        
        return base_weight * trust_weight
    
    async def process_validation(
        self, 
        validation: Validation, 
        claim: Claim
    ) -> ValidationConsensus:
        """
        Process a new validation and update consensus.
        
        Steps:
        1. Calculate validation weight
        2. Update or create consensus record
        3. Check if consensus is reached
        4. Update claim status if consensus reached
        5. Update validator trust scores
        
        Returns the updated consensus record.
        """
        # Calculate distance if validator location provided
        distance_km = None
        if validation.validator_location and claim.location:
            try:
                # Assuming claim has coordinates
                if hasattr(claim, 'coordinates') and claim.coordinates:
                    claim_lat = claim.coordinates.get('lat')
                    claim_lon = claim.coordinates.get('lon')
                    val_lat = validation.validator_location.get('lat')
                    val_lon = validation.validator_location.get('lon')
                    
                    if all([claim_lat, claim_lon, val_lat, val_lon]):
                        distance_km = self.calculate_distance(
                            claim_lat, claim_lon, val_lat, val_lon
                        )
                        validation.distance_to_claim = distance_km
            except Exception as e:
                logger.warning(f"Error calculating distance: {e}")
        
        # Calculate validation weight
        weight = self.calculate_validation_weight(
            validation.validator_trust_score,
            distance_km
        )
        validation.weight = weight
        await validation.save()
        
        # Get or create consensus record
        consensus = await ValidationConsensus.find_one(
            ValidationConsensus.claim_id == str(claim.id)
        )
        
        if not consensus:
            consensus = ValidationConsensus(
                claim_id=str(claim.id),
                first_validation_at=validation.created_at
            )
        
        # Update consensus counts and weights
        consensus.total_validations += 1
        
        if validation.action == "vouch":
            consensus.vouch_count += 1
            consensus.vouch_weight += weight
        elif validation.action == "dispute":
            consensus.dispute_count += 1
            consensus.dispute_weight += weight
        elif validation.action == "unsure":
            consensus.unsure_count += 1
            consensus.unsure_weight += weight
        
        consensus.total_weight += weight
        consensus.last_updated_at = datetime.utcnow()
        
        # Calculate statistics
        all_validations = await Validation.find(
            Validation.claim_id == str(claim.id)
        ).to_list()
        
        if all_validations:
            trust_scores = [v.validator_trust_score for v in all_validations]
            consensus.avg_validator_trust_score = sum(trust_scores) / len(trust_scores)
            
            distances = [v.distance_to_claim for v in all_validations if v.distance_to_claim is not None]
            if distances:
                consensus.avg_distance_to_claim = sum(distances) / len(distances)
        
        # Emit real-time validation count update
        try:
            await self.websocket_service.update_validation_count(
                claim_id=str(claim.id),
                count=consensus.total_validations
            )
        except Exception as ws_error:
            logger.warning(f"Failed to emit validation count update: {ws_error}")
        
        # Calculate and emit consensus percentages
        if consensus.total_weight > 0:
            vouch_pct = (consensus.vouch_weight / consensus.total_weight) * 100
            dispute_pct = (consensus.dispute_weight / consensus.total_weight) * 100
            unsure_pct = (consensus.unsure_weight / consensus.total_weight) * 100
            
            try:
                await self.websocket_service.update_consensus_percentage(
                    claim_id=str(claim.id),
                    vouch_percentage=round(vouch_pct, 2),
                    dispute_percentage=round(dispute_pct, 2),
                    unsure_percentage=round(unsure_pct, 2)
                )
            except Exception as ws_error:
                logger.warning(f"Failed to emit consensus percentage update: {ws_error}")
        
        # Check if minimum validations requirement met
        consensus.minimum_validations_met = consensus.total_validations >= self.MINIMUM_VALIDATORS
        
        # Check consensus
        if consensus.minimum_validations_met:
            consensus_result = self.check_consensus(consensus)
            
            if consensus_result['reached']:
                consensus.consensus_reached = True
                consensus.consensus_action = consensus_result['action']
                consensus.consensus_percentage = consensus_result['percentage']
                consensus.confidence_level = consensus_result['confidence_level']
                consensus.consensus_threshold_met = True
                consensus.consensus_reached_at = datetime.utcnow()
                
                # Update claim status
                await self.update_claim_status(claim, consensus_result['action'])
                
                # Log consensus activity
                if claim.jurisdiction_id:
                    try:
                        await ActivityLogService.log_claim_activity(
                            claim_id=str(claim.id),
                            activity_type="validation",
                            description=f"Community consensus reached: {consensus_result['action']} ({consensus_result['percentage']}%)",
                            status=consensus_result['action'].replace('validated', 'approved').replace('rejected', 'rejected')
                        )
                    except Exception as log_error:
                        logger.warning(f"Failed to log consensus activity: {log_error}")
                
                # Notify claim owner of consensus
                await self.notification_service.notify_consensus_reached(
                    claim_owner_id=str(claim.user_id),
                    claim_id=str(claim.id),
                    consensus_action=consensus_result['action'],
                    confidence_level=consensus_result['confidence_level'],
                    percentage=consensus_result['percentage']
                )
                
                # Update validator trust scores
                await self.update_validator_trust_scores(claim.id, consensus_result['action'])
        
        await consensus.save()
        return consensus
    
    def check_consensus(self, consensus: ValidationConsensus) -> Dict:
        """
        Check if consensus has been reached based on weighted votes.
        
        Returns dict with:
        - reached: bool
        - action: str (validated/rejected)
        - percentage: float
        - confidence_level: str
        """
        if consensus.total_weight == 0:
            return {'reached': False}
        
        # Calculate percentages based on weighted votes
        vouch_percentage = (consensus.vouch_weight / consensus.total_weight) * 100
        dispute_percentage = (consensus.dispute_weight / consensus.total_weight) * 100
        
        # Check if vouch reaches threshold
        if vouch_percentage >= (self.CONSENSUS_THRESHOLD * 100):
            confidence = self._get_confidence_level(vouch_percentage)
            return {
                'reached': True,
                'action': 'validated',
                'percentage': round(vouch_percentage, 2),
                'confidence_level': confidence
            }
        
        # Check if dispute reaches threshold
        if dispute_percentage >= (self.CONSENSUS_THRESHOLD * 100):
            confidence = self._get_confidence_level(dispute_percentage)
            return {
                'reached': True,
                'action': 'rejected',
                'percentage': round(dispute_percentage, 2),
                'confidence_level': confidence
            }
        
        return {'reached': False}
    
    def _get_confidence_level(self, percentage: float) -> str:
        """Determine confidence level based on consensus percentage."""
        if percentage >= 95:
            return 'very_high'
        elif percentage >= 85:
            return 'high'
        elif percentage >= 75:
            return 'medium'
        else:
            return 'low'
    
    async def update_claim_status(self, claim: Claim, consensus_action: str):
        """Update claim status based on consensus result."""
        try:
            if consensus_action == 'validated':
                claim.status = 'validated'
            elif consensus_action == 'rejected':
                claim.status = 'rejected'
            
            claim.validated_at = datetime.utcnow()
            await claim.save()
            logger.info(f"Claim {claim.id} status updated to {claim.status}")
        except Exception as e:
            logger.error(f"Error updating claim status: {e}")
    
    async def update_validator_trust_scores(self, claim_id: str, consensus_action: str):
        """
        Update trust scores for all validators based on consensus outcome.
        
        Validators who voted with consensus: +2 to +5 points
        Validators who voted against consensus: -1 to -3 points
        Validators who marked unsure: 0 points
        
        Higher trust score validators get larger rewards/penalties.
        """
        try:
            validations = await Validation.find(
                Validation.claim_id == str(claim_id)
            ).to_list()
            
            for validation in validations:
                was_correct = False
                impact = 0.0
                
                if validation.action == "unsure":
                    # Unsure votes get no penalty or reward
                    impact = 0.0
                    was_correct = None
                elif (validation.action == "vouch" and consensus_action == "validated") or \
                     (validation.action == "dispute" and consensus_action == "rejected"):
                    # Correct validation - positive impact
                    was_correct = True
                    base_reward = 2.0
                    
                    # Higher trust validators get bigger rewards
                    if validation.validator_trust_score >= 80:
                        impact = base_reward * 2.5  # +5 points
                    elif validation.validator_trust_score >= 60:
                        impact = base_reward * 1.5  # +3 points
                    else:
                        impact = base_reward  # +2 points
                else:
                    # Incorrect validation - negative impact
                    was_correct = False
                    base_penalty = -1.0
                    
                    # Higher trust validators get bigger penalties
                    if validation.validator_trust_score >= 80:
                        impact = base_penalty * 3.0  # -3 points
                    elif validation.validator_trust_score >= 60:
                        impact = base_penalty * 2.0  # -2 points
                    else:
                        impact = base_penalty  # -1 point
                
                validation.was_correct = was_correct
                validation.trust_score_impact = impact
                await validation.save()
                
                # Notify validator of validation outcome
                if was_correct is not None:  # Skip unsure votes
                    await self.notification_service.notify_validation_outcome(
                        validator_id=str(validation.validator_id),
                        was_correct=was_correct,
                        claim_id=str(claim_id),
                        validation_id=str(validation.id),
                        trust_score_impact=impact
                    )
                
                # Note: Actual trust score update would happen in User model
                # This is just recording the impact for tracking
                logger.info(
                    f"Validator {validation.validator_id} trust score impact: {impact} "
                    f"(action: {validation.action}, consensus: {consensus_action})"
                )
        
        except Exception as e:
            logger.error(f"Error updating validator trust scores: {e}")
    
    async def get_consensus_status(self, claim_id: str) -> Optional[ValidationConsensus]:
        """Get current consensus status for a claim."""
        return await ValidationConsensus.find_one(
            ValidationConsensus.claim_id == claim_id
        )
    
    async def get_claim_validations(self, claim_id: str) -> List[Validation]:
        """Get all validations for a claim."""
        return await Validation.find(
            Validation.claim_id == claim_id
        ).sort("-created_at").to_list()
