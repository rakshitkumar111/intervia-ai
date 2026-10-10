import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
import datetime
from app.config import settings
from app.utils.logger import logger

class EmailService:
    """
    Standard SMTP email dispatch gateway.
    Supports secure SSL (port 465) and STARTTLS (port 587) delivery.
    Sends responsive, high-deliverability HTML + plain-text invitation emails.
    """

    @staticmethod
    def is_configured() -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    @classmethod
    def send_interview_invitation(
        cls,
        candidate_name: str,
        candidate_email: str,
        target_role: str,
        mode: str,
        difficulty: str,
        total_questions: int,
        expires_at: datetime.datetime,
        interview_url: str,
        recruiter_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches an official AI Virtual Interviewer invitation to the candidate.
        """
        if not cls.is_configured():
            msg = (
                "SMTP server is not configured in backend/.env. "
                "Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD "
                "(e.g., for Gmail SMTP: smtp.gmail.com with an App Password)."
            )
            logger.warning(f"Email dispatch skipped: {msg}")
            return {
                "success": False,
                "error": msg,
                "email_status": "failed"
            }

        expiry_str = (
            expires_at.strftime("%B %d, %Y at %I:%M %p UTC")
            if isinstance(expires_at, datetime.datetime)
            else str(expires_at)
        )
        sender_header = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        subject = f"Interview Invitation – {target_role}"
        org_name = recruiter_name or "AI Virtual Interviewer Team"

        # Plain text fallback
        text_body = f"""Hello {candidate_name},

You have been invited by {org_name} to complete an AI-powered technical interview for the position of {target_role}.

Interview Details:
- Target Role: {target_role}
- Mode: {mode}
- Difficulty: {difficulty}
- Questions: {total_questions} Questions
- Expiry Date: {expiry_str}

Start your interview (no login required):
{interview_url}

Important Instructions:
1. Ensure you have a working camera and microphone ready.
2. Complete the session in a quiet, well-lit room.
3. The assessment is proctored with AI evaluation.

Best regards,
{org_name}
AI Virtual Interviewer Platform
"""

        # Responsive modern HTML email
        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: -0.5px; font-weight: 800;">
        AI Virtual Interviewer
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff; font-weight: 500;">
        Candidate Assessment Invitation
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 28px;">
      <div style="font-size: 16px; font-weight: 600; color: #f8fafc; margin-bottom: 12px;">
        Hello {candidate_name},
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
        You have been officially invited by <strong>{org_name}</strong> to complete an AI-powered assessment for the position of <strong style="color: #c084fc;">{target_role}</strong>.
      </div>

      <!-- Details Table -->
      <div style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8; padding: 8px 0; font-weight: 500;">Target Role</td>
            <td align="right" style="color: #a855f7; padding: 8px 0; font-weight: 700;">{target_role}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8; padding: 8px 0; font-weight: 500;">Interview Mode</td>
            <td align="right" style="color: #f8fafc; padding: 8px 0; font-weight: 600;">{mode}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8; padding: 8px 0; font-weight: 500;">Difficulty</td>
            <td align="right" style="color: #f8fafc; padding: 8px 0; font-weight: 600;">{difficulty}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8; padding: 8px 0; font-weight: 500;">Total Questions</td>
            <td align="right" style="color: #f8fafc; padding: 8px 0; font-weight: 600;">{total_questions} Questions</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 8px 0; font-weight: 500;">Valid Until</td>
            <td align="right" style="color: #f59e0b; padding: 8px 0; font-weight: 700;">{expiry_str}</td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{interview_url}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 40px; border-radius: 10px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4); text-align: center;" target="_blank">
          Start Interview Now &rarr;
        </a>
      </div>

      <!-- Fallback URL -->
      <div style="font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 20px; line-height: 1.5; text-align: center;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="{interview_url}" style="color: #a78bfa; text-decoration: underline;" target="_blank">{interview_url}</a>
      </div>

      <!-- Guidelines Box -->
      <div style="background-color: rgba(124, 58, 237, 0.08); border-left: 4px solid #7c3aed; padding: 14px 16px; border-radius: 6px; font-size: 12px; color: #cbd5e1; margin-top: 28px; line-height: 1.6;">
        <strong style="color: #f8fafc;">Before you start:</strong>
        <ul style="margin: 6px 0 0 16px; padding: 0;">
          <li>No prior account or password required — session is validated automatically.</li>
          <li>Ensure your webcam and microphone are enabled for AI voice and proctoring.</li>
          <li>Find a quiet place with stable internet for the duration of the interview.</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #030712; border-top: 1px solid #1e293b; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b;">
      Sent via <strong>AI Virtual Interviewer Platform</strong> on behalf of {org_name}.<br>
      Automated assessment notification &bull; Please do not reply directly to this email.
    </div>

  </div>
</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_header
        msg["To"] = candidate_email
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        return cls._dispatch_mime(candidate_email, msg, context="Interview invitation")

    @classmethod
    def _dispatch_mime(cls, to_email: str, msg: MIMEMultipart, context: str = "Email") -> Dict[str, Any]:
        """Dispatches MIME message with automatic STARTTLS and SSL fallback."""
        def _send(use_ssl: bool, port: int):
            if use_ssl:
                srv = smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=25)
            else:
                srv = smtplib.SMTP(settings.SMTP_HOST, port, timeout=25)
                srv.ehlo()
                if settings.SMTP_USE_TLS:
                    srv.starttls()
                    srv.ehlo()

            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

            srv.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            try:
                srv.quit()
            except Exception:
                pass

        try:
            _send(settings.SMTP_USE_SSL, settings.SMTP_PORT)
            logger.info(f"{context} dispatched successfully to {to_email}")
            return {"success": True, "email_status": "sent"}
        except Exception as first_err:
            logger.warning(f"Initial SMTP delivery failed for {to_email} ({first_err}), attempting SSL fallback...")
            try:
                _send(use_ssl=True, port=465)
                logger.info(f"{context} dispatched via SSL fallback to {to_email}")
                return {"success": True, "email_status": "sent"}
            except Exception as e:
                logger.error(f"Failed to deliver {context} to {to_email}: {e}")
                return {
                    "success": False,
                    "error": f"SMTP Delivery Error: {str(e)}",
                    "email_status": "failed"
                }

    @classmethod
    def send_interview_completion_notification(
        cls,
        recruiter_email: str,
        candidate_name: str,
        target_role: str,
        overall_score: float,
        verdict: str,
        interview_id: int,
        report_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dispatches an assessment completion notification to the recruiter."""
        if not cls.is_configured():
            logger.warning("Email dispatch skipped: SMTP not configured.")
            return {"success": False, "error": "SMTP not configured", "email_status": "skipped"}

        sender_header = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        subject = f"Interview Completed: {candidate_name} – {target_role} ({overall_score}/100)"
        view_url = report_url or f"{settings.PUBLIC_FRONTEND_URL}/report/{interview_id}"

        text_body = f"""Hello,

Candidate {candidate_name} has just completed their AI-evaluated interview session.

Assessment Summary:
- Candidate: {candidate_name}
- Target Role: {target_role}
- Overall Score: {overall_score}/100
- Hiring Committee Verdict: {verdict}
- Interview ID: #{interview_id}

View Full Report:
{view_url}

Best regards,
AI Virtual Interviewer Platform
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 800;">
        Assessment Completed
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #ccfbf1; font-weight: 500;">
        Candidate Interview Finished & Evaluated
      </p>
    </div>
    <div style="padding: 32px 28px;">
      <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 20px;">
        Candidate <strong>{candidate_name}</strong> has completed the interview for <strong style="color: #34d399;">{target_role}</strong>.
      </p>
      <div style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8;">Candidate Name</td>
            <td align="right" style="color: #f8fafc; font-weight: 600;">{candidate_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8;">Target Role</td>
            <td align="right" style="color: #34d399; font-weight: 600;">{target_role}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="color: #94a3b8;">Overall Composite Score</td>
            <td align="right" style="color: #38bdf8; font-weight: 700; font-size: 15px;">{overall_score}/100</td>
          </tr>
          <tr>
            <td style="color: #94a3b8;">AI Committee Verdict</td>
            <td align="right" style="color: #a855f7; font-weight: 700;">{verdict}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{view_url}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.4);">
          View Full Evaluation Report &rarr;
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
        AI Virtual Interviewer Platform &bull; Automated Recruiter Dispatch
      </p>
    </div>
  </div>
</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_header
        msg["To"] = recruiter_email
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        return cls._dispatch_mime(recruiter_email, msg, context="Interview completion notification")

email_service = EmailService()
