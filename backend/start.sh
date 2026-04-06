#!/bin/bash
set -e

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
pip install -q -r requirements.txt

# Start the server
echo "🚀 Starting CDP Backend API on http://localhost:8000"
echo "📚 Docs available at http://localhost:8000/docs"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
