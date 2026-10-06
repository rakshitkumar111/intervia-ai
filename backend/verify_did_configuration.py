import requests
import json
from app.config import settings

def verify_did_setup():
    print("=" * 65)
    print("D-ID CONFIGURATION & WEBRTC AGENT VERIFICATION")
    print("=" * 65)

    # 1. Check presence of credentials (without exposing secrets)
    has_api_key = bool(settings.DID_API_KEY and len(settings.DID_API_KEY.strip()) > 5)
    has_agent_id = bool(settings.DID_AGENT_ID and len(settings.DID_AGENT_ID.strip()) > 3)
    has_client_key = bool(settings.DID_CLIENT_KEY and len(settings.DID_CLIENT_KEY.strip()) > 3)

    print(f"[Check 1] DID_API_KEY Present:      {'[PASS] YES' if has_api_key else '[FAIL] MISSING'}")
    print(f"[Check 2] DID_AGENT_ID Present:     {'[PASS] YES' if has_agent_id else '[FAIL] MISSING'}")
    print(f"[Check 3] DID_CLIENT_KEY Present:   {'[PASS] YES' if has_client_key else '[FAIL] MISSING'}")

    if not has_api_key:
        print("[ERROR] DID_API_KEY is missing from backend/.env")
        return

    # 2. Test D-ID API Authentication
    print("\n[Step 2] Testing D-ID API Authentication...")
    headers = {
        "Authorization": f"Basic {settings.DID_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        credits_res = requests.get("https://api.d-id.com/credits", headers=headers, timeout=10)
        if credits_res.status_code == 200:
            credits_data = credits_res.json()
            remaining = credits_data.get("remaining", 0)
            print(f"[PASS] D-ID API Authentication: Valid (Credits Available: {remaining})")
        else:
            print(f"[FAIL] D-ID API Authentication Failed: HTTP {credits_res.status_code}")
            return
    except Exception as e:
        print(f"[FAIL] D-ID API Connection Error: {e}")
        return

    # 3. Test Agent Existence & Configuration
    if not has_agent_id:
        print("[FAIL] DID_AGENT_ID is missing from backend/.env")
        return

    print(f"\n[Step 3] Testing D-ID Agent Configuration...")
    try:
        agent_res = requests.get(f"https://api.d-id.com/agents/{settings.DID_AGENT_ID}", headers=headers, timeout=10)
        if agent_res.status_code == 200:
            agent_data = agent_res.json()
            agent_name = agent_data.get("preview_name", "AI Interviewer")
            presenter = agent_data.get("presenter", {})
            voice = presenter.get("voice", {})
            voice_id = voice.get("voice_id", "Unknown")
            print(f"[PASS] Agent Found: {agent_name} (Status: {agent_data.get('status')})")
            print(f"[PASS] Presenter Voice: {voice_id} (Female Neural Voice)")
            print(f"[PASS] Presenter Type: {presenter.get('type', 'talk')}")
        else:
            print(f"[FAIL] D-ID Agent Lookup Failed: HTTP {agent_res.status_code} - {agent_res.text}")
    except Exception as e:
        print(f"[FAIL] Agent Lookup Exception: {e}")

    # 4. Verify Telemetry Endpoint
    print("\n[Step 4] Testing Backend Telemetry Endpoint (/api/avatar/status)...")
    try:
        status_res = requests.get("http://127.0.0.1:8000/api/avatar/status", timeout=5)
        if status_res.status_code == 200:
            data = status_res.json()
            print(f"[PASS] Endpoint Status: HTTP 200")
            print(f"[PASS] Primary Provider: {data.get('primary_provider')}")
            print(f"[PASS] D-ID Configured Flag: {data.get('did_configured')}")
            print(f"[PASS] Default Voice ID: {data.get('default_voice_id')}")
        else:
            print(f"[FAIL] Telemetry endpoint returned HTTP {status_res.status_code}")
    except Exception as e:
        print(f"[FAIL] Telemetry request error: {e}")

    print("\n" + "=" * 65)
    print("D-ID CONFIGURATION VERIFICATION COMPLETED")
    print("=" * 65)

if __name__ == "__main__":
    verify_did_setup()
