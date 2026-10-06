import pytest
from app.services.resume_service import ResumeParserService

SAMPLE_RESUME_TEXT = """
Alex Chen
Email: alex.chen@example.com | GitHub: github.com/alexchen
Education:
Bachelor of Technology in Computer Science and Engineering, 2024
Technical Skills:
Programming Languages: Python, Java, JavaScript, TypeScript, SQL, C++
Frameworks & Libraries: React, FastAPI, Node.js, Docker, PyTorch, Tailwind CSS
Databases: PostgreSQL, MongoDB, Redis
Core Concepts: Data Structures & Algorithms, Object-Oriented Programming, Operating Systems

Projects:
AI Threat Detection System: Built a neural intrusion detection model using PyTorch and FastAPI.
Distributed Task Queue: Implemented asynchronous worker queue with Redis and Docker.
"""

def test_resume_nlp_analysis():
    analysis = ResumeParserService.analyze_resume(SAMPLE_RESUME_TEXT, "alex_resume.pdf")
    skills = analysis.get("skills", [])
    
    assert "Python" in skills
    assert "React" in skills
    assert "FastAPI" in skills
    assert "PostgreSQL" in skills
    assert "Docker" in skills
    assert len(skills) >= 5

    assert len(analysis.get("projects", [])) >= 1
    assert "Frontend & Fullstack Development" in analysis.get("suggested_domains", [])
