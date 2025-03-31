#!/bin/bash
set -e
source /home/vscode/.venv/bin/activate

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

start_service() {
    echo "Starting $1..."
    bash -c "$2" &
    sleep 2
}


trap 'kill $(jobs -p)' EXIT

start_service "API" "python server.py"
# start_service "API" "uvicorn server:app --host 0.0.0.0 --port 5055 --reload"
start_service "Calling Bot Rasa" "cd calling_bot_calm && rasa run"
start_service "Real Estate Bot Rasa" "cd realstate_bot_calm && rasa run --enable-api --cors '*' --port 5006"
start_service "Frontend" "cd frontent_rasa_custom && http-server -p 8000 --cors"

echo -e "\nServices running:
- Frontend:   http://localhost:8000
- API:        http://localhost:5055
- Calling Bot: http://localhost:5005
- Real Estate: http://localhost:5006"

wait