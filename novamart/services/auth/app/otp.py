import random
import redis
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Redis client — connects to the Docker Redis container
_redis = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

OTP_TTL       = settings.OTP_EXPIRE_SECONDS   # 240 seconds = 4 minutes
MAX_ATTEMPTS  = 3


def _otp_key(email: str) -> str:
    """Redis key for storing the OTP code."""
    return f"otp:{email}"


def _attempts_key(email: str) -> str:
    """Redis key for tracking verification attempts."""
    return f"otp_attempts:{email}"


def generate_and_store_otp(email: str) -> str:
    """
    Generates a random 6-digit OTP, stores it in Redis with a 4-minute TTL,
    resets the attempt counter, and returns the code.
    """
    code = str(random.randint(100000, 999999))

    _redis.setex(_otp_key(email), OTP_TTL, code)
    _redis.setex(_attempts_key(email), OTP_TTL, "0")

    # Always log OTP to Docker terminal for local dev fallback
    logger.warning(f"[OTP] Code for {email}: {code}  (expires in {OTP_TTL}s)")

    return code


def verify_otp(email: str, submitted_code: str) -> dict:
    """
    Verifies a submitted OTP code against the stored Redis value.

    Returns a dict:
      { "success": True }                   — on correct code
      { "success": False, "reason": "..." } — on failure
    """
    stored_code = _redis.get(_otp_key(email))

    # OTP doesn't exist or has expired
    if stored_code is None:
        return {"success": False, "reason": "expired"}

    # Check attempt count
    attempts = int(_redis.get(_attempts_key(email)) or 0)
    if attempts >= MAX_ATTEMPTS:
        # Nuke both keys so user must request a fresh OTP
        _redis.delete(_otp_key(email))
        _redis.delete(_attempts_key(email))
        return {"success": False, "reason": "max_attempts"}

    # Compare codes
    if submitted_code.strip() != stored_code.strip():
        _redis.incr(_attempts_key(email))
        remaining = MAX_ATTEMPTS - attempts - 1
        return {"success": False, "reason": "invalid", "attempts_left": remaining}

    # ✅ Correct! Delete from Redis immediately (one-time use)
    _redis.delete(_otp_key(email))
    _redis.delete(_attempts_key(email))
    return {"success": True}
