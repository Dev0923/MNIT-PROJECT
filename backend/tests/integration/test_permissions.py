import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone

@pytest.mark.asyncio
async def test_create_permission_request(async_client: AsyncClient, regular_user, auth_headers, test_gate):
    headers = auth_headers(regular_user)
    
    # Register vehicle first
    v_res = await async_client.post(
        "/api/v1/vehicles/",
        json={
            "license_plate": "PERM-123",
            "vehicle_type": "SEDAN",
            "vehicle_category": "PRIVATE",
            "owner_name": "Owner",
            "contact_number": "123"
        },
        headers=headers
    )
    vehicle_id = v_res.json()["id"]

    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    day_after = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    p_res = await async_client.post(
        "/api/v1/permissions/",
        json={
            "vehicle_id": vehicle_id,
            "purpose": "Darshan",
            "valid_from": tomorrow,
            "valid_until": day_after,
            "allowed_gate_ids": [str(test_gate.id)]
        },
        headers=headers
    )
    assert p_res.status_code == 201
    assert p_res.json()["status"] == "PENDING"

@pytest.mark.asyncio
async def test_approve_permission(async_client: AsyncClient, regular_user, admin_user, auth_headers, test_gate):
    # Register vehicle and request permission
    user_headers = auth_headers(regular_user)
    v_res = await async_client.post("/api/v1/vehicles/", json={"license_plate": "APP-123", "vehicle_type": "SEDAN", "vehicle_category": "PRIVATE", "owner_name": "Owner", "contact_number": "123"}, headers=user_headers)
    vehicle_id = v_res.json()["id"]
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    day_after = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    p_res = await async_client.post("/api/v1/permissions/", json={"vehicle_id": vehicle_id, "purpose": "Darshan", "valid_from": tomorrow, "valid_until": day_after, "allowed_gate_ids": [str(test_gate.id)]}, headers=user_headers)
    perm_id = p_res.json()["id"]

    # Admin approves
    admin_headers = auth_headers(admin_user)
    app_res = await async_client.post(
        f"/api/v1/permissions/{perm_id}/approve",
        json={"status": "APPROVED", "remarks": "OK"},
        headers=admin_headers
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"

@pytest.mark.asyncio
async def test_invalid_state_transition(async_client: AsyncClient, regular_user, admin_user, auth_headers, test_gate):
    # ... setup vehicle and perm ...
    user_headers = auth_headers(regular_user)
    v_res = await async_client.post("/api/v1/vehicles/", json={"license_plate": "INV-123", "vehicle_type": "SEDAN", "vehicle_category": "PRIVATE", "owner_name": "Owner", "contact_number": "123"}, headers=user_headers)
    vehicle_id = v_res.json()["id"]
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    day_after = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    p_res = await async_client.post("/api/v1/permissions/", json={"vehicle_id": vehicle_id, "purpose": "Darshan", "valid_from": tomorrow, "valid_until": day_after, "allowed_gate_ids": [str(test_gate.id)]}, headers=user_headers)
    perm_id = p_res.json()["id"]

    admin_headers = auth_headers(admin_user)
    # Approve
    await async_client.post(f"/api/v1/permissions/{perm_id}/approve", json={"status": "APPROVED"}, headers=admin_headers)
    
    # Try to reject approved
    rej_res = await async_client.post(f"/api/v1/permissions/{perm_id}/reject", json={"status": "REJECTED"}, headers=admin_headers)
    assert rej_res.status_code == 400
    assert rej_res.json()["error"] == "INVALID_STATE_TRANSITION"
