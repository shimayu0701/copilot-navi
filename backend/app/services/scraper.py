"""
GitHub Copilot で利用可能なモデル情報のスクレイピング

フロー:
  Phase 1: GitHub 公式ページからモデル一覧を取得
  Phase 2: 各プロバイダー / モデル比較ページから詳細情報を収集
"""

import asyncio
import logging
import re
from typing import Any, Callable, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ─── Phase 1: GitHub Copilot 公式モデル一覧 ───────────────────────
GITHUB_SUPPORTED_MODELS_URL = (
    "https://docs.github.com/en/copilot/reference/ai-models/supported-models"
)

# ─── Phase 2: 詳細情報ソース ──────────────────────────────────────
DETAIL_SOURCES = [
    {
        "id": "github_model_comparison",
        "name": "GitHub Copilot モデル比較",
        "url": "https://docs.github.com/en/copilot/reference/ai-models/model-comparison",
    },
    {
        "id": "openai_models",
        "name": "OpenAI モデル一覧",
        "url": "https://platform.openai.com/docs/models",
    },
    {
        "id": "anthropic_models",
        "name": "Anthropic モデル一覧",
        "url": "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    },
    {
        "id": "google_models",
        "name": "Google AI モデル一覧",
        "url": "https://ai.google.dev/gemini-api/docs/models",
    },
    {
        "id": "xai_models",
        "name": "xAI Grok モデル一覧",
        "url": "https://docs.x.ai/docs/models",
    },
]

HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


# ─────────────────────────────────────────────────────────────────
# ユーティリティ
# ─────────────────────────────────────────────────────────────────

def _extract_text(soup: BeautifulSoup, max_chars: int = 15000) -> str:
    """BeautifulSoup から本文テキストを抽出"""
    for selector in ["article", "main", ".content", ".documentation", "body"]:
        el = soup.select_one(selector)
        if el:
            for tag in el.find_all(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = el.get_text(separator="\n", strip=True)
            if len(text) > max_chars:
                text = text[:max_chars] + "\n... (truncated)"
            return text
    return ""


def _extract_tables(soup: BeautifulSoup) -> List[List[List[str]]]:
    """HTML テーブルを 3次元リスト(tables > rows > cells)として取得"""
    tables = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = [
                td.get_text(separator=" ", strip=True)
                for td in tr.find_all(["td", "th"])
            ]
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    return tables


# ─────────────────────────────────────────────────────────────────
# Phase 1: GitHub Copilot サポートモデル一覧
# ─────────────────────────────────────────────────────────────────

async def scrape_copilot_model_list(
    client: httpx.AsyncClient,
) -> Dict[str, Any]:
    """
    GitHub 公式の supported-models ページをスクレイピングし、
    モデル名・プロバイダー・ステータス・乗数などを取得する。
    """
    try:
        resp = await client.get(
            GITHUB_SUPPORTED_MODELS_URL,
            timeout=settings.scrape_timeout,
            follow_redirects=True,
            headers=HTTP_HEADERS,
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        tables = _extract_tables(soup)
        text = _extract_text(soup)

        # テーブルからモデル情報をパース
        models_raw: List[Dict[str, Any]] = []
        multipliers: Dict[str, Any] = {}
        retired: List[Dict[str, str]] = []

        for table in tables:
            if not table:
                continue

            for row in table[1:]:
                if len(row) < 2:
                    continue

                name = row[0].strip()
                if not name:
                    continue

                # モデル一覧テーブル (Model | Provider | Status | Free | Pro | ...)
                if len(row) >= 3 and any(
                    p in row[1].lower()
                    for p in ["openai", "anthropic", "google", "xai", "fine-tuned"]
                ):
                    models_raw.append({
                        "name": name,
                        "provider": row[1].strip(),
                        "status": row[2].strip() if len(row) > 2 else "GA",
                    })

                # 乗数テーブル (Model | Chat multiplier | Completions multiplier)
                elif len(row) >= 2 and re.match(
                    r"^([\d.]+|Not applicable)$", row[1].strip()
                ):
                    try:
                        chat_mult = row[1].strip()
                        comp_mult = (
                            row[2].strip() if len(row) > 2 else "Not applicable"
                        )
                        multipliers[name] = {
                            "chat": chat_mult,
                            "completions": comp_mult,
                        }
                    except (IndexError, ValueError):
                        pass

                # リタイアテーブル (Model | Retirement date | Replacement)
                elif len(row) >= 3 and re.match(
                    r"\d{4}-\d{2}-\d{2}", row[1].strip()
                ):
                    retired.append({
                        "name": name,
                        "retirement_date": row[1].strip(),
                        "replacement": row[2].strip() if len(row) > 2 else "",
                    })

        return {
            "status": "success",
            "url": GITHUB_SUPPORTED_MODELS_URL,
            "models": models_raw,
            "multipliers": multipliers,
            "retired": retired,
            "raw_text": text,
        }

    except Exception as e:
        logger.error(f"Failed to scrape GitHub supported models: {e}")
        return {
            "status": "error",
            "url": GITHUB_SUPPORTED_MODELS_URL,
            "models": [],
            "multipliers": {},
            "retired": [],
            "raw_text": "",
            "error": str(e),
        }


# ─────────────────────────────────────────────────────────────────
# Phase 2: 各プロバイダー詳細情報
# ─────────────────────────────────────────────────────────────────

async def scrape_url(
    client: httpx.AsyncClient, source: Dict
) -> Dict:
    """単一URLのコンテンツをスクレイピングする"""
    try:
        response = await client.get(
            source["url"],
            timeout=settings.scrape_timeout,
            follow_redirects=True,
            headers=HTTP_HEADERS,
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        content = _extract_text(soup)

        return {
            "id": source["id"],
            "name": source["name"],
            "url": source["url"],
            "status": "success",
            "content": content,
        }

    except httpx.TimeoutException:
        logger.warning(f"Timeout scraping {source['url']}")
        return {
            "id": source["id"],
            "name": source["name"],
            "url": source["url"],
            "status": "timeout",
            "content": "",
        }
    except Exception as e:
        logger.error(f"Error scraping {source['url']}: {e}")
        return {
            "id": source["id"],
            "name": source["name"],
            "url": source["url"],
            "status": "error",
            "content": "",
            "error": str(e),
        }


# ─────────────────────────────────────────────────────────────────
# 統合: Phase 1 + Phase 2
# ─────────────────────────────────────────────────────────────────

async def scrape_all_sources(
    progress_callback: Optional[Callable] = None,
) -> Dict[str, Any]:
    """
    Phase 1: GitHub 公式ページからモデル一覧取得
    Phase 2: 各プロバイダーページから詳細情報取得

    Returns:
        {
            "copilot_models": { ... Phase 1 結果 ... },
            "detail_sources": [ ... Phase 2 結果 ... ],
        }
    """
    async with httpx.AsyncClient() as client:
        # ── Phase 1 ──
        if progress_callback:
            await progress_callback(5, "GitHub 公式ページからモデル一覧を取得中...")

        copilot_models = await scrape_copilot_model_list(client)

        model_count = len(copilot_models.get("models", []))
        if progress_callback:
            await progress_callback(
                15,
                f"GitHub 公式: {model_count} モデルを検出 → 詳細情報を収集中...",
            )

        # ── Phase 2 ──
        detail_results: List[Dict] = []
        total = len(DETAIL_SOURCES)
        tasks = [scrape_url(client, src) for src in DETAIL_SOURCES]

        for i, coro in enumerate(asyncio.as_completed(tasks)):
            result = await coro
            detail_results.append(result)
            if progress_callback:
                pct = 15 + int((i + 1) / total * 25)  # 15-40%
                await progress_callback(
                    pct,
                    f"詳細情報収集中... ({i + 1}/{total}: {result['name']})",
                )

    return {
        "copilot_models": copilot_models,
        "detail_sources": detail_results,
    }
