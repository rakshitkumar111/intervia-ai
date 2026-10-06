from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.services.avatar.did_service import did_avatar_service
from app.config import settings

avatar_router = APIRouter(prefix="/avatar", tags=["Avatar"])

class CreateStreamRequest(BaseModel):
    source_url: Optional[str] = None

class SDPAnswerRequest(BaseModel):
    stream_id: str
    session_id: str
    answer: Dict[str, Any]

class ICECandidateRequest(BaseModel):
    stream_id: str
    session_id: str
    candidate: Dict[str, Any]

class TalkStreamRequest(BaseModel):
    stream_id: str
    session_id: str
    text: str
    voice_id: Optional[str] = None

class CloseStreamRequest(BaseModel):
    stream_id: str
    session_id: str

@avatar_router.get("/status")
def get_avatar_status():
    """
    Returns avatar capabilities and provider telemetry.
    """
    is_cfg = did_avatar_service.is_configured() or bool(settings.DID_CLIENT_KEY)
    masked_client_key = f"{settings.DID_CLIENT_KEY[:6]}...{settings.DID_CLIENT_KEY[-4:]}" if len(settings.DID_CLIENT_KEY) > 10 else settings.DID_CLIENT_KEY
    return {
        "did_configured": is_cfg,
        "agent_id": settings.DID_AGENT_ID,
        "client_key": masked_client_key,
        "primary_provider": "d-id" if is_cfg else "realistic-female",
        "fallback_available": True,
        "presenter_image_url": settings.DID_PRESENTER_IMAGE_URL,
        "default_voice_id": settings.DID_VOICE_ID,
        "supported_providers": ["d-id", "realistic-female", "canvas-2d", "threejs-3d"]
    }

@avatar_router.get("/did-health")
def get_did_health():
    """
    Live real-time diagnostic validating:
    - DID_API_KEY authentication
    - DID_AGENT_ID validity
    - DID_CLIENT_KEY validity
    - allowed domain configuration
    - D-ID Agent accessibility
    - Ability to create and tear down a real-time stream session
    Never exposes raw secrets or full keys.
    """
    return did_avatar_service.validate_did_health()

@avatar_router.post("/did/stream")
def create_did_stream(req: CreateStreamRequest = Body(...)):
    """
    Initializes a new WebRTC session with D-ID.
    Enforces strictly ONE active session.
    """
    if req.source_url is None:
        return {
            "success": False,
            "error": "DID stream unconfigured or source_url is required",
            "is_configured": False
        }
    result = did_avatar_service.create_stream(source_url=req.source_url)
    if not result.get("success") and result.get("is_configured"):
        raise HTTPException(
            status_code=502,
            detail={
                "error": result.get("error", "D-ID stream creation failed"),
                "error_code": result.get("error_code"),
                "error_message": result.get("error_message")
            }
        )
    return result

@avatar_router.post("/did/sdp")
def submit_did_sdp(req: SDPAnswerRequest = Body(...)):
    """
    Exchanges the client WebRTC SDP Answer with D-ID.
    """
    result = did_avatar_service.submit_sdp_answer(
        stream_id=req.stream_id,
        session_id=req.session_id,
        answer_sdp=req.answer
    )
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Failed to submit SDP answer to D-ID"))
    return result

@avatar_router.post("/did/ice")
def submit_did_ice(req: ICECandidateRequest = Body(...)):
    """
    Forwards WebRTC ICE Candidate to D-ID.
    """
    result = did_avatar_service.submit_ice_candidate(
        stream_id=req.stream_id,
        session_id=req.session_id,
        candidate=req.candidate
    )
    return result

@avatar_router.post("/did/talk")
def stream_did_talk(req: TalkStreamRequest = Body(...)):
    """
    Streams dynamic speech and lip-sync video onto the active WebRTC avatar stream.
    """
    result = did_avatar_service.stream_talk(
        stream_id=req.stream_id,
        session_id=req.session_id,
        text=req.text,
        voice_id=req.voice_id
    )
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "D-ID talk request failed"))
    return result

@avatar_router.delete("/did/stream")
def close_did_stream(req: CloseStreamRequest = Body(...)):
    """
    Terminates the active WebRTC stream session.
    """
    success = did_avatar_service.close_stream(
        stream_id=req.stream_id,
        session_id=req.session_id
    )
    return {"success": success}
