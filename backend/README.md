# Backend - AI-Assisted Land Registry System

This backend is built with FastAPI and SQLModel (SQLAlchemy).

Environment

Create a `.env` file in `backend/` with:

DB_URL=postgresql://<user>:<password>@localhost:5432/land_registry_db
JWT_SECRET=<your-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

Run locally

1. Create a virtualenv and install requirements:

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

2. Run migrations / create DB tables (app will create tables on startup):

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Auth endpoints

POST /auth/register
POST /auth/login
GET /auth/me (protected)
