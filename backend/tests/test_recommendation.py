import pytest
from app.services.recommendation import compute_recommendation


def test_compute_recommendation_new_development():
    selections = {
        "q1": "new_development",
        "q2": "architecture_design",
        "q3": {
            "complexity": "complex",
            "priority": ["quality", "creativity"],
            "context_amount": "medium",
        },
    }
    results = compute_recommendation(selections)
    assert len(results) == 3
    assert results[0]["rank"] == 1
    assert results[1]["rank"] == 2
    assert results[2]["rank"] == 3
    assert results[0]["score"] >= results[1]["score"]
    assert results[1]["score"] >= results[2]["score"]


def test_compute_recommendation_bug_fixing():
    selections = {
        "q1": "bug_fixing",
        "q2": "hard_to_reproduce",
        "q3": {
            "complexity": "complex",
            "priority": ["quality"],
            "context_amount": "large",
        },
    }
    results = compute_recommendation(selections)
    assert len(results) == 3
    # 複雑なバグ修正 + 大量コンテキスト → context_length が高いモデルが上位に来るはず


def test_compute_recommendation_cost_priority():
    selections = {
        "q1": "code_generation",
        "q2": "boilerplate",
        "q3": {
            "complexity": "simple",
            "priority": ["speed", "cost"],
            "context_amount": "small",
        },
    }
    results = compute_recommendation(selections)
    assert len(results) == 3
    # コスト重視 + シンプルなタスク → cost_efficiency が高いモデルが上位に来るはず
