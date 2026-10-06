import os
import json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
load_dotenv()

from app.services.ai.gemini_provider import GeminiAIProvider
from app.config import settings

def test_live_gemini():
    api_key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL or "gemini-2.5-flash"
    
    if not api_key:
        print("RESULT: KEY_MISSING")
        return

    provider = GeminiAIProvider(api_key=api_key, model_name=model)
    
    # 1. Connection & Question Generation
    print("--- 1. Testing Live Question Generation ---")
    plan_prompt = """
    Generate 1 interview question for:
    Role: Software Engineer
    Difficulty: Medium
    Category: Data Structures & Algorithms
    
    Return JSON:
    {
      "questions": [
        {
          "order_index": 1,
          "question_text": "...",
          "category": "Data Structures & Algorithms",
          "difficulty": "Medium",
          "expected_concepts": ["concept1", "concept2"]
        }
      ]
    }
    """
    res1 = provider._call_gemini(plan_prompt, "You are a technical interviewer.")
    print("Q_GEN_RESULT:", json.dumps(res1, indent=2) if res1 else "FAIL")
    has_q = bool(res1 and isinstance(res1, dict) and "questions" in res1 and len(res1["questions"]) > 0)
    
    # 2. Adaptive Follow-Up Question
    print("\n--- 2. Testing Live Follow-up Generation ---")
    follow_prompt = """
    Original Question: "Explain how a Hash Map handles collisions."
    Candidate Answer: "It uses chaining."
    
    Return JSON:
    {
      "should_follow_up": true,
      "question_text": "...",
      "reason": "..."
    }
    """
    res2 = provider._call_gemini(follow_prompt, "You are a technical interviewer.")
    print("FOLLOW_UP_RESULT:", json.dumps(res2, indent=2) if res2 else "FAIL")
    has_follow = bool(res2 and isinstance(res2, dict) and res2.get("should_follow_up") and res2.get("question_text"))
    
    # 3. Candidate Answer Evaluation
    print("\n--- 3. Testing Live Answer Evaluation ---")
    eval_prompt = """
    Question: "Explain the difference between an Array and a Linked List."
    Expected Concepts: ["contiguous memory", "pointer traversal", "indexing time complexity"]
    Candidate Answer: "Arrays allocate contiguous blocks of memory allowing O(1) index lookups, whereas linked lists use pointers between dynamically allocated nodes which require O(n) traversal."
    
    Return JSON:
    {
      "score": 92.0,
      "relevance_score": 95.0,
      "correctness_score": 90.0,
      "depth_score": 90.0,
      "clarity_score": 95.0,
      "completeness_score": 90.0,
      "confidence_score": 90.0,
      "feedback": "...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "missing_concepts": [],
      "suggestions": ["..."]
    }
    """
    res3 = provider._call_gemini(eval_prompt, "You are an AI assessment evaluator.")
    print("EVAL_RESULT:", json.dumps(res3, indent=2) if res3 else "FAIL")
    has_eval = bool(res3 and isinstance(res3, dict) and "score" in res3 and "relevance_score" in res3)
    
    # 4. Final Assessment Synthesis
    print("\n--- 4. Testing Live Final Assessment Synthesis ---")
    report_prompt = """
    Synthesize assessment:
    Candidate: Alex Chen
    Role: Software Engineer
    Turn Evaluations: [{"score": 92.0, "feedback": "Solid answer on array vs linked list."}]
    
    Return JSON:
    {
      "overall_score": 92.0,
      "technical_score": 92.0,
      "communication_score": 90.0,
      "problem_solving_score": 90.0,
      "confidence_score": 90.0,
      "verdict": "Strong Hire",
      "executive_summary": "...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "skill_gaps": [],
      "recommendations": ["..."]
    }
    """
    res4 = provider._call_gemini(report_prompt, "You are a hiring director.")
    print("REPORT_RESULT:", json.dumps(res4, indent=2) if res4 else "FAIL")
    has_report = bool(res4 and isinstance(res4, dict) and "verdict" in res4 and "overall_score" in res4)

    print("\n================== SUMMARY ==================")
    print("ALL_SUCCESS:", has_q and has_follow and has_eval and has_report)

if __name__ == "__main__":
    test_live_gemini()
