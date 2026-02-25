import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import get_db, DiagnosisHistory
from app.models.schemas import RecommendRequest, RecommendResponse
from app.services.recommendation import load_chart, compute_recommendation

router = APIRouter(prefix="/chart", tags=["chart"])


@router.get("/questions")
async def get_questions() -> Dict[str, Any]:
    """チャートの質問一覧を取得"""
    chart = load_chart()
    return chart


@router.post("/recommend")
async def recommend(
    request: RecommendRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """選択結果を送信し推薦モデルを取得"""
    try:
        results = compute_recommendation(request.selections)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推薦計算に失敗しました: {str(e)}")

    diagnosis_id = str(uuid.uuid4())

    # 診断履歴を保存
    try:
        history_entry = DiagnosisHistory(
            id=diagnosis_id,
            selections=request.selections,
            result={"recommendations": results},
        )
        db.add(history_entry)
        db.commit()
    except Exception as e:
        # 履歴保存失敗は推薦結果に影響しない
        db.rollback()

    return {
        "diagnosis_id": diagnosis_id,
        "recommendations": results,
        "selections": request.selections,
    }
