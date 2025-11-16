# Backend Tests - AI-Assisted Land Registry System

## 📁 Test Suite Overview

This directory contains comprehensive tests for the Land Registry System backend API.

### Test Files

| File | Purpose | Test Count |
|------|---------|------------|
| `conftest.py` | Shared fixtures and test configuration | N/A |
| `test_auth.py` | Authentication and JWT tests | 16 tests |
| `test_claims.py` | Land claims management tests | 18 tests |
| `test_ai_detection.py` | AI boundary detection tests | 13 tests |
| `test_validation.py` | Validation workflow tests | 15 tests |

**Total: 62+ comprehensive tests**

---

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r ../requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest test_auth.py -v
```

---

## 🧪 Test Categories

### Authentication Tests (`test_auth.py`)
- User registration (success, duplicate email, invalid data)
- Login functionality (success, invalid credentials)
- JWT token generation and validation
- Protected route access
- Password hashing verification

### Claims Tests (`test_claims.py`)
- Claim submission with images
- GeoJSON boundary validation
- Claim retrieval by ID and filters
- Authorization checks
- Pagination
- Status updates

### AI Detection Tests (`test_ai_detection.py`)
- Boundary detection from images
- OpenCV integration (mocked)
- GeoJSON polygon generation
- Confidence scoring
- Area calculation
- Geo-referencing

### Validation Tests (`test_validation.py`)
- Witness approvals
- Leader endorsements
- Status transitions
- Role-based access control
- Validation workflow enforcement
- Audit trail

---

## 🔧 Available Fixtures

### Database & Client
- `mock_db` - In-memory MongoDB using mongomock
- `test_client` - Async HTTP client for API testing

### User Fixtures
- `test_user` - Regular citizen user
- `test_leader` - Community leader user
- `test_government_official` - Government official user
- `auth_headers` - Authorization headers for test_user
- `leader_headers` - Authorization headers for leader
- `official_headers` - Authorization headers for official

### Data Fixtures
- `test_claim` - Sample land claim
- `sample_image_file` - Test image for uploads

### Mocking Fixtures
- `mock_opencv_detection` - Mocked AI boundary detection
- `mock_file_upload` - Mocked file upload service

---

## 📊 Coverage Goals

- **Target:** 80%+ code coverage
- **Current Status:** See coverage report after running tests
- **Generate Report:** `pytest --cov=app --cov-report=html`

---

## 🎯 Running Tests

### All Tests
```bash
pytest -v
```

### Specific Test File
```bash
pytest test_auth.py -v
```

### Tests by Marker
```bash
pytest -m auth
pytest -m claims
pytest -m ai
pytest -m validation
```

### Tests by Keyword
```bash
pytest -k "login" -v
pytest -k "boundary" -v
```

### With Coverage
```bash
pytest --cov=app --cov-report=term-missing
```

### Parallel Execution
```bash
pytest -n auto
```

---

## 📝 Test Structure

Each test follows the **Arrange-Act-Assert** pattern:

```python
@pytest.mark.asyncio
async def test_example(test_client, auth_headers):
    # Arrange: Set up test data
    data = {"field": "value"}
    
    # Act: Perform the action
    response = await test_client.post(
        "/api/endpoint",
        json=data,
        headers=auth_headers
    )
    
    # Assert: Verify results
    assert response.status_code == 200
    assert response.json()["field"] == "value"
```

---

## 🐛 Debugging Tests

### Show Print Statements
```bash
pytest -s
```

### Drop into Debugger on Failure
```bash
pytest --pdb
```

### Show Local Variables on Failure
```bash
pytest -l
```

### Maximum Verbosity
```bash
pytest -vv
```

---

## 📚 Documentation

For more detailed information, see:
- `../TESTING.md` - Comprehensive testing guide
- `../TESTING_QUICKSTART.md` - Quick start guide
- `../pytest.ini` - Pytest configuration
- `../.coveragerc` - Coverage configuration

---

## ✅ Success Criteria

Tests pass when:
1. All 62+ tests execute successfully
2. Code coverage exceeds 80%
3. No authentication bypasses
4. All validation workflows enforced
5. AI detection properly mocked
6. Database operations isolated

---

## 🔄 CI/CD Integration

These tests are designed to run in CI/CD pipelines:
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI

See `../TESTING.md` for CI/CD configuration examples.

---

**Last Updated:** November 16, 2025  
**Status:** ✅ Complete and Ready
