import requests
import json
from app.config import settings

def run_deep_diagnostic():
    print("=" * 65)
    print("D-ID DEEP CONNECTIVITY & CREDENTIAL DIAGNOSTIC")
    print("=" * 65)

    # 1. Credential Presence Check (No secret values printed)
    has_api_key = bool(settings.DID_API_KEY and len(settings.DID_API_KEY.strip()) > 5)
    has_agent_id = bool(settings.DID_AGENT_ID and len(settings.DID_AGENT_ID.strip()) > 3)
    has_client_key = bool(settings.DID_CLIENT_KEY and len(settings.DID_CLIENT_KEY.strip()) > 3)

    print(f"DID_API_KEY: {'PRESENT' if has_api_key else 'MISSING'}")
    print(f"DID_AGENT_ID: {'PRESENT' if has_agent_id else 'MISSING'}")
    print(f"DID_CLIENT_KEY: {'PRESENT' if has_client_key else 'MISSING'}")
    print(f"DID_PRESENTER_IMAGE_URL: {'PRESENT' if settings.DID_PRESENTER_IMAGE_URL else 'MISSING'}")
    print(f"DID_VOICE_ID: {'PRESENT' if settings.DID_VOICE_ID else 'MISSING'}")

    headers = {
        "Authorization": f"Basic {settings.DID_API_KEY}",
        "Content-Type": "application/json"
    }

    # 2. Credits & Account Status Check
    print("\n--- [1] Checking Account Credits & Billing ---")
    try:
        cred_res = requests.get("https://api.d-id.com/credits", headers=headers, timeout=10)
        print(f"HTTP STATUS: {cred_res.status_code}")
        if cred_res.status_code == 200:
            c_data = cred_res.json()
            remaining = c_data.get("remaining", 0)
            total = c_data.get("total", 0)
            print(f"Credits Remaining: {remaining} / Total: {total}")
        else:
            print(f"ERROR BODY: {cred_res.text}")
    except Exception as e:
        print(f"Connection Exception: {e}")

    # 3. Agent Details & Owner ID Check
    print("\n--- [2] Checking Configured Agent ID ---")
    try:
        agent_res = requests.get(f"https://api.d-id.com/agents/{settings.DID_AGENT_ID}", headers=headers, timeout=10)
        print(f"HTTP STATUS: {agent_res.status_code}")
        if agent_res.status_code == 200:
            a_data = agent_res.json()
            print(f"Agent Name: {a_data.get('preview_name')}")
            print(f"Agent Status: {a_data.get('status')}")
            print(f"Presenter Type: {a_data.get('presenter', {}).get('type')}")
            print(f"Voice ID: {a_data.get('presenter', {}).get('voice', {}).get('voice_id')}")
            print(f"Client Key in Agent Object: {'MATCHES' if a_data.get('client_key') == settings.DID_CLIENT_KEY else 'MISMATCH'}")
        else:
            print(f"ERROR BODY: {agent_res.text}")
    except Exception as e:
        print(f"Connection Exception: {e}")

    # 4. Test WebRTC Streams API directly
    print("\n--- [3] Testing D-ID Talks Streams (WebRTC Session Initiation) ---")
    try:
        stream_payload = {
            "source_url": settings.DID_PRESENTER_IMAGE_URL or "https://raw.githubusercontent.com/d-id/streaming-demos/main/main/source.jpg"
        }
        stream_res = requests.post("https://api.d-id.com/talks/streams", headers=headers, json=stream_payload, timeout=15)
        print(f"HTTP STATUS: {stream_res.status_code}")
        if stream_res.status_code in [200, 201]:
            s_data = stream_res.json()
            stream_id = s_data.get("id")
            session_id = s_data.get("session_id")
            print(f"[PASS] WebRTC Stream Initialized successfully! Stream ID: {stream_id}")
            print(f"SDP Offer Generated: {'YES' if s_data.get('offer') else 'NO'}")
            print(f"ICE Servers Received: {len(s_data.get('ice_servers', []))} servers")

            # Clean up the test stream immediately
            if stream_id and session_id:
                requests.delete(f"https://api.d-id.com/talks/streams/{stream_id}", headers=headers, json={"session_id": session_id})
                print(f"[PASS] Test stream closed cleanly.")
        else:
            print(f"ERROR RESPONSE: {stream_res.text}")
    except Exception as e:
        print(f"Stream Test Exception: {e}")

    # 5. Test Agent Chat Session Creation
    print("\n--- [4] Testing Agents Chat / WebRTC Session ---")
    try:
        chat_res = requests.post(f"https://api.d-id.com/agents/{settings.DID_AGENT_ID}/chat", headers=headers, json={}, timeout=10)
        print(f"HTTP STATUS: {chat_res.status_code}")
        if chat_res.status_code in [200, 201]:
            chat_data = chat_res.json()
            print(f"[PASS] Agent Chat Session created! Chat ID: {chat_data.get('id')}")
        else:
            print(f"AGENT CHAT RESPONSE: {chat_res.text}")
    except Exception as e:
        print(f"Agent Chat Exception: {e}")

    print("\n" + "=" * 65)

if __name__ == "__main__":
    run_deep_diagnostic()
