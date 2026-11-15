import numpy as np
from typing import Dict, List, Any
from app.models.site import Site

class IlluminationService:
    """
    Illumination Analysis Service:
    Provides solar availability timelines across the lunar year, power generation modeling,
    cold trap / PSR status, and horizon elevation masking.
    Explicitly labeled as REAL LROC WAC baseline + SIMULATED Ephemeris time-series.
    """

    @staticmethod
    def generate_annual_timeline(site: Site, num_samples: int = 24) -> List[Dict[str, Any]]:
        """
        Simulates 365-day solar illumination timeline (representing lunar precession & seasons).
        At the lunar South Pole, the subsolar latitude oscillates between +1.54° and -1.54°.
        During southern summer, solar elevation is highest; in winter, even elevated peaks experience shadows.
        """
        timeline = []
        days = np.linspace(0, 365, num_samples)
        
        # Site latitude relative to pole
        deg_from_pole = 90.0 - abs(site.lat)
        elev_km = site.elevation_m / 1000.0

        for d in days:
            # Solar sub-latitude angle (obliquity 1.54° cycle)
            solar_sub_lat = -1.54 * np.cos(2 * np.pi * d / 365.25)
            
            # Theoretical unblocked solar elevation at horizon
            base_solar_elev = solar_sub_lat + (deg_from_pole * 0.4) + (elev_km * 0.03)

            # Terrain horizon blockage simulation
            # If site is in a deep PSR (like Shoemaker floor), sunlight is 0
            if site.illumination_annual_pct < 1.0:
                is_illuminated = False
                illum_pct = 0.0
                solar_flux_w_m2 = 0.0
                power_kw = 0.0
            else:
                # Modulate by site's empirical annual fraction
                seasonal_factor = (site.illumination_summer_pct - site.illumination_annual_pct) * np.sin(np.pi * d / 365.25)
                local_illum = site.illumination_annual_pct + seasonal_factor
                local_illum = max(0.0, min(100.0, local_illum))
                
                is_illuminated = local_illum > 30.0
                illum_pct = round(float(local_illum), 1)
                
                # Solar constant ~1361 W/m^2 adjusted by low grazing angle
                graze_sin = max(0.02, min(0.12, np.sin(np.radians(max(0.5, base_solar_elev + 2.0)))))
                solar_flux_w_m2 = round(float(1361.0 * (local_illum / 100.0) * graze_sin), 1)
                
                # Standard 10 m^2 vertical solar array (typical lander mast) at 28% efficiency
                power_kw = round(float((solar_flux_w_m2 * 10.0 * 0.28) / 1000.0), 2)

            timeline.append({
                "day_of_year": int(d),
                "illumination_pct": illum_pct,
                "solar_elevation_deg": round(float(base_solar_elev), 2),
                "solar_flux_w_m2": solar_flux_w_m2,
                "estimated_power_kw": power_kw,
                "status": "ILLUMINATED" if is_illuminated else "SHADOWED",
                "provenance": "SIMULATED (Ephemeris orbital model constrained by LROC WAC empirical albedo)"
            })

        return timeline

    @staticmethod
    def get_solar_summary(site: Site) -> Dict[str, Any]:
        """
        Summary statistics of solar access and battery energy storage implications.
        """
        is_psr = site.illumination_annual_pct < 5.0
        
        # Max consecutive dark period (hours)
        if is_psr:
            max_shadow_hrs = 8760 # Permanent
            battery_mass_req_kg = 9999.0 # Impossible with solar alone
            solar_power_feasibility = "UNFEASIBLE (Requires Nuclear / RTG or Tethered Power)"
        else:
            # Rim sites typically experience shadows lasting 24 to 90 hours
            max_shadow_hrs = round((100.0 - site.illumination_summer_pct) * 2.8, 1)
            # Battery required to sustain 500W hotel load through longest shadow
            battery_kwh = (max_shadow_hrs * 0.5) / 0.85 # 85% depth of discharge
            battery_mass_req_kg = round(battery_kwh * 6.5, 1) # ~150 Wh/kg space Li-ion
            solar_power_feasibility = "EXCELLENT" if site.illumination_annual_pct >= 80.0 else "FEASIBLE WITH SIZING"

        return {
            "annual_illumination_fraction": site.illumination_annual_pct,
            "summer_solstice_peak_fraction": site.illumination_summer_pct,
            "is_permanent_shadow_region": is_psr,
            "longest_consecutive_shadow_hours": max_shadow_hrs,
            "required_energy_storage_kwh": round(battery_kwh if not is_psr else 999.0, 1),
            "estimated_battery_mass_kg": battery_mass_req_kg,
            "solar_feasibility_verdict": solar_power_feasibility,
            "thermal_environment": "Extreme Cryogenic (< 90K)" if is_psr else "Cyclic (100K - 220K)",
            "provenance": "REAL LROC WAC multi-temporal statistics + SIMULATED battery trade model"
        }
