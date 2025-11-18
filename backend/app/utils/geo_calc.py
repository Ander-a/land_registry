"""
Utility functions for geographic calculations
"""
from typing import List, Tuple
import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth (in meters)
    using the Haversine formula.
    
    Args:
        lat1, lon1: Latitude and longitude of point 1 in degrees
        lat2, lon2: Latitude and longitude of point 2 in degrees
    
    Returns:
        Distance in meters
    """
    # Earth's radius in meters
    R = 6371000
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * \
        math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def calculate_polygon_area(coordinates: List[List[float]]) -> float:
    """
    Calculate the area of a polygon in hectares using the Shoelace formula
    with Haversine distance for geographic coordinates.
    
    Args:
        coordinates: List of [longitude, latitude] pairs forming a polygon
                    Example: [[lon1, lat1], [lon2, lat2], ...]
    
    Returns:
        Area in hectares (1 hectare = 10,000 square meters)
    """
    if not coordinates or len(coordinates) < 3:
        return 0.0
    
    # Remove the closing point if it's the same as the first point
    if coordinates[0] == coordinates[-1]:
        coordinates = coordinates[:-1]
    
    # Calculate area using the Shoelace formula with projected coordinates
    # First, we need to convert geographic coordinates to a local projection
    # We'll use the centroid as the reference point
    
    # Calculate centroid
    avg_lat = sum(coord[1] for coord in coordinates) / len(coordinates)
    avg_lon = sum(coord[0] for coord in coordinates) / len(coordinates)
    
    # Convert to meters using a simple equirectangular projection
    # This works well for small areas
    def to_meters(lon, lat):
        x = haversine_distance(avg_lat, avg_lon, avg_lat, lon)
        if lon < avg_lon:
            x = -x
        y = haversine_distance(avg_lat, avg_lon, lat, avg_lon)
        if lat < avg_lat:
            y = -y
        return x, y
    
    # Convert all coordinates to meters
    coords_meters = [to_meters(lon, lat) for lon, lat in coordinates]
    
    # Apply Shoelace formula
    area_sq_meters = 0.0
    n = len(coords_meters)
    
    for i in range(n):
        j = (i + 1) % n
        area_sq_meters += coords_meters[i][0] * coords_meters[j][1]
        area_sq_meters -= coords_meters[j][0] * coords_meters[i][1]
    
    area_sq_meters = abs(area_sq_meters) / 2.0
    
    # Convert square meters to hectares (1 hectare = 10,000 m²)
    area_hectares = area_sq_meters / 10000.0
    
    return round(area_hectares, 2)


def calculate_boundary_area(boundary: dict) -> float:
    """
    Calculate area from a GeoJSON boundary polygon.
    
    Args:
        boundary: GeoJSON polygon dict with 'type' and 'coordinates' keys
                 Example: {"type": "Polygon", "coordinates": [[[lon, lat], ...]]}
    
    Returns:
        Area in hectares
    """
    if not boundary or boundary.get("type") != "Polygon":
        return 0.0
    
    coordinates = boundary.get("coordinates", [[]])
    if not coordinates or len(coordinates[0]) < 3:
        return 0.0
    
    # Use the outer ring (first element) for area calculation
    outer_ring = coordinates[0]
    
    return calculate_polygon_area(outer_ring)
