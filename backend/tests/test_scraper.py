import pytest


def test_scraper_sources_defined():
    from app.services.scraper import SCRAPE_SOURCES
    assert len(SCRAPE_SOURCES) > 0
    for source in SCRAPE_SOURCES:
        assert "id" in source
        assert "name" in source
        assert "url" in source
