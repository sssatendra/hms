import json
from typing import Any, Optional
import redis.asyncio as aioredis
import structlog

from app.config import settings

logger = structlog.get_logger()

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """Get Redis client (singleton)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=10,
        )
        logger.info("Redis client initialized")
    return _redis_client


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    client = await get_redis()
    await client.setex(key, ttl, json.dumps(value))


async def cache_get(key: str) -> Optional[Any]:
    client = await get_redis()
    data = await client.get(key)
    if data:
        return json.loads(data)
    return None


async def cache_delete(key: str) -> None:
    client = await get_redis()
    await client.delete(key)


async def enqueue_job(queue_name: str, payload: dict) -> None:
    """Add a job to a Bull-compatible Redis queue."""
    client = await get_redis()
    
    import uuid
    import time
    
    job_id = str(uuid.uuid4())
    job_data = {
        "id": job_id,
        "data": payload,
        "opts": {
            "attempts": 3,
            "backoff": {"type": "exponential", "delay": 2000},
        },
        "timestamp": int(time.time() * 1000),
        "status": "waiting",
    }
    
    # Push to Bull queue format
    await client.rpush(f"bull:{queue_name}:wait", json.dumps(job_data))
    logger.info("Job enqueued", queue=queue_name, job_id=job_id)


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")
