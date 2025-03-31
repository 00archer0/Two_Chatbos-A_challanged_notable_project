#!/bin/bash
set -e

echo "Setting up Rasa environment..."

# Create .devcontainer directory if it doesn't exist
mkdir -p .devcontainer

# Setup virtual environment for Python
python -m venv .venv
source .venv/bin/activate

# Source environment variables
if [ -f .env ]; then
    echo "Loading environment variables..."
    source .env
fi

# Install Rasa Pro and other dependencies
echo "Installing Rasa Pro and dependencies..."
pip install --upgrade pip uv
uv pip install -U --extra-index-url https://europe-west3-python.pkg.dev/rasa-releases/rasa-pro-python/simple rasa-pro==3.12 seaborn jupyter

# Install additional dependencies if needed
uv pip install -r requirements.txt || echo "No requirements.txt found, skipping..."

# Setup database
echo "Setting up database..."
python table_create.py

# Train Rasa models
echo "Training Rasa models..."
cd calling_bot_calm
rasa train || echo "Failed to train calling_bot_calm, please check model configuration"
cd ..

cd realstate_bot_calm
rasa train || echo "Failed to train realstate_bot_calm, please check model configuration"
cd ..

echo "Setup complete!"