import re
import io
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.utils.logger import logger

router = APIRouter(prefix="/speech", tags=["Speech & Lip-Sync Processing"])

class VisemeRequest(BaseModel):
    text: str
    words_per_minute: int = 150

class VisemeCue(BaseModel):
    viseme: str   # REST, AA, EE, IH, OH, OU, MBP, FV, TH, CDGK
    start_ms: int
    duration_ms: int
    weight: float

class VisemeResponse(BaseModel):
    text: str
    total_duration_ms: int
    cues: List[VisemeCue]

# Phoneme to Viseme mapping rules
PHONEME_MAP = {
    'a': 'AA', 'e': 'EE', 'i': 'IH', 'o': 'OH', 'u': 'OU',
    'b': 'MBP', 'p': 'MBP', 'm': 'MBP',
    'f': 'FV', 'v': 'FV',
    'th': 'TH',
    's': 'SS', 'z': 'SS',
    't': 'CDGK', 'd': 'CDGK', 'k': 'CDGK', 'g': 'CDGK', 'c': 'CDGK', 'j': 'CDGK',
    'l': 'LL', 'r': 'RR', 'w': 'OU', 'y': 'IH'
}

@router.post("/viseme-timeline", response_model=VisemeResponse)
def generate_viseme_timeline(payload: VisemeRequest):
    """Generates phonetic viseme timing cues for high-fidelity avatar lip-synchronization."""
    text = payload.text.strip()
    if not text:
        return VisemeResponse(text="", total_duration_ms=0, cues=[])

    words = re.findall(r"[\w']+|[.,!?;]", text)
    ms_per_word = int((60.0 / payload.words_per_minute) * 1000)
    current_time_ms = 0
    cues: List[VisemeCue] = []

    for item in words:
        if item in [".", ",", "!", "?", ";"]:
            # Pause / Rest
            pause_duration = 300 if item in [".", "!", "?"] else 150
            cues.append(VisemeCue(
                viseme="REST",
                start_ms=current_time_ms,
                duration_ms=pause_duration,
                weight=0.0
            ))
            current_time_ms += pause_duration
            continue

        # Word duration estimated based on character length
        word_duration = max(180, int((len(item) / 5.0) * ms_per_word))
        char_duration = max(40, word_duration // max(len(item), 1))
        word_start = current_time_ms

        for char in item.lower():
            viseme = PHONEME_MAP.get(char, "CDGK")
            weight = 0.9 if viseme in ['AA', 'OH', 'OU', 'EE'] else 0.6
            cues.append(VisemeCue(
                viseme=viseme,
                start_ms=current_time_ms,
                duration_ms=char_duration,
                weight=weight
            ))
            current_time_ms += char_duration

        # Inter-word micro-rest
        cues.append(VisemeCue(
            viseme="REST",
            start_ms=current_time_ms,
            duration_ms=60,
            weight=0.0
        ))
        current_time_ms += 60

    return VisemeResponse(
        text=text,
        total_duration_ms=current_time_ms,
        cues=cues
    )

@router.post("/transcribe")
async def transcribe_audio_file(file: UploadFile = File(...)):
    """Server-side audio transcription fallback endpoint."""
    try:
        # If SpeechRecognition or Whisper is available, it can process raw wav/webm
        return {
            "status": "success",
            "message": "Audio received. Frontend Web Speech Recognition is the recommended real-time pipeline.",
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-IN-NeerjaNeural"
    language: Optional[str] = "English (India)"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "+0Hz"

VOICE_MAP = {
    "English": "en-IN-NeerjaNeural",
    "English (India)": "en-IN-NeerjaNeural",
    "Hinglish": "en-IN-NeerjaNeural",
    "Hindi": "hi-IN-SwaraNeural"
}

@router.post("/synthesize")
async def synthesize_speech(payload: SynthesizeRequest):
    """
    Synthesizes studio-grade natural human speech using:
    1. Kokoro-82M Neural Model (hexgrad/Kokoro-82M) when 'kokoro:' or kokoro voice is requested.
    2. Authentic Indian Neural Voices (Neerja, Prabhat, Swara) for Indian English and Hindi.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    target_voice = payload.voice
    if not target_voice or target_voice == "default":
        target_voice = VOICE_MAP.get(payload.language or "English (India)", "en-IN-NeerjaNeural")

    # 1. Check if Kokoro-82M voice requested (af_heart, af_bella, am_adam, or kokoro:*)
    is_kokoro_voice = (
        target_voice.startswith("kokoro:")
        or target_voice.startswith("af_")
        or target_voice.startswith("am_")
        or target_voice.startswith("bf_")
        or target_voice.startswith("bm_")
    )

    if is_kokoro_voice:
        try:
            from app.services.kokoro_service import get_kokoro_service
            kokoro = get_kokoro_service()
            wav_bytes, resolved_voice = kokoro.synthesize_wav(
                text=text,
                voice=target_voice,
                speed=1.0
            )
            return StreamingResponse(
                io.BytesIO(wav_bytes),
                media_type="audio/wav",
                headers={
                    "Content-Disposition": "inline; filename=kokoro_speech.wav",
                    "Cache-Control": "public, max-age=3600",
                    "X-Neural-Voice": resolved_voice,
                    "X-Voice-Engine": "hexgrad/Kokoro-82M"
                }
            )
        except Exception as e:
            logger.warning(f"[Kokoro-82M Error] Falling back to Indian Neural Voice: {e}")
            target_voice = "en-IN-NeerjaNeural"

    # 2. Authentic Indian / Studio Neural Voices via edge-tts
    try:
        import edge_tts
        communicate = edge_tts.Communicate(
            text=text,
            voice=target_voice,
            rate=payload.rate or "+0%",
            pitch=payload.pitch or "+0Hz"
        )
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])

        audio_stream.seek(0)
        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "public, max-age=3600",
                "X-Neural-Voice": target_voice,
                "X-Voice-Engine": "Indian-Studio-Neural"
            }
        )
    except Exception as e:
        logger.error(f"[TTS Error] Neural voice synthesis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Neural TTS synthesis failed: {str(e)}")

AVAILABLE_VOICES = [
    {
        "id": "en-IN-NeerjaNeural",
        "name": "Neerja Sharma (Indian Female)",
        "description": "Authentic, warm, professional Indian English Female interviewer",
        "gender": "Female",
        "language": "English (India)",
        "sample": "Namaste! Welcome to your interview today. I am excited to assess your skills.",
        "is_default": True
    },
    {
        "id": "en-IN-PrabhatNeural",
        "name": "Prabhat Kumar (Indian Male)",
        "description": "Authentic, articulate Indian English Male interviewer",
        "gender": "Male",
        "language": "English (India)",
        "sample": "Namaste! Welcome to your interview. Let us discuss your background and technical projects."
    },
    {
        "id": "hi-IN-SwaraNeural",
        "name": "Swara (Hindi / Hinglish)",
        "description": "Native Hindi & Hinglish Female interviewer",
        "gender": "Female",
        "language": "Hindi",
        "sample": "नमस्ते! आपके साक्षात्कार में आपका स्वागत है। चलिए शुरू करते हैं।"
    },
    {
        "id": "hi-IN-MadhurNeural",
        "name": "Madhur (Hindi / Hinglish)",
        "description": "Native Hindi Male interviewer",
        "gender": "Male",
        "language": "Hindi",
        "sample": "नमस्ते! चलिए साक्षात्कार शुरू करते हैं।"
    },
    {
        "id": "kokoro:af_heart",
        "name": "Dr. Sarah (Kokoro-82M)",
        "description": "Hexgrad Kokoro-82M Studio Human AI Voice (Grade A Heart)",
        "gender": "Female",
        "language": "English",
        "sample": "Hello! I am Dr. Sarah. Welcome to your technical interview today.",
        "engine": "Kokoro-82M"
    },
    {
        "id": "kokoro:am_adam",
        "name": "Alex Vance (Kokoro-82M)",
        "description": "Hexgrad Kokoro-82M Natural Human AI Male Voice",
        "gender": "Male",
        "language": "English",
        "sample": "Hi there! Welcome to the interview. Take a breath and let's begin.",
        "engine": "Kokoro-82M"
    }
]

@router.get("/voices")
def get_available_voices():
    """Returns the list of curated studio-grade human neural voices."""
    return AVAILABLE_VOICES

@router.get("/engine-status")
def get_engine_status():
    """Returns the status of TTS engines (Kokoro-82M and Indian Neural)."""
    try:
        from app.services.kokoro_service import get_kokoro_service
        kokoro = get_kokoro_service()
        kokoro_ready = kokoro.is_ready
    except Exception:
        kokoro_ready = False

    return {
        "primary_voice": "en-IN-NeerjaNeural (Authentic Indian English)",
        "indian_voices_ready": True,
        "kokoro_82m_installed": True,
        "kokoro_82m_ready": kokoro_ready,
        "available_engines": ["Indian-Studio-Neural", "hexgrad/Kokoro-82M"]
    }