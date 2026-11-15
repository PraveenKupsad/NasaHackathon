# LUNA NAV — Lunar South Pole Landing Site Intelligence and Navigation System

> **Independent Hackathon Engineering Prototype**  
> *Notice: This application is an independent engineering prototype developed for a lunar exploration hackathon. It does not imply NASA endorsement, certification, or affiliation.*

---

## 1. Product Overview

**LUNA NAV** is an aerospace mission operations workstation and planetary GIS decision-support tool engineered for lunar South Pole (-80.0°S to -90.0°S) landing site evaluation, hazard analysis, and mission planning.

It provides mission planners and flight dynamics engineers with an information-dense, high-precision workstation interface to evaluate Artemis candidate landing sites using real NASA orbital datasets, terrain characteristics, multi-temporal illumination, crater proximity, and strict lander safety envelopes.

---

## 2. Key Architecture & Features

### Application Shell & Top Telemetry Bar
- **Product Telemetry**: Live UTC clock, mission identifier (`ARTEMIS-III-SPT`), dataset validation count, and real-time backend heartbeat monitor with round-trip latency.
- **Dedicated Workstation Modules**:
  1. **Mission Overview**: Executive telemetry dashboard with site rankings, hazard distributions, illumination stats, and analysis audit logs.
  2. **Lunar Navigator**: Interactive Lunar South Pole Map using authentic **IAU Moon 2000 Polar Stereographic (EPSG:75400)** projection centered at the 90°S Pole with 7 switchable layers, crater nomenclature, real-time geodetic coordinate HUD, and multi-selection basket.
  3. **Terrain Intelligence**: W-E radial cross-section elevation profiles, slope angle frequency distributions (Weibull regolith model), clearance envelopes, and configurable slope limit evaluation.
  4. **Illumination Analysis**: Sunlight availability modeling, Permanently Shadowed Region (PSR) cold trap classifications (<90K), 365-day solar power curves (kW), and battery payload mass requirements.
  5. **Landing Site Evaluation Engine**: Explainable 5-factor weighted scoring algorithm with live slider tuning, weight normalization, and **mandatory hard safety exclusion boundaries** (e.g., lander tipping angle, boulder hazard density, and footprint clearance).
  6. **Site Comparison**: Multi-candidate trade-off analysis comparing 3+ sites simultaneously with radar charts, side-by-side metrics, strengths/weaknesses profiles, and algorithmic recommendations strictly adhering to safety rules.
  7. **Mission Planner**: Interactive flight constraints configurator with SQLite persistence and real-time site re-evaluation.
  8. **Reports**: Printable PDF-ready engineering certification dossiers and direct RFC 4180 CSV export.
  9. **Data Sources**: Full provenance catalog detailing 4 real NASA LRO datasets and 2 simulated physical models.
  10. **Settings**: Coordinate notation formatting (DD vs DMS), elevation units, and mission weight presets.

---

## 3. Technology Stack

- **Frontend**:
  - React 18 + TypeScript + Vite
  - Tailwind CSS (Aerospace mission control dark design system)
  - Recharts (Scientific charts, histograms, radar charts, power timelines)
  - Lucide React (Engineering iconography)
  - Axios (API integration)
  - Custom HTML5 High-DPI Canvas (Planetary polar stereographic renderer)

- **Backend**:
  - Python 3.13 + FastAPI + Uvicorn
  - NumPy + Pandas + SciPy
  - Pydantic v2 (Strict request/response validation)
  - SQLite (Persistent mission configurations and audit logs)
  - Pytest (Automated test suite)

---

## 4. Scientific Scoring Algorithm & Safety Exclusion

### Explainable Weighted Formula
$$\text{Final Score} = (\text{Slope} \times w_1) + (\text{Terrain} \times w_2) + (\text{Illumination} \times w_3) + (\text{Crater Avoidance} \times w_4) + (\text{Accessibility} \times w_5)$$

- **Default Weights**:
  - Slope Suitability: 30% ($w_1 = 0.30$)
  - Terrain Safety (Roughness & Boulders): 25% ($w_2 = 0.25$)
  - Illumination Suitability: 20% ($w_3 = 0.20$)
  - Crater Avoidance: 15% ($w_4 = 0.15$)
  - Accessibility & Direct Earth Comm: 10% ($w_5 = 0.10$)

### Mandatory Hard Exclusion Boundaries
Safety constraints are evaluated independently from the mathematical weighted score:
1. **Slope Limit**: Mean slope $> \theta_{\max}$ (default 10.0°) or peak slope $> 1.6 \times \theta_{\max}$ (tipping hazard).
2. **Critical Hazard Density**: Density index $> 0.50$ (boulder cluster obstruction).
3. **Footprint Clearance**: Usable flat radius $< 0.5 \times \text{Footprint Diameter}$.
4. **Illumination Cutoff**: Annual solar access $< 20.0\%$ (solar architecture failure).
5. **Direct Earth Line-of-Sight**: LOS $< 15.0\%$ when continuous DTE comm is mandated.

> **Safety Rule**: If a site violates any hard constraint, it is strictly flagged as `DISQUALIFIED`, its operational score is capped to $\le 35$, and it **cannot** be recommended regardless of its weighted mathematical score.

---

## 5. Data Provenance & NASA Datasets

| Dataset Name | Source | Status | Resolution | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **LRO LOLA GDR DEM** | NASA LRO / PDS | **REAL** | 20m / px | Topographical elevation & macro slopes |
| **LROC WAC Illumination** | NASA / ASU | **REAL** | 100m / px | Empirical 6-month southern summer solar albedo |
| **LROC NAC Orthomosaics** | NASA / ASU / USGS | **REAL** | 0.5m - 1.0m / px | Crater identification & visual context |
| **Diviner Thermal / PSRs** | NASA / UCLA / JPL | **REAL** | 250m / px | Cryogenic cold trap temperatures (<90K) |
| **Micro-Roughness & Boulders**| LUNA NAV Pipeline | **SIMULATED** | 0.1m - 1.0m | Fractional Brownian motion & Apollo rock SFD |
| **Ephemeris Solar Time-Series**| Astrodynamics Model | **SIMULATED** | 1-hr intervals | Obliquity cycle (1.54°) horizon masking |

---

## 6. Verification & Automated Tests

All automated unit tests pass cleanly:
```bash
python -m pytest backend/tests -v
```
Test Coverage:
- `test_weights_validation`: Validates 100% sum and positive boundary checks.
- `test_hard_exclusion_for_steep_slope`: Validates that Shackleton Inner Scarp (28.5° slope) is disqualified.
- `test_hard_exclusion_for_zero_illumination`: Validates that Shoemaker Floor (0% sunlight PSR) fails solar criteria.
- `test_prime_site_passes_all_constraints`: Validates that Malapert Massif passes with high nominal score.
- `test_health_endpoint`, `test_list_sites`, `test_site_detail`, `test_comparison_endpoint`, `test_mission_overview`: Full API verification.

---

## 7. How to Run

### Quick Start (PowerShell)
```powershell
.\run_all.ps1
```

### Manual Start

**Backend:**
```powershell
cd backend
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Endpoint: `http://127.0.0.1:8000/api`
- Swagger Interactive Docs: `http://127.0.0.1:8000/docs`

**Frontend:**
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`
