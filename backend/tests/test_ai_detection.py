"""
AI Boundary Detection Tests
Tests for AI-powered land boundary detection using OpenCV
"""
import pytest
from httpx import AsyncClient
import json
from unittest.mock import patch, MagicMock
import numpy as np


@pytest.mark.asyncio
async def test_detect_boundary_success(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test successful AI boundary detection"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    result = response.json()
    assert "boundary" in result
    assert result["boundary"]["type"] == "Polygon"
    assert "coordinates" in result["boundary"]
    assert "confidence" in result
    assert "area_hectares" in result


@pytest.mark.asyncio
async def test_detect_boundary_no_image(test_client: AsyncClient, auth_headers):
    """Test boundary detection without image upload"""
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 422  # Validation error - missing image


@pytest.mark.asyncio
async def test_detect_boundary_invalid_image_format(test_client: AsyncClient, auth_headers):
    """Test boundary detection with invalid image format"""
    # Create a fake non-image file
    files = {"image": ("test.txt", b"not an image", "text/plain")}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_detect_boundary_unauthorized(test_client: AsyncClient, sample_image_file):
    """Test that boundary detection requires authentication"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_detect_boundary_returns_polygon(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test that detected boundary is a valid GeoJSON Polygon"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    result = response.json()
    
    # Validate GeoJSON Polygon structure
    boundary = result["boundary"]
    assert boundary["type"] == "Polygon"
    assert isinstance(boundary["coordinates"], list)
    assert len(boundary["coordinates"]) > 0
    
    # Polygon should have at least 4 coordinates (3 unique + 1 closing)
    coords = boundary["coordinates"][0]
    assert len(coords) >= 4
    
    # First and last coordinate should be the same (closed polygon)
    assert coords[0] == coords[-1]


@pytest.mark.asyncio
async def test_detect_boundary_confidence_score(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test that confidence score is returned and valid"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    result = response.json()
    
    assert "confidence" in result
    confidence = result["confidence"]
    assert 0.0 <= confidence <= 1.0


@pytest.mark.asyncio
async def test_detect_boundary_calculates_area(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test that area is calculated in hectares"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    result = response.json()
    
    assert "area_hectares" in result
    area = result["area_hectares"]
    assert area > 0
    assert isinstance(area, (int, float))


@pytest.mark.asyncio
async def test_detect_boundary_no_clear_boundary_found(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_file_upload
):
    """Test fallback when no clear boundary is detected"""
    # Mock detection to return None/empty result
    with patch('app.ai_module.detect_boundary') as mock_detect:
        mock_detect.return_value = None
        
        files = {"image": sample_image_file}
        data = {
            "gps_coordinates": json.dumps({
                "type": "Point",
                "coordinates": [36.8219, -1.2921]
            })
        }
        
        response = await test_client.post(
            "/api/ai/detect-boundary",
            files=files,
            data=data,
            headers=auth_headers
        )
        
        # Should return 200 with low confidence or error message
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            result = response.json()
            # Either returns low confidence or indicates no boundary found
            assert result.get("confidence", 0) < 0.5 or "error" in result


@pytest.mark.asyncio
async def test_opencv_contour_detection_called(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test that OpenCV detection function is called"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    # Verify mock was called
    mock_opencv_detection.assert_called_once()


@pytest.mark.asyncio
async def test_detect_boundary_with_multiple_contours(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_file_upload
):
    """Test detection when multiple contours are found (should pick largest)"""
    with patch('app.ai_module.detect_boundary') as mock_detect:
        # Return multiple boundaries
        mock_detect.return_value = {
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
            "confidence": 0.92,
            "area_hectares": 0.25,
            "contours_found": 3  # Multiple contours detected
        }
        
        files = {"image": sample_image_file}
        data = {
            "gps_coordinates": json.dumps({
                "type": "Point",
                "coordinates": [36.8219, -1.2921]
            })
        }
        
        response = await test_client.post(
            "/api/ai/detect-boundary",
            files=files,
            data=data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["boundary"]["type"] == "Polygon"
        # Should return the largest/best boundary


@pytest.mark.asyncio
async def test_detect_boundary_image_preprocessing(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_file_upload
):
    """Test that image preprocessing is applied before detection"""
    with patch('app.ai_module.preprocess_image') as mock_preprocess:
        with patch('app.ai_module.detect_boundary') as mock_detect:
            mock_preprocess.return_value = MagicMock()
            mock_detect.return_value = {
                "boundary": {
                    "type": "Polygon",
                    "coordinates": [[[36.8219, -1.2921], [36.8229, -1.2921], 
                                     [36.8229, -1.2931], [36.8219, -1.2921]]]
                },
                "confidence": 0.85,
                "area_hectares": 0.25
            }
            
            files = {"image": sample_image_file}
            data = {
                "gps_coordinates": json.dumps({
                    "type": "Point",
                    "coordinates": [36.8219, -1.2921]
                })
            }
            
            response = await test_client.post(
                "/api/ai/detect-boundary",
                files=files,
                data=data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            # Verify preprocessing was called
            mock_preprocess.assert_called_once()


@pytest.mark.asyncio
async def test_detect_boundary_with_geo_referencing(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test that pixel coordinates are converted to geo coordinates"""
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    result = response.json()
    
    # Check that coordinates are in proper lat/lng range
    coords = result["boundary"]["coordinates"][0]
    for coord in coords:
        lng, lat = coord
        assert -180 <= lng <= 180
        assert -90 <= lat <= 90


@pytest.mark.asyncio
async def test_ai_detection_integration_with_claim_submission(
    test_client: AsyncClient, 
    auth_headers, 
    sample_image_file,
    mock_opencv_detection,
    mock_file_upload
):
    """Test that AI detection integrates with claim submission"""
    # First detect boundary
    files = {"image": sample_image_file}
    data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        })
    }
    
    detect_response = await test_client.post(
        "/api/ai/detect-boundary",
        files=files,
        data=data,
        headers=auth_headers
    )
    
    assert detect_response.status_code == 200
    detected_boundary = detect_response.json()["boundary"]
    
    # Then submit claim with detected boundary
    claim_data = {
        "gps_coordinates": json.dumps({
            "type": "Point",
            "coordinates": [36.8219, -1.2921]
        }),
        "plot_area": "0.25",
        "ai_detected_boundary": json.dumps(detected_boundary)
    }
    
    claim_response = await test_client.post(
        "/api/claims/submit",
        data=claim_data,
        headers=auth_headers
    )
    
    assert claim_response.status_code == 201
    claim = claim_response.json()
    assert "ai_detected_boundary" in claim
    assert claim["ai_detected_boundary"]["type"] == "Polygon"
