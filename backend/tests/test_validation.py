"""
Validation Flow Tests
Tests for witness approvals and leader endorsements
"""
import pytest
from httpx import AsyncClient
import json


@pytest.mark.asyncio
async def test_witness_approval_success(
    test_client: AsyncClient, 
    auth_headers, 
    test_claim,
    test_user
):
    """Test successful witness approval of a claim"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/witness-approval",
        json={
            "witness_name": test_user["full_name"],
            "witness_id": test_user["id"],
            "comments": "I confirm this land claim is valid."
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "witness_approvals" in data
    assert len(data["witness_approvals"]) >= 1
    
    # Check that the approval was added
    approval = data["witness_approvals"][-1]
    assert approval["witness_id"] == test_user["id"]
    assert approval["witness_name"] == test_user["full_name"]


@pytest.mark.asyncio
async def test_witness_approval_duplicate_prevented(
    test_client: AsyncClient, 
    auth_headers, 
    test_claim,
    test_user,
    mock_db
):
    """Test that same witness cannot approve twice"""
    # First approval
    await mock_db.claims.update_one(
        {"_id": test_claim["_id"]},
        {"$push": {"witness_approvals": {
            "witness_id": test_user["id"],
            "witness_name": test_user["full_name"],
            "comments": "First approval"
        }}}
    )
    
    # Try to approve again
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/witness-approval",
        json={
            "witness_name": test_user["full_name"],
            "witness_id": test_user["id"],
            "comments": "Trying to approve again"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "already" in data["detail"].lower() or "duplicate" in data["detail"].lower()


@pytest.mark.asyncio
async def test_witness_approval_unauthorized(test_client: AsyncClient, test_claim):
    """Test that witness approval requires authentication"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/witness-approval",
        json={
            "witness_name": "Anonymous",
            "comments": "Approval attempt"
        }
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_witness_approval_claim_not_found(test_client: AsyncClient, auth_headers):
    """Test witness approval on non-existent claim"""
    response = await test_client.post(
        "/api/claims/nonexistent_claim_id/witness-approval",
        json={
            "witness_name": "Test Witness",
            "comments": "Approval"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_witness_approval_requires_comments(
    test_client: AsyncClient, 
    auth_headers, 
    test_claim
):
    """Test that witness approval requires comments/justification"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/witness-approval",
        json={
            "witness_name": "Test Witness"
            # Missing comments
        },
        headers=auth_headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_leader_endorsement_success(
    test_client: AsyncClient, 
    leader_headers, 
    test_claim,
    test_leader
):
    """Test successful leader endorsement"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/leader-endorsement",
        json={
            "decision": "approved",
            "comments": "This claim meets all community requirements."
        },
        headers=leader_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "leader_endorsement" in data
    
    endorsement = data["leader_endorsement"]
    assert endorsement["decision"] == "approved"
    assert endorsement["leader_id"] == test_leader["id"]


@pytest.mark.asyncio
async def test_leader_endorsement_rejection(
    test_client: AsyncClient, 
    leader_headers, 
    test_claim
):
    """Test leader rejection of a claim"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/leader-endorsement",
        json={
            "decision": "rejected",
            "comments": "Insufficient evidence provided."
        },
        headers=leader_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    endorsement = data["leader_endorsement"]
    assert endorsement["decision"] == "rejected"
    assert data["status"] == "rejected"  # Claim status should update


@pytest.mark.asyncio
async def test_leader_endorsement_non_leader_forbidden(
    test_client: AsyncClient, 
    auth_headers,  # Regular citizen
    test_claim
):
    """Test that only leaders can endorse claims"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/leader-endorsement",
        json={
            "decision": "approved",
            "comments": "Trying to endorse"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 403  # Forbidden


@pytest.mark.asyncio
async def test_leader_endorsement_requires_witnesses(
    test_client: AsyncClient, 
    leader_headers, 
    mock_db,
    test_user
):
    """Test that leader endorsement requires minimum witness approvals"""
    # Create a claim with no witnesses
    claim_data = {
        "claimant_id": test_user["id"],
        "gps_coordinates": {"type": "Point", "coordinates": [36.8219, -1.2921]},
        "plot_area": 0.25,
        "status": "pending",
        "witness_approvals": []  # No witnesses
    }
    result = await mock_db.claims.insert_one(claim_data)
    claim_id = str(result.inserted_id)
    
    response = await test_client.post(
        f"/api/claims/{claim_id}/leader-endorsement",
        json={
            "decision": "approved",
            "comments": "Approving without witnesses"
        },
        headers=leader_headers
    )
    
    # Should fail or warn about missing witnesses
    assert response.status_code in [400, 403]


@pytest.mark.asyncio
async def test_claim_status_transitions(
    test_client: AsyncClient, 
    auth_headers, 
    leader_headers,
    official_headers,
    mock_db,
    test_user,
    test_leader
):
    """Test proper status transitions: pending -> witness_approved -> leader_endorsed -> verified"""
    # Create a new claim
    claim_data = {
        "claimant_id": test_user["id"],
        "gps_coordinates": {"type": "Point", "coordinates": [36.8219, -1.2921]},
        "plot_area": 0.25,
        "status": "pending",
        "witness_approvals": []
    }
    result = await mock_db.claims.insert_one(claim_data)
    claim_id = str(result.inserted_id)
    
    # Step 1: Add witness approvals
    for i in range(2):  # Add 2 witnesses
        response = await test_client.post(
            f"/api/claims/{claim_id}/witness-approval",
            json={
                "witness_name": f"Witness {i+1}",
                "witness_id": f"witness_{i+1}",
                "comments": f"Approval from witness {i+1}"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
    
    # Step 2: Leader endorsement
    response = await test_client.post(
        f"/api/claims/{claim_id}/leader-endorsement",
        json={
            "decision": "approved",
            "comments": "Community leader approves"
        },
        headers=leader_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["pending_verification", "endorsed"]
    
    # Step 3: Final verification by government official
    response = await test_client.patch(
        f"/api/claims/{claim_id}/status",
        json={"status": "verified"},
        headers=official_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"


@pytest.mark.asyncio
async def test_cannot_skip_validation_steps(
    test_client: AsyncClient, 
    official_headers,
    mock_db,
    test_user
):
    """Test that claims cannot be verified without proper validation steps"""
    # Create a claim without witnesses or endorsement
    claim_data = {
        "claimant_id": test_user["id"],
        "gps_coordinates": {"type": "Point", "coordinates": [36.8219, -1.2921]},
        "plot_area": 0.25,
        "status": "pending",
        "witness_approvals": [],
        "leader_endorsement": None
    }
    result = await mock_db.claims.insert_one(claim_data)
    claim_id = str(result.inserted_id)
    
    # Try to verify directly
    response = await test_client.patch(
        f"/api/claims/{claim_id}/status",
        json={"status": "verified"},
        headers=official_headers
    )
    
    # Should fail due to missing validation steps
    assert response.status_code in [400, 403]


@pytest.mark.asyncio
async def test_witness_approval_includes_timestamp(
    test_client: AsyncClient, 
    auth_headers, 
    test_claim,
    test_user
):
    """Test that witness approvals include timestamp"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/witness-approval",
        json={
            "witness_name": test_user["full_name"],
            "witness_id": test_user["id"],
            "comments": "Approval with timestamp"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    approval = data["witness_approvals"][-1]
    assert "timestamp" in approval or "approved_at" in approval


@pytest.mark.asyncio
async def test_leader_endorsement_includes_timestamp(
    test_client: AsyncClient, 
    leader_headers, 
    test_claim
):
    """Test that leader endorsement includes timestamp"""
    response = await test_client.post(
        f"/api/claims/{test_claim['id']}/leader-endorsement",
        json={
            "decision": "approved",
            "comments": "Endorsement with timestamp"
        },
        headers=leader_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    endorsement = data["leader_endorsement"]
    assert "timestamp" in endorsement or "endorsed_at" in endorsement


@pytest.mark.asyncio
async def test_get_claims_pending_validation(
    test_client: AsyncClient, 
    leader_headers,
    mock_db,
    test_user
):
    """Test getting claims that need leader validation"""
    # Create claims with witness approvals but no leader endorsement
    for i in range(3):
        await mock_db.claims.insert_one({
            "claimant_id": test_user["id"],
            "gps_coordinates": {"type": "Point", "coordinates": [36.8219, -1.2921]},
            "plot_area": 0.25,
            "status": "pending",
            "witness_approvals": [{"witness_id": "w1", "comments": "OK"}],
            "leader_endorsement": None
        })
    
    response = await test_client.get(
        "/api/claims?needs_leader_endorsement=true",
        headers=leader_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    
    # All should have witnesses but no leader endorsement
    for claim in data:
        assert len(claim.get("witness_approvals", [])) > 0
        assert claim.get("leader_endorsement") is None


@pytest.mark.asyncio
async def test_validation_audit_trail(
    test_client: AsyncClient, 
    auth_headers,
    leader_headers,
    test_claim,
    test_user
):
    """Test that validation actions create proper audit trail"""
    # Add witness approval
    await test_client.post(
        f"/api/claims/{test_claim['id']}/witness-approval",
        json={
            "witness_name": test_user["full_name"],
            "witness_id": test_user["id"],
            "comments": "Witnessed"
        },
        headers=auth_headers
    )
    
    # Add leader endorsement
    await test_client.post(
        f"/api/claims/{test_claim['id']}/leader-endorsement",
        json={
            "decision": "approved",
            "comments": "Endorsed"
        },
        headers=leader_headers
    )
    
    # Get claim and verify audit trail
    response = await test_client.get(
        f"/api/claims/{test_claim['id']}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should have history/audit trail
    assert "witness_approvals" in data
    assert "leader_endorsement" in data
    assert "updated_at" in data
