import sqlite3
import json
from typing import List, Dict, Any, Optional
from app.config import config

def get_connection():
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mission_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mission_identifier TEXT NOT NULL,
        footprint_diameter_m REAL NOT NULL,
        max_acceptable_slope REAL NOT NULL,
        min_illumination_req REAL NOT NULL,
        max_hazard_tolerance REAL NOT NULL,
        mission_duration_days INTEGER NOT NULL,
        require_earth_los BOOLEAN NOT NULL DEFAULT 0,
        weights_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id TEXT,
        site_id TEXT NOT NULL,
        final_score REAL NOT NULL,
        is_excluded BOOLEAN NOT NULL,
        exclusion_reasons TEXT,
        breakdown_json TEXT NOT NULL,
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()

def save_mission_config(data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    weights_json = json.dumps(data.get("weights", {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }))
    
    cursor.execute("""
    INSERT OR REPLACE INTO mission_configs 
    (id, name, mission_identifier, footprint_diameter_m, max_acceptable_slope, 
     min_illumination_req, max_hazard_tolerance, mission_duration_days, require_earth_los, weights_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["id"],
        data["name"],
        data["mission_identifier"],
        data["footprint_diameter_m"],
        data["max_acceptable_slope"],
        data["min_illumination_req"],
        data["max_hazard_tolerance"],
        data["mission_duration_days"],
        1 if data.get("require_earth_los", False) else 0,
        weights_json
    ))
    conn.commit()
    conn.close()
    return data["id"]

def get_all_mission_configs() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mission_configs ORDER BY created_at DESC")
    rows = cursor.fetchall()
    configs = []
    for row in rows:
        cfg = dict(row)
        cfg["weights"] = json.loads(cfg["weights_json"])
        cfg["require_earth_los"] = bool(cfg["require_earth_los"])
        configs.append(cfg)
    conn.close()
    return configs
