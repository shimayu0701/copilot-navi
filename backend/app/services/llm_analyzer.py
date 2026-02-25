"""
LLM を使った Copilot モデルデータ解析

Phase 1 (GitHub 公式) で取得したモデル一覧を正として、
Phase 2 (各プロバイダー) の詳細情報を組み合わせて
最終的な models.json を生成する。
"""

import json
import logging
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import google.generativeai as genai

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

DATA_DIR = Path(__file__).parent.parent / "data"


# ─────────────────────────────────────────────────────────────────
# プロンプト
# ─────────────────────────────────────────────────────────────────

ANALYSIS_PROMPT = """\
あなたは GitHub Copilot で使用できる AI モデルの専門家です。

## タスク
以下の情報を総合的に分析し、GitHub Copilot で現在利用可能な各モデルのデータを
JSON で出力してください。

## 重要なルール
1. **GitHub 公式ページで確認されたモデルのみ** を対象にしてください。
   公式ページにないモデルは絶対に含めないでください。
2. リタイア済みモデルは含めないでください。
3. 各モデルの情報は、各AI会社の公式情報やその他の情報源から総合的に判断してください。
4. 情報が不確かな場合は、控えめな中央値（3.0）のスコアを付けてください。

## Phase 1: GitHub 公式で確認されたモデル一覧
{copilot_models_json}

## Phase 1: 乗数情報
{multipliers_json}

## Phase 1: リタイア済みモデル（これらは含めないこと）
{retired_json}

## Phase 2: 詳細情報（各プロバイダー等のスクレイピング結果）
{detail_content}

## 現在のシステムデータ（参考）
{current_models_json}

## 出力形式
必ず以下の JSON スキーマに従って出力してください。配列の各要素は1つのモデルです。

```json
{{
  "version": "ISO8601タイムスタンプ",
  "last_updated": "ISO8601タイムスタンプ",
  "models": [
    {{
      "id": "モデルID（小文字ケバブケース。例: gpt-5.1, claude-sonnet-4）",
      "name": "表示名（例: GPT-5.1, Claude Sonnet 4）",
      "provider": "プロバイダー名（OpenAI / Anthropic / Google / xAI / GitHub）",
      "description": "日本語での簡潔な説明（60文字以内）",
      "context_window": コンテキストウィンドウのトークン数（整数）,
      "cost_tier": "free / low / medium / high / premium のいずれか",
      "premium_multiplier": {{
        "chat": "チャットの乗数（数値文字列 or 'Not applicable'）",
        "completions": "補完の乗数（数値文字列 or 'Not applicable'）"
      }},
      "release_status": "GA / Public preview",
      "performance": {{
        "speed": 1.0〜5.0,
        "reasoning": 1.0〜5.0,
        "coding": 1.0〜5.0,
        "context_length": 1.0〜5.0,
        "cost_efficiency": 1.0〜5.0,
        "instruction_following": 1.0〜5.0,
        "creativity": 1.0〜5.0,
        "long_output": 1.0〜5.0
      }},
      "strengths": ["強み1", "強み2", "強み3"],
      "cautions": ["注意点1", "注意点2"],
      "best_for": ["最適な用途1", "最適な用途2", "最適な用途3"],
      "available": true
    }}
  ]
}}
```

### performance の各軸の意味:
- **speed**: 応答速度（高速なモデルほど高スコア）
- **reasoning**: 推論力・多段階思考能力
- **coding**: コード生成・理解・デバッグの精度
- **context_length**: コンテキスト長（128K=2.0, 200K=3.0, 1M=4.0, 2M+=5.0）
- **cost_efficiency**: コスト効率（乗数0=5.0, 0.25~0.33=4.0, 1=3.0, 3=2.0, 30=1.0）
- **instruction_following**: 指示追従性
- **creativity**: 創造性・新しいアイデア提案能力
- **long_output**: 長文出力の品質

### cost_tier の決定基準:
- free: 乗数 0
- low: 乗数 0.25〜0.33
- medium: 乗数 1
- high: 乗数 3
- premium: 乗数 30

### id の命名規則:
- モデル名をそのまま小文字ケバブケースに変換
- 例: "GPT-5.1" → "gpt-5.1", "Claude Sonnet 4" → "claude-sonnet-4"
- 例: "Gemini 2.5 Pro" → "gemini-2.5-pro"
- 例: "Claude Opus 4.6 (fast mode)" → "claude-opus-4.6-fast"
"""


async def analyze_with_llm(
    scraped_data: Dict[str, Any],
    model_id: str,
    api_key: str,
    progress_callback: Optional[Callable] = None,
) -> Optional[Dict[str, Any]]:
    """
    Phase 1 + Phase 2 のスクレイピング結果を LLM で解析し、
    更新された models.json データを返す。

    Args:
        scraped_data: scrape_all_sources() の返り値
            {
                "copilot_models": { ... },
                "detail_sources": [ ... ],
            }
    """
    try:
        genai.configure(api_key=api_key)

        # 現在のモデルデータを読み込む
        current_models = {}
        try:
            with open(DATA_DIR / "models.json", "r", encoding="utf-8") as f:
                current_models = json.load(f)
        except Exception:
            pass

        # Phase 1 データ
        copilot = scraped_data.get("copilot_models", {})
        copilot_models_json = json.dumps(
            copilot.get("models", []), ensure_ascii=False, indent=2
        )
        multipliers_json = json.dumps(
            copilot.get("multipliers", {}), ensure_ascii=False, indent=2
        )
        retired_json = json.dumps(
            copilot.get("retired", []), ensure_ascii=False, indent=2
        )

        # Phase 2 詳細データを結合
        detail_content = ""
        for src in scraped_data.get("detail_sources", []):
            if src.get("status") == "success" and src.get("content"):
                detail_content += f"\n\n### {src['name']} ({src['url']})\n"
                detail_content += src["content"]

        # GitHub 公式ページの生テキストも追加
        github_raw = copilot.get("raw_text", "")
        if github_raw:
            detail_content = (
                f"### GitHub Copilot Supported Models (raw)\n{github_raw}\n"
                + detail_content
            )

        if progress_callback:
            await progress_callback(50, "AI によるデータ解析中...")

        prompt = ANALYSIS_PROMPT.format(
            copilot_models_json=copilot_models_json,
            multipliers_json=multipliers_json,
            retired_json=retired_json,
            detail_content=detail_content[:60000],
            current_models_json=json.dumps(
                current_models, ensure_ascii=False, indent=2
            )[:10000],
        )

        # Gemini モデルで解析
        model = genai.GenerativeModel(
            model_name=model_id,
            generation_config={
                "temperature": settings.llm_temperature,
                "max_output_tokens": settings.llm_max_tokens,
                "response_mime_type": "application/json",
            },
        )

        response = model.generate_content(prompt)

        if progress_callback:
            await progress_callback(80, "解析結果を処理中...")

        # レスポンスの JSON をパース
        try:
            result_text = response.text
            analyzed_data = json.loads(result_text)
            return analyzed_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Response text: {response.text[:500]}")
            return None

    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        return None


async def generate_update_summary(
    old_data: Dict,
    new_data: Dict,
    model_id: str,
    api_key: str,
) -> Dict[str, Any]:
    """更新内容のサマリを生成する"""
    try:
        genai.configure(api_key=api_key)

        model = genai.GenerativeModel(
            model_name=model_id,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json",
            },
        )

        old_ids = {m["id"] for m in old_data.get("models", [])}
        new_ids = {m["id"] for m in new_data.get("models", [])}
        added = new_ids - old_ids
        removed = old_ids - new_ids

        prompt = f"""
以下の変更内容を日本語で簡潔にサマリしてください。JSONで返してください。

追加されたモデル: {list(added)}
削除されたモデル: {list(removed)}
変更前のモデル数: {len(old_data.get("models", []))}
変更後のモデル数: {len(new_data.get("models", []))}

変更前 (IDリスト):
{[m["id"] for m in old_data.get("models", [])]}

変更後 (IDリスト):
{[m["id"] for m in new_data.get("models", [])]}

出力形式:
{{
  "models_added": ["追加されたモデルの表示名"],
  "models_removed": ["削除されたモデルの表示名"],
  "models_updated": ["スコア等が更新されたモデル名"],
  "key_changes": ["主な変更点の説明（最大5件）"],
  "overall_summary": "全体的な変更内容の説明"
}}
"""

        response = model.generate_content(prompt)
        return json.loads(response.text)

    except Exception as e:
        logger.error(f"Failed to generate update summary: {e}")
        return {
            "models_added": [],
            "models_removed": [],
            "models_updated": [],
            "key_changes": ["更新が完了しました"],
            "overall_summary": "データが更新されました",
        }
