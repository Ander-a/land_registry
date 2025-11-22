# Backend Dockerfile for Land Registry Application
# Base: Python 3.12 slim for lightweight container
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# CRITICAL: Install system dependencies required for OpenCV and scikit-image
# - libgl1: OpenGL library for image rendering
# - libglib2.0-0: GLib library required by OpenCV
# - build-essential: Compilers and build tools for Python packages
# - libgomp1: GNU OpenMP library for parallel processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory and set permissions
# Ensure the application can write uploaded files
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Expose port 8000 for FastAPI
EXPOSE 8000

# Development command with hot-reload enabled
# --reload: Auto-restart server on code changes
# --host 0.0.0.0: Bind to all interfaces (required for Docker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
