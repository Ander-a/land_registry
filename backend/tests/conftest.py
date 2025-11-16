"""
Pytest configuration and fixtures for testing
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
import mongomock
from unittest.mock import Mock, patch

from app.main import app
from app.config import settings
from app.database import get_database
from app.auth import get_current_user, create_access_token
from app.models import User


# Override settings for testing
settings.TESTING = True
settings.MONGODB_URL = "mongodb://localhost:27017/test_db"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def mock_db():
    """Create a mock MongoDB database using mongomock"""
    client = mongomock.MongoClient()
    db = client.test_land_registry
    yield db
    client.close()


@pytest.fixture
async def test_client(mock_db) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test client with mocked database
    """
    def override_get_database():
        return mock_db
    
    app.dependency_overrides[get_database] = override_get_database
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(mock_db) -> dict:
    """Create a test user in the mock database"""
    from app.auth import get_password_hash
    
    user_data = {
        "email": "testuser@example.com",
        "password": get_password_hash("testpassword123"),
        "full_name": "Test User",
        "role": "citizen",
        "is_active": True
    }
    
    result = await mock_db.users.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)
    
    return {
        "email": "testuser@example.com",
        "password": "testpassword123",  # Plain password for login tests
        "full_name": "Test User",
        "role": "citizen",
        "id": str(result.inserted_id)
    }


@pytest.fixture
async def test_leader(mock_db) -> dict:
    """Create a test leader user in the mock database"""
    from app.auth import get_password_hash
    
    user_data = {
        "email": "leader@example.com",
        "password": get_password_hash("leaderpass123"),
        "full_name": "Community Leader",
        "role": "leader",
        "is_active": True
    }
    
    result = await mock_db.users.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)
    
    return {
        "email": "leader@example.com",
        "password": "leaderpass123",
        "full_name": "Community Leader",
        "role": "leader",
        "id": str(result.inserted_id)
    }


@pytest.fixture
async def test_government_official(mock_db) -> dict:
    """Create a test government official user in the mock database"""
    from app.auth import get_password_hash
    
    user_data = {
        "email": "official@example.com",
        "password": get_password_hash("officialpass123"),
        "full_name": "Government Official",
        "role": "government_official",
        "is_active": True
    }
    
    result = await mock_db.users.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)
    
    return {
        "email": "official@example.com",
        "password": "officialpass123",
        "full_name": "Government Official",
        "role": "government_official",
        "id": str(result.inserted_id)
    }


@pytest.fixture
def auth_token(test_user) -> str:
    """Generate a valid JWT token for the test user"""
    return create_access_token(data={"sub": test_user["email"]})


@pytest.fixture
def leader_token(test_leader) -> str:
    """Generate a valid JWT token for the test leader"""
    return create_access_token(data={"sub": test_leader["email"]})


@pytest.fixture
def official_token(test_government_official) -> str:
    """Generate a valid JWT token for the government official"""
    return create_access_token(data={"sub": test_government_official["email"]})


@pytest.fixture
def auth_headers(auth_token) -> dict:
    """Create authorization headers with valid JWT token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def leader_headers(leader_token) -> dict:
    """Create authorization headers for leader"""
    return {"Authorization": f"Bearer {leader_token}"}


@pytest.fixture
def official_headers(official_token) -> dict:
    """Create authorization headers for government official"""
    return {"Authorization": f"Bearer {official_token}"}


@pytest.fixture
async def test_claim(mock_db, test_user) -> dict:
    """Create a test land claim in the mock database"""
    claim_data = {
        "claimant_id": test_user["id"],
        "claimant_name": test_user["full_name"],
        "claimant_email": test_user["email"],
        "gps_coordinates": {
            "type": "Point",
            "coordinates": [36.8219, -1.2921]  # Nairobi
        },
        "plot_area": 0.25,  # hectares
        "custom_boundary": {
            "type": "Polygon",
            "coordinates": [[
                [36.8219, -1.2921],
                [36.8229, -1.2921],
                [36.8229, -1.2931],
                [36.8219, -1.2931],
                [36.8219, -1.2921]
            ]]
        },
        "image_url": "https://example.com/images/claim_123.jpg",
        "ai_detected_boundary": {
            "type": "Polygon",
            "coordinates": [[
                [36.8219, -1.2921],
                [36.8229, -1.2921],
                [36.8229, -1.2931],
                [36.8219, -1.2931],
                [36.8219, -1.2921]
            ]]
        },
        "status": "pending",
        "witness_approvals": [],
        "leader_endorsement": None,
        "created_at": "2024-01-15T10:30:00",
        "updated_at": "2024-01-15T10:30:00"
    }
    
    result = await mock_db.claims.insert_one(claim_data)
    claim_data["_id"] = str(result.inserted_id)
    claim_data["id"] = str(result.inserted_id)
    
    return claim_data


@pytest.fixture
def sample_image_file():
    """Create a sample image file for upload testing"""
    import io
    from PIL import Image
    
    # Create a simple test image
    image = Image.new('RGB', (100, 100), color='green')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    return ("test_image.jpg", img_byte_arr, "image/jpeg")


@pytest.fixture
def mock_opencv_detection():
    """Mock OpenCV boundary detection"""
    with patch('app.ai_module.detect_boundary') as mock:
        mock.return_value = {
            "boundary": {
                "type": "Polygon",
                "coordinates": [[
                    [36.8219, -1.2921],
                    [36.8229, -1.2921],
                    [36.8229, -1.2931],
                    [36.8219, -1.2931],
                    [36.8219, -1.2921]
                ]]
            },
            "confidence": 0.85,
            "area_hectares": 0.25
        }
        yield mock


@pytest.fixture
def mock_file_upload():
    """Mock file upload functionality"""
    with patch('app.utils.upload_file') as mock:
        mock.return_value = "https://example.com/uploads/test_image.jpg"
        yield mock
