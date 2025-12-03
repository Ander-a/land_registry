# Admin User Role Management API

## Overview

This document describes the Admin User Role Management functionality for the AI-Assisted Land Registry System. This feature enables administrators to promote or demote users by changing their roles, supporting the "Manage Users" use case.

## Tech Stack

- **Framework:** FastAPI
- **Database:** MongoDB Atlas (using Beanie ODM)
- **Auth:** JWT (OAuth2 with HS256)
- **Validation:** Pydantic v2

## User Roles

The system supports four distinct roles defined in the `UserRole` enum:

```python
class UserRole(str, Enum):
    RESIDENT = "resident"              # Basic land claimants
    COMMUNITY_MEMBER = "community_member"  # Community validators
    LOCAL_LEADER = "local_leader"      # Local leaders/endorsers
    ADMIN = "admin"                    # System administrators
```

## API Endpoints

### 1. Update User Role (PATCH /admin/users/{user_id}/role)

**Description:** Update a user's role. Only accessible by ADMIN users.

**Authentication:** Required (JWT Bearer token)

**Authorization:** ADMIN role only

**Request:**

```bash
PATCH /admin/users/{user_id}/role
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "community_member"
}
```

**Path Parameters:**
- `user_id` (string, required): The MongoDB ObjectId of the user to update

**Request Body:**

```json
{
  "role": "community_member"  // Valid values: resident, community_member, local_leader, admin
}
```

**Response (200 OK):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "community_member",
  "is_active": true
}
```

**Error Responses:**

- **400 Bad Request:** Invalid user ID format or trying to modify own role
```json
{
  "detail": "Cannot modify your own role. Ask another admin."
}
```

- **403 Forbidden:** User is not an admin
```json
{
  "detail": "Access forbidden: insufficient role privileges"
}
```

- **404 Not Found:** User not found
```json
{
  "detail": "User with ID 507f1f77bcf86cd799439011 not found"
}
```

### 2. List All Users (GET /admin/users)

**Description:** Get a list of all users with optional filtering.

**Query Parameters:**
- `role` (optional): Filter by role (resident, community_member, local_leader, admin)
- `is_active` (optional): Filter by active status (true/false)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Maximum records to return (default: 100)

**Request:**

```bash
GET /admin/users?role=community_member&is_active=true&skip=0&limit=50
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "community_member",
    "is_active": true
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "community_member",
    "is_active": true
  }
]
```

### 3. Get User Details (GET /admin/users/{user_id})

**Description:** Get detailed information about a specific user.

**Request:**

```bash
GET /admin/users/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "community_member",
  "is_active": true
}
```

### 4. Toggle User Active Status (PATCH /admin/users/{user_id}/status)

**Description:** Activate or deactivate a user account.

**Request:**

```bash
PATCH /admin/users/507f1f77bcf86cd799439011/status?is_active=false
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `is_active` (boolean, required): New active status

**Response (200 OK):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "community_member",
  "is_active": false
}
```

## Implementation Details

### Request Model

```python
class RoleUpdateRequest(BaseModel):
    """Request model for updating a user's role."""
    role: UserRole = Field(
        ...,
        description="The new role to assign to the user",
        example=UserRole.COMMUNITY_MEMBER
    )
```

### Security Features

1. **JWT Authentication:** All endpoints require valid JWT token
2. **Role-Based Access:** Only ADMIN role can access these endpoints
3. **Self-Protection:** Admins cannot modify their own role or deactivate themselves
4. **Validation:** Pydantic ensures role values are valid enum members

### Database Operations

The implementation uses Beanie ODM's async methods:

```python
# Fetch user
user = await User.get(object_id)

# Update fields
user.role = new_role
user.updated_at = datetime.utcnow()

# Save to MongoDB
await user.save()
```

## Usage Examples

### Example 1: Promote Resident to Community Member

```bash
curl -X PATCH "http://localhost:8000/admin/users/507f1f77bcf86cd799439011/role" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "role": "community_member"
  }'
```

### Example 2: Promote Community Member to Local Leader

```bash
curl -X PATCH "http://localhost:8000/admin/users/507f1f77bcf86cd799439011/role" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "role": "local_leader"
  }'
```

### Example 3: Demote Local Leader to Resident

```bash
curl -X PATCH "http://localhost:8000/admin/users/507f1f77bcf86cd799439011/role" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "role": "resident"
  }'
```

### Example 4: List All Community Members

```bash
curl -X GET "http://localhost:8000/admin/users?role=community_member&is_active=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 5: Deactivate a User

```bash
curl -X PATCH "http://localhost:8000/admin/users/507f1f77bcf86cd799439011/status?is_active=false" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Python Client Example

```python
import httpx
import asyncio

async def update_user_role(user_id: str, new_role: str, admin_token: str):
    """Update a user's role using the admin API."""
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"http://localhost:8000/admin/users/{user_id}/role",
            json={"role": new_role},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            updated_user = response.json()
            print(f"Successfully updated user {updated_user['name']} to {updated_user['role']}")
            return updated_user
        else:
            print(f"Error: {response.status_code} - {response.json()}")
            return None

# Usage
asyncio.run(update_user_role(
    user_id="507f1f77bcf86cd799439011",
    new_role="community_member",
    admin_token="your-jwt-token-here"
))
```

## Common Role Transitions

### Resident → Community Member
- **Use Case:** Promote a trusted resident to validate community claims
- **Required By:** Local leaders assigning validators

### Resident → Local Leader
- **Use Case:** Promote a community elder or official to local leader
- **Required By:** System admins during initial setup

### Community Member → Local Leader
- **Use Case:** Promote an experienced validator to leadership
- **Required By:** Recognizing community contributions

### Local Leader → Community Member
- **Use Case:** Demote a leader who is stepping down
- **Required By:** Leadership transitions

### Any Role → Resident
- **Use Case:** Remove special privileges
- **Required By:** Policy violations or user request

## Testing

### Test Setup

```bash
# 1. Start the backend server
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# 2. Create an admin user (if not exists)
# Use the registration endpoint or database seeding

# 3. Login as admin to get JWT token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@landregistry.gov&password=admin123"
```

### Test Cases

1. **Valid Role Update:** Update a resident to community_member
2. **Invalid User ID:** Try to update non-existent user
3. **Self-Modification:** Admin tries to change their own role
4. **Unauthorized Access:** Non-admin tries to access endpoint
5. **Invalid Role:** Try to set invalid role value
6. **Deactivate User:** Toggle user active status

## Security Considerations

1. **Authentication Required:** All endpoints require valid JWT token
2. **Authorization Check:** Only ADMIN role can access these endpoints
3. **Self-Protection:** Prevents admins from locking themselves out
4. **Audit Trail:** Updated_at timestamp tracks changes
5. **Input Validation:** Pydantic ensures valid role values
6. **ObjectId Validation:** Prevents invalid ID formats

## Integration with Frontend

Frontend components should:

1. Display current user role in user profile
2. Show role management interface only to admins
3. Validate role changes before submission
4. Handle 403 errors gracefully (non-admin users)
5. Refresh user list after role updates
6. Display success/error notifications

## Future Enhancements

- [ ] Add audit log for role changes
- [ ] Implement role change approval workflow
- [ ] Add bulk role update functionality
- [ ] Create role permission matrix visualization
- [ ] Add email notifications for role changes
- [ ] Implement temporary role assignments (time-limited)
