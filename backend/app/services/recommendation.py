import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional


DATA_DIR = Path(__file__).parent.parent / "data"


def load_json(filename: str) -> Any:
    """JSONファイルを読み込む"""
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def load_models() -> Dict[str, Any]:
    return load_json("models.json")


def load_chart() -> Dict[str, Any]:
    return load_json("chart.json")


def load_recommendation_rules() -> Dict[str, Any]:
    return load_json("recommendation_rules.json")


def get_model_by_id(model_id: str) -> Optional[Dict[str, Any]]:
    models_data = load_models()
    for model in models_data["models"]:
        if model["id"] == model_id:
            return model
    return None


def compute_recommendation(selections: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    ユーザーの選択結果からモデル推薦スコアを計算する。

    selections 形式:
    {
      "q1": "new_development",
      "q2": "architecture_design",
      "q3": {
        "complexity": "complex",
        "priority": ["quality", "creativity"],
        "context_amount": "large"
      }
    }
    """
    models_data = load_models()
    rules = load_recommendation_rules()

    category = selections.get("q1", "")
    subcategory = selections.get("q2", "")
    q3 = selections.get("q3", {})
    complexity = q3.get("complexity", "moderate")
    priority = q3.get("priority", [])
    context_amount = q3.get("context_amount", "medium")

    # ベース重みを取得（カテゴリのオーバーライドがあれば適用）
    base_weights = rules["base_weights"].copy()
    category_overrides = rules.get("category_overrides", {})
    if category in category_overrides:
        base_weights = category_overrides[category].copy()

    # サブカテゴリの乗数を取得
    subcategory_multipliers = rules.get("subcategory_multipliers", {})
    sub_mult = subcategory_multipliers.get(subcategory, {})

    # Q3 の複雑度による乗数
    chart_data = load_chart()
    q3_questions = chart_data["questions"][2]["questions"]

    complexity_mult: Dict[str, float] = {}
    priority_mult: Dict[str, float] = {}
    context_mult: Dict[str, float] = {}

    for q in q3_questions:
        if q["id"] == "complexity":
            for opt in q["options"]:
                if opt["id"] == complexity:
                    complexity_mult = opt.get("multiplier", {})
        elif q["id"] == "priority":
            for opt in q["options"]:
                if opt["id"] in priority:
                    for k, v in opt.get("multiplier", {}).items():
                        priority_mult[k] = priority_mult.get(k, 1.0) * v
        elif q["id"] == "context_amount":
            for opt in q["options"]:
                if opt["id"] == context_amount:
                    context_mult = opt.get("multiplier", {})

    # 最終的な重みを計算
    final_weights: Dict[str, float] = {}
    all_axes = list(base_weights.keys())
    for axis in all_axes:
        w = base_weights[axis]
        # サブカテゴリ乗数
        w *= sub_mult.get(axis, 1.0)
        # 複雑度乗数
        w *= complexity_mult.get(axis, 1.0)
        # 優先度乗数
        w *= priority_mult.get(axis, 1.0)
        # コンテキスト量乗数
        w *= context_mult.get(axis, 1.0)
        final_weights[axis] = w

    # 重みを正規化
    total = sum(final_weights.values())
    if total > 0:
        final_weights = {k: v / total for k, v in final_weights.items()}

    # モデルごとのスコアを計算
    model_scores = []
    templates = rules.get("recommendation_templates", {})

    for model in models_data["models"]:
        perf = model["performance"]
        score = 0.0
        for axis, weight in final_weights.items():
            model_score = perf.get(axis, 0.0)
            # スコアを0-1に正規化 (5段階なので /5)
            score += (model_score / 5.0) * weight

        # 100点満点に変換
        score_100 = round(score * 100, 1)

        # 推薦理由の生成
        template = templates.get(model["id"], {})
        reason = template.get("strengths_text", "このタスクに適したモデルです。")
        caution = template.get("caution_text", None)

        model_scores.append({
            "model": model,
            "score": score_100,
            "reason": reason,
            "caution": caution,
        })

    # スコア降順でソート
    model_scores.sort(key=lambda x: x["score"], reverse=True)

    # 上位3件を返す（1位、2位、3位）
    results = []
    for i, item in enumerate(model_scores[:3], start=1):
        results.append({
            "rank": i,
            "model": item["model"],
            "score": item["score"],
            "reason": item["reason"],
            "caution": item["caution"],
        })

    return results
