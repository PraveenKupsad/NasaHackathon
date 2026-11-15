from app.main import health_check
from app.routes.sites import list_sites, get_site_detail
from app.routes.analysis import get_mission_overview
from app.routes.comparison import compare_sites
from app.models.site import ComparisonRequest

def test_health_endpoint():
    res = health_check()
    assert res["status"] == "HEALTHY"
    assert "LUNA NAV" in res["service"]

def test_list_sites():
    results = list_sites(max_slope=10.0, min_illum=20.0, max_hazard=0.5, footprint=100.0)
    assert len(results) >= 15
    assert results[0].final_score >= results[-1].final_score

def test_site_detail():
    detail = get_site_detail("site-001")
    assert detail["site"].name == "Faustini Rim A"
    assert len(detail["elevation_profile"]) > 0
    assert len(detail["solar_timeline"]) > 0
    assert detail["evaluation"].final_score > 0

def test_comparison_endpoint():
    req = ComparisonRequest(site_ids=["site-001", "site-002", "site-008"])
    comp = compare_sites(req)
    assert len(comp.sites) == 3
    assert comp.recommended_site_id is not None
    assert "tradeoff_matrix" in comp.model_dump()

def test_mission_overview():
    overview = get_mission_overview()
    assert overview["candidate_sites_total"] >= 15
    assert overview["craters_mapped_count"] >= 10
    assert overview["highest_scoring_candidate"] is not None
