import json
import httpx
from typing import Dict, Any, List, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.fallback_provider import FallbackAIProvider
from app.utils.logger import logger

class OpenAIProvider(BaseAIProvider):
    """OpenAI compatible AI Provider for ChatGPT and local/remote LLM endpoints."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url
        self.fallback = FallbackAIProvider()

    def _call_openai_json(self, messages: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
        if not self.api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)
                else:
                    logger.warning(f"OpenAI API returned {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            return None

    def generate_interview_plan(
        self,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        total_questions: int,
        skills: List[str],
        projects: List[Dict[str, Any]],
        experience_level: str
    ) -> List[Dict[str, Any]]:
        messages = [
            {"role": "system", "content": "You are an expert technical and HR interviewer."},
            {"role": "user", "content": f"""Generate {total_questions} questions for {target_role} ({difficulty}, {mode}, {category}). Skills: {skills}. Return JSON {{"questions": [...]}}"""}
        ]
        result = self._call_openai_json(messages)
        if result and "questions" in result:
            return result["questions"]
        return self.fallback.generate_interview_plan(
            target_role, mode, category, difficulty, total_questions, skills, projects, experience_level
        )

    def generate_follow_up_question(
        self,
        original_question: str,
        candidate_answer: str,
        category: str,
        difficulty: str
    ) -> Optional[Dict[str, Any]]:
        messages = [
            {"role": "system", "content": "Determine if candidate's answer requires a follow up. Return JSON."},
            {"role": "user", "content": f"Question: {original_question}\nAnswer: {candidate_answer}"}
        ]
        result = self._call_openai_json(messages)
        if result and result.get("should_follow_up") and result.get("question_text"):
            return {
                "question_text": result["question_text"],
                "is_follow_up": True,
                "reason": result.get("reason", "Probing answer depth")
            }
        return self.fallback.generate_follow_up_question(original_question, candidate_answer, category, difficulty)

    def evaluate_answer(
        self,
        question_text: str,
        candidate_answer: str,
        expected_concepts: List[str],
        category: str,
        difficulty: str
    ) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": "Evaluate candidate response across 6 dimensions. Return JSON format."},
            {"role": "user", "content": f"Question: {question_text}\nAnswer: {candidate_answer}\nExpected: {expected_concepts}"}
        ]
        result = self._call_openai_json(messages)
        if result and "score" in result:
            return result
        return self.fallback.evaluate_answer(question_text, candidate_answer, expected_concepts, category, difficulty)

    def synthesize_final_report(
        self,
        candidate_name: str,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": "Synthesize full interview assessment report. Return JSON format."},
            {"role": "user", "content": f"Candidate: {candidate_name}\nEvaluations: {json.dumps(evaluations)}"}
        ]
        result = self._call_openai_json(messages)
        if result and "verdict" in result:
            return result
        return self.fallback.synthesize_final_report(
            candidate_name, target_role, mode, category, difficulty, evaluations
        )
