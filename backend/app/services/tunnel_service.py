import os
import re
import sys
import shutil
import logging
import threading
import subprocess
from pathlib import Path
from typing import Optional

logger = logging.getLogger("ai_interviewer.tunnel")

class CloudflareTunnelService:
    """
    Manages automated Cloudflare HTTPS tunnel creation directly from localhost.
    Automatically grabs the generated trycloudflare.com URL and propagates it
    to system settings and candidate invitation links.
    """
    def __init__(self):
        self._process: Optional[subprocess.Popen] = None
        self._thread: Optional[threading.Thread] = None
        self._public_url: Optional[str] = None
        self._is_running: bool = False
        self._stop_event = threading.Event()
        self._workspace_root = Path(__file__).resolve().parent.parent.parent.parent
        self._tunnel_file = self._workspace_root / "tunnel_url.txt"

    def find_cloudflared_executable(self) -> Optional[str]:
        """Locates cloudflared executable on Windows or POSIX environments."""
        candidates = [
            r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
            r"C:\Program Files\cloudflared\cloudflared.exe",
            shutil.which("cloudflared"),
            shutil.which("cloudflared.exe")
        ]
        for c in candidates:
            if c and os.path.exists(c):
                return c
        return None

    @property
    def public_url(self) -> Optional[str]:
        if self._public_url:
            return self._public_url
        # Fallback: check if tunnel_url.txt has an active URL
        if self._tunnel_file.exists():
            try:
                content = self._tunnel_file.read_text(encoding="utf-8").strip()
                if content.startswith("https://") and "trycloudflare.com" in content:
                    return content
            except Exception:
                pass
        return None

    def start_tunnel_async(self, target_url: str = "http://localhost:5174"):
        """Starts the tunnel in a background thread if not already active."""
        if self._is_running and self._public_url:
            logger.info(f"[AutoTunnel] Cloudflare tunnel already active: {self._public_url}")
            return

        thread = threading.Thread(
            target=self._run_tunnel_process,
            args=(target_url,),
            daemon=True,
            name="CloudflareTunnelWorker"
        )
        self._thread = thread
        thread.start()

    def _run_tunnel_process(self, target_url: str):
        executable = self.find_cloudflared_executable()
        if not executable:
            logger.warning("[AutoTunnel] cloudflared.exe not found on system. Auto-tunneling skipped.")
            return

        logger.info(f"[AutoTunnel] Launching Cloudflare Tunnel pointing to {target_url}...")
        self._stop_event.clear()

        # Windows creation flags to avoid opening extra CMD windows
        creationflags = 0
        if sys.platform == "win32":
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)

        cmd = [executable, "tunnel", "--protocol", "http2", "--url", target_url]

        try:
            self._process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                creationflags=creationflags
            )
            self._is_running = True

            # Cloudflare logs its generated URL to stderr
            url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

            def monitor_stream(stream, stream_name):
                for line in iter(stream.readline, ''):
                    if not line:
                        break
                    line_clean = line.strip()
                    # Search for the tunnel URL
                    match = url_pattern.search(line_clean)
                    if match:
                        found_url = match.group(0)
                        self._public_url = found_url
                        logger.info(f"[AutoTunnel] [OK] Automatic Cloudflare Public URL Established: {found_url}")

                        # 1. Update in-memory settings
                        try:
                            from app.config import settings
                            settings.PUBLIC_FRONTEND_URL = found_url
                        except Exception as e:
                            logger.warn(f"[AutoTunnel] Could not set settings.PUBLIC_FRONTEND_URL: {e}")

                        # 2. Persist to workspace file for visibility
                        try:
                            self._tunnel_file.write_text(found_url, encoding="utf-8")
                        except Exception:
                            pass

                        # 3. Update backend .env for future restarts
                        self._update_env_file(found_url)

            # Start reading stderr in separate thread because cloudflared logs primarily there
            stderr_thread = threading.Thread(
                target=monitor_stream,
                args=(self._process.stderr, "stderr"),
                daemon=True
            )
            stderr_thread.start()

            # Also monitor stdout just in case
            monitor_stream(self._process.stdout, "stdout")
            stderr_thread.join(timeout=2.0)

        except Exception as err:
            logger.error(f"[AutoTunnel] Failed to run cloudflared process: {err}")
        finally:
            self._is_running = False

    def _update_env_file(self, new_url: str):
        try:
            env_path = self._workspace_root / "backend" / ".env"
            if env_path.exists():
                lines = env_path.read_text(encoding="utf-8").splitlines()
                updated = False
                new_lines = []
                for line in lines:
                    if line.startswith("PUBLIC_FRONTEND_URL="):
                        new_lines.append(f"PUBLIC_FRONTEND_URL={new_url}")
                        updated = True
                    else:
                        new_lines.append(line)
                if not updated:
                    new_lines.append(f"PUBLIC_FRONTEND_URL={new_url}")
                env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
                logger.info(f"[AutoTunnel] Updated backend/.env with PUBLIC_FRONTEND_URL={new_url}")
        except Exception as e:
            logger.warn(f"[AutoTunnel] Could not auto-update .env: {e}")

    def stop_tunnel(self):
        """Terminates the tunnel process if running."""
        self._stop_event.set()
        if self._process:
            try:
                self._process.terminate()
                self._process.wait(timeout=3)
            except Exception:
                try:
                    self._process.kill()
                except Exception:
                    pass
            self._process = None
        self._is_running = False
        self._public_url = None

tunnel_service = CloudflareTunnelService()
