import asyncio
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.config import get_settings
from app.models.schemas import RefreshRequest
from app.services.data_updater import (
    execute_data_refresh,
    get_refresh_status,
    _refresh_state,
)

router = APIRouter(prefix="/data", tags=["data-refresh"])
settings = get_settings()

# 最終更新日時
_last_updated: Dict[str, Any] = {
    "updated_at": None,
    "gemini_model": None,
}


@router.get("/config")
async def get_data_config() -> Dict[str, Any]:
    """データ更新設定（.envで指定されたモデル等）を返す"""
    return {
        "llm_model": settings.llm_model,
        "organization_name": settings.organization_name,
    }


@router.post("/refresh")
async def refresh_data(
    request: RefreshRequest,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """最新データ取得・ロジック更新を実行"""
    global _refresh_state

    model_id = request.model_id or settings.llm_model
    api_key = request.api_key or settings.gemini_api_key
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API キーが指定されていません。設定画面で API キーを保存してください。",
        )

    if _refresh_state.get("status") == "running":
        raise HTTPException(
            status_code=409,
            detail="データ更新が既に実行中です。完了をお待ちください。",
        )

    if not model_id.startswith("gemini-"):
        raise HTTPException(
            status_code=400,
            detail=f"無効なモデルID: {model_id}",
        )

    async def run_refresh():
        global _last_updated
        try:
            result = await execute_data_refresh(
                model_id=model_id,
                api_key=api_key,
            )
            _last_updated["updated_at"] = datetime.utcnow().isoformat() + "Z"
            _last_updated["gemini_model"] = model_id
        except Exception:
            pass

    background_tasks.add_task(run_refresh)

    return {
        "status": "started",
        "message": f"{model_id} でデータ更新を開始しました",
        "model_id": model_id,
    }


@router.get("/refresh/status")
async def get_status() -> Dict[str, Any]:
    """更新処理の進行状況を取得"""
    status = get_refresh_status()
    return {
        "status": status.get("status", "idle"),
        "progress": status.get("progress", 0),
        "message": status.get("message", ""),
        "started_at": status.get("started_at"),
    }


@router.get("/last-updated")
async def get_last_updated() -> Dict[str, Any]:
    """最終更新日時を取得"""
    return _last_updated
