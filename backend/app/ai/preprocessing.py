import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional

def load_image(image_path: str) -> np.ndarray:
    """
    Load an image from file path using OpenCV.
    
    Args:
        image_path: Path to the image file
    
    Returns:
        numpy.ndarray: Loaded image in BGR format
    
    Raises:
        Exception: If image cannot be loaded
    """
    image = cv2.imread(image_path)
    if image is None:
        raise Exception(f"Failed to load image from {image_path}")
    return image

def resize_image(image: np.ndarray, max_width: int = 1024, max_height: int = 1024) -> np.ndarray:
    """
    Resize image to fit within max dimensions while maintaining aspect ratio.
    
    Args:
        image: Input image as numpy array
        max_width: Maximum width
        max_height: Maximum height
    
    Returns:
        numpy.ndarray: Resized image
    """
    height, width = image.shape[:2]
    
    # Calculate scaling factor
    scale = min(max_width / width, max_height / height)
    
    # Only resize if image is larger than max dimensions
    if scale < 1:
        new_width = int(width * scale)
        new_height = int(height * scale)
        return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    return image

def convert_to_grayscale(image: np.ndarray) -> np.ndarray:
    """
    Convert BGR image to grayscale.
    
    Args:
        image: Input image in BGR format
    
    Returns:
        numpy.ndarray: Grayscale image
    """
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image

def apply_gaussian_blur(image: np.ndarray, kernel_size: Tuple[int, int] = (5, 5)) -> np.ndarray:
    """
    Apply Gaussian blur to reduce noise.
    
    Args:
        image: Input grayscale image
        kernel_size: Size of Gaussian kernel (must be odd numbers)
    
    Returns:
        numpy.ndarray: Blurred image
    """
    return cv2.GaussianBlur(image, kernel_size, 0)

def extract_edges(image: np.ndarray, low_threshold: int = 50, high_threshold: int = 150) -> np.ndarray:
    """
    Apply Canny edge detection.
    
    Args:
        image: Input grayscale image
        low_threshold: Lower threshold for hysteresis
        high_threshold: Upper threshold for hysteresis
    
    Returns:
        numpy.ndarray: Binary edge image
    """
    return cv2.Canny(image, low_threshold, high_threshold)

def apply_threshold(image: np.ndarray, threshold_value: int = 127) -> np.ndarray:
    """
    Apply binary thresholding.
    
    Args:
        image: Input grayscale image
        threshold_value: Threshold value (0-255)
    
    Returns:
        numpy.ndarray: Binary thresholded image
    """
    _, binary = cv2.threshold(image, threshold_value, 255, cv2.THRESH_BINARY)
    return binary

def apply_adaptive_threshold(image: np.ndarray) -> np.ndarray:
    """
    Apply adaptive thresholding for better results with varying lighting.
    
    Args:
        image: Input grayscale image
    
    Returns:
        numpy.ndarray: Binary thresholded image
    """
    return cv2.adaptiveThreshold(
        image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

def find_contours(binary_image: np.ndarray) -> list:
    """
    Extract contours from a binary image.
    
    Args:
        binary_image: Binary input image
    
    Returns:
        list: List of contours (each contour is a numpy array of points)
    """
    contours, _ = cv2.findContours(binary_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return contours

def preprocess_image(image_path: str) -> Tuple[np.ndarray, np.ndarray, list]:
    """
    Complete preprocessing pipeline for boundary detection.
    
    Args:
        image_path: Path to the input image
    
    Returns:
        Tuple containing:
            - Original resized image
            - Processed binary image
            - List of detected contours
    
    Raises:
        Exception: If preprocessing fails
    """
    try:
        # Load and resize image
        original = load_image(image_path)
        resized = resize_image(original)
        
        # Convert to grayscale
        gray = convert_to_grayscale(resized)
        
        # Apply Gaussian blur to reduce noise
        blurred = apply_gaussian_blur(gray, kernel_size=(7, 7))
        
        # Apply edge detection
        edges = extract_edges(blurred, low_threshold=30, high_threshold=100)
        
        # Dilate edges to close gaps
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=2)
        
        # Find contours
        contours = find_contours(dilated)
        
        return resized, dilated, contours
    
    except Exception as e:
        raise Exception(f"Preprocessing failed: {str(e)}")

def get_image_dimensions(image_path: str) -> Tuple[int, int]:
    """
    Get image dimensions without loading the full image.
    
    Args:
        image_path: Path to the image file
    
    Returns:
        Tuple of (width, height)
    """
    with Image.open(image_path) as img:
        return img.size
