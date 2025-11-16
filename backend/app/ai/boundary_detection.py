import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
from .preprocessing import preprocess_image, get_image_dimensions

def select_largest_contour(contours: list) -> Optional[np.ndarray]:
    """
    Select the largest contour by area.
    
    Args:
        contours: List of contours
    
    Returns:
        numpy.ndarray: Largest contour or None if no contours found
    """
    if not contours:
        return None
    
    # Find contour with maximum area
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Filter out very small contours (noise)
    min_area = 100
    if cv2.contourArea(largest_contour) < min_area:
        return None
    
    return largest_contour

def approximate_polygon(contour: np.ndarray, epsilon_factor: float = 0.01) -> np.ndarray:
    """
    Approximate contour to a polygon with fewer points using Douglas-Peucker algorithm.
    
    Args:
        contour: Input contour
        epsilon_factor: Approximation accuracy factor (lower = more accurate)
    
    Returns:
        numpy.ndarray: Approximated polygon
    """
    perimeter = cv2.arcLength(contour, True)
    epsilon = epsilon_factor * perimeter
    approx = cv2.approxPolyDP(contour, epsilon, True)
    return approx

def normalize_coordinates(contour: np.ndarray, image_width: int, image_height: int) -> List[List[float]]:
    """
    Normalize contour coordinates to [0, 1] range.
    
    Args:
        contour: Input contour with pixel coordinates
        image_width: Width of the image
        image_height: Height of the image
    
    Returns:
        List of normalized [x, y] coordinate pairs
    """
    normalized = []
    for point in contour:
        x, y = point[0]
        norm_x = float(x) / image_width
        norm_y = float(y) / image_height
        normalized.append([norm_x, norm_y])
    
    return normalized

def contour_to_geojson_polygon(contour: np.ndarray, image_width: int, image_height: int) -> Dict:
    """
    Convert OpenCV contour to GeoJSON Polygon format with normalized coordinates.
    
    Args:
        contour: OpenCV contour array
        image_width: Width of the image
        image_height: Height of the image
    
    Returns:
        dict: GeoJSON Polygon
    """
    # Simplify the contour to reduce number of points
    simplified = approximate_polygon(contour, epsilon_factor=0.02)
    
    # Reshape contour to 2D array of points
    points = simplified.reshape(-1, 2)
    
    # Normalize coordinates to [0, 1] range
    normalized_points = []
    for point in points:
        x, y = point
        norm_x = float(x) / image_width
        norm_y = float(y) / image_height
        normalized_points.append([norm_x, norm_y])
    
    # Close the polygon (last point = first point)
    if len(normalized_points) > 0 and normalized_points[0] != normalized_points[-1]:
        normalized_points.append(normalized_points[0])
    
    # Create GeoJSON polygon structure
    geojson_polygon = {
        "type": "Polygon",
        "coordinates": [normalized_points]
    }
    
    return geojson_polygon

def validate_polygon(polygon: Dict) -> bool:
    """
    Validate that a polygon has at least 3 points and is properly closed.
    
    Args:
        polygon: GeoJSON polygon dict
    
    Returns:
        bool: True if valid, False otherwise
    """
    if polygon.get("type") != "Polygon":
        return False
    
    coordinates = polygon.get("coordinates", [])
    if not coordinates or len(coordinates) == 0:
        return False
    
    ring = coordinates[0]
    if len(ring) < 4:  # At least 3 unique points + closing point
        return False
    
    # Check if polygon is closed
    if ring[0] != ring[-1]:
        return False
    
    return True

def detect_boundary_classical(image_path: str) -> Dict:
    """
    Detect land boundary using classical computer vision pipeline.
    
    Pipeline:
    1. Load and preprocess image
    2. Apply edge detection
    3. Find contours
    4. Select largest contour
    5. Approximate to polygon
    6. Convert to GeoJSON format
    
    Args:
        image_path: Path to the land image
    
    Returns:
        dict: GeoJSON polygon representing the detected boundary
    
    Raises:
        Exception: If boundary detection fails
    """
    try:
        # Get original image dimensions
        img_width, img_height = get_image_dimensions(image_path)
        
        # Preprocess image and extract contours
        original, processed, contours = preprocess_image(image_path)
        
        if not contours:
            raise Exception("No contours detected in the image")
        
        # Select the largest contour (assumed to be the land boundary)
        largest_contour = select_largest_contour(contours)
        
        if largest_contour is None:
            raise Exception("No valid boundary contour found")
        
        # Get dimensions of the processed image (may differ from original due to resizing)
        proc_height, proc_width = processed.shape[:2]
        
        # Convert contour to GeoJSON polygon
        polygon = contour_to_geojson_polygon(largest_contour, proc_width, proc_height)
        
        # Validate polygon
        if not validate_polygon(polygon):
            raise Exception("Generated polygon is invalid")
        
        return polygon
    
    except Exception as e:
        raise Exception(f"Boundary detection failed: {str(e)}")

def run_unet_segmentation(image_array: np.ndarray) -> np.ndarray:
    """
    Run U-Net segmentation model on image.
    
    This is a placeholder for future ML-based boundary detection.
    In production, this would load a trained U-Net model and perform segmentation.
    
    Args:
        image_array: Input image as numpy array
    
    Returns:
        numpy.ndarray: Binary segmentation mask
    
    Note:
        Currently returns a simple threshold-based segmentation as placeholder.
    """
    # Placeholder: Convert to grayscale and threshold
    if len(image_array.shape) == 3:
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_array
    
    # Apply Otsu's thresholding
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return binary

def detect_boundary_ml(image_path: str) -> Dict:
    """
    Detect land boundary using ML-based approach (placeholder).
    
    Args:
        image_path: Path to the land image
    
    Returns:
        dict: GeoJSON polygon representing the detected boundary
    
    Note:
        This is a placeholder that falls back to classical CV.
        Replace with actual ML model inference in production.
    """
    # For now, fall back to classical approach
    # In production, this would use a trained segmentation model
    return detect_boundary_classical(image_path)

def detect_boundary(image_path: str, method: str = "classical") -> Dict:
    """
    Main function to detect land boundary from an image.
    
    Args:
        image_path: Path to the land image
        method: Detection method - "classical" or "ml"
    
    Returns:
        dict: GeoJSON polygon representing the detected boundary
    
    Raises:
        Exception: If detection fails
    """
    if method == "ml":
        return detect_boundary_ml(image_path)
    else:
        return detect_boundary_classical(image_path)
