import jwt
from uuid import UUID
from fastapi import Header, HTTPException, status
from pydantic import BaseModel
from app.core.config import settings

class CurrentUser(BaseModel):
    id: UUID
    email: str
    full_name: str | None = None

def get_current_user(authorization: str = Header(...)) -> CurrentUser:
    """
    FastAPI dependency to verify Supabase JWT.
    Expects header format: Authorization: Bearer <token>
    """
    if not authorization.startswith("Bearer ") and not authorization.startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
        )
    
    token = authorization.split(" ", 1)[1]
    
    try:
        # Decode using the Supabase JWT secret
        # Disable audience verification to prevent local development environment mismatches
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing user identifiers (sub or email)",
            )
            
        # Parse full name from user metadata if present
        user_metadata = payload.get("user_metadata", {})
        full_name = user_metadata.get("full_name") or user_metadata.get("name")
        
        return CurrentUser(id=user_id, email=email, full_name=full_name)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )
