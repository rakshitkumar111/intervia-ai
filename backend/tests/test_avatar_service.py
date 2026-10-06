import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.avatar.did_service import DIDRealtimeAvatarService

client = TestClient(app)

def test_avatar_status_endpoint():
    response = client.get("/api/avatar/status")
    assert response.status_code == 200
    data = response.json()
    assert "did_configured" in data
    assert "supported_providers" in data
    assert "d-id" in data["supported_providers"]
    assert "threejs-3d" in data["supported_providers"]

def test_did_unconfigured_graceful_handling():
    # Test that creating a stream without D-ID key reports proper status rather than unhandled crash
    service = DIDRealtimeAvatarService()
    service.api_key = ""
    result = service.create_stream()
    assert result["success"] is False
    assert result["is_configured"] is False

def test_avatar_did_stream_unconfigured_api():
    response = client.post("/api/avatar/did/stream", json={"source_url": None})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["is_configured"] is False
