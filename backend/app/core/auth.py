import jwt
from jwt import PyJWKClient
from datetime import timedelta
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
    Supports both HS256 (symmetric) and ES256 (asymmetric) algorithms.
    """
    if not authorization.startswith("Bearer ") and not authorization.startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
        )
    
    token = authorization.split(" ", 1)[1]
    
    try:
        # Check unverified header to see what algorithm is used
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
        
        if alg == "ES256":
            # Asymmetric key verification using JWKS endpoint
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                options={"verify_aud": False},
                leeway=timedelta(seconds=60)
            )
        else:
            # Symmetric key verification using local secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
                leeway=timedelta(seconds=60)
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
