import os
from pathlib import Path
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.config import REPORT_DIR
from app.utils.logger import logger

class PDFReportGenerator:
    """Generates professional executive candidate evaluation PDF reports for Universal AI Interviewer."""

    @staticmethod
    def generate_interview_pdf(
        interview_data: Dict[str, Any],
        candidate_data: Dict[str, Any],
        report_data: Dict[str, Any],
        questions_eval_data: List[Dict[str, Any]],
        output_path: Any = None
    ) -> str:
        """Renders universal interview assessment into a downloadable PDF report file."""
        interview_id = interview_data.get("id", 1)
        if not output_path:
            filename = f"interview_assessment_{interview_id}.pdf"
            output_file = REPORT_DIR / filename
        else:
            output_file = Path(output_path)

        try:
            doc = SimpleDocTemplate(
                str(output_file),
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )
            story = []
            styles = getSampleStyleSheet()

            # Custom typography styles
            title_style = ParagraphStyle(
                'DocTitle',
                parent=styles['Heading1'],
                fontSize=20,
                leading=24,
                textColor=colors.HexColor("#1e293b"),
                fontName="Helvetica-Bold",
                alignment=0
            )
            subtitle_style = ParagraphStyle(
                'DocSubtitle',
                parent=styles['Normal'],
                fontSize=11,
                leading=15,
                textColor=colors.HexColor("#64748b"),
                fontName="Helvetica"
            )
            section_title = ParagraphStyle(
                'SectionTitle',
                parent=styles['Heading2'],
                fontSize=13,
                leading=17,
                textColor=colors.HexColor("#0f172a"),
                fontName="Helvetica-Bold",
                spaceBefore=10,
                spaceAfter=6
            )
            body_style = ParagraphStyle(
                'BodyTextCustom',
                parent=styles['Normal'],
                fontSize=9,
                leading=13,
                textColor=colors.HexColor("#334155")
            )
            bullet_style = ParagraphStyle(
                'BulletCustom',
                parent=styles['Normal'],
                fontSize=9,
                leading=13,
                textColor=colors.HexColor("#1e293b"),
                leftIndent=12
            )

            # 1. Header Banner
            story.append(Paragraph("UNIVERSAL AI INTERVIEWER", title_style))
            story.append(Paragraph("Official Candidate Assessment & Hiring Committee Report", subtitle_style))
            story.append(Spacer(1, 10))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#8b5cf6"), spaceAfter=12))

            # 2. Meta Information Grid
            c_name = candidate_data.get("full_name", "Candidate")
            c_email = candidate_data.get("email", "candidate@interviewer.ai")
            target_role = interview_data.get("target_role", "Software Engineer")
            domain = interview_data.get("domain", "Technology")
            mode = interview_data.get("mode", "Technical")
            cat = interview_data.get("category", "General")
            diff = interview_data.get("difficulty", "Medium")
            lang = interview_data.get("language", "English")
            exp = interview_data.get("experience_level", "Mid-Level")
            verdict = report_data.get("verdict", report_data.get("hiring_readiness", "Needs Improvement"))
            overall_score = report_data.get("overall_score", 0.0)

            # Verdict badge color
            if "STRONG HIRE" in verdict.upper():
                v_color = "#059669"
            elif "HIRE" in verdict.upper():
                v_color = "#10b981"
            elif "CONSIDER" in verdict.upper():
                v_color = "#3b82f6"
            elif "NEEDS IMPROVEMENT" in verdict.upper():
                v_color = "#f59e0b"
            else:
                v_color = "#ef4444"

            meta_data = [
                [
                    Paragraph(f"<b>Candidate:</b> {c_name}", body_style),
                    Paragraph(f"<b>Target Role:</b> {target_role}", body_style),
                    Paragraph(f"<b>Domain:</b> {domain}", body_style)
                ],
                [
                    Paragraph(f"<b>Experience:</b> {exp}", body_style),
                    Paragraph(f"<b>Interview Type:</b> {mode}", body_style),
                    Paragraph(f"<b>Difficulty:</b> {diff}", body_style)
                ],
                [
                    Paragraph(f"<b>Language:</b> {lang}", body_style),
                    Paragraph(f"<b>Overall Score:</b> <font color='#8b5cf6'><b>{overall_score}/100</b></font>", body_style),
                    Paragraph(f"<b>Recommendation:</b> <font color='{v_color}'><b>{verdict}</b></font>", body_style)
                ]
            ]
            meta_table = Table(meta_data, colWidths=[2.4 * inch, 2.6 * inch, 2.4 * inch])
            meta_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(meta_table)
            story.append(Spacer(1, 14))

            # 3. Executive Summary
            story.append(Paragraph("Executive Performance Summary", section_title))
            exec_summary = report_data.get("executive_summary", "Candidate successfully completed the structured universal interview.")
            story.append(Paragraph(exec_summary, body_style))
            story.append(Spacer(1, 12))

            # 4. Multi-Dimensional Competency Scores
            story.append(Paragraph("8-Dimensional Competency Assessment", section_title))
            score_data = [
                [
                    Paragraph("<b>Assessment Dimension</b>", body_style),
                    Paragraph("<b>Normalized Score (0 - 100)</b>", body_style),
                    Paragraph("<b>Readiness Level</b>", body_style)
                ],
                [
                    Paragraph("Technical & Domain Knowledge", body_style),
                    Paragraph(f"{report_data.get('technical_score', 0.0):.1f} / 100", body_style),
                    Paragraph("Proficient" if report_data.get('technical_score', 0.0) >= 70 else "Developing", body_style)
                ],
                [
                    Paragraph("Problem Solving & Trade-offs", body_style),
                    Paragraph(f"{report_data.get('problem_solving_score', 0.0):.1f} / 100", body_style),
                    Paragraph("Proficient" if report_data.get('problem_solving_score', 0.0) >= 70 else "Developing", body_style)
                ],
                [
                    Paragraph("Verbal Communication & Structure", body_style),
                    Paragraph(f"{report_data.get('communication_score', 0.0):.1f} / 100", body_style),
                    Paragraph("Strong" if report_data.get('communication_score', 0.0) >= 70 else "Needs Practice", body_style)
                ],
                [
                    Paragraph("Delivery Confidence & Clarity", body_style),
                    Paragraph(f"{report_data.get('confidence_score', 0.0):.1f} / 100", body_style),
                    Paragraph("Strong" if report_data.get('confidence_score', 0.0) >= 70 else "Developing", body_style)
                ]
            ]
            score_table = Table(score_data, colWidths=[3.2 * inch, 2.2 * inch, 2.0 * inch])
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#ede9fe")),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('TOPPADDING', (0, 0), (-1, 0), 6),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(score_table)
            story.append(Spacer(1, 14))

            # 5. Strengths & Weaknesses Split
            story.append(Paragraph("Identified Strengths & Improvement Areas", section_title))
            strengths = report_data.get("strengths", [])
            weaknesses = report_data.get("weaknesses", [])
            technical_gaps = report_data.get("technical_gaps", report_data.get("skill_gaps", []))

            str_para = "<br/>".join([f"• {s}" for s in strengths]) if strengths else "• Engaged actively across questions."
            weak_para = "<br/>".join([f"• {w}" for w in weaknesses]) if weaknesses else "• Could provide deeper edge case analysis."
            gap_para = "<br/>".join([f"• {g}" for g in technical_gaps]) if technical_gaps else "• Advanced architectural patterns."

            grid_data = [
                [
                    Paragraph("<b>Key Strengths</b>", ParagraphStyle('G1', parent=body_style, textColor=colors.HexColor("#047857"))),
                    Paragraph("<b>Areas for Improvement</b>", ParagraphStyle('G2', parent=body_style, textColor=colors.HexColor("#b45309"))),
                    Paragraph("<b>Technical Gaps</b>", ParagraphStyle('G3', parent=body_style, textColor=colors.HexColor("#b91c1c")))
                ],
                [
                    Paragraph(str_para, body_style),
                    Paragraph(weak_para, body_style),
                    Paragraph(gap_para, body_style)
                ]
            ]
            grid_table = Table(grid_data, colWidths=[2.5 * inch, 2.5 * inch, 2.4 * inch])
            grid_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(grid_table)
            story.append(Spacer(1, 14))

            # 6. Communication Feedback
            comm_fb = report_data.get("communication_feedback")
            if comm_fb:
                story.append(Paragraph("Communication Articulation Feedback", section_title))
                story.append(Paragraph(comm_fb, body_style))
                story.append(Spacer(1, 12))

            # 7. Actionable Recommendations
            recs = report_data.get("recommendations", [])
            if recs:
                story.append(Paragraph("Actionable Recommendations", section_title))
                for r in recs:
                    story.append(Paragraph(f"• {r}", bullet_style))
                story.append(Spacer(1, 14))

            # 8. Question-by-Question Breakdown
            if questions_eval_data:
                story.append(KeepTogether([
                    Paragraph("Question-by-Question Turn Evaluation", section_title),
                    Spacer(1, 6)
                ]))
                for i, q in enumerate(questions_eval_data):
                    q_num = i + 1
                    q_text = q.get("question_text", f"Question {q_num}")
                    ans_text = q.get("answer_text", "")
                    q_score = q.get("score", 0.0)
                    fb = q.get("feedback", "Good participation.")

                    q_box = [
                        [Paragraph(f"<b>Q{q_num}: {q_text}</b>", ParagraphStyle('QB', parent=body_style, fontName="Helvetica-Bold"))],
                        [Paragraph(f"<b>Candidate Answer:</b> {ans_text[:300]}{'...' if len(ans_text) > 300 else ''}", body_style)],
                        [Paragraph(f"<b>Score:</b> {q_score:.1f}/100 | <b>Evaluation:</b> {fb}", body_style)]
                    ]
                    q_table = Table(q_box, colWidths=[7.4 * inch])
                    q_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ('TOPPADDING', (0, 0), (-1, -1), 4),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                        ('LEFTPADDING', (0, 0), (-1, -1), 6),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                    ]))
                    story.append(q_table)
                    story.append(Spacer(1, 8))

            doc.build(story)
            logger.info(f"Generated Universal AI Interviewer PDF report: {output_file}")
            return f"/api/interview/report/{interview_id}/download-pdf"

        except Exception as e:
            logger.error(f"Failed to generate universal PDF assessment: {e}")
            return ""

    @classmethod
    def generate_report_pdf(cls, report: Any, output_path: str = None) -> str:
        """Helper to generate PDF from an InterviewReport model instance."""
        interview_data = {
            "id": getattr(report, "interview_id", 1),
            "target_role": getattr(report, "target_role", "Software Engineer"),
            "domain": getattr(report, "domain", "Technology"),
            "difficulty": getattr(report, "difficulty", "Medium")
        }
        candidate_data = {
            "name": getattr(report, "candidate_name", "Candidate"),
            "target_role": getattr(report, "target_role", "Software Engineer"),
            "experience_level": getattr(report, "experience_level", "Mid-Level")
        }
        report_data = {
            "overall_score": getattr(report, "overall_score", 0.0),
            "technical_score": getattr(report, "technical_score", 0.0),
            "communication_score": getattr(report, "communication_score", 0.0),
            "problem_solving_score": getattr(report, "problem_solving_score", 0.0),
            "confidence_score": getattr(report, "confidence_score", 0.0),
            "verdict": getattr(report, "verdict", "Needs Improvement"),
            "executive_summary": getattr(report, "executive_summary", ""),
            "strengths": getattr(report, "strengths", []),
            "weaknesses": getattr(report, "weaknesses", []),
            "technical_gaps": getattr(report, "technical_gaps", []),
            "recommendations": getattr(report, "recommendations", []),
            "communication_feedback": getattr(report, "communication_feedback", "")
        }
        questions_eval_data = getattr(report, "question_breakdown", []) or []
        return cls.generate_interview_pdf(interview_data, candidate_data, report_data, questions_eval_data, output_path=output_path)
