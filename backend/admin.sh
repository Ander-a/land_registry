#!/bin/bash

# Admin User Management Script
# Wrapper for Python admin creation scripts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🏛️  Land Registry - Admin User Management       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "$SCRIPT_DIR/.venv" ] && [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo -e "${YELLOW}Please create a virtual environment first:${NC}"
    echo "  python -m venv .venv"
    echo "  source .venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
if [ -d "$SCRIPT_DIR/.venv" ]; then
    source "$SCRIPT_DIR/.venv/bin/activate"
elif [ -d "$SCRIPT_DIR/venv" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
fi

echo -e "${GREEN}✅ Virtual environment activated${NC}"
echo ""

# Check if Python script exists
if [ ! -f "$SCRIPT_DIR/create_admin.py" ]; then
    echo -e "${RED}❌ create_admin.py not found!${NC}"
    exit 1
fi

# Run the Python script
python "$SCRIPT_DIR/create_admin.py"
