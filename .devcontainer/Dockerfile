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

# Install Node.js dependencies for frontend
RUN npm install -g http-server

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip

# Create non-root user and set work directory
RUN useradd -m vscode
WORKDIR /workspace
RUN chown vscode:vscode /workspace
USER vscode

# Create virtual environment
RUN python -m venv /home/vscode/.venv
ENV PATH="/home/vscode/.venv/bin:$PATH"