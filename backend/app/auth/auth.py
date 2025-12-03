from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt

from ..config import settings
from ..models.user import User


security = HTTPBearer()


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt. Truncates to 72 bytes if needed.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        str: Hashed password
    """
    # Bcrypt has a 72 byte limit
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    # Truncate to 72 bytes to match what was hashed
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing user data to encode (typically {"sub": email, "role": role})
        expires_delta: Optional custom expiration time
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


class JWTBearer:
    """
    FastAPI dependency for JWT token authentication.
    
    Extracts and validates JWT token from Authorization header,
    then retrieves the corresponding user from database.
    """
    
    def __init__(self, auto_error: bool = True):
        """
        Initialize JWT bearer authentication.
        
        Args:
            auto_error: If True, raises HTTPException on authentication failure
        """
        self.auto_error = auto_error

    async def __call__(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """
        Validate JWT token and return authenticated user.
        
        Args:
            credentials: HTTP Authorization credentials with Bearer token
            
        Returns:
            User: Authenticated user object from database
            
        Raises:
            HTTPException: 401 if token is invalid or user not found
        """
        if credentials:
            token = credentials.credentials
            try:
                payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
                email: str = payload.get("sub")
                if email is None:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid authentication credentials"
                    )
            except JWTError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Could not validate credentials: {str(e)}"
                )

            user = await User.find_one(User.email == email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            # Check if user is active
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is inactive"
                )
            
            return user

        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization code."
            )
        return None


# Create a reusable dependency for getting the current user
async def get_current_user(user: User = Depends(JWTBearer())) -> User:
    """
    Dependency to get the current authenticated user.
    
    This is a convenience wrapper around JWTBearer for cleaner route definitions.
    
    Returns:
        User: The authenticated user
    """
    return user
