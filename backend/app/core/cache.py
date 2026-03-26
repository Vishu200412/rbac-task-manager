import redis
import json
import os
from dotenv import load_dotenv
from app.core.logger import get_logger

load_dotenv()

logger = get_logger("cache")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_TTL  = int(os.getenv("REDIS_TTL_SECONDS", 300))

# ── Connect to Redis ───────────────────────────────────────────────────────────
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True,
        socket_connect_timeout=2,
    )
    redis_client.ping()
    logger.info(f"Redis connected at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis connection failed: {e} — caching disabled")
    redis_client = None


def _is_available() -> bool:
    """Check if Redis is available before every operation."""
    if redis_client is None:
        return False
    try:
        redis_client.ping()
        return True
    except Exception:
        return False


def cache_get(key: str):
    """
    Retrieve a value from cache.
    Returns the parsed Python object, or None if not found / cache unavailable.
    """
    if not _is_available():
        return None
    try:
        value = redis_client.get(key)
        if value:
            logger.debug(f"Cache HIT  → {key}")
            return json.loads(value)
        logger.debug(f"Cache MISS → {key}")
        return None
    except Exception as e:
        logger.warning(f"Cache get error for key '{key}': {e}")
        return None


def cache_set(key: str, value, ttl: int = REDIS_TTL) -> bool:
    """
    Store a value in cache with TTL (seconds).
    Value must be JSON-serialisable.
    Returns True on success, False otherwise.
    """
    if not _is_available():
        return False
    try:
        redis_client.setex(key, ttl, json.dumps(value, default=str))
        logger.debug(f"Cache SET  → {key} (TTL={ttl}s)")
        return True
    except Exception as e:
        logger.warning(f"Cache set error for key '{key}': {e}")
        return False


def cache_delete(key: str) -> bool:
    """Delete a single key from cache."""
    if not _is_available():
        return False
    try:
        redis_client.delete(key)
        logger.debug(f"Cache DEL  → {key}")
        return True
    except Exception as e:
        logger.warning(f"Cache delete error for key '{key}': {e}")
        return False


def cache_delete_pattern(pattern: str) -> int:
    """
    Delete all keys matching a pattern (e.g. 'tasks:user:42:*').
    Returns number of keys deleted.
    """
    if not _is_available():
        return 0
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.debug(f"Cache DEL pattern '{pattern}' → {len(keys)} key(s) removed")
            return len(keys)
        return 0
    except Exception as e:
        logger.warning(f"Cache delete pattern error '{pattern}': {e}")
        return 0


# ── Key builders (keeps naming consistent across the app) ─────────────────────
def task_list_key(user_id: int, status: str = None, priority: int = None) -> str:
    return f"tasks:user:{user_id}:list:status={status}:priority={priority}"

def task_detail_key(task_id: int) -> str:
    return f"tasks:detail:{task_id}"

def user_tasks_pattern(user_id: int) -> str:
    return f"tasks:user:{user_id}:*"
