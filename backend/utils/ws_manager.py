from typing import List
from fastapi import WebSocket


class GateWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        # We make a copy of the list to avoid issues if a connection disconnects during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


class ParkingWebSocketManager:
    """
    Dedicated WebSocket manager for the zonal parking system.
    Broadcasts `parking_count_update` payloads to every connected
    admin panel and devotee web interface.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Broadcast a JSON message to all connected parking WebSocket clients."""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

    async def broadcast_zone_update(self, zone_id: int, zone_name: str,
                                    current_occupancy: int, system_capacity_limit: int,
                                    total_physical_capacity: int, anomaly: dict | None = None):
        """
        Convenience method: emit a standardised parking_count_update payload.
        anomaly is an optional dict with 'sensor_id' and 'reason' keys.
        """
        available = max(0, system_capacity_limit - current_occupancy)
        pct_full = round((current_occupancy / system_capacity_limit) * 100, 1) if system_capacity_limit else 0.0
        payload: dict = {
            "type": "parking_count_update",
            "zone_id": zone_id,
            "zone_name": zone_name,
            "current_occupancy": current_occupancy,
            "system_capacity_limit": system_capacity_limit,
            "total_physical_capacity": total_physical_capacity,
            "available_slots": available,
            "pct_full": pct_full,
        }
        if anomaly:
            payload["anomaly"] = anomaly
        await self.broadcast(payload)


gate_ws_manager = GateWebSocketManager()
parking_ws_manager = ParkingWebSocketManager()
