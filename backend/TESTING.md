# Testing & Quality Assurance Documentation
## AI-Assisted Land Registry System

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Setup Instructions](#setup-instructions)
4. [Running Tests](#running-tests)
5. [Coverage Goals](#coverage-goals)
6. [Test Categories](#test-categories)
7. [Writing New Tests](#writing-new-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This document describes the complete testing strategy for the AI-Assisted Land Registry System. Our testing framework ensures:

- **80%+ Code Coverage** across all modules
- **Comprehensive API Testing** with FastAPI and httpx
- **Mocked Database** using mongomock for isolation
- **AI Module Testing** with OpenCV mocks
- **Authentication & Authorization** validation
- **Validation Flow Testing** (witnesses, leaders, officials)

### Testing Stack

| Tool | Purpose |
|------|---------|
| `pytest` | Test framework and runner |
| `pytest-asyncio` | Async test support for FastAPI |
| `httpx` | Async HTTP client for API testing |
| `mongomock` | In-memory MongoDB for test isolation |
| `pytest-cov` | Code coverage measurement |
| `Faker` | Test data generation |
| `Pillow` | Image generation for upload tests |

---

## 📁 Test Structure

```
backend/
├── tests/
│   ├── __init__.py              # Test package initialization
│   ├── conftest.py              # Shared fixtures and configuration
│   ├── test_auth.py             # Authentication & JWT tests (16 tests)
│   ├── test_claims.py           # Land claims management (18 tests)
│   ├── test_validation.py       # Witness/leader validation (15 tests)
│   └── test_ai_detection.py     # AI boundary detection (13 tests)
├── pytest.ini                   # Pytest configuration
├── .coveragerc                  # Coverage configuration
└── requirements-test.txt        # Testing dependencies
```

**Total: 62+ comprehensive tests**

---

## 🛠️ Setup Instructions

### 1. Install Testing Dependencies

```bash
cd backend
source .venv/bin/activate  # Activate your virtual environment
pip install -r requirements-test.txt
```

### 2. Verify Installation

```bash
pytest --version
# Should output: pytest 7.4.3 or later
```

### 3. Environment Configuration

Create a `.env.test` file for test-specific settings:

```bash
# .env.test
TESTING=true
MONGODB_URL=mongodb://localhost:27017/test_land_registry
SECRET_KEY=test_secret_key_for_jwt_tokens_only
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 🚀 Running Tests

### Run All Tests

```bash
# Run complete test suite with coverage
pytest

# Or explicitly
pytest tests/ -v
```

### Run Specific Test Files

```bash
# Authentication tests only
pytest tests/test_auth.py -v

# Claims tests only
pytest tests/test_claims.py -v

# AI detection tests
pytest tests/test_ai_detection.py -v

# Validation flow tests
pytest tests/test_validation.py -v
```

### Run Tests by Marker

```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run authentication related tests
pytest -m auth

# Run AI tests
pytest -m ai
```

### Run Specific Test Functions

```bash
# Run single test
pytest tests/test_auth.py::test_user_registration_success -v

# Run tests matching pattern
pytest -k "login" -v

# Run tests matching multiple patterns
pytest -k "login or registration" -v
```

### Parallel Test Execution

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run tests in parallel (faster)
pytest -n auto
```

---

## 📊 Coverage Goals

### Target: **80%+ Code Coverage**

### Generate Coverage Reports

```bash
# Run tests with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Open HTML coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Coverage Report Formats

1. **Terminal Output**: Shows coverage summary in console
2. **HTML Report**: Interactive web-based report (`htmlcov/index.html`)
3. **XML Report**: For CI/CD integration (`coverage.xml`)
4. **JSON Report**: Machine-readable format (`coverage.json`)

### Check Coverage Thresholds

```bash
# Fail if coverage is below 80%
pytest --cov=app --cov-fail-under=80
```

### Coverage by Module

```bash
# Generate detailed coverage by file
pytest --cov=app --cov-report=term-missing

# Example output:
# app/auth.py          95%   12-15, 45
# app/claims.py        88%   78-82
# app/ai_module.py     82%   156-160, 234-240
```

---

## 🧪 Test Categories

### 1. Authentication Tests (`test_auth.py`)

**Coverage: User registration, login, JWT tokens**

```python
# Key tests:
- test_user_registration_success
- test_user_registration_duplicate_email
- test_login_success
- test_login_invalid_password
- test_get_current_user_with_valid_token
- test_jwt_token_authentication
- test_password_hashing
```

**Run:**
```bash
pytest tests/test_auth.py -v
```

### 2. Claims Tests (`test_claims.py`)

**Coverage: Claim submission, retrieval, filtering**

```python
# Key tests:
- test_submit_claim_success
- test_submit_claim_with_image_upload
- test_get_claim_by_id
- test_get_claims_by_status_filter
- test_update_claim_status_as_official
- test_unauthorized_access_prevention
- test_claim_pagination
```

**Run:**
```bash
pytest tests/test_claims.py -v
```

### 3. AI Detection Tests (`test_ai_detection.py`)

**Coverage: OpenCV boundary detection, GeoJSON**

```python
# Key tests:
- test_detect_boundary_success
- test_detect_boundary_returns_polygon
- test_detect_boundary_confidence_score
- test_opencv_detection_mocked
- test_no_clear_boundary_fallback
- test_geo_coordinate_conversion
```

**Run:**
```bash
pytest tests/test_ai_detection.py -v
```

### 4. Validation Tests (`test_validation.py`)

**Coverage: Witness approvals, leader endorsements, status transitions**

```python
# Key tests:
- test_witness_approval_success
- test_witness_approval_duplicate_prevented
- test_leader_endorsement_success
- test_leader_endorsement_non_leader_forbidden
- test_claim_status_transitions
- test_cannot_skip_validation_steps
```

**Run:**
```bash
pytest tests/test_validation.py -v
```

---

## ✍️ Writing New Tests

### Test Template

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_your_feature(test_client: AsyncClient, auth_headers):
    """Test description"""
    # Arrange: Set up test data
    test_data = {
        "field": "value"
    }
    
    # Act: Perform the action
    response = await test_client.post(
        "/api/your-endpoint",
        json=test_data,
        headers=auth_headers
    )
    
    # Assert: Verify results
    assert response.status_code == 200
    data = response.json()
    assert data["field"] == "expected_value"
```

### Using Fixtures

```python
# Available fixtures from conftest.py:

@pytest.mark.asyncio
async def test_with_fixtures(
    test_client,          # HTTP client
    mock_db,              # Mocked MongoDB
    test_user,            # Test citizen user
    test_leader,          # Test leader user
    test_government_official,  # Test official
    auth_headers,         # Auth headers for test_user
    leader_headers,       # Auth headers for leader
    official_headers,     # Auth headers for official
    test_claim,           # Sample land claim
    sample_image_file,    # Test image file
    mock_opencv_detection,  # Mocked OpenCV
    mock_file_upload      # Mocked file upload
):
    # Your test code here
    pass
```

### Best Practices

1. **One assertion per test** (or closely related assertions)
2. **Clear test names** that describe what's being tested
3. **Arrange-Act-Assert** pattern
4. **Use fixtures** for common setup
5. **Mock external dependencies** (database, file uploads, AI)
6. **Test both success and failure cases**
7. **Test edge cases** (empty inputs, invalid data, etc.)

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install -r requirements-test.txt
    
    - name: Run tests with coverage
      run: |
        cd backend
        pytest --cov=app --cov-report=xml --cov-report=term
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
        fail_ci_if_error: true
    
    - name: Check coverage threshold
      run: |
        cd backend
        pytest --cov=app --cov-fail-under=80
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test

test:
  stage: test
  image: python:3.11
  before_script:
    - cd backend
    - pip install -r requirements.txt
    - pip install -r requirements-test.txt
  script:
    - pytest --cov=app --cov-report=xml --cov-report=term
    - pytest --cov=app --cov-fail-under=80
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: backend/coverage.xml
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Run tests before commit
cd backend
pytest tests/ -v --tb=short

if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi

echo "All tests passed! Proceeding with commit."
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Import Errors

**Problem:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
# Ensure you're in the backend directory
cd backend

# Add backend to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Or install package in editable mode
pip install -e .
```

#### 2. Async Test Errors

**Problem:** `RuntimeWarning: coroutine 'test_function' was never awaited`

**Solution:**
```python
# Make sure to use @pytest.mark.asyncio decorator
@pytest.mark.asyncio
async def test_your_function():
    # Test code
    pass
```

#### 3. Database Connection Issues

**Problem:** Tests trying to connect to real database

**Solution:**
```python
# Ensure you're using the mock_db fixture
async def test_with_mock_db(mock_db, test_client):
    # This uses the mocked database
    pass
```

#### 4. Coverage Not Showing

**Problem:** Coverage shows 0% or missing files

**Solution:**
```bash
# Ensure coverage is installed
pip install pytest-cov

# Run with explicit source
pytest --cov=app --cov-report=term-missing

# Check .coveragerc is properly configured
cat .coveragerc
```

#### 5. Fixture Not Found

**Problem:** `fixture 'auth_headers' not found`

**Solution:**
```bash
# Ensure conftest.py is in the tests directory
ls tests/conftest.py

# Check fixture definition in conftest.py
grep -A 5 "def auth_headers" tests/conftest.py
```

### Debug Mode

Run tests with verbose output:
```bash
# Maximum verbosity
pytest -vv

# Show print statements
pytest -s

# Show local variables on failure
pytest -l

# Drop into debugger on failure
pytest --pdb
```

### Clear Test Cache

```bash
# Remove pytest cache
rm -rf .pytest_cache

# Remove coverage files
rm -rf htmlcov coverage.xml .coverage
```

---

## 📈 Continuous Improvement

### Monitoring Test Health

1. **Track coverage trends** over time
2. **Monitor test execution time**
3. **Review failing tests** regularly
4. **Update tests** when requirements change
5. **Add tests** for bug fixes

### Test Metrics Dashboard

Key metrics to track:
- Total number of tests: **62+**
- Code coverage: **>80%**
- Average test execution time: **<30s**
- Flaky tests: **0**
- Test success rate: **100%**

---

## 🎓 Additional Resources

### Documentation
- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [httpx Documentation](https://www.python-httpx.org/)
- [mongomock Documentation](https://github.com/mongomock/mongomock)

### Best Practices
- [Test-Driven Development (TDD)](https://en.wikipedia.org/wiki/Test-driven_development)
- [Testing Best Practices](https://testdriven.io/blog/modern-tdd/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/advanced/testing-dependencies/)

---

## 📞 Support

For testing issues or questions:
1. Check this documentation
2. Review test examples in `tests/` directory
3. Check conftest.py for available fixtures
4. Consult pytest documentation

---

## ✅ Quick Reference

### Essential Commands

```bash
# Install dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run tests matching pattern
pytest -k "login" -v

# Generate coverage report
pytest --cov=app --cov-report=term-missing

# Check coverage threshold
pytest --cov=app --cov-fail-under=80

# Run tests in parallel
pytest -n auto

# Debug mode
pytest --pdb -v
```

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete - Ready for Use
