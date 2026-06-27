from fastapi.testclient import TestClient
from main import app
from camera.manager import CameraManager

def test_camera_flow():
    # Make sure camera manager is initialized
    manager = CameraManager()
    if not manager.workers:
        manager.initialize()
        
    client = TestClient(app)
    
    # 1. Test camera list endpoint
    print("Testing GET /api/v1/cameras...")
    res = client.get("/api/v1/cameras")
    assert res.status_code == 200
    cameras = res.json()
    print(f"Registered cameras list: {cameras}")
    assert len(cameras) == 6
    
    # 2. Test status endpoint for C1
    print("Testing GET /api/v1/cameras/C1/status...")
    res = client.get("/api/v1/cameras/C1/status")
    assert res.status_code == 200
    status = res.json()
    print(f"C1 Status metrics: {status}")
    assert status["id"] == "C1"
    
    # 3. Test snapshot endpoint for C1
    print("Testing GET /api/v1/cameras/C1/snapshot...")
    res = client.get("/api/v1/cameras/C1/snapshot")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/jpeg"
    print(f"Snapshot returned successfully. Length: {len(res.content)} bytes")
    
    # 4. Test stream endpoint for C1 (first few frames)
    print("Testing GET /api/v1/cameras/C1/stream...")
    with client.stream("GET", "/api/v1/cameras/C1/stream") as stream:
        assert stream.status_code == 200
        assert "multipart/x-mixed-replace" in stream.headers["content-type"]
        
        # Read a chunk from the stream to verify bytes are yielding
        chunks_read = 0
        for chunk in stream.iter_raw():
            if len(chunk) > 0:
                print(f"Stream is active: yielded chunk of size {len(chunk)} bytes.")
                chunks_read += 1
            if chunks_read >= 3:
                break
                
    print("All camera endpoints successfully validated!")

if __name__ == "__main__":
    test_camera_flow()
