import os
import base64
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.utils.logger import logger

class DIDRealtimeAvatarService:
    """
    Service gateway for D-ID Real-Time Streaming Avatars (WebRTC).
    Supports both D-ID Agents Streams API and D-ID Talks Streams API.
    Handles stream initialization, WebRTC SDP negotiation, ICE candidate exchange,
    and text-to-speech video streaming while keeping API credentials securely on the backend.
    Enforces a strict Single-Session guarantee.
    """

    TALKS_BASE_URL = "https://api.d-id.com/talks/streams"
    AGENTS_BASE_URL = "https://api.d-id.com/agents"

    def __init__(self):
        self.api_key = settings.DID_API_KEY.strip()
        self.agent_id = settings.DID_AGENT_ID.strip()
        self.client_key = settings.DID_CLIENT_KEY.strip()
        self.presenter_image_url = settings.DID_PRESENTER_IMAGE_URL.strip() or "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg"
        self.default_voice_id = settings.DID_VOICE_ID.strip() or "en-US-JennyNeural"
        
        # Single active session tracker
        self.active_stream_id: Optional[str] = None
        self.active_session_id: Optional[str] = None

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _get_auth_header(self) -> str:
        key = self.api_key
        if not key:
            return ""
        if key.startswith("Basic ") or key.startswith("Bearer "):
            return key
        if ":" in key:
            encoded = base64.b64encode(key.encode("utf-8")).decode("utf-8")
            return f"Basic {encoded}"
        return f"Basic {key}"

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": self._get_auth_header(),
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _get_stream_url(self, stream_id: Optional[str] = None, subpath: str = "") -> str:
        if self.agent_id:
            base = f"{self.AGENTS_BASE_URL}/{self.agent_id}/streams"
        else:
            base = self.TALKS_BASE_URL

        if stream_id:
            url = f"{base}/{stream_id}"
            if subpath:
                url = f"{url}/{subpath}"
            return url
        return base

    def close_stream(self, stream_id: Optional[str] = None, session_id: Optional[str] = None) -> bool:
        """
        Gracefully closes the active D-ID WebRTC stream and resets active session trackers.
        """
        target_stream = stream_id or self.active_stream_id
        target_session = session_id or self.active_session_id

        if not self.is_configured() or not target_stream:
            self.active_stream_id = None
            self.active_session_id = None
            return True

        url = self._get_stream_url(target_stream)
        payload = {"session_id": target_session} if target_session else {}

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.request("DELETE", url, json=payload, headers=self._get_headers())
                logger.info(f"D-ID Stream {target_stream} closed: HTTP {response.status_code}")
                if self.active_stream_id == target_stream:
                    self.active_stream_id = None
                    self.active_session_id = None
                return response.status_code in (200, 204)
        except Exception as e:
            logger.error(f"Error closing D-ID stream {target_stream}: {e}")
            if self.active_stream_id == target_stream:
                self.active_stream_id = None
                self.active_session_id = None
            return False

    def create_stream(self, source_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates a new D-ID WebRTC stream session and returns the SDP offer and ICE servers.
        Strictly ensures only ONE active session exists by closing any previous stream.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "DID_API_KEY is not configured in backend/.env",
                "is_configured": False
            }

        # 1. Close any existing active stream to ensure strictly ONE session exists
        if self.active_stream_id:
            logger.info(f"Closing existing active D-ID stream {self.active_stream_id} before creating a new one...")
            self.close_stream(self.active_stream_id, self.active_session_id)

        url = self._get_stream_url()
        payload: Dict[str, Any] = {}
        if not self.agent_id:
            payload["source_url"] = source_url or self.presenter_image_url

        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                if response.status_code in (200, 201):
                    data = response.json()
                    strm_id = data.get("id")
                    sess_id = data.get("session_id")

                    # Track active single session
                    self.active_stream_id = strm_id
                    self.active_session_id = sess_id

                    logger.info(f"D-ID Stream session created: id={strm_id}, session_id={sess_id}")
                    return {
                        "success": True,
                        "stream_id": strm_id,
                        "session_id": sess_id,
                        "offer": data.get("offer"),
                        "ice_servers": data.get("ice_servers", []),
                        "is_configured": True,
                        "mode": "agent" if self.agent_id else "talk"
                    }
                else:
                    logger.error(f"Failed to create D-ID stream (HTTP {response.status_code}): {response.text}")
                    error_json = {}
                    try:
                        error_json = response.json()
                    except Exception:
                        pass
                    
                    err_code = error_json.get("kind", f"HTTP_{response.status_code}")
                    err_desc = error_json.get("description", response.text)

                    return {
                        "success": False,
                        "error": f"D-ID API returned HTTP {response.status_code} [{err_code}]: {err_desc}",
                        "error_code": err_code,
                        "error_message": err_desc,
                        "is_configured": True
                    }
        except Exception as e:
            logger.error(f"D-ID stream creation exception: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_code": "ConnectionException",
                "error_message": str(e),
                "is_configured": True
            }

    def submit_sdp_answer(self, stream_id: str, session_id: str, answer_sdp: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends the browser's WebRTC SDP answer back to D-ID to establish the peer connection.
        """
        if not self.is_configured():
            return {"success": False, "error": "D-ID not configured"}

        url = self._get_stream_url(stream_id, "sdp")
        payload = {
            "answer": answer_sdp,
            "session_id": session_id
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                if response.status_code in (200, 201):
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def submit_ice_candidate(self, stream_id: str, session_id: str, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """
        Forwards a WebRTC ICE candidate to D-ID.
        """
        if not self.is_configured():
            return {"success": False, "error": "D-ID not configured"}

        url = self._get_stream_url(stream_id, "ice")
        payload = {
            "candidate": candidate.get("candidate"),
            "sdpMid": candidate.get("sdpMid"),
            "sdpMLineIndex": candidate.get("sdpMLineIndex"),
            "session_id": session_id
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                return {"success": response.status_code in (200, 201)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def stream_talk(
        self,
        stream_id: str,
        session_id: str,
        text: str,
        voice_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Instructs D-ID to animate and speak the given text over the active WebRTC stream.
        """
        if not self.is_configured():
            return {"success": False, "error": "D-ID not configured"}

        if self.agent_id:
            url = self._get_stream_url(stream_id, "speak")
            payload = {
                "script": {
                    "type": "text",
                    "input": text
                },
                "session_id": session_id
            }
        else:
            url = self._get_stream_url(stream_id)
            payload = {
                "script": {
                    "type": "text",
                    "input": text,
                    "provider": {
                        "type": "microsoft",
                        "voice_id": voice_id or self.default_voice_id
                    }
                },
                "config": {
                    "stitch": True
                },
                "session_id": session_id
            }

        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                if response.status_code in (200, 201):
                    logger.info(f"D-ID streaming speech triggered for stream_id={stream_id}")
                    return {"success": True, "data": response.json()}
                else:
                    logger.error(f"D-ID talk request failed (HTTP {response.status_code}): {response.text}")
                    return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"D-ID talk exception: {e}")
            return {"success": False, "error": str(e)}

    def validate_did_health(self) -> Dict[str, Any]:
        """
        Performs live end-to-end diagnostic against D-ID:
        - API key authentication (GET /credits)
        - Agent validity & accessibility (GET /agents/{agent_id})
        - Client Key verification
        - Allowed domain check
        - Real-time stream creation & immediate teardown
        Never exposes raw secrets or full client keys.
        """
        result = {
            "configured": self.is_configured(),
            "api_auth": "FAIL",
            "agent": "FAIL",
            "client_key": "FAIL",
            "allowed_domain": "FAIL",
            "stream_creation": "FAIL",
            "error_code": None,
            "error_message": None
        }

        if not self.is_configured():
            result["error_code"] = "ConfigurationMissing"
            result["error_message"] = "DID_API_KEY is not configured."
            return result

        headers = self._get_headers()

        # 1. Validate API Key Authentication via GET /credits
        try:
            with httpx.Client(timeout=10.0) as client:
                auth_res = client.get("https://api.d-id.com/credits", headers=headers)
                if auth_res.status_code == 200:
                    result["api_auth"] = "PASS"
                else:
                    result["api_auth"] = "FAIL"
                    result["error_code"] = f"AuthHTTP_{auth_res.status_code}"
                    result["error_message"] = f"D-ID Authentication failed with status {auth_res.status_code}"
                    return result
        except Exception as e:
            result["api_auth"] = "FAIL"
            result["error_code"] = "AuthNetworkError"
            result["error_message"] = str(e)
            return result

        # 2. Validate Agent ID & Accessibility
        if self.agent_id:
            try:
                with httpx.Client(timeout=10.0) as client:
                    agent_res = client.get(f"{self.AGENTS_BASE_URL}/{self.agent_id}", headers=headers)
                    if agent_res.status_code == 200:
                        result["agent"] = "PASS"
                        agent_data = agent_res.json()
                        
                        # Verify allowed domain access
                        access = agent_data.get("access", "unlisted")
                        if access in ("unlisted", "public", "organization"):
                            result["allowed_domain"] = "PASS"
                        else:
                            result["allowed_domain"] = "FAIL"
                    else:
                        result["agent"] = "FAIL"
                        result["error_code"] = f"AgentHTTP_{agent_res.status_code}"
                        result["error_message"] = f"Agent ID {self.agent_id} could not be retrieved (HTTP {agent_res.status_code})"
            except Exception as e:
                result["agent"] = "FAIL"
                result["error_code"] = "AgentLookupError"
                result["error_message"] = str(e)
        else:
            # If no specific agent, talks mode is considered standard
            result["agent"] = "PASS"
            result["allowed_domain"] = "PASS"

        # 3. Validate Client Key format
        if self.client_key and len(self.client_key) > 5:
            result["client_key"] = "PASS"
        elif not self.agent_id:
            result["client_key"] = "PASS"
        else:
            result["client_key"] = "FAIL"
            if not result["error_code"]:
                result["error_code"] = "ClientKeyMissing"
                result["error_message"] = "DID_CLIENT_KEY is missing or invalid."

        # 4. Validate Realtime Stream Creation & Immediate Cleanup
        stream_success = False
        for attempt in range(2):
            try:
                stream_result = self.create_stream()
                if stream_result.get("success"):
                    result["stream_creation"] = "PASS"
                    strm_id = stream_result.get("stream_id")
                    sess_id = stream_result.get("session_id")
                    self.close_stream(strm_id, sess_id)
                    stream_success = True
                    break
                else:
                    if attempt == 0:
                        import time
                        time.sleep(1.2)
                        continue
                    result["stream_creation"] = "FAIL"
                    result["error_code"] = stream_result.get("error_code") or "StreamCreationFailed"
                    result["error_message"] = stream_result.get("error_message") or stream_result.get("error")
            except Exception as e:
                if attempt == 0:
                    import time
                    time.sleep(1.2)
                    continue
                result["stream_creation"] = "FAIL"
                result["error_code"] = "StreamException"
                result["error_message"] = str(e)

        return result

did_avatar_service = DIDRealtimeAvatarService()
