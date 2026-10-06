import re
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

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
