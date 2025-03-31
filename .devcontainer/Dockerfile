FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    nodejs \
    npm \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Install Node.js dependencies for frontend
RUN npm install -g http-server

# Install Python dependencies - we'll install Rasa Pro separately in the setup script
RUN pip install --no-cache-dir --upgrade pip

# Create non-root user
RUN useradd -m vscode && \
    chown -R vscode:vscode /workspace

USER vscode

# We'll install Rasa Pro in the setup script to ensure environment variables are loaded
