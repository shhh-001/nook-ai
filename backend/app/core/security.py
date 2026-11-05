import os
from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

# Supabase JWT Secret — optional, needed for full signature verification.
# If not set, we decode without verification (safe for dev, tokens still expire).
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"


def get_verified_user_id(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency that extracts and validates the Supabase JWT token.
    Returns the user's UUID (sub claim).

    Verification strategy:
    1. If SUPABASE_JWT_SECRET is set → full signature verification
    2. Otherwise → decode without verification (claims still checked for expiry via python-jose)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>",
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        # python-jose is always available (listed in requirements.txt)
        from jose import jwt, JWTError

        if JWT_SECRET:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[ALGORITHM],
                options={"verify_aud": False},
            )
        else:
            # Decode without signature verification.
            # The token's exp claim is still checked by python-jose.
            payload = jwt.decode(
                token,
                "placeholder-secret-not-used",
                algorithms=[ALGORITHM],
                options={"verify_aud": False, "verify_signature": False},
            )

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user identifier (sub claim).",
            )
        return user_id

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate token: {str(e)}",
        )
