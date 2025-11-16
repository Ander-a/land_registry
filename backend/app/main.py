from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .routes.auth_routes import router as auth_router
from .db import init_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database connection
    await init_db()
    yield
    # Shutdown: close database connection
    await close_db()

app = FastAPI(title="AI-Assisted Land Registry API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "API running"}
