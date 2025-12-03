# Phase 5: Backend Consensus Engine - Implementation Summary

## Overview
Implemented a comprehensive backend consensus engine for decentralized community-driven land claim validation with weighted voting, trust score management, and automatic claim status updates.

## Components Implemented

### 1. Enhanced Validation Models (`app/models/validation.py`)
Updated the existing Validation model with new fields:
- **Validation Document**: Individual validation records from community validators
  - `claim_id`: ID of claim being validated
  - `validator_id`, `validator_name`: Validator identification
  - `validator_trust_score`: Trust score at time of validation (0-100)
  - `action`: vouch, dispute, or unsure
  - `reason`: Required for disputes
  - `validator_location`: GPS coordinates for distance weighting
  - `distance_to_claim`: Calculated distance in kilometers
  - `weight`: Calculated weighted value (1.0 base)
  - `was_correct`: Boolean tracking if validation matched consensus
  - `trust_score_impact`: Points added/subtracted from trust score

- **ValidationConsensus Document**: Aggregated consensus results
  - Vote counts: `vouch_count`, `dispute_count`, `unsure_count`
  - Weighted scores: `vouch_weight`, `dispute_weight`, `unsure_weight`
  - Consensus status: `consensus_reached`, `consensus_action`, `consensus_percentage`
  - Confidence level: low, medium, high, very_high
  - Requirements met: `minimum_validations_met`, `consensus_threshold_met`
  - Statistics: avg trust score, avg distance, top validators

### 2. Consensus Engine (`app/services/consensus_engine.py`)
Core business logic for validation processing:

**Configuration:**
- Minimum 3 validators required
- 70% weighted threshold for consensus
- Trust score range: 0-100
- Max weighted distance: 50km

**Key Methods:**
- `calculate_distance()`: Haversine formula for GPS distance (km)
- `calculate_trust_weight()`: Trust score → weight multiplier
  - 90-100: 2.0x
  - 80-89: 1.5x
  - 70-79: 1.25x
  - 60-69: 1.0x
  - 50-59: 0.75x
  - <50: 0.5x
  
- `calculate_distance_weight()`: Distance → weight multiplier
  - 0-5km: 1.5x (local knowledge premium)
  - 5-10km: 1.25x
  - 10-25km: 1.0x
  - 25-50km: 0.75x
  - >50km: 0.5x

- `process_validation()`: Main workflow
  1. Calculate distance if coordinates provided
  2. Calculate validation weight
  3. Update/create consensus record
  4. Check if consensus reached (70% threshold)
  5. Update claim status if consensus reached
  6. Update validator trust scores

- `check_consensus()`: Determines if consensus reached
  - Compares vouch_weight vs dispute_weight percentages
  - Returns validated/rejected action
  - Calculates confidence level (very_high ≥95%, high ≥85%, medium ≥75%, low <75%)

- `update_claim_status()`: Updates claim to validated/rejected

- `update_validator_trust_scores()`: Reward/penalty system
  - Correct vouch/dispute: +2 to +5 points (based on trust score)
  - Incorrect vouch/dispute: -1 to -3 points
  - Unsure: 0 points (no penalty)

### 3. Validation API Routes (`app/routes/validation_routes.py`)
RESTful endpoints for community validation:

**POST /validations/** - Submit validation
- Body: `{ claim_id, action, reason?, validator_location? }`
- Validates action (vouch/dispute/unsure)
- Requires reason for disputes
- Prevents duplicate validations
- Prevents self-validation
- Triggers consensus processing
- Returns: `ValidationResponse` with trust score impact

**GET /validations/claim/{claim_id}** - Get all validations for claim
- Returns list of all validators who participated
- Includes actions, reasons, distances, trust impacts

**GET /validations/consensus/{claim_id}** - Get consensus status
- Returns: `ConsensusResponse` with percentages, confidence level
- Shows if minimum validators met (3)
- Shows if threshold met (70%)

**GET /validations/my-validations** - Get user's validation history
- Paginated list of user's validations
- Shows trust score impacts
- Useful for validator dashboard

**DELETE /validations/{validation_id}** - Delete validation
- Only allowed before consensus reached
- Only by validator or admin
- Triggers consensus recalculation

### 4. Database Updates

**Updated `app/db.py`:**
- Registered `ValidationConsensus` model in Beanie init
- Now tracks 9 document models total

**Updated `app/main.py`:**
- Registered `validation_routes_router` (new endpoints)
- Now 8 routers total

**Enhanced `app/models/claim.py`:**
- Added `validated_at` timestamp
- Added `location` string field
- Added `coordinates` dict for GPS consistency
- Status now includes "under_review" state

**Enhanced `app/models/user.py`:**
- Added `trust_score` (default 50.0, range 0-100)
- Added `validations_count` (total performed)
- Added `successful_validations` (correct ones)
- Added `accuracy_rate` (percentage correct)

## How It Works

### Validation Flow:
1. **User submits validation** via POST /validations/
   - System validates claim exists
   - Checks for duplicate validations
   - Prevents self-validation

2. **Consensus engine calculates weights**
   - Distance calculated using Haversine formula
   - Trust score weight: 0.5x to 2.0x multiplier
   - Distance weight: 0.5x to 1.5x multiplier
   - Final weight = base × trust_weight × distance_weight

3. **Consensus record updated**
   - Adds to vouch/dispute/unsure counts
   - Adds weighted value to respective totals
   - Calculates statistics (avg trust, avg distance)

4. **Check consensus (≥3 validators)**
   - Calculate vouch percentage = vouch_weight / total_weight × 100
   - Calculate dispute percentage = dispute_weight / total_weight × 100
   - If vouch ≥70%: consensus = "validated"
   - If dispute ≥70%: consensus = "rejected"
   - Otherwise: no consensus yet

5. **If consensus reached**
   - Update claim status to validated/rejected
   - Set validated_at timestamp
   - Update all validator trust scores:
     * Correct predictions: +2 to +5 points
     * Incorrect predictions: -1 to -3 points
     * Unsure: 0 points

### Trust Score Evolution:
- New validators start at 50 points
- High-trust validators (80+) earn more rewards but bigger penalties
- Incentivizes accurate validations
- Discourages spam/incorrect validations
- Trust score affects future validation weight (feedback loop)

### Distance Weighting Rationale:
- Validators within 5km likely have local knowledge
- They can verify boundaries, access roads, landmarks
- Remote validators (>50km) still valuable but lower weight
- Prevents urban validators from dominating rural claims

## API Examples

### Submit a vouch:
```bash
POST /validations/
{
  "claim_id": "674f1234567890abcdef1234",
  "action": "vouch",
  "validator_location": {
    "lat": -1.2921,
    "lon": 36.8219
  }
}
```

### Submit a dispute:
```bash
POST /validations/
{
  "claim_id": "674f1234567890abcdef1234",
  "action": "dispute",
  "reason": "Boundary overlaps with existing registered plot #12345",
  "validator_location": {
    "lat": -1.2921,
    "lon": 36.8219
  }
}
```

### Get consensus status:
```bash
GET /validations/consensus/674f1234567890abcdef1234

Response:
{
  "claim_id": "674f1234567890abcdef1234",
  "consensus_reached": true,
  "consensus_action": "validated",
  "consensus_percentage": 85.5,
  "confidence_level": "high",
  "total_validations": 5,
  "vouch_count": 4,
  "dispute_count": 1,
  "unsure_count": 0,
  "minimum_validations_met": true,
  "consensus_threshold_met": true
}
```

## Integration with Frontend

The frontend ClaimValidation component should:
1. Call POST /validations/ when user clicks Vouch/Dispute/Unsure
2. Call GET /validations/consensus/{claimId} to show progress bars
3. Display validator count: "3/3 minimum validators"
4. Display consensus percentage: "85% vouched"
5. Show confidence level badge
6. Disable voting buttons after user submits validation

## Security Features

1. **Authentication Required**: All endpoints require JWT token
2. **Authorization Checks**:
   - Cannot validate own claim
   - Cannot delete validation after consensus
   - Admin override for deletion
3. **Validation Rules**:
   - Dispute requires reason
   - Action must be valid (vouch/dispute/unsure)
   - One validation per user per claim

## Performance Considerations

- Compound indexes on (claim_id, validator_id) for fast duplicate checks
- Indexes on claim_id for aggregation queries
- Consensus record updated incrementally (not recalculated from scratch)
- Distance calculation cached in validation record

## Future Enhancements

1. **Time decay**: Older validations get reduced weight
2. **Validator reputation tiers**: Bronze/Silver/Gold badges
3. **Dispute resolution**: Human moderator review for close calls
4. **Machine learning**: Train model to predict consensus based on features
5. **Real-time notifications**: WebSocket updates when consensus reached
6. **Geofencing**: Require validators to be within certain radius
7. **Conflict resolution**: Automatic dispute mediation workflow

## Testing the System

To test the consensus engine:

1. Create 3 test users with different trust scores (50, 75, 90)
2. Submit a claim
3. Have each user validate the claim:
   - User 1 (trust 50): vouch → weight ≈ 0.75
   - User 2 (trust 75): vouch → weight ≈ 1.25
   - User 3 (trust 90): dispute → weight ≈ 2.0
4. Check consensus:
   - Vouch weight: 0.75 + 1.25 = 2.0
   - Dispute weight: 2.0
   - Total weight: 4.0
   - Vouch %: 50%, Dispute %: 50%
   - Result: No consensus (neither reaches 70%)
5. Add 4th validator (trust 85, vouch):
   - Vouch weight: 2.0 + 1.5 = 3.5
   - Dispute weight: 2.0
   - Total weight: 5.5
   - Vouch %: 63.6%
   - Result: Still no consensus
6. Add 5th validator (trust 80, vouch):
   - Vouch weight: 3.5 + 1.5 = 5.0
   - Dispute weight: 2.0
   - Total weight: 7.0
   - Vouch %: 71.4% ✓
   - **Result: CONSENSUS REACHED - VALIDATED**

## Status: ✅ COMPLETE

Phase 5 implementation is complete with:
- ✅ Enhanced validation models with consensus tracking
- ✅ Consensus engine with weighted voting
- ✅ Trust score and distance weighting algorithms
- ✅ Automatic claim status updates
- ✅ Trust score reward/penalty system
- ✅ RESTful API endpoints
- ✅ Database integration
- ✅ Security and authorization
- ✅ Backward compatibility with legacy validation system
