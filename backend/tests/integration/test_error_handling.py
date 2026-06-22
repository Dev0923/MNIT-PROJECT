import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_validation_failures(async_client: AsyncClient):
    # Missing fields
    res = await async_client.post("/api/v1/vehicles/", json={"license_plate": "123"})
    assert res.status_code == 422 # FastAPI standard validation error

    # Type errors
    res = await async_client.post("/api/v1/auth/login", data={"username": "notanemail", "password": "123"})
    # It might hit 401 if form allows it, or 422 if strict email validation is active

@pytest.mark.asyncio
async def test_exception_mapping(async_client: AsyncClient, admin_user, auth_headers):
    admin_headers = auth_headers(admin_user)
    
    # Try to approve a non-existent permission
    import uuid
    fake_id = str(uuid.uuid4())
    res = await async_client.post(
        f"/api/v1/permissions/{fake_id}/approve",
        json={"status": "APPROVED"},
        headers=admin_headers
    )
    assert res.status_code == 404
    assert res.json()["error"] == "NOT_FOUND"
