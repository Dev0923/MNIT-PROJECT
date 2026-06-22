import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone

@pytest.mark.asyncio
async def test_simultaneous_permission_approvals(async_client: AsyncClient, regular_user, admin_user, auth_headers, test_gate):
    # Setup
    user_headers = auth_headers(regular_user)
    v_res = await async_client.post("/api/v1/vehicles/", json={"license_plate": "RACE-1", "vehicle_type": "SEDAN", "vehicle_category": "PRIVATE", "owner_name": "Owner", "contact_number": "123"}, headers=user_headers)
    vehicle_id = v_res.json()["id"]
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    day_after = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    p_res = await async_client.post("/api/v1/permissions/", json={"vehicle_id": vehicle_id, "purpose": "Darshan", "valid_from": tomorrow, "valid_until": day_after, "allowed_gate_ids": [str(test_gate.id)]}, headers=user_headers)
    perm_id = p_res.json()["id"]

    admin_headers = auth_headers(admin_user)

    # Fire 5 simultaneous approvals
    tasks = [
        async_client.post(f"/api/v1/permissions/{perm_id}/approve", json={"status": "APPROVED"}, headers=admin_headers)
        for _ in range(5)
    ]
    responses = await asyncio.gather(*tasks)

    # Only one should succeed (200), rest should fail with 400 (Invalid State Transition) due to row locking
    success_count = sum(1 for r in responses if r.status_code == 200)
    conflict_count = sum(1 for r in responses if r.status_code == 400)
    
    assert success_count == 1
    assert conflict_count == 4

@pytest.mark.asyncio
async def test_simultaneous_refresh_token_requests(async_client: AsyncClient, regular_user):
    # Login to get refresh token
    login_res = await async_client.post("/api/v1/auth/login", data={"username": "user@test.com", "password": "password123"})
    refresh_token = login_res.json()["refresh_token"]

    # Fire 5 simultaneous refresh requests
    tasks = [
        async_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        for _ in range(5)
    ]
    responses = await asyncio.gather(*tasks)

    # Only one should succeed (200), rest should fail (401 Replay Attack)
    success_count = sum(1 for r in responses if r.status_code == 200)
    conflict_count = sum(1 for r in responses if r.status_code == 401)
    
    assert success_count == 1
    assert conflict_count == 4

@pytest.mark.asyncio
async def test_simultaneous_qr_scans(async_client: AsyncClient, regular_user, admin_user, operator_user, auth_headers, test_gate):
    # Setup valid QR
    user_headers = auth_headers(regular_user)
    v_res = await async_client.post("/api/v1/vehicles/", json={"license_plate": "RACE-2", "vehicle_type": "SEDAN", "vehicle_category": "PRIVATE", "owner_name": "Owner", "contact_number": "123"}, headers=user_headers)
    vehicle_id = v_res.json()["id"]
    now = datetime.now(timezone.utc)
    p_res = await async_client.post("/api/v1/permissions/", json={"vehicle_id": vehicle_id, "purpose": "Darshan", "valid_from": (now - timedelta(hours=1)).isoformat(), "valid_until": (now + timedelta(days=1)).isoformat(), "allowed_gate_ids": [str(test_gate.id)]}, headers=user_headers)
    perm_id = p_res.json()["id"]

    admin_headers = auth_headers(admin_user)
    await async_client.post(f"/api/v1/permissions/{perm_id}/approve", json={"status": "APPROVED"}, headers=admin_headers)
    
    qr_res = await async_client.get(f"/api/v1/permissions/{perm_id}/qr", headers=user_headers)
    qr_token = qr_res.json()["qr_token"]

    operator_headers = auth_headers(operator_user)
    
    # Fire 5 simultaneous scans
    tasks = [
        async_client.post("/api/v1/scan/verify", json={"qr_token": qr_token, "gate_id": str(test_gate.id), "direction": "IN"}, headers=operator_headers)
        for _ in range(5)
    ]
    responses = await asyncio.gather(*tasks)

    # All should return 200 (schema response), but only ONE should have is_allowed=True. Rest should be is_allowed=False (DUPLICATE_SCAN)
    success_count = sum(1 for r in responses if r.status_code == 200 and r.json()["is_allowed"] == True)
    conflict_count = sum(1 for r in responses if r.status_code == 200 and r.json()["status"] == "DUPLICATE_SCAN")
    
    assert success_count == 1
    assert conflict_count == 4
