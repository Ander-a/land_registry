"""
Land Claims Tests
Tests for submitting, retrieving, and managing land claims
"""
import pytest
from httpx import AsyncClient
import json


@pytest.mark.asyncio
async def test_submit_claim_success(test_client: AsyncClient, auth_headers, mock_file_upload):
    """Test successful claim submission with all required fields"""
    claim_data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        }),
        "plot_area": "0.35",
        "custom_boundary": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [36.8219, -1.2921],
                [36.8229, -1.2921],
                [36.8229, -1.2931],
                [36.8219, -1.2931],
                [36.8219, -1.2921]
            ]]
        })
    }
    
    response = await test_client.post(
        "/api/claims/submit",
        data=claim_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "pending"
    assert data["plot_area"] == 0.35
    assert data["gps_coordinates"]["type"] == "Point"


@pytest.mark.asyncio
async def test_submit_claim_with_image_upload(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_file_upload
):
    """Test claim submission with image file upload"""
    claim_data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        }),
        "plot_area": "0.25"
    }
    
    files = {"image": sample_image_file}
    
    response = await test_client.post(
        "/api/claims/submit",
        data=claim_data,
        files=files,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "image_url" in data
    assert data["image_url"].startswith("http")


@pytest.mark.asyncio
async def test_submit_claim_missing_gps(test_client: AsyncClient, auth_headers):
    """Test that claim submission fails without GPS coordinates"""
    claim_data = {
        "plot_area": "0.25"
    }
    
    response = await test_client.post(
        "/api/claims/submit",
        data=claim_data,
        headers=auth_headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_submit_claim_invalid_geojson(test_client: AsyncClient, auth_headers):
    """Test that claim submission fails with invalid GeoJSON"""
    claim_data = {
        "gps_coordinates": json.dumps({
            "invalid": "structure"
        }),
        "plot_area": "0.25"
    }
    
    response = await test_client.post(
        "/api/claims/submit",
        data=claim_data,
        headers=auth_headers
    )
    
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_submit_claim_unauthorized(test_client: AsyncClient):
    """Test that claim submission requires authentication"""
    claim_data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        }),
        "plot_area": "0.25"
    }
    
    response = await test_client.post(
        "/api/claims/submit",
        data=claim_data
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_claim_by_id_success(test_client: AsyncClient, auth_headers, test_claim):
    """Test retrieving a specific claim by ID"""
    response = await test_client.get(
        f"/api/claims/{test_claim['id']}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_claim["id"]
    assert data["claimant_email"] == test_claim["claimant_email"]
    assert data["status"] == test_claim["status"]


@pytest.mark.asyncio
async def test_get_claim_by_id_not_found(test_client: AsyncClient, auth_headers):
    """Test retrieving non-existent claim"""
    response = await test_client.get(
        "/api/claims/nonexistent_id_12345",
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_claim_by_id_unauthorized(test_client: AsyncClient, test_claim):
    """Test that retrieving claim requires authentication"""
    response = await test_client.get(f"/api/claims/{test_claim['id']}")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_claims(test_client: AsyncClient, auth_headers, test_claim):
    """Test retrieving list of all claims"""
    response = await test_client.get(
        "/api/claims",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(claim["id"] == test_claim["id"] for claim in data)


@pytest.mark.asyncio
async def test_get_claims_by_status_filter(test_client: AsyncClient, auth_headers, test_claim):
    """Test filtering claims by status"""
    response = await test_client.get(
        "/api/claims?status=pending",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # All returned claims should have pending status
    for claim in data:
        assert claim["status"] == "pending"


@pytest.mark.asyncio
async def test_get_claims_by_claimant(test_client: AsyncClient, auth_headers, test_user):
    """Test retrieving claims by specific claimant"""
    response = await test_client.get(
        f"/api/claims?claimant_id={test_user['id']}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # All returned claims should belong to the test user
    for claim in data:
        assert claim["claimant_id"] == test_user["id"]


@pytest.mark.asyncio
async def test_get_my_claims(test_client: AsyncClient, auth_headers, test_claim):
    """Test retrieving current user's own claims"""
    response = await test_client.get(
        "/api/claims/my-claims",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_update_claim_status_as_official(
    test_client: AsyncClient, 
    official_headers, 
    test_claim
):
    """Test that government officials can update claim status"""
    response = await test_client.patch(
        f"/api/claims/{test_claim['id']}/status",
        json={"status": "verified"},
        headers=official_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"


@pytest.mark.asyncio
async def test_update_claim_status_unauthorized_role(
    test_client: AsyncClient, 
    auth_headers,  # Regular citizen
    test_claim
):
    """Test that citizens cannot update claim status"""
    response = await test_client.patch(
        f"/api/claims/{test_claim['id']}/status",
        json={"status": "verified"},
        headers=auth_headers
    )
    
    assert response.status_code == 403  # Forbidden


@pytest.mark.asyncio
async def test_delete_claim_as_owner(test_client: AsyncClient, auth_headers, test_claim):
    """Test that claim owner can delete their own claim"""
    response = await test_client.delete(
        f"/api/claims/{test_claim['id']}",
        headers=auth_headers
    )
    
    assert response.status_code in [200, 204]


@pytest.mark.asyncio
async def test_delete_claim_not_owner(
    test_client: AsyncClient, 
    leader_headers,  # Different user
    test_claim
):
    """Test that users cannot delete claims they don't own"""
    response = await test_client.delete(
        f"/api/claims/{test_claim['id']}",
        headers=leader_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_claim_pagination(test_client: AsyncClient, auth_headers, mock_db, test_user):
    """Test pagination of claims list"""
    # Create multiple test claims
    for i in range(15):
        await mock_db.claims.insert_one({
            "claimant_id": test_user["id"],
            "gps_coordinates": {"type": "Point", "coordinates": [36.8219 + i*0.001, -1.2921]},
            "plot_area": 0.25,
            "status": "pending"
        })
    
    # Test first page
    response = await test_client.get(
        "/api/claims?page=1&limit=10",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 10
    
    # Test second page
    response = await test_client.get(
        "/api/claims?page=2&limit=10",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5  # Should have remaining claims


@pytest.mark.asyncio
async def test_claim_includes_timestamps(test_client: AsyncClient, auth_headers, mock_file_upload):
    """Test that claims include created_at and updated_at timestamps"""
    claim_data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        }),
        "plot_area": "0.25"
    }
    
    response = await test_client.post(
        "/api/claims/submit",
        data=claim_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "created_at" in data
    assert "updated_at" in data
