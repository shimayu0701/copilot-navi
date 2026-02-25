from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import get_db, DiagnosisHistory
from app.models.schemas import FeedbackRequest

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """診断履歴を取得"""
    total = db.query(DiagnosisHistory).count()
    items = (
        db.query(DiagnosisHistory)
        .order_by(DiagnosisHistory.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "items": [
            {
                "id": item.id,
                "created_at": item.created_at.isoformat() + "Z" if item.created_at else None,
                "selections": item.selections,
                "result": item.result,
                "feedback": item.feedback,
            }
            for item in items
        ],
    }


@router.get("/{diagnosis_id}")
async def get_diagnosis(
    diagnosis_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """特定の診断結果を取得"""
    item = db.query(DiagnosisHistory).filter(DiagnosisHistory.id == diagnosis_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="診断結果が見つかりません")

    return {
        "id": item.id,
        "created_at": item.created_at.isoformat() + "Z" if item.created_at else None,
        "selections": item.selections,
        "result": item.result,
        "feedback": item.feedback,
    }


@router.post("/{diagnosis_id}/feedback")
async def submit_feedback(
    diagnosis_id: str,
    request: FeedbackRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """診断結果へのフィードバックを送信"""
    if not (1 <= request.get_value() <= 5):
        raise HTTPException(status_code=400, detail="フィードバックは1〜5の整数で指定してください")

    item = db.query(DiagnosisHistory).filter(DiagnosisHistory.id == diagnosis_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="診断結果が見つかりません")

    item.feedback = request.get_value()
    db.commit()

    return {"message": "フィードバックを受け付けました", "feedback": request.feedback}
