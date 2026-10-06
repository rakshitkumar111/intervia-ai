import os
import httpx
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    with httpx.Client(timeout=10.0) as client:
        r = client.get(url)
        print("Status code:", r.status_code)
        if r.status_code == 200:
            models = [m["name"] for m in r.json().get("models", [])]
            print("Available models:")
            for m in models:
                if "gemini" in m:
                    print(" -", m)
        else:
            print("Response:", r.text)
except Exception as e:
    print("Error:", e)
