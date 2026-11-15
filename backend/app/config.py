import os
from pydantic import BaseModel

class ScoringWeights(BaseModel):
    slope: float = 0.30
    terrain: float = 0.25
    illumination: float = 0.20
    crater_avoidance: float = 0.15
    accessibility: float = 0.10

    def validate_weights(self) -> bool:
        total = self.slope + self.terrain + self.illumination + self.crater_avoidance + self.accessibility
        return abs(total - 1.0) < 1e-4

class HardConstraints(BaseModel):
    max_slope_deg: float = 10.0
    min_illumination_pct: float = 20.0
    max_hazard_density: float = 0.50
    min_landing_clearance_m: float = 60.0
    require_earth_los: bool = False
    min_data_confidence_pct: float = 50.0

class AppConfig:
    PROJECT_NAME: str = "LUNA NAV"
    FULL_TITLE: str = "Lunar South Pole Landing Site Intelligence and Navigation System"
    VERSION: str = "1.0.0-hackathon"
    CRS_DEFAULT: str = "Lunar Polar Stereographic (EPSG:75400 / IAU Moon 2000)"
    
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    DB_PATH: str = os.path.join(BASE_DIR, "..", "lunanav.db")

config = AppConfig()
