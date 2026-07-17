import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.endpoints import router as api_router, TEMP_UPLOAD_DIR

app = FastAPI(
    title="Nook AI API",
    description="Your AI Second Brain - Automated Screenshot Organizer Backend",
    version="1.0.0"
)

# Configure CORS for local development (allow Next.js on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Temporary Screenshots folder to serve uploaded files statically
app.mount("/temp_uploads", StaticFiles(directory=TEMP_UPLOAD_DIR), name="temp_uploads")

# Include the API router under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Nook AI",
        "tagline": "Your AI Second Brain",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # Start server locally on port 8000
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
