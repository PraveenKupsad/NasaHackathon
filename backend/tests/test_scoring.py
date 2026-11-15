import pytest
from app.services.scoring_engine import ScoringEngine
from app.services.dataset_service import DatasetService
from app.models.site import Site

def test_weights_validation():
    valid, _, norm = ScoringEngine.validate_weights({
        "slope": 0.30, "terrain": 0.25, "illumination": 0.20, "crater_avoidance": 0.15, "accessibility": 0.10
    })
    assert valid is True
    assert abs(sum(norm.values()) - 1.0) < 1e-4

def test_hard_exclusion_for_steep_slope():
    # Site 14 is Shackleton Inner Scarp (slope 28.5°)
    site_14 = DatasetService.get_site_by_id("site-014")
    assert site_14 is not None
    
    weights = {"slope": 0.30, "terrain": 0.25, "illumination": 0.20, "crater_avoidance": 0.15, "accessibility": 0.10}
    evaluation = ScoringEngine.evaluate_site(site_14, weights, max_slope_deg=10.0)
    
    assert evaluation.exclusion.is_excluded is True
    assert evaluation.exclusion.slope_exceeded is True
    assert evaluation.risk_classification == "UNACCEPTABLE"
    assert "DISQUALIFIED" in evaluation.recommendation

def test_hard_exclusion_for_zero_illumination():
    # Site 13 is Shoemaker Deep Basin Floor (PSR, 0% annual illumination)
    site_13 = DatasetService.get_site_by_id("site-013")
    assert site_13 is not None
    
    weights = {"slope": 0.30, "terrain": 0.25, "illumination": 0.20, "crater_avoidance": 0.15, "accessibility": 0.10}
    # Require 20% illumination
    evaluation = ScoringEngine.evaluate_site(site_13, weights, min_illumination_pct=20.0)
    
    assert evaluation.exclusion.is_excluded is True
    assert evaluation.exclusion.illumination_insufficient is True
    assert evaluation.risk_classification == "UNACCEPTABLE"

def test_prime_site_passes_all_constraints():
    # Malapert Massif Peak (Site 8) is prime
    site_8 = DatasetService.get_site_by_id("site-008")
    assert site_8 is not None
    
    weights = {"slope": 0.30, "terrain": 0.25, "illumination": 0.20, "crater_avoidance": 0.15, "accessibility": 0.10}
    evaluation = ScoringEngine.evaluate_site(site_8, weights, max_slope_deg=10.0, min_illumination_pct=20.0)
    
    assert evaluation.exclusion.is_excluded is False
    assert evaluation.final_score >= 80.0
    assert evaluation.risk_classification == "NOMINAL"
    assert "PRIME" in evaluation.recommendation
