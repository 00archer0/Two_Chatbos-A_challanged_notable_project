#!/bin/bash

# Source environment variables
if [ -f .env ]; then
    echo "Loading environment variables..."
    source .env
fi

# Function to start a process in the background
start_service() {
  echo "Starting $1..."
  $2 &
  sleep 2
}

# Kill background processes on exit
trap 'kill $(jobs -p)' EXIT

# Start the Node.js server
start_service "API hosted" "python server.py"

# Start calling bot
cd calling_bot_calm
start_service "Calling bot Rasa server" "rasa run --enable-api --cors '*'"
start_service "Calling bot actions server" "rasa run actions"
cd ..

# Start real estate bot
cd realstate_bot_calm
start_service "Real estate bot Rasa server" "rasa run --enable-api --cors '*' --port 5006"
start_service "Real estate bot actions server" "rasa run actions --port 5056"
cd ..

# Start frontend server
cd frontent_rasa_custom
start_service "Frontend server" "http-server -p 8000"
cd ..

echo "All services are running!"
echo "- Frontend: http://localhost:8000"
echo "- Calling Bot API: http://localhost:5005"
echo "- Real Estate Bot API: http://localhost:5006"

# Wait for Ctrl+C
echo "Press Ctrl+C to stop all services"
wait