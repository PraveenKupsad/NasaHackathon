from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

@router.get("", response_model=List[Dict[str, Any]])
def list_datasets():
    return DatasetService.get_datasets()
