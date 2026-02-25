import json
from pathlib import Path
from typing import Any, Dict, Optional
import datetime

import httpx
from fastapi import APIRouter, Query

from app.config import get_settings
from app.models.schemas import VerifyKeyRequest
from app.services.rate_limit_tracker import get_rate_limits

router = APIRouter(prefix="/gemini", tags=["gemini"])
settings = get_settings()

DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("/models")
async def get_available_models(api_key: Optional[str] = Query(None)) -> Dict[str, Any]:
    """利用可能な Gemini モデル一覧を取得。api_key がある場合は Google API から最新情報を取得。"""
    if api_key:
        try:
            url = "https://generativelanguage.googleapis.com/v1beta/models"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params={"key": api_key})

            if response.status_code == 200:
                api_models = response.json().get("models", [])
                filtered = []
                for m in api_models:
                    m_id = m.get("name", "").replace("models/", "")
                    # Gemini 1.5 / 2.0 のみ取得。vision 専用は除外
                    # 汎用テキストモデルのみ選択（image-generation / robotics / lite は除外）
                    EXCLUDE_KEYWORDS = ("image-generation", "robotics", "vision", "tts", "live", "embedding", "computer-use", "deep-research", "customtools")
                    # -001 等のバージョンサフィックス付きは除外
                    import re
                    has_version_suffix = bool(re.search(r"-\d{3}$", m_id))
                    version_ok = "2.0" in m_id or "2.5" in m_id or "gemini-3" in m_id
                    if (
                        "gemini" in m_id
                        and version_ok
                        and not has_version_suffix
                        and not any(kw in m_id for kw in EXCLUDE_KEYWORDS)
                    ):
                        is_pro = "pro" in m_id
                        filtered.append({
                            "id": m_id,
                            "name": m.get("displayName", m_id),
                            "display_name": m.get("displayName", m_id),
                            "description": m.get("description", "Google Gemini モデル"),
                            "version": m.get("version", ""),
                            "tier": "pro" if is_pro else "flash",
                            "performance": {
                                "quality": 5.0 if is_pro else 4.5,
                                "speed": 3.5 if is_pro else 5.0,
                                "cost": 3 if is_pro else 5,
                            },
                            "context_length": m.get("inputTokenLimit", 1_000_000),
                            "recommended_for": [],
                            "available": True,
                            "default": m_id in ("gemini-2.5-pro",),
                        })

                if filtered:
                    # デフォルトフラグが 1 つもなければ先頭を設定
                    if not any(m["default"] for m in filtered):
                        filtered[0]["default"] = True

                    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    result = {
                        "version": now_iso,
                        "last_updated": now_iso,
                        "models": filtered,
                    }
                    try:
                        with open(DATA_DIR / "gemini_models.json", "w", encoding="utf-8") as f:
                            json.dump(result, f, ensure_ascii=False, indent=2)
                    except Exception:
                        pass
                    return result
        except Exception as exc:
            print(f"Gemini API models fetch failed: {exc}")

    # フォールバック: 保存済み JSON を返す
    try:
        with open(DATA_DIR / "gemini_models.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"models": []}


@router.get("/rate-limits")
async def get_rate_limits_endpoint(
    api_key: Optional[str] = Query(None),
    model_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """APIキーのレート制限情報を取得（model_id指定で特定モデルのみ）"""
    key = api_key or settings.gemini_api_key
    if not key:
        return {"rate_limits": {}, "last_checked": None}
    return await get_rate_limits(key, model_id=model_id)


@router.post("/verify-key")
async def verify_api_key(request: VerifyKeyRequest) -> Dict[str, Any]:
    """APIキーの有効性を検証"""
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params={"key": request.api_key, "pageSize": 1})
        if response.status_code == 200:
            return {"valid": True}
        return {"valid": False, "error": f"HTTP {response.status_code}"}
    except Exception as exc:
        return {"valid": False, "error": str(exc)}
