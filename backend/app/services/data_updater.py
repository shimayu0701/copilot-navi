import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from app.config import get_settings
from app.services.scraper import scrape_all_sources
from app.services.llm_analyzer import analyze_with_llm, generate_update_summary
from app.models.database import SessionLocal, UpdateHistory

logger = logging.getLogger(__name__)
settings = get_settings()

DATA_DIR = Path(__file__).parent.parent / "data"

# 更新状態管理（インメモリ）
_refresh_state: Dict[str, Any] = {
    "status": "idle",  # idle, running, completed, failed
    "progress": 0,
    "message": "",
    "started_at": None,
    "last_result_id": None,
}


def get_refresh_status() -> Dict[str, Any]:
    return _refresh_state.copy()


async def execute_data_refresh(
    model_id: str,
    api_key: str,
) -> Dict[str, Any]:
    """
    データ更新処理のメインフロー
    """
    global _refresh_state

    if _refresh_state["status"] == "running":
        raise ValueError("データ更新が既に実行中です")

    _refresh_state = {
        "status": "running",
        "progress": 0,
        "message": "更新を開始しています...",
        "started_at": datetime.utcnow().isoformat(),
        "last_result_id": None,
    }

    async def update_progress(progress: int, message: str):
        _refresh_state["progress"] = progress
        _refresh_state["message"] = message
        logger.info(f"[{progress}%] {message}")

    update_id = str(uuid.uuid4())
    old_data = None
    new_data = None

    try:
        # 現在のデータをバックアップ
        await update_progress(5, "現在のデータをバックアップ中...")
        with open(DATA_DIR / "models.json", "r", encoding="utf-8") as f:
            old_data = json.load(f)

        # スクレイピング実行 (5-40%)
        # Phase 1: GitHub 公式からモデル一覧取得
        # Phase 2: 各プロバイダーから詳細情報取得
        await update_progress(10, "GitHub 公式ページからモデル一覧を取得中...")
        scraped_data = await scrape_all_sources(
            progress_callback=update_progress
        )

        copilot_models = scraped_data.get("copilot_models", {})
        detail_sources = scraped_data.get("detail_sources", [])
        model_count = len(copilot_models.get("models", []))
        detail_ok = sum(1 for s in detail_sources if s.get("status") == "success")
        await update_progress(
            45,
            f"情報収集完了: {model_count} モデル検出, {detail_ok}/{len(detail_sources)} ソース成功",
        )

        # LLM解析 (45-85%)
        await update_progress(50, f"{model_id} でデータを解析中...")
        analyzed_data = await analyze_with_llm(
            scraped_data=scraped_data,
            model_id=model_id,
            api_key=api_key,
            progress_callback=update_progress,
        )

        if analyzed_data is None:
            # LLM解析失敗 → スクレイピング結果のみで部分更新
            status = "partial"
            summary = {
                "models_added": [],
                "models_removed": [],
                "models_updated": [],
                "key_changes": ["LLM解析に失敗しましたが、スクレイピングは完了しました"],
                "overall_summary": f"一部のデータ取得に成功しましたが、AI解析に失敗しました。既存データを維持します。",
            }
            new_data = old_data
        else:
            # データを検証・保存
            await update_progress(85, "データを検証・保存しています...")
            validated = validate_model_data(analyzed_data)

            if validated:
                new_data = analyzed_data
                with open(DATA_DIR / "models.json", "w", encoding="utf-8") as f:
                    json.dump(new_data, f, ensure_ascii=False, indent=2)

                # サマリ生成
                await update_progress(90, "更新サマリを生成中...")
                summary = await generate_update_summary(
                    old_data=old_data,
                    new_data=new_data,
                    model_id=model_id,
                    api_key=api_key,
                )
                status = "success"
            else:
                # バリデーション失敗 → ロールバック
                logger.warning("Data validation failed, rolling back")
                new_data = old_data
                status = "failed"
                summary = {
                    "models_added": [],
                    "models_removed": [],
                    "models_updated": [],
                    "key_changes": ["データのバリデーションに失敗しました"],
                    "overall_summary": "更新データの形式が正しくないため、既存データを維持しました",
                }

        # DB に記録
        db = SessionLocal()
        try:
            record = UpdateHistory(
                id=update_id,
                status=status,
                summary=summary,
                old_data=old_data,
                new_data=new_data,
                gemini_model=model_id,
            )
            db.add(record)
            db.commit()
        finally:
            db.close()

        await update_progress(100, "更新が完了しました！")
        _refresh_state["status"] = "completed"
        _refresh_state["last_result_id"] = update_id

        return {
            "id": update_id,
            "status": status,
            "summary": summary,
            "gemini_model": model_id,
        }

    except Exception as e:
        logger.error(f"Data refresh failed: {e}", exc_info=True)
        _refresh_state["status"] = "failed"
        _refresh_state["message"] = f"更新に失敗しました: {str(e)}"

        # ロールバック
        if old_data is not None:
            try:
                with open(DATA_DIR / "models.json", "w", encoding="utf-8") as f:
                    json.dump(old_data, f, ensure_ascii=False, indent=2)
                logger.info("Rolled back to old data")
            except Exception as re:
                logger.error(f"Rollback failed: {re}")

        raise


def validate_model_data(data: Dict) -> bool:
    """モデルデータの基本的なバリデーション"""
    try:
        if "models" not in data:
            return False
        if not isinstance(data["models"], list):
            return False
        if len(data["models"]) == 0:
            return False

        required_fields = ["id", "name", "provider", "performance"]
        for model in data["models"]:
            for field in required_fields:
                if field not in model:
                    logger.warning(f"Model missing required field: {field}")
                    return False

            # パフォーマンススコアの範囲チェック
            perf = model.get("performance", {})
            for axis, score in perf.items():
                if not (0.0 <= float(score) <= 5.0):
                    logger.warning(
                        f"Invalid performance score for {model['id']}.{axis}: {score}"
                    )
                    return False

        return True
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return False
