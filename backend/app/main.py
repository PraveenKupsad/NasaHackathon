from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import config
from app.database import init_db
from app.routes import sites, analysis, comparison, mission, reports, datasets

# Initialize SQLite schemas
init_db()

app = FastAPI(
    title=config.PROJECT_NAME,
    description="Scientific Decision-Support & Geospatial Navigation System for Lunar South Pole Artemis Candidates",
    version=config.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local dev and frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(sites.router)
app.include_router(analysis.router)
app.include_router(comparison.router)
app.include_router(mission.router)
app.include_router(reports.router)
app.include_router(datasets.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": config.PROJECT_NAME,
        "full_title": config.FULL_TITLE,
        "version": config.VERSION,
        "crs": config.CRS_DEFAULT,
        "backend_engine": "Python 3.13 / FastAPI / NumPy / SQLite"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
