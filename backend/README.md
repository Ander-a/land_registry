# Backend - AI-Assisted Land Registry System

This backend is built with FastAPI and MongoDB (using Motor + Beanie ODM).

## Environment

Create a `.env` file in `backend/` with:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=land_registry_db
JWT_SECRET=<your-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

For MongoDB Atlas (cloud), use:
```
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
```

## Run locally

1. Ensure MongoDB is running locally or use MongoDB Atlas
2. Create a virtualenv and install requirements:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Run the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Auth endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (protected)
