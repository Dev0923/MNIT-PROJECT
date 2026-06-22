import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_cannot_access_others_vehicles(async_client: AsyncClient, regular_user, admin_user, auth_headers):
    # Admin creates vehicle
    headers = auth_headers(admin_user)
    await async_client.post(
        "/api/v1/vehicles/",
        json={
            "license_plate": "ADMIN123",
            "vehicle_type": "SUV",
            "vehicle_category": "PRIVATE",
            "owner_name": "Admin Owner",
            "contact_number": "1234567890"
        },
        headers=headers
    )

    # User tries to list vehicles
    user_headers = auth_headers(regular_user)
    response = await async_client.get("/api/v1/vehicles/", headers=user_headers)
    assert response.status_code == 200
    assert len(response.json()) == 0  # Should not see admin's vehicle

@pytest.mark.asyncio
async def test_operator_cannot_approve_permissions(async_client: AsyncClient, operator_user, auth_headers):
    # Try to hit approve endpoint
    headers = auth_headers(operator_user)
    response = await async_client.post(
        "/api/v1/permissions/123e4567-e89b-12d3-a456-426614174000/approve",
        json={"status": "APPROVED"},
        headers=headers
    )
    # Require admin role will raise 403
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_superadmin_access_everything(async_client: AsyncClient, superadmin_user, auth_headers):
    headers = auth_headers(superadmin_user)
    # Access gates
    response = await async_client.get("/api/v1/gates/", headers=headers)
    assert response.status_code == 200
