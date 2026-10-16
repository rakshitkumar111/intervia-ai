"""
Kokoro-82M Neural Text-to-Speech Service
Powered by hexgrad/Kokoro-82M (https://github.com/hexgrad/kokoro)

Provides ultra-realistic, human-like voice synthesis with low latency.
Includes an in-memory LRU cache for instant responses on common questions.
"""

import io
import time
import logging
import threading
from typing import Optional, Dict, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Global singleton Kokoro service
_kokoro_service_instance: Optional["KokoroService"] = None
_instance_lock = threading.Lock()

class KokoroService:
    def __init__(self, lang_code: str = 'a', repo_id: str = 'hexgrad/Kokoro-82M'):
        self.lang_code = lang_code
        self.repo_id = repo_id
        self._pipeline = None
        self._lock = threading.Lock()
        self._cache: Dict[str, bytes] = {}
        self._is_initialized = False

    def initialize(self) -> bool:
        """Pre-warms the Kokoro-82M pipeline in memory."""
        if self._is_initialized and self._pipeline is not None:
            return True

        with self._lock:
            if self._is_initialized and self._pipeline is not None:
                return True
            try:
                logger.info("[KOKORO] Initializing Kokoro-82M KPipeline...")
                t0 = time.time()
                from kokoro import KPipeline
                self._pipeline = KPipeline(lang_code=self.lang_code, repo_id=self.repo_id)
                self._is_initialized = True
                logger.info(f"[KOKORO] Initialized successfully in {time.time() - t0:.2f}s")
                return True
            except Exception as e:
                logger.error(f"[KOKORO] Failed to initialize pipeline: {e}", exc_info=True)
                return False

    @property
    def is_ready(self) -> bool:
        return self._is_initialized and self._pipeline is not None

    def synthesize_wav(
        self,
        text: str,
        voice: str = "af_heart",
        speed: float = 1.0
    ) -> Tuple[bytes, str]:
        """
        Synthesizes speech using Kokoro-82M model.
        Returns (wav_bytes, voice_used).
        """
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Input text cannot be empty.")

        # Canonical voice name resolution
        voice_clean = voice.lower().replace("kokoro:", "")
        if voice_clean not in [
            "af_heart", "af_bella", "af_sarah", "af_nicole", "af_sky",
            "am_adam", "am_michael", "am_echo", "am_eric",
            "bf_emma", "bf_isabella", "bm_george", "bm_lewis"
        ]:
            # Default to #1 top-rated voice: af_heart
            voice_clean = "af_heart"

        # Check in-memory cache for instant delivery
        cache_key = f"{voice_clean}_{speed:.2f}_{clean_text}"
        if cache_key in self._cache:
            logger.info(f"[KOKORO Cache Hit] Served '{clean_text[:40]}...' instantly")
            return self._cache[cache_key], voice_clean

        if not self.is_ready:
            success = self.initialize()
            if not success or not self._pipeline:
                raise RuntimeError("Kokoro-82M pipeline is not available.")

        import soundfile as sf

        with self._lock:
            pipeline = self._pipeline
            if pipeline is None:
                raise RuntimeError("Kokoro-82M pipeline is not available.")
            t0 = time.time()
            generator = pipeline(clean_text, voice=voice_clean, speed=speed)
            chunks = []
            for _, _, audio in generator:
                if audio is not None and len(audio) > 0:
                    chunks.append(audio)

            if not chunks:
                raise RuntimeError(f"Kokoro produced empty audio for text: '{clean_text[:40]}'")

            full_audio = np.concatenate(chunks)
            audio_duration = len(full_audio) / 24000.0

            buffer = io.BytesIO()
            sf.write(buffer, full_audio, 24000, format='WAV')
            buffer.seek(0)
            wav_bytes = buffer.read()

            logger.info(
                f"[KOKORO TTS] Synthesized {audio_duration:.2f}s audio with voice '{voice_clean}' "
                f"in {time.time() - t0:.2f}s (size: {len(wav_bytes)} bytes)"
            )

            # Keep cache size bounded to last 100 synthesis results
            if len(self._cache) > 100:
                # Discard an arbitrary key
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = wav_bytes

            return wav_bytes, voice_clean

def get_kokoro_service() -> KokoroService:
    global _kokoro_service_instance
    if _kokoro_service_instance is None:
        with _instance_lock:
            if _kokoro_service_instance is None:
                _kokoro_service_instance = KokoroService()
    return _kokoro_service_instance
