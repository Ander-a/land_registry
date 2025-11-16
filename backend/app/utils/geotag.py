from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from typing import Optional, Dict

def get_exif_data(image_path: str) -> Dict:
    """Extract EXIF data from an image."""
    try:
        image = Image.open(image_path)
        exif_data = {}
        
        if hasattr(image, '_getexif') and image._getexif() is not None:
            exif = image._getexif()
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                exif_data[tag] = value
        
        return exif_data
    except Exception as e:
        print(f"Error reading EXIF: {e}")
        return {}

def get_geotagging(exif_data: Dict) -> Optional[Dict]:
    """Extract GPS data from EXIF."""
    if not exif_data:
        return None
    
    gps_info = exif_data.get('GPSInfo')
    if not gps_info:
        return None
    
    gps_data = {}
    for tag_id, value in gps_info.items():
        tag = GPSTAGS.get(tag_id, tag_id)
        gps_data[tag] = value
    
    return gps_data

def convert_to_degrees(value):
    """Convert GPS coordinates to degrees in float format."""
    d, m, s = value
    return d + (m / 60.0) + (s / 3600.0)

def extract_geolocation(image_path: str) -> Optional[Dict[str, float]]:
    """
    Extract GPS coordinates from image EXIF data.
    Returns {"latitude": float, "longitude": float} or None.
    """
    exif_data = get_exif_data(image_path)
    gps_data = get_geotagging(exif_data)
    
    if not gps_data:
        return None
    
    try:
        lat = gps_data.get('GPSLatitude')
        lat_ref = gps_data.get('GPSLatitudeRef')
        lon = gps_data.get('GPSLongitude')
        lon_ref = gps_data.get('GPSLongitudeRef')
        
        if not all([lat, lat_ref, lon, lon_ref]):
            return None
        
        latitude = convert_to_degrees(lat)
        if lat_ref == 'S':
            latitude = -latitude
        
        longitude = convert_to_degrees(lon)
        if lon_ref == 'W':
            longitude = -longitude
        
        return {
            "latitude": latitude,
            "longitude": longitude
        }
    except Exception as e:
        print(f"Error extracting geolocation: {e}")
        return None
