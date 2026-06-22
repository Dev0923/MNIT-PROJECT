import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, regular_user):
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_login_failure(async_client: AsyncClient, regular_user):
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["error"] == "AUTHENTICATION_FAILED"

@pytest.mark.asyncio
async def test_account_lockout(async_client: AsyncClient, regular_user):
    # 5 failed attempts
    for _ in range(5):
        await async_client.post(
            "/api/v1/auth/login",
            data={"username": "user@test.com", "password": "wrongpassword"}
        )
    
    # 6th attempt should be locked out even with correct password
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "password123"}
    )
    assert response.status_code == 403
    assert response.json()["error"] == "ACCOUNT_LOCKED"

@pytest.mark.asyncio
async def test_refresh_token_rotation(async_client: AsyncClient, regular_user):
    # Login
    login_res = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "password123"}
    )
    refresh_token = login_res.json()["refresh_token"]

    # Refresh
    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()
    new_refresh = refresh_res.json()["refresh_token"]
    assert new_refresh != refresh_token

@pytest.mark.asyncio
async def test_revoked_token_rejection(async_client: AsyncClient, regular_user):
    login_res = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "password123"}
    )
    refresh_token = login_res.json()["refresh_token"]
    
    # Logout (Revokes)
    logout_res = await async_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token}
    )
    assert logout_res.status_code == 204

    # Try to refresh with revoked token
    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 401
