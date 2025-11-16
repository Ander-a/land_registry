#!/bin/bash

# Test Runner Script for Land Registry System
# Usage: ./run_tests.sh [options]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
COVERAGE_THRESHOLD=80
VERBOSE=false
PARALLEL=false
MARKER=""
PATTERN=""

# Help message
show_help() {
    echo -e "${BLUE}Land Registry System - Test Runner${NC}"
    echo ""
    echo "Usage: ./run_tests.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -v, --verbose           Verbose output"
    echo "  -p, --parallel          Run tests in parallel"
    echo "  -c, --coverage          Generate coverage report (default: enabled)"
    echo "  -t, --threshold N       Set coverage threshold (default: 80)"
    echo "  -m, --marker MARKER     Run tests with specific marker (auth, claims, ai, validation)"
    echo "  -k, --keyword PATTERN   Run tests matching keyword pattern"
    echo "  -f, --file FILE         Run specific test file"
    echo "  --no-cov                Disable coverage reporting"
    echo "  --html                  Generate HTML coverage report"
    echo "  --quick                 Quick test (no coverage, essential tests only)"
    echo ""
    echo "Examples:"
    echo "  ./run_tests.sh                          # Run all tests with coverage"
    echo "  ./run_tests.sh -v                       # Run with verbose output"
    echo "  ./run_tests.sh -p                       # Run tests in parallel"
    echo "  ./run_tests.sh -m auth                  # Run only auth tests"
    echo "  ./run_tests.sh -k login                 # Run tests matching 'login'"
    echo "  ./run_tests.sh -f test_auth.py          # Run specific file"
    echo "  ./run_tests.sh --quick                  # Quick test run"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -t|--threshold)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        -m|--marker)
            MARKER="$2"
            shift 2
            ;;
        -k|--keyword)
            PATTERN="$2"
            shift 2
            ;;
        -f|--file)
            TEST_FILE="$2"
            shift 2
            ;;
        --no-cov)
            NO_COVERAGE=true
            shift
            ;;
        --html)
            HTML_REPORT=true
            shift
            ;;
        --quick)
            QUICK_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AI-Assisted Land Registry System - Test Suite    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -d "tests" ]; then
    if [ -d "backend/tests" ]; then
        echo -e "${YELLOW}Changing to backend directory...${NC}"
        cd backend
    else
        echo -e "${RED}Error: tests directory not found!${NC}"
        echo "Please run this script from the backend directory or project root."
        exit 1
    fi
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Warning: Virtual environment not activated!${NC}"
    if [ -f ".venv/bin/activate" ]; then
        echo -e "${YELLOW}Activating virtual environment...${NC}"
        source .venv/bin/activate
    elif [ -f "venv/bin/activate" ]; then
        echo -e "${YELLOW}Activating virtual environment...${NC}"
        source venv/bin/activate
    else
        echo -e "${RED}Error: Virtual environment not found!${NC}"
        exit 1
    fi
fi

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest not found!${NC}"
    echo "Installing test dependencies..."
    pip install -r requirements-test.txt
fi

# Build pytest command
PYTEST_CMD="pytest"

# Add verbosity
if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -v"
fi

# Add parallel execution
if [ "$PARALLEL" = true ]; then
    echo -e "${BLUE}Running tests in parallel...${NC}"
    PYTEST_CMD="$PYTEST_CMD -n auto"
fi

# Add marker
if [ ! -z "$MARKER" ]; then
    echo -e "${BLUE}Running tests with marker: ${MARKER}${NC}"
    PYTEST_CMD="$PYTEST_CMD -m $MARKER"
fi

# Add keyword pattern
if [ ! -z "$PATTERN" ]; then
    echo -e "${BLUE}Running tests matching: ${PATTERN}${NC}"
    PYTEST_CMD="$PYTEST_CMD -k $PATTERN"
fi

# Add specific test file
if [ ! -z "$TEST_FILE" ]; then
    echo -e "${BLUE}Running test file: ${TEST_FILE}${NC}"
    PYTEST_CMD="$PYTEST_CMD tests/$TEST_FILE"
fi

# Add coverage options (unless disabled or quick mode)
if [ "$NO_COVERAGE" != true ] && [ "$QUICK_MODE" != true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=term-missing"
    
    if [ "$HTML_REPORT" = true ]; then
        PYTEST_CMD="$PYTEST_CMD --cov-report=html"
    fi
    
    PYTEST_CMD="$PYTEST_CMD --cov-fail-under=$COVERAGE_THRESHOLD"
fi

# Quick mode
if [ "$QUICK_MODE" = true ]; then
    echo -e "${YELLOW}Quick mode: Running essential tests only${NC}"
    PYTEST_CMD="pytest -v -x tests/"
fi

echo ""
echo -e "${BLUE}Command: ${PYTEST_CMD}${NC}"
echo ""

# Run tests
START_TIME=$(date +%s)

if $PYTEST_CMD; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ ALL TESTS PASSED! ✅                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}Execution time: ${DURATION}s${NC}"
    
    if [ "$HTML_REPORT" = true ]; then
        echo ""
        echo -e "${BLUE}📊 HTML Coverage Report generated: ${NC}htmlcov/index.html"
        echo "Open with: open htmlcov/index.html (macOS) or xdg-open htmlcov/index.html (Linux)"
    fi
    
    exit 0
else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ❌ TESTS FAILED! ❌                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
    echo -e "${RED}Execution time: ${DURATION}s${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run with -v flag for verbose output${NC}"
    echo -e "${YELLOW}💡 Tip: Run specific test with -f test_file.py${NC}"
    
    exit 1
fi
