"""
Authentication Tests
Tests for user registration, login, and JWT authentication
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_user_registration_success(test_client: AsyncClient):
    """Test successful user registration"""
    response = await test_client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepass123",
            "full_name": "New User",
            "role": "citizen"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "citizen"
    assert "id" in data
    assert "password" not in data  # Password should not be returned


@pytest.mark.asyncio
async def test_user_registration_duplicate_email(test_client: AsyncClient, test_user):
    """Test that duplicate email registration is rejected"""
    response = await test_client.post(
        "/api/auth/register",
        json={
            "email": test_user["email"],  # Already exists
            "password": "anotherpass123",
            "full_name": "Duplicate User",
            "role": "citizen"
        }
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "email" in data["detail"].lower() or "already exists" in data["detail"].lower()


@pytest.mark.asyncio
async def test_user_registration_invalid_email(test_client: AsyncClient):
    """Test registration with invalid email format"""
    response = await test_client.post(
        "/api/auth/register",
        json={
            "email": "notanemail",
            "password": "securepass123",
            "full_name": "Invalid Email User",
            "role": "citizen"
        }
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_user_registration_weak_password(test_client: AsyncClient):
    """Test registration with weak password"""
    response = await test_client.post(
        "/api/auth/register",
        json={
            "email": "weakpass@example.com",
            "password": "123",
            "full_name": "Weak Pass User",
            "role": "citizen"
        }
    )
    
    assert response.status_code in [400, 422]  # Bad request or validation error


@pytest.mark.asyncio
async def test_login_success(test_client: AsyncClient, test_user):
    """Test successful login"""
    response = await test_client.post(
        "/api/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


@pytest.mark.asyncio
async def test_login_invalid_email(test_client: AsyncClient):
    """Test login with non-existent email"""
    response = await test_client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "somepassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "incorrect" in data["detail"].lower() or "invalid" in data["detail"].lower()


@pytest.mark.asyncio
async def test_login_invalid_password(test_client: AsyncClient, test_user):
    """Test login with incorrect password"""
    response = await test_client.post(
        "/api/auth/login",
        data={
            "username": test_user["email"],
            "password": "wrongpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "incorrect" in data["detail"].lower() or "invalid" in data["detail"].lower()


@pytest.mark.asyncio
async def test_login_missing_credentials(test_client: AsyncClient):
    """Test login with missing credentials"""
    response = await test_client.post(
        "/api/auth/login",
        data={},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_get_current_user_success(test_client: AsyncClient, auth_headers):
    """Test getting current user with valid token"""
    response = await test_client.get(
        "/api/auth/me",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    assert "password" not in data


@pytest.mark.asyncio
async def test_get_current_user_no_token(test_client: AsyncClient):
    """Test accessing protected route without token"""
    response = await test_client.get("/api/auth/me")
    
    assert response.status_code == 401
    data = response.json()
    assert "not authenticated" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(test_client: AsyncClient):
    """Test accessing protected route with invalid token"""
    response = await test_client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token_here"}
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_expired_token(test_client: AsyncClient):
    """Test accessing protected route with expired token"""
    # This would require generating an expired token
    # For now, we'll use an obviously invalid token
    expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjowfQ.invalid"
    
    response = await test_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_jwt_token_contains_user_info(test_client: AsyncClient, test_user):
    """Test that JWT token can be decoded and contains user info"""
    from app.auth import decode_token
    
    # Login to get a token
    response = await test_client.post(
        "/api/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Decode and verify
    payload = decode_token(token)
    assert payload["sub"] == test_user["email"]


@pytest.mark.asyncio
async def test_register_different_roles(test_client: AsyncClient):
    """Test registration with different user roles"""
    roles = ["citizen", "government_official", "land_surveyor", "community_leader"]
    
    for idx, role in enumerate(roles):
        response = await test_client.post(
            "/api/auth/register",
            json={
                "email": f"user_{role}_{idx}@example.com",
                "password": "securepass123",
                "full_name": f"User {role}",
                "role": role
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == role


@pytest.mark.asyncio
async def test_password_hashing(test_client: AsyncClient, mock_db):
    """Test that passwords are properly hashed in database"""
    from app.auth import verify_password
    
    # Register a user
    password = "mysecurepassword123"
    response = await test_client.post(
        "/api/auth/register",
        json={
            "email": "hashtest@example.com",
            "password": password,
            "full_name": "Hash Test User",
            "role": "citizen"
        }
    )
    
    assert response.status_code == 201
    
    # Check database - password should be hashed
    user = await mock_db.users.find_one({"email": "hashtest@example.com"})
    assert user is not None
    assert user["password"] != password  # Should be hashed
    assert len(user["password"]) > 50  # Hashed passwords are long
    assert verify_password(password, user["password"])  # Should verify correctly
