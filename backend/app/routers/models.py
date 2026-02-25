from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from app.services.recommendation import load_models, get_model_by_id

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
async def get_models() -> Dict[str, Any]:
    """利用可能なモデル一覧を取得"""
    return load_models()


@router.get("/{model_id}")
async def get_model(model_id: str) -> Dict[str, Any]:
    """特定モデルの詳細情報を取得"""
    model = get_model_by_id(model_id)
    if model is None:
        raise HTTPException(status_code=404, detail=f"モデル '{model_id}' が見つかりません")
    return model
