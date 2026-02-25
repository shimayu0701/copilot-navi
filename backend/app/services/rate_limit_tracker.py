import hashlib
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

DATA_DIR = Path(__file__).parent.parent / "data"

GEMINI_REST_BASE = "https://generativelanguage.googleapis.com/v1beta"

# インメモリキャッシュ（Redisが使えない場合のフォールバック）
_memory_cache: Dict[str, Dict[str, Any]] = {}  # key: cache_key -> value
_cache_expires: Dict[str, datetime] = {}  # key: cache_key -> expires_at


def _hash_api_key(api_key: str) -> str:
    return "sha256:" + hashlib.sha256(api_key.encode()).hexdigest()[:12]


def calculate_status(percentage: int) -> str:
    if percentage < 80:
        return "available"
    elif percentage < 95:
        return "warning"
    else:
        return "exhausted"


async def fetch_rate_limits_from_api(
    api_key: str, model_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Gemini REST API に直接リクエストを送り、
    レスポンスヘッダーからレート制限情報を取得する。

    model_id が指定された場合、そのモデルのみを確認する。
    """
    if model_id is None:
        model_id = settings.llm_model
    models_to_check = [model_id]
    rate_limits: Dict[str, Any] = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        for model_id in models_to_check:
            try:
                url = f"{GEMINI_REST_BASE}/models/{model_id}:generateContent"
                payload = {
                    "contents": [
                        {"parts": [{"text": "hi"}], "role": "user"}
                    ],
                    "generationConfig": {
                        "maxOutputTokens": 1,
                    },
                }
                response = await client.post(
                    url,
                    json=payload,
                    params={"key": api_key},
                    headers={"Content-Type": "application/json"},
                )

                headers = response.headers

                # レート制限ヘッダーを取得（返されない場合はデフォルト値）
                rpm_limit = int(headers.get("x-ratelimit-limit-requests", 60))
                rpm_remaining = int(headers.get("x-ratelimit-remaining-requests", -1))
                tpm_limit = int(headers.get("x-ratelimit-limit-tokens", 4000000))
                tpm_remaining = int(headers.get("x-ratelimit-remaining-tokens", -1))

                reset_time = (
                    datetime.utcnow() + timedelta(minutes=1)
                ).isoformat() + "Z"

                # remaining が -1 の場合はヘッダーなし → 推定値を使用
                if rpm_remaining == -1:
                    # ヘッダーがない場合: リクエスト1回分消費として扱う
                    rpm_used = 1
                    rpm_remaining = rpm_limit - rpm_used
                else:
                    rpm_used = rpm_limit - rpm_remaining

                rpm_percentage = min(100, int(rpm_used / rpm_limit * 100)) if rpm_limit > 0 else 0

                if tpm_remaining == -1:
                    # 実際にAPIが動いているなら使用量は少ない
                    tpm_used = 10  # テストリクエスト分
                    tpm_remaining = tpm_limit - tpm_used
                else:
                    tpm_used = tpm_limit - tpm_remaining

                tpm_percentage = min(100, int(tpm_used / tpm_limit * 100)) if tpm_limit > 0 else 0

                # HTTPステータスで制限到達を確認
                if response.status_code == 429:
                    rpm_percentage = 100
                    rpm_remaining = 0
                    rpm_used = rpm_limit

                rate_limits[model_id] = {
                    "rpm": {
                        "limit": rpm_limit,
                        "used": rpm_used,
                        "remaining": rpm_remaining,
                        "reset_at": reset_time,
                        "percentage": rpm_percentage,
                        "status": calculate_status(rpm_percentage),
                    },
                    "tpm": {
                        "limit": tpm_limit,
                        "used": tpm_used,
                        "remaining": tpm_remaining,
                        "reset_at": reset_time,
                        "percentage": tpm_percentage,
                        "status": calculate_status(tpm_percentage),
                    },
                }

            except httpx.TimeoutException:
                logger.warning(f"Timeout fetching rate limits for {model_id}")
                rate_limits[model_id] = _make_unavailable_entry()
            except Exception as e:
                logger.error(f"Failed to get rate limits for {model_id}: {e}")
                rate_limits[model_id] = _make_unavailable_entry()

    return rate_limits


def _make_unavailable_entry() -> Dict[str, Any]:
    """API呼び出し失敗時のデフォルトエントリ"""
    return {
        "rpm": {
            "limit": 60,
            "used": 0,
            "remaining": 60,
            "reset_at": None,
            "percentage": 0,
            "status": "available",
            "note": "取得できませんでした",
        }
    }


async def get_cached_rate_limits(api_key: str, model_id: str) -> Optional[Dict[str, Any]]:
    """キャッシュからレート制限情報を取得（有効期限チェック付き）"""
    cache_key = f"rate_limits:{model_id}"

    # Redis を試みる
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        cached = await r.get(cache_key)
        await r.aclose()
        if cached:
            data = json.loads(cached)
            return data
    except Exception:
        pass  # Redisが使えない場合はメモリキャッシュにフォールバック

    # メモリキャッシュ
    if (
        cache_key in _memory_cache
        and cache_key in _cache_expires
        and datetime.utcnow() < _cache_expires[cache_key]
    ):
        return _memory_cache[cache_key]

    return None


async def save_rate_limits_cache(
    data: Dict[str, Any], api_key: str, model_id: str
) -> None:
    """レート制限情報をキャッシュに保存（1分間）"""
    cache_key = f"rate_limits:{model_id}"
    expires_at = datetime.utcnow() + timedelta(seconds=60)
    cache_data = {
        "rate_limits": data,
        "last_checked": datetime.utcnow().isoformat() + "Z",
        "api_key_hash": _hash_api_key(api_key),
    }

    # Redis に保存
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        await r.setex(cache_key, 60, json.dumps(cache_data))
        await r.aclose()
    except Exception:
        pass

    # メモリキャッシュにも保存
    _memory_cache[cache_key] = cache_data
    _cache_expires[cache_key] = expires_at


async def get_rate_limits(api_key: str, model_id: Optional[str] = None) -> Dict[str, Any]:
    """
    レート制限情報を取得する（キャッシュ優先）

    Returns:
        {
            "rate_limits": {...},
            "last_checked": "ISO8601",
            "api_key_hash": "sha256:..."
        }
    """
    # キャッシュを確認
    effective_model = model_id or settings.llm_model
    cached = await get_cached_rate_limits(api_key, effective_model)
    if cached:
        return cached

    # API から取得
    rate_limits = await fetch_rate_limits_from_api(api_key, model_id)

    # キャッシュに保存
    await save_rate_limits_cache(rate_limits, api_key, effective_model)

    return {
        "rate_limits": rate_limits,
        "last_checked": datetime.utcnow().isoformat() + "Z",
        "api_key_hash": _hash_api_key(api_key),
    }
