# Phase 1: RBAC Enhancement with Jurisdiction Support

## Overview

Phase 1 implements a comprehensive **Role-Based Access Control (RBAC)** system with **jurisdiction-based data filtering** to support multi-level administrative hierarchies in the land registry system. This enables local leaders (Chiefs, Assistant Chiefs, Elders) to manage their geographic jurisdictions while maintaining data isolation and appropriate permissions.

## Completed: January 2025

---

## Features Implemented

### 1. **Jurisdiction Model** (`backend/app/models/jurisdiction.py`)

A geographic administrative division model representing counties, sub-counties, wards, and villages.

#### Key Fields:
- **Basic Information:**
  - `name`: Jurisdiction name (e.g., "Kajiado North")
  - `code`: Unique identifier (e.g., "KJD-NORTH-001")
  - `level`: Administrative level (county/sub_county/ward/village)

- **Geographic Data:**
  - `boundary_coordinates`: GeoJSON polygon defining boundaries
  - `center_lat`, `center_lon`: Geographic center coordinates

- **Leadership:**
  - `assigned_leader_id`: User assigned as leader
  - `leader_name`: Leader's full name
  - `leader_title`: Title (Chief, Assistant Chief, Elder)

- **Statistics:**
  - `total_households`: Total households in jurisdiction
  - `registered_households`: Households registered in system
  - `active_disputes`: Number of active disputes
  - `pending_approvals`: Claims awaiting approval
  - `total_claims`, `approved_claims`, `rejected_claims`: Claim statistics

- **Hierarchy:**
  - `parent_jurisdiction_id`: Parent jurisdiction (for hierarchical structure)
  - `child_jurisdictions`: List of child jurisdiction IDs

#### Pydantic Schemas:
- `JurisdictionCreate`: For creating new jurisdictions
- `JurisdictionUpdate`: For updating jurisdiction details
- `JurisdictionResponse`: API response model
- `JurisdictionStats`: Statistics summary

---

### 2. **Activity Log Model** (`backend/app/models/activity_log.py`)

Comprehensive audit trail and recent activity feed for jurisdiction-level operations.

#### Key Fields:
- **Context:**
  - `jurisdiction_id`: Jurisdiction this activity belongs to
  - `jurisdiction_name`: Jurisdiction name for display

- **Activity Details:**
  - `activity_type`: Type of activity (claim, dispute, approval, validation, household_update)
  - `description`: Human-readable description
  - `status`: Current status (pending, approved, rejected, closed, active, completed)
  - `status_color`: Color code for UI display (#FFA500, #4CAF50, etc.)

- **Related Entities:**
  - `related_user_id`, `related_user_name`: User involved
  - `related_claim_id`: Associated claim
  - `related_dispute_id`: Associated dispute
  - `related_parcel_number`: Parcel identifier

- **Timestamp:** `timestamp` for sorting and filtering

#### Indexes:
- Compound index on `(jurisdiction_id, timestamp)` for efficient querying
- Compound index on `(jurisdiction_id, activity_type)` for filtering

---

### 3. **Enhanced User Model** (`backend/app/models/user.py`)

Extended user model with jurisdiction assignment and leadership capabilities.

#### New Fields:
- `jurisdiction_id`: Assigned jurisdiction (Optional)
- `jurisdiction_name`: Jurisdiction name for display
- `leader_level`: Leadership level (chief/assistant_chief/elder/null)
- `can_approve_claims`: Permission to approve land claims
- `can_resolve_disputes`: Permission to resolve disputes

#### Updated Indexes:
- Added `jurisdiction_id` to indexes for efficient filtering

---

### 4. **Permissions Module** (`backend/app/auth/permissions.py`)

Centralized permission checking and jurisdiction-based data filtering.

#### Permission Checking Functions:
```python
async def check_jurisdiction_access(user: User, jurisdiction_id: str) -> bool
    """Check if user can access a specific jurisdiction"""

async def check_approval_permission(user: User) -> bool
    """Check if user can approve land claims"""

async def check_dispute_resolution_permission(user: User) -> bool
    """Check if user can resolve disputes"""

def get_user_jurisdiction_filter(user: User) -> Optional[str]
    """Get jurisdiction filter for data queries"""
```

#### Decorators for Route Protection:
```python
@require_jurisdiction_access(jurisdiction_id_param="jurisdiction_id")
@require_approval_permission()
@require_dispute_permission()
```

#### Query Filters:
```python
async def filter_claims_by_jurisdiction(user: User, claims_query)
async def filter_disputes_by_jurisdiction(user: User, disputes_query)
```

#### Permission Logic:
- **Admins:** Full access to all jurisdictions and all permissions
- **Local Leaders:** Access only to assigned jurisdiction, permissions based on flags
- **Community Members:** Access only to assigned jurisdiction, no special permissions

---

### 5. **Enhanced Claim Model** (`backend/app/models/claim.py`)

Claims now track jurisdiction for proper data filtering.

#### New Fields:
- `jurisdiction_id`: Jurisdiction this claim belongs to
- `jurisdiction_name`: Jurisdiction name for display
- `parcel_number`: Official parcel identifier (e.g., "KJD-12345")

#### Updated Indexes:
- Added `jurisdiction_id` to indexes for efficient filtering

---

### 6. **Jurisdiction Routes** (`backend/app/routes/jurisdiction_routes.py`)

RESTful API endpoints for jurisdiction management.

#### Endpoints:

**POST /jurisdiction/**
- Create new jurisdiction (Admin only)
- Validates unique jurisdiction code
- Returns: `JurisdictionResponse`

**GET /jurisdiction/**
- List all jurisdictions with optional filters
- Query params: `level`, `active_only`
- Returns: `List[JurisdictionResponse]`

**GET /jurisdiction/{jurisdiction_id}**
- Get specific jurisdiction details
- Permission: Requires jurisdiction access
- Returns: `JurisdictionResponse`

**PATCH /jurisdiction/{jurisdiction_id}**
- Update jurisdiction details (Admin only)
- Automatically updates assigned leader's user record
- Returns: `JurisdictionResponse`

**GET /jurisdiction/{jurisdiction_id}/stats**
- Get jurisdiction statistics
- Calculates registration percentage, approval rate
- Permission: Requires jurisdiction access
- Returns: `JurisdictionStats`

**GET /jurisdiction/{jurisdiction_id}/activities**
- Get recent activities for jurisdiction
- Query params: `activity_type`, `status`, `limit`, `skip`
- Permission: Requires jurisdiction access
- Returns: `List[ActivityLogResponse]`

**POST /jurisdiction/{jurisdiction_id}/refresh-stats**
- Recalculate and update jurisdiction statistics
- Permission: Admin or assigned leader
- Counts claims by status, pending approvals
- Returns: `JurisdictionStats`

---

### 7. **Activity Log Routes** (`backend/app/routes/activity_log_routes.py`)

RESTful API endpoints for activity logging and retrieval.

#### Endpoints:

**POST /activity-logs/**
- Create new activity log entry
- Usually called internally by services
- Returns: `ActivityLogResponse`

**GET /activity-logs/**
- List activity logs with filters
- Query params: `activity_type`, `status`, `days`, `limit`, `skip`
- Auto-filters by jurisdiction for non-admin users
- Returns: `List[ActivityLogResponse]`

**GET /activity-logs/recent**
- Get recent activities for dashboard
- Optimized for quick display
- Query param: `limit` (default 10)
- Returns: `List[ActivityLogResponse]`

**GET /activity-logs/stats**
- Get activity statistics
- Query param: `days` (default 30)
- Returns counts by type and status
- Returns: `{total_activities, by_type, by_status, period_days}`

---

### 8. **Jurisdiction Service** (`backend/app/services/jurisdiction_service.py`)

Business logic layer for jurisdiction management.

#### Methods:

**calculate_statistics(jurisdiction_id: str) -> dict**
- Calculate all statistics for a jurisdiction
- Counts claims by status, pending approvals
- Calculates registration percentage, approval rate

**update_statistics(jurisdiction_id: str) -> Jurisdiction**
- Recalculate and persist statistics to database
- Returns updated jurisdiction

**assign_leader(jurisdiction_id: str, leader_id: str, leader_level: str) -> tuple**
- Assign leader to jurisdiction
- Updates both jurisdiction and user records
- Sets user role to "local_leader"
- Returns (jurisdiction, user)

**unassign_leader(jurisdiction_id: str) -> Jurisdiction**
- Remove assigned leader from jurisdiction
- Reverts user role to "community_member"
- Clears jurisdiction assignment

**update_household_stats(jurisdiction_id, total_households, registered_households) -> Jurisdiction**
- Update household statistics
- Returns updated jurisdiction

**get_child_jurisdictions(jurisdiction_id: str) -> List[Jurisdiction]**
- Get all child jurisdictions (hierarchical structure)

**deactivate_jurisdiction(jurisdiction_id: str) -> Jurisdiction**
- Soft delete jurisdiction (sets is_active=False)

**activate_jurisdiction(jurisdiction_id: str) -> Jurisdiction**
- Reactivate previously deactivated jurisdiction

---

### 9. **Activity Log Service** (`backend/app/services/activity_log_service.py`)

Business logic layer for activity logging.

#### Core Method:

**log_activity(...) -> ActivityLog**
- Create activity log entry with all context
- Automatically fetches jurisdiction name, user name
- Assigns status color for UI display

#### Helper Methods:

**get_status_color(status: str) -> str**
- Returns color code for status (#FFA500, #4CAF50, etc.)

**log_claim_activity(claim_id, activity_type, description, status)**
- Log activity related to a claim
- Automatically extracts claim details

**log_claim_submission(claim_id)**
- Log when new claim is submitted

**log_claim_validation(claim_id, validator_name, is_valid)**
- Log community validation activity

**log_claim_approval(claim_id, approver_name, approved)**
- Log leader approval/rejection

**log_dispute_activity(...)**
- Log dispute-related activities

**log_household_update(...)**
- Log household statistics updates

**log_leader_assignment(...)**
- Log when leader is assigned to jurisdiction

---

### 10. **Integration Updates**

#### **main.py**
- Registered `jurisdiction_router` at `/jurisdiction`
- Registered `activity_log_router` at `/activity-logs`

#### **db.py**
- Registered `Jurisdiction` model with Beanie
- Registered `ActivityLog` model with Beanie
- Total: 13 document models

#### **consensus_engine.py**
- Integrated `ActivityLogService`
- Logs consensus reached events automatically
- Example: "Community consensus reached: validated (87.5%)"

#### **claims.py**
- Integrated `ActivityLogService`
- Logs claim submission automatically
- Auto-assigns jurisdiction from user's jurisdiction

---

## Database Schema Updates

### Jurisdiction Collection
```javascript
{
  _id: ObjectId,
  name: "Kajiado North",
  code: "KJD-NORTH-001",
  level: "sub_county",
  boundary_coordinates: {...}, // GeoJSON
  center_lat: -1.2345,
  center_lon: 36.7890,
  assigned_leader_id: "user_id_123",
  leader_name: "Chief Omondi",
  leader_title: "Chief",
  total_households: 1500,
  registered_households: 847,
  active_disputes: 3,
  pending_approvals: 12,
  total_claims: 234,
  approved_claims: 198,
  rejected_claims: 24,
  parent_jurisdiction_id: "county_id",
  child_jurisdictions: ["ward_id_1", "ward_id_2"],
  is_active: true,
  created_at: ISODate,
  updated_at: ISODate
}
```

### Activity Log Collection
```javascript
{
  _id: ObjectId,
  jurisdiction_id: "jurisdiction_id_123",
  jurisdiction_name: "Kajiado North",
  activity_type: "claim",
  description: "New land claim submitted by David Ole Nkaiserry",
  related_user_id: "user_id_123",
  related_user_name: "David Ole Nkaiserry",
  related_claim_id: "claim_id_456",
  related_parcel_number: "KJD-12345",
  status: "pending",
  status_color: "#FFA500",
  timestamp: ISODate
}
```

### User Collection (Enhanced)
```javascript
{
  _id: ObjectId,
  email: "chief.omondi@example.com",
  full_name: "Chief Omondi",
  role: "local_leader",
  jurisdiction_id: "jurisdiction_id_123",
  jurisdiction_name: "Kajiado North",
  leader_level: "chief",
  can_approve_claims: true,
  can_resolve_disputes: true,
  // ...existing fields
}
```

### Claim Collection (Enhanced)
```javascript
{
  _id: ObjectId,
  user_id: "user_id_123",
  jurisdiction_id: "jurisdiction_id_123",
  jurisdiction_name: "Kajiado North",
  parcel_number: "KJD-12345",
  // ...existing fields
}
```

---

## API Examples

### 1. Create Jurisdiction (Admin)
```http
POST /jurisdiction/
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "name": "Kajiado North",
  "code": "KJD-NORTH-001",
  "level": "sub_county",
  "boundary_coordinates": {...},
  "center_lat": -1.2345,
  "center_lon": 36.7890,
  "leader_title": "Chief"
}
```

### 2. Assign Leader to Jurisdiction
```python
from app.services.jurisdiction_service import JurisdictionService

jurisdiction, user = await JurisdictionService.assign_leader(
    jurisdiction_id="jurisdiction_id_123",
    leader_id="user_id_456",
    leader_level="chief"
)
```

### 3. Get Jurisdiction Statistics
```http
GET /jurisdiction/{jurisdiction_id}/stats
Authorization: Bearer {jwt_token}

Response:
{
  "jurisdiction_id": "jurisdiction_id_123",
  "jurisdiction_name": "Kajiado North",
  "total_households": 1500,
  "registered_households": 847,
  "registration_percentage": 56.47,
  "active_disputes": 3,
  "pending_approvals": 12,
  "total_claims": 234,
  "approved_claims": 198,
  "rejected_claims": 24,
  "approval_rate": 84.62
}
```

### 4. Get Recent Activities
```http
GET /activity-logs/recent?limit=10
Authorization: Bearer {local_leader_jwt_token}

Response:
[
  {
    "id": "activity_id_1",
    "jurisdiction_id": "jurisdiction_id_123",
    "activity_type": "claim",
    "description": "New land claim submitted by David Ole Nkaiserry",
    "related_user_name": "David Ole Nkaiserry",
    "related_parcel_number": "KJD-12345",
    "status": "pending",
    "status_color": "#FFA500",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  {
    "id": "activity_id_2",
    "activity_type": "validation",
    "description": "Community consensus reached: validated (87.5%)",
    "status": "approved",
    "status_color": "#4CAF50",
    "timestamp": "2025-01-15T09:15:00Z"
  }
]
```

### 5. Using Permission Decorators
```python
from app.auth.permissions import require_jurisdiction_access
from app.auth import get_current_user

@router.get("/my-protected-endpoint/{jurisdiction_id}")
@require_jurisdiction_access(jurisdiction_id_param="jurisdiction_id")
async def protected_endpoint(
    jurisdiction_id: str,
    current_user: User = Depends(get_current_user)
):
    # User has been verified to have access to this jurisdiction
    # Proceed with endpoint logic
    return {"message": "Access granted"}
```

---

## Permission Matrix

| Role | Create Jurisdiction | Update Jurisdiction | View All Jurisdictions | View Own Jurisdiction | Approve Claims | Resolve Disputes |
|------|---------------------|---------------------|------------------------|----------------------|----------------|------------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Local Leader (Chief)** | ❌ | ❌ | ❌ | ✅ | ✅ (if flag set) | ✅ (if flag set) |
| **Community Member** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Resident** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Use Cases Enabled

### 1. **Local Leader Dashboard**
Chief Omondi logs in and sees:
- Jurisdiction: Kajiado North
- Statistics: 847/1500 households registered (56.47%)
- Pending Approvals: 12 claims
- Active Disputes: 3
- Recent Activity: Last 10 activities in his jurisdiction

### 2. **Claim Approval Workflow**
1. Resident submits claim → Auto-assigned to their jurisdiction
2. Community validates claim → Consensus reached (logged)
3. Claim appears in Chief's "Pending Approvals" queue
4. Chief reviews and approves → Activity logged
5. Statistics updated automatically

### 3. **Jurisdiction Hierarchy**
- County → Contains multiple Sub-Counties
- Sub-County → Contains multiple Wards
- Ward → Contains multiple Villages
- Each level has assigned leader with appropriate permissions

### 4. **Data Isolation**
- Chief Omondi (Kajiado North) cannot see claims from Chief Kamau's jurisdiction
- Each leader sees only their jurisdiction's data
- Admins see all jurisdictions

---

## Testing Checklist

- [x] Create jurisdiction (admin only)
- [x] List jurisdictions (all users)
- [x] Get jurisdiction details (with permission check)
- [x] Update jurisdiction (admin only)
- [x] Get jurisdiction statistics
- [x] Refresh jurisdiction statistics
- [x] Assign leader to jurisdiction
- [x] Unassign leader from jurisdiction
- [x] Get jurisdiction activities
- [x] Create activity log
- [x] List activity logs (filtered by jurisdiction)
- [x] Get recent activities
- [x] Get activity statistics
- [x] Permission decorators work correctly
- [x] Query filters apply jurisdiction filtering
- [x] Claim submission logs activity
- [x] Consensus logs activity

---

## Next Steps (Phase 2)

**Phase 2: Leader Portal** will build on this foundation to create:

1. **LocalLeaderDashboard Component**
   - Statistics cards
   - Jurisdiction map
   - Recent activity feed
   - Quick actions

2. **Claims Ready for Approval Component**
   - List of claims awaiting approval
   - Filtering and sorting
   - Approve/Reject actions

3. **Household Management**
   - Register new households
   - Update household statistics
   - View registered households

4. **Frontend Jurisdiction Context**
   - `JurisdictionContext.jsx` provider
   - Access current jurisdiction
   - Check permissions

5. **Role-Based Route Guards**
   - `ProtectedRoute` component
   - Redirect unauthorized users
   - Show/hide features based on role

---

## Files Created/Modified

### Created (10 files):
1. `backend/app/models/jurisdiction.py` (130 lines)
2. `backend/app/models/activity_log.py` (70 lines)
3. `backend/app/auth/permissions.py` (230 lines)
4. `backend/app/routes/jurisdiction_routes.py` (420 lines)
5. `backend/app/routes/activity_log_routes.py` (200 lines)
6. `backend/app/services/jurisdiction_service.py` (200 lines)
7. `backend/app/services/activity_log_service.py` (180 lines)
8. `PHASE_1_RBAC_ENHANCEMENT.md` (this file)

### Modified (5 files):
1. `backend/app/models/user.py` (added 5 fields)
2. `backend/app/models/claim.py` (added 3 fields)
3. `backend/app/db.py` (registered 2 new models)
4. `backend/app/main.py` (registered 2 new routers)
5. `backend/app/services/consensus_engine.py` (integrated ActivityLogService)
6. `backend/app/routes/claims.py` (integrated ActivityLogService)

**Total:** ~1,500 lines of code added

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - Dashboard Components                                      │
│  - Jurisdiction Context                                      │
│  - Role-Based Route Guards                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                   FastAPI Backend                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes                                                │   │
│  │ - jurisdiction_routes.py                             │   │
│  │ - activity_log_routes.py                             │   │
│  │ - claims.py (enhanced)                               │   │
│  └────────────┬──────────────────────────────────────────┘   │
│               │                                              │
│  ┌────────────▼──────────────────────────────────────────┐   │
│  │ Services                                              │   │
│  │ - JurisdictionService (business logic)               │   │
│  │ - ActivityLogService (logging)                       │   │
│  │ - ConsensusEngine (validation)                       │   │
│  └────────────┬──────────────────────────────────────────┘   │
│               │                                              │
│  ┌────────────▼──────────────────────────────────────────┐   │
│  │ Permissions (auth/permissions.py)                    │   │
│  │ - check_jurisdiction_access()                        │   │
│  │ - check_approval_permission()                        │   │
│  │ - @require_jurisdiction_access                       │   │
│  └────────────┬──────────────────────────────────────────┘   │
│               │                                              │
│  ┌────────────▼──────────────────────────────────────────┐   │
│  │ Models (Beanie ODM)                                  │   │
│  │ - Jurisdiction                                       │   │
│  │ - ActivityLog                                        │   │
│  │ - User (enhanced)                                    │   │
│  │ - Claim (enhanced)                                   │   │
│  └────────────┬──────────────────────────────────────────┘   │
└────────────────┼──────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              MongoDB Atlas                               │
│  - jurisdictions collection                             │
│  - activity_logs collection                             │
│  - users collection (enhanced)                          │
│  - claims collection (enhanced)                         │
└─────────────────────────────────────────────────────────┘
```

---

## Conclusion

Phase 1 successfully implements a robust RBAC system with jurisdiction-based data filtering. The system now supports:

✅ Multi-level administrative hierarchies  
✅ Role-based permissions with granular control  
✅ Automatic data filtering by jurisdiction  
✅ Comprehensive activity logging and audit trail  
✅ Leader assignment and management  
✅ Statistics tracking per jurisdiction  
✅ Permission decorators for route protection  

**Phase 1 Status:** ✅ **COMPLETE**

Ready for Phase 2: Leader Portal implementation.
