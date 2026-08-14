"""
KrishiMitra FastAPI backend — entry point.

Run with:
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="KrishiMitra API",
    description="Backend API for the KrishiMitra agricultural advisory platform.",
    version="0.1.0",
)

# Allow all origins during development; tighten in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check():
    """Liveness probe — returns 200 OK when the server is running."""
    return {"status": "ok"}
