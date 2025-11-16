# Quick Start Guide - Testing

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements-test.txt
```

### 2. Run Tests
```bash
# Simple way
pytest

# Or use the test runner script
./run_tests.sh
```

### 3. View Coverage
```bash
# Generate HTML report
pytest --cov=app --cov-report=html

# Open the report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

---

## 📦 What's Included

- ✅ **62+ Tests** covering all major functionality
- ✅ **80%+ Coverage** target for code quality
- ✅ **Mock Database** for isolated testing
- ✅ **Async Support** for FastAPI endpoints
- ✅ **AI Module Mocking** for OpenCV tests

---

## 🎯 Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Authentication | 16 tests | User registration, login, JWT |
| Claims Management | 18 tests | Submit, retrieve, filter claims |
| AI Detection | 13 tests | Boundary detection, OpenCV |
| Validation Flow | 15 tests | Witnesses, leaders, officials |

---

## 🛠️ Common Commands

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run tests matching keyword
pytest -k "login"

# Run with coverage
pytest --cov=app --cov-report=term-missing

# Run in parallel (faster)
pytest -n auto

# Use the test runner
./run_tests.sh --help
```

---

## 📊 Using the Test Runner

The `run_tests.sh` script provides convenient options:

```bash
# Basic usage
./run_tests.sh

# Verbose output
./run_tests.sh -v

# Run in parallel
./run_tests.sh -p

# Run specific category
./run_tests.sh -m auth

# Generate HTML report
./run_tests.sh --html

# Quick test (no coverage)
./run_tests.sh --quick

# Run specific file
./run_tests.sh -f test_auth.py
```

---

## 🔍 Test Files

```
tests/
├── conftest.py          # Shared fixtures
├── test_auth.py         # Authentication tests
├── test_claims.py       # Claims management tests
├── test_ai_detection.py # AI boundary detection tests
└── test_validation.py   # Validation flow tests
```

---

## ✅ Success Criteria

Your tests are working correctly when you see:

```
======================== test session starts ========================
collected 62 items

tests/test_auth.py ................                          [ 25%]
tests/test_claims.py ..................                      [ 54%]
tests/test_ai_detection.py .............                    [ 75%]
tests/test_validation.py ...............                    [100%]

---------- coverage: platform linux, python 3.11.x -----------
Name                     Stmts   Miss  Cover   Missing
------------------------------------------------------
app/auth.py                 45      2    95%   12-15
app/claims.py               78      9    88%   78-82
app/ai_module.py            92     15    82%   156-160
app/validation.py           56      8    85%   34-40
------------------------------------------------------
TOTAL                      271     34    87%

====================== 62 passed in 3.45s =======================
```

✅ **80%+ coverage achieved!**

---

## 🐛 Troubleshooting

**Tests not found?**
```bash
# Make sure you're in the backend directory
cd backend
pytest
```

**Import errors?**
```bash
# Activate virtual environment
source .venv/bin/activate
pip install -r requirements-test.txt
```

**Database errors?**
```bash
# Tests use mongomock (no real database needed)
# Ensure mongomock is installed
pip install mongomock
```

---

## 📚 More Information

For detailed documentation, see [TESTING.md](TESTING.md)

For CI/CD integration and advanced usage, check the full testing guide.

---

**Ready to test?** Run `./run_tests.sh` now! 🚀
