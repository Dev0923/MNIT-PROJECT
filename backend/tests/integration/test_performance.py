import pytest
import time
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_qr_scan_performance(async_client: AsyncClient, regular_user, admin_user, operator_user, auth_headers, test_gate):
    # Setup vehicle, perm, qr
    user_headers = auth_headers(regular_user)
    v_res = await async_client.post("/api/v1/vehicles/", json={"license_plate": "PERF-1", "vehicle_type": "SEDAN", "vehicle_category": "PRIVATE", "owner_name": "Owner", "contact_number": "123"}, headers=user_headers)
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    p_res = await async_client.post("/api/v1/permissions/", json={"vehicle_id": v_res.json()["id"], "purpose": "Darshan", "valid_from": (now - timedelta(hours=1)).isoformat(), "valid_until": (now + timedelta(days=1)).isoformat(), "allowed_gate_ids": [str(test_gate.id)]}, headers=user_headers)
    
    admin_headers = auth_headers(admin_user)
    await async_client.post(f"/api/v1/permissions/{p_res.json()['id']}/approve", json={"status": "APPROVED"}, headers=admin_headers)
    qr_res = await async_client.get(f"/api/v1/permissions/{p_res.json()['id']}/qr", headers=user_headers)
    qr_token = qr_res.json()["qr_token"]

    operator_headers = auth_headers(operator_user)
    
    # Measure latency of a single scan
    start = time.perf_counter()
    res = await async_client.post(
        "/api/v1/scan/verify",
        json={"qr_token": qr_token, "gate_id": str(test_gate.id), "direction": "IN"},
        headers=operator_headers
    )
    end = time.perf_counter()
    latency_ms = (end - start) * 1000
    
    # Assert latency is under 200ms (typical threshold for QR scanners to feel instantaneous)
    assert latency_ms < 200
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_concurrent_throughput_bounds(async_client: AsyncClient):
    # Perform 50 concurrent health checks to ensure ASGI transport doesn't bottleneck
    start = time.perf_counter()
    tasks = [async_client.get("/health") for _ in range(50)]
    responses = await asyncio.gather(*tasks)
    end = time.perf_counter()
    
    latency_ms = (end - start) * 1000
    assert all(r.status_code == 200 for r in responses)
    # Total time for 50 requests should be small in testing framework
    assert latency_ms < 1000
