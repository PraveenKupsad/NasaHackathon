import os
import json
from typing import List, Dict, Any, Optional
from app.config import config
from app.models.site import Site

class DatasetService:
    _sites_cache: Optional[List[Site]] = None
    _craters_cache: Optional[List[Dict[str, Any]]] = None
    _datasets_cache: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def get_sites(cls) -> List[Site]:
        if cls._sites_cache is None:
            path = os.path.join(config.DATA_DIR, "demo_sites.json")
            with open(path, "r", encoding="utf-8") as f:
                raw = json.load(f)
                cls._sites_cache = [Site(**item) for item in raw]
        return cls._sites_cache

    @classmethod
    def get_site_by_id(cls, site_id: str) -> Optional[Site]:
        sites = cls.get_sites()
        for s in sites:
            if s.id == site_id:
                return s
        return None

    @classmethod
    def get_craters(cls) -> List[Dict[str, Any]]:
        if cls._craters_cache is None:
            path = os.path.join(config.DATA_DIR, "craters.json")
            with open(path, "r", encoding="utf-8") as f:
                cls._craters_cache = json.load(f)
        return cls._craters_cache

    @classmethod
    def get_datasets(cls) -> List[Dict[str, Any]]:
        if cls._datasets_cache is None:
            path = os.path.join(config.DATA_DIR, "datasets.json")
            with open(path, "r", encoding="utf-8") as f:
                cls._datasets_cache = json.load(f)
        return cls._datasets_cache
