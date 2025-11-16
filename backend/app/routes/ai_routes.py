from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends
import os
import tempfile
from typing import Optional

from ..models.user import User
from ..models.ai_result import AIResult
from ..auth.auth import JWTBearer
from ..ai.boundary_detection import detect_boundary
from ..utils.storage import save_upload_file

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/detect-boundary")
async def detect_boundary_endpoint(
    photo: UploadFile = File(...),
    method: str = "classical",
    claim_id: Optional[str] = None,
    current_user: User = Depends(JWTBearer())
):
    """
    Detect land boundary from an uploaded image using AI/CV algorithms.
    
    **Parameters:**
    - **photo**: Image file to analyze
    - **method**: Detection method - "classical" (default) or "ml"
    - **claim_id**: Optional claim ID to associate with this detection
    - **current_user**: Authenticated user from JWT token
    
    **Returns:**
    - **success**: Boolean indicating success
    - **polygon**: GeoJSON polygon with detected boundary
    - **message**: Description of the result
    - **result_id**: ID of the stored AI result in database
    
    **Process:**
    1. Save uploaded image temporarily
    2. Run boundary detection algorithm
    3. Save results to MongoDB
    4. Return GeoJSON polygon for frontend use
    """
    temp_path = None
    
    try:
        # Validate method parameter
        if method not in ["classical", "ml"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid method. Choose 'classical' or 'ml'"
            )
        
        # Save uploaded file to permanent storage
        photo_path = await save_upload_file(photo)
        
        # Get full file path for processing
        from ..utils.storage import get_file_path
        full_path = get_file_path(photo_path)
        
        # Run boundary detection
        try:
            polygon = detect_boundary(str(full_path), method=method)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Boundary detection failed: {str(e)}. Make sure the image contains clear land boundaries."
            )
        
        # Validate polygon
        if not polygon or polygon.get("type") != "Polygon":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Failed to generate valid polygon from image"
            )
        
        coordinates = polygon.get("coordinates", [[]])
        if len(coordinates[0]) < 4:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Detected boundary has too few points. Please use a clearer image."
            )
        
        # Save AI result to MongoDB
        ai_result = AIResult(
            user_id=str(current_user.id),
            claim_id=claim_id,
            image_url=photo_path,
            detected_polygon=polygon,
            method=method
        )
        await ai_result.insert()
        
        # Return success response
        return {
            "success": True,
            "polygon": polygon,
            "message": f"Boundary detected successfully using {method} method",
            "result_id": str(ai_result.id),
            "num_points": len(coordinates[0])
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    
    finally:
        # Clean up temporary file if it exists
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

@router.get("/results/{result_id}")
async def get_ai_result(
    result_id: str,
    current_user: User = Depends(JWTBearer())
):
    """
    Retrieve a specific AI detection result by ID.
    
    Args:
        result_id: The ID of the AI result to retrieve
        current_user: Authenticated user
    
    Returns:
        dict: AI result details including detected polygon
    """
    from bson import ObjectId
    
    try:
        ai_result = await AIResult.get(ObjectId(result_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result ID format"
        )
    
    if not ai_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI result not found"
        )
    
    # Ensure user can only access their own results
    if ai_result.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own AI results"
        )
    
    return {
        "id": str(ai_result.id),
        "user_id": ai_result.user_id,
        "claim_id": ai_result.claim_id,
        "image_url": ai_result.image_url,
        "polygon": ai_result.detected_polygon,
        "method": ai_result.method,
        "confidence": ai_result.confidence,
        "created_at": ai_result.created_at
    }

@router.get("/results/")
async def get_user_ai_results(current_user: User = Depends(JWTBearer())):
    """
    Get all AI detection results for the authenticated user.
    
    Args:
        current_user: Authenticated user
    
    Returns:
        list: List of AI results
    """
    results = await AIResult.find(AIResult.user_id == str(current_user.id)).to_list()
    
    return [
        {
            "id": str(result.id),
            "user_id": result.user_id,
            "claim_id": result.claim_id,
            "image_url": result.image_url,
            "polygon": result.detected_polygon,
            "method": result.method,
            "confidence": result.confidence,
            "created_at": result.created_at
        }
        for result in results
    ]
