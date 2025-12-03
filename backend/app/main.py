from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from .routes.auth_routes import router as auth_router
from .routes.claims import router as claims_router
from .routes.ai_routes import router as ai_router
from .routes.validation import router as validation_router
from .routes.validation_routes import router as validation_routes_router
from .routes.rbac_examples import router as rbac_examples_router
from .routes.admin import router as admin_router
from .routes.community import router as community_router
from .routes.geolocation_routes import router as geolocation_router
from .routes.notification_routes import router as notification_router
from .routes.jurisdiction_routes import router as jurisdiction_router
from .routes.activity_log_routes import router as activity_log_router
from .routes.dispute_routes import router as dispute_router
from .routes.approval_routes import router as approval_router
from .routes.profile_routes import router as profile_router
from .routes.transaction_routes import router as transaction_router
from .routes.property_routes import router as property_router
from .routes.analytics_routes import router as analytics_router
from .services.websocket_service import socket_app
from .db import init_db, close_db
from .ai.model_loader import load_models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database connection and AI models
    await init_db()
    load_models()
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

# Mount uploads directory for static file serving
uploads_dir = Path(__file__).parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(auth_router)
app.include_router(claims_router)
app.include_router(ai_router)
app.include_router(validation_router)
app.include_router(validation_routes_router)  # Community validation routes
app.include_router(rbac_examples_router)  # RBAC example routes
app.include_router(admin_router)  # Admin user management routes
app.include_router(community_router)  # Community feed routes
app.include_router(geolocation_router)  # Geolocation services
app.include_router(notification_router)  # Notification system
app.include_router(jurisdiction_router)  # Jurisdiction management
app.include_router(activity_log_router)  # Activity logging
app.include_router(dispute_router)  # Dispute resolution
app.include_router(approval_router)  # Approval management
app.include_router(profile_router)  # User profile management
app.include_router(transaction_router)  # Transaction management
app.include_router(property_router)  # Property management (valuations, tax, permits)
app.include_router(analytics_router)  # Analytics and reporting

# Mount WebSocket server at /ws
app.mount("/ws", socket_app)

@app.get("/")
def root():
    return {
        "message": "AI-Assisted Land Registry API",
        "version": "1.0.0",
        "roles": ["resident", "community_member", "local_leader", "admin"],
        "websocket": "/ws",
        "docs": "/docs"
    }
