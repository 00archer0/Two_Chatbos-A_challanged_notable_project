#!/bin/bash
set -e

echo "Setting up Rasa environment..."
source /home/vscode/.venv/bin/activate

# Install UV and base dependencies
pip install --upgrade pip
pip install uv

# Install Rasa Pro and dependencies
uv pip install -U --extra-index-url https://europe-west3-python.pkg.dev/rasa-releases/rasa-pro-python/simple rasa-pro==3.12.0 seaborn jupyter
# Install project dependencies
if [ -f requirements.txt ]; then
    uv pip install -r requirements.txt
fi

# Setup database
echo "Setting up database..."
python table_create.py

# Train Rasa models
echo "Training Rasa models..."
(cd calling_bot_calm && rasa train) || echo "Failed to train calling_bot_calm"
(cd realstate_bot_calm && rasa train) || echo "Failed to train realstate_bot_calm"

echo "Setup complete!"