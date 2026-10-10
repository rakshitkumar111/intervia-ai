import json
import re
import time
import httpx
from typing import Dict, Any, List, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.fallback_provider import FallbackAIProvider
from app.config import settings
from app.utils.logger import logger

def calculate_text_similarity(s1: str, s2: str) -> float:
    """Calculates word-level Jaccard similarity between two question strings."""
    tokens1 = set(re.findall(r'\w+', s1.lower()))
    tokens2 = set(re.findall(r'\w+', s2.lower()))
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

class GeminiAIProvider(BaseAIProvider):
    """Production-grade Universal AI Interviewer Provider powered by Google Gemini (Flash 3.5)."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        # Allow injection of API key and model name for testing; fallback to settings if not provided
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        self.fallback = FallbackAIProvider()

    def _clean_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        """Strips markdown code fences and parses pure JSON."""
        try:
            cleaned = re.sub(r"^```json\s*", "", text, flags=re.MULTILINE)
            cleaned = re.sub(r"^```\s*", "", cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Failed to parse Gemini JSON response: {e}. Raw content: {text[:200]}...")
            return None

    def _call_gemini(self, prompt: str, system_instruction: Optional[str] = None, temperature: float = 0.6) -> Optional[Dict[str, Any]]:
        """Executes raw HTTP request to Gemini REST API with fast failover on quota limits."""
        if not self.api_key:
            logger.warning("Gemini API key is not configured. Falling back to local AI engine.")
            return None

        url = f"{self.endpoint}?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "topP": 0.95,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json"
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        max_retries = 0
        for attempt in range(max_retries + 1):
            try:
                # If we are in cooldown period due to recent failures, fast-fail to fallback
                if getattr(self, "_cooldown_until", 0) > time.time():
                    logger.warning("Gemini provider in cooldown; skipping API call.")
                    return None
                with httpx.Client(timeout=15.0) as client:
                    response = client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            content = candidates[0].get("content", {})
                            parts = content.get("parts", [])
                            if parts:
                                raw_text = "".join(p.get("text", "") for p in parts if "text" in p)
                                parsed = self._clean_json_response(raw_text)
                                if parsed is not None:
                                    return parsed
                    elif response.status_code == 429:
                        logger.warning("Gemini API Free-Tier Quota Limit (429). Fast-failing to Universal Fallback Engine.")
                        # Activate cooldown to avoid rapid repeated failures
                        self._cooldown_until = time.time() + 60.0
                        return None
                    else:
                        error_msg = f"Gemini API returned HTTP {response.status_code}: {response.text}"
                        logger.warning(f"{error_msg}. Fast-failing to fallback engine.")
                        if settings.STRICT_AI_MODE:
                            raise RuntimeError(f"Gemini API Error: {error_msg}")
                        return None

            except httpx.TimeoutException:
                logger.warning("Gemini API request timed out (15.0s). Fast-failing to Universal Fallback Engine.")
                if settings.STRICT_AI_MODE:
                    raise RuntimeError("Gemini API request timed out after 15 seconds.")
                return None
            except Exception as e:
                logger.warning(f"Gemini API invocation error: {e}. Fast-failing to fallback engine.")
                if settings.STRICT_AI_MODE:
                    raise
                return None

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
        experience_level: str,
        domain: Optional[str] = "Technology",
        company_name: Optional[str] = None,
        language: Optional[str] = "English",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        system_instruction = (
            f"You are Dr. Sarah Mitchell, a senior interviewer and executive hiring director. "
            f"You are conducting a professional universal interview for the position of '{target_role}' in the '{domain}' domain"
            + (f" at {company_name}" if company_name else "") + ". "
            f"Your language of interaction must be strictly {language}."
        )

        language_guideline = ""
        if language == "Hindi":
            language_guideline = "LANGUAGE RULE: Output all questions and concepts strictly in natural, professional Hindi (Devanagari script)."
        elif language == "Hinglish":
            language_guideline = "LANGUAGE RULE: Output all questions in natural Indian conversational Hinglish (Roman script Hindi-English mix, retaining standard technical terms in English)."
        else:
            language_guideline = "LANGUAGE RULE: Output all questions in clear, professional conversational English."

        prompt = f"""
        Generate a list of exactly {total_questions} structured interview questions for this candidate profile:
        - Candidate Name: {candidate_name or 'Candidate'}
        - Target Role: {target_role}
        - Domain / Industry: {domain}
        - Target Company: {company_name or 'Industry Leader'}
        - Interview Mode / Type: {mode} (e.g. HR, Technical, Behavioral, Situational, Case Study, Coding, Domain Specific, Mixed)
        - Focus Category: {category}
        - Difficulty Level: {difficulty} (Easy, Medium, Hard, Expert)
        - Experience Level: {experience_level} (Fresher, Internship, Junior, Mid-Level, Senior, Lead / Manager)
        - Language: {language}
        - Extracted Skills: {', '.join(skills) if skills else 'Relevant to ' + target_role}
        - Projects / Background: {json.dumps(projects) if projects else '[]'}
        - Job Description (JD): {job_description or 'Standard industry expectations for ' + target_role}

        {language_guideline}

        REQUIREMENTS:
        1. Adapt questions precisely to the candidate's exact role ({target_role}) and domain ({domain}).
           - If Tech (e.g. Software/Data): architecture, coding concepts, frameworks, trade-offs.
           - If Business/Product/HR/Sales: metrics, stakeholder management, conflict resolution, strategy, situational cases.
           - If Finance/Engineering/Healthcare: industry regulations, formulas, methodologies, safety/standards.
           - If Fresher/Campus: academic projects, foundational fundamentals, willingness to learn.
           - If Senior/Lead: system scalability, team leadership, architectural governance, budget/strategy.
        2. Make Question 1 a welcoming, professional introductory question tailored to the role.
        3. For each question provide 3-5 expected domain concepts and 2 evaluation criteria.

        Return strictly a JSON object:
        {{
          "questions": [
            {{
              "order_index": 1,
              "question_number": 1,
              "question_text": "Spoken question text in {language}",
              "question_type": "conceptual" | "scenario" | "behavioral" | "case_study" | "resume_deep_dive",
              "category": "{category}",
              "difficulty": "{difficulty}",
              "expected_concepts": ["concept 1", "concept 2", "concept 3"],
              "evaluation_criteria": ["criteria 1", "criteria 2"]
            }}
          ]
        }}
        """

        result = self._call_gemini(prompt, system_instruction)
        if result and isinstance(result, dict) and "questions" in result and isinstance(result["questions"], list):
            logger.info(f"Generated {len(result['questions'])} universal interview questions via Gemini for role={target_role}, lang={language}")
            return result["questions"]

        if settings.STRICT_AI_MODE:
            raise RuntimeError("Gemini AI failed to return structured questions in strict mode.")

        logger.warning("[Development Fallback]: Using Universal Fallback for interview plan.")
        return self.fallback.generate_interview_plan(
            target_role, mode, category, difficulty, total_questions, skills, projects, experience_level,
            domain, company_name, language, job_description, candidate_name
        )

    def generate_follow_up_question(
        self,
        original_question: str,
        candidate_answer: str,
        category: str,
        difficulty: str,
        language: Optional[str] = "English"
    ) -> Optional[Dict[str, Any]]:
        system_instruction = (
            f"You are Dr. Sarah Mitchell, universal AI interviewer. Analyze candidate answers in real-time. "
            f"Formulate a sharp, adaptive follow-up question in {language} if the answer warrants deeper probing."
        )

        prompt = f"""
        Original Question: "{original_question}"
        Candidate's Response: "{candidate_answer}"
        Category: {category}
        Difficulty: {difficulty}
        Language: {language}

        Determine if a dynamic follow-up is warranted to probe deeper into trade-offs, root causes, methodology, or ambiguity.
        
        Return strictly a JSON object:
        {{
          "should_follow_up": true | false,
          "question_text": "Follow-up question in {language} if should_follow_up is true, else null",
          "reason": "Brief reason for follow-up"
        }}
        """

        result = self._call_gemini(prompt, system_instruction)
        if result and isinstance(result, dict) and result.get("should_follow_up") and result.get("question_text"):
            logger.info(f"Generated dynamic follow-up question via Gemini: {result['question_text']}")
            return {
                "question_text": result["question_text"],
                "is_follow_up": True,
                "reason": result.get("reason", "Probing technical/domain depth")
            }

        return self.fallback.generate_follow_up_question(original_question, candidate_answer, category, difficulty, language)

    def generate_next_adaptive_question(
        self,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        previous_question: str,
        previous_answer: str,
        previous_evaluation: Optional[Dict[str, Any]],
        asked_questions: List[str],
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        system_instruction = (
            f"You are Dr. Sarah Mitchell, senior universal interviewer for '{target_role}' in the '{domain}' domain. "
            f"Your language of interaction must be strictly {language}. "
            f"CRITICAL: You must NEVER repeat, semantically duplicate, or closely rephrase any question already asked."
        )

        asked_formatted = "\n".join([f"- {q}" for q in asked_questions if q.strip()]) if asked_questions else "(None yet)"
        prev_score = previous_evaluation.get("score") if previous_evaluation else "N/A"

        language_guideline = ""
        if language == "Hindi":
            language_guideline = "LANGUAGE RULE: Output strictly in natural, professional Hindi (Devanagari script)."
        elif language == "Hinglish":
            language_guideline = "LANGUAGE RULE: Output strictly in natural Indian conversational Hinglish (Roman script Hindi-English mix, retaining English technical terms)."
        else:
            language_guideline = "LANGUAGE RULE: Output strictly in clear, professional English."

        prompt = f"""
        Generate the NEXT adaptive, unique interview question:
        - Target Role: {target_role}
        - Domain: {domain}
        - Experience Level: {experience_level}
        - Interview Mode / Type: {mode}
        - Focus Category: {category}
        - Difficulty Level: {difficulty}
        - Language: {language}
        - Previous Question Asked: "{previous_question}"
        - Candidate's Previous Answer: "{previous_answer}"
        - Candidate's Previous Score: {prev_score}/100

        CRITICAL ANTI-REPETITION CONSTRAINT:
        Do NOT ask or rephrase any question from this list of ALREADY ASKED questions:
        {asked_formatted}

        ADAPTIVE CRITERIA:
        - If candidate gave a strong answer (> 75/100): Escalate question difficulty, ask about complex edge cases, leadership, or high-stakes trade-offs.
        - If candidate struggled (< 50/100): Pivot to an adjacent foundational question or practical scenario to assess baseline competency.
        - If candidate gave an incomplete answer: Probe a specific nuance of their answer.

        {language_guideline}

        Return strictly a JSON object:
        {{
          "question_text": "Spoken question text in {language}",
          "question_type": "conceptual" | "scenario" | "case_study" | "behavioral" | "coding",
          "category": "{category}",
          "difficulty": "{difficulty}",
          "expected_concepts": ["concept 1", "concept 2", "concept 3"],
          "evaluation_criteria": ["criteria 1", "criteria 2"]
        }}
        """

        result = self._call_gemini(prompt, system_instruction)
        if result and isinstance(result, dict) and result.get("question_text"):
            new_text = result["question_text"]
            
            # Strict Anti-Repetition Check
            is_dup = False
            for aq in asked_questions:
                similarity = calculate_text_similarity(new_text, aq)
                if similarity > 0.65 or new_text.strip().lower() == aq.strip().lower():
                    is_dup = True
                    logger.warning(f"Gemini generated semantically duplicate question (similarity={similarity:.2f}). Rejecting: '{new_text[:50]}'")
                    break
            
            if not is_dup:
                logger.info(f"Generated adaptive next question via Gemini API: {new_text[:70]}...")
                return result

        if settings.STRICT_AI_MODE and result is not None and not is_dup:
            raise RuntimeError("Gemini AI failed to generate unique next question.")

        return self.fallback.generate_next_adaptive_question(
            target_role, mode, category, difficulty, previous_question, previous_answer, previous_evaluation,
            asked_questions, domain, experience_level, language, job_description, candidate_name, conversation_history
        )

    def evaluate_answer(
        self,
        question_text: str,
        candidate_answer: str,
        expected_concepts: List[str],
        category: str,
        difficulty: str,
        target_role: Optional[str] = "Candidate",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        system_instruction = (
            f"You are a rigorous 8-dimensional universal AI interviewer evaluator assessing responses for a '{target_role}' candidate. "
            f"Score each dimension accurately on a 0.0 to 10.0 scale and calculate the normalized composite score (0.0 to 100.0)."
        )

        prompt = f"""
        Evaluate the candidate's spoken response:
        - Target Role: {target_role}
        - Domain Category: {category}
        - Target Difficulty: {difficulty}
        - Language: {language}
        - Interview Question: "{question_text}"
        - Expected Concepts / Rubric: {json.dumps(expected_concepts)}
        - Candidate's Spoken Answer: "{candidate_answer}"

        Score the response across 8 Core Dimensions (0.0 to 10.0 each):
        1. technical_score: Domain Knowledge, Accuracy & Concepts (0.0 - 10.0)
        2. correctness_score: Factual correctness and logical soundness (0.0 - 10.0)
        3. relevance_score: Direct responsiveness to the question without evasive fluff (0.0 - 10.0)
        4. problem_solving_score: Analytical thinking, structure, trade-offs (0.0 - 10.0)
        5. communication_score: Articulation, conciseness, vocabulary (0.0 - 10.0)
        6. depth_score: Nuance, internal mechanisms, technical depth (0.0 - 10.0)
        7. practical_score: Real-world examples, past project application (0.0 - 10.0)
        8. confidence_score: Fluency, tone, decisiveness (0.0 - 10.0)

        Composite Score Calculation:
        - score = Average of all 8 dimension scores multiplied by 10 (0.0 to 100.0).

        Return strictly a JSON object:
        {{
          "technical_score": float,
          "correctness_score": float,
          "relevance_score": float,
          "problem_solving_score": float,
          "communication_score": float,
          "depth_score": float,
          "practical_score": float,
          "confidence_score": float,
          "score": float,
          "feedback": "2-3 sentences concise professional evaluation",
          "strengths": ["specific strength 1", "specific strength 2"],
          "weaknesses": ["specific weakness 1"],
          "missing_concepts": ["concept not covered"],
          "suggestions": ["actionable improvement 1", "actionable improvement 2"]
        }}
        """

        result = self._call_gemini(prompt, system_instruction)
        if result and isinstance(result, dict) and "score" in result:
            if "clarity_score" not in result:
                result["clarity_score"] = result.get("communication_score", result.get("score", 75.0))
            if "completeness_score" not in result:
                result["completeness_score"] = result.get("depth_score", result.get("score", 75.0))
            logger.info(f"Evaluated answer via Gemini API: Score={result.get('score')}/100 for role={target_role}")
            return result

        if settings.STRICT_AI_MODE:
            raise RuntimeError("Gemini AI failed to evaluate answer in strict mode.")

        logger.warning("[Development Fallback]: Evaluating answer via Universal Fallback.")
        return self.fallback.evaluate_answer(question_text, candidate_answer, expected_concepts, category, difficulty, target_role, language)

    def synthesize_final_report(
        self,
        candidate_name: str,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        evaluations: List[Dict[str, Any]],
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        system_instruction = (
            "You are an executive hiring committee director synthesizing the official candidate assessment and hiring readiness decision."
        )

        prompt = f"""
        Synthesize the final executive candidate evaluation report:
        - Candidate Name: {candidate_name}
        - Target Role: {target_role}
        - Domain / Industry: {domain}
        - Experience Level: {experience_level}
        - Interview Mode / Type: {mode}
        - Difficulty: {difficulty}
        - Language: {language}
        - Turn-by-Turn Evaluations: {json.dumps(evaluations)}

        Hiring Readiness Verdict Criteria:
        - Overall Score >= 85: "Strong Hire"
        - Overall Score >= 72: "Hire"
        - Overall Score >= 58: "Leaning Hire"
        - Overall Score >= 45: "Needs Improvement"
        - Overall Score < 45: "Reject"

        Return strictly a JSON object:
        {{
          "overall_score": float,
          "technical_score": float,
          "communication_score": float,
          "problem_solving_score": float,
          "confidence_score": float,
          "verdict": "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Improvement" | "Reject",
          "hiring_readiness": "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Improvement" | "Reject",
          "executive_summary": "Comprehensive 3-4 sentence performance synthesis",
          "strengths": ["strength 1", "strength 2", "strength 3"],
          "weaknesses": ["area for improvement 1", "area for improvement 2"],
          "technical_gaps": ["technical gap 1", "technical gap 2"],
          "communication_feedback": "Detailed paragraph on verbal structure, articulation and clarity",
          "recommended_topics": ["topic 1", "topic 2", "topic 3"],
          "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
        }}
        """

        result = self._call_gemini(prompt, system_instruction)
        if result and isinstance(result, dict) and "verdict" in result:
            raw_verdict = str(result.get("verdict", "")).strip().upper()
            verdict_map = {
                "STRONG HIRE": "Strong Hire",
                "HIRE": "Hire",
                "CONSIDER": "Leaning Hire",
                "LEANING HIRE": "Leaning Hire",
                "NEEDS IMPROVEMENT": "Needs Improvement",
                "NOT READY": "Reject",
                "REJECT": "Reject"
            }
            standard_verdict = verdict_map.get(raw_verdict, "Hire" if result.get("overall_score", 0) >= 70 else "Needs Improvement")
            result["verdict"] = standard_verdict
            result["hiring_readiness"] = standard_verdict
            logger.info(f"Synthesized final report via Gemini API: Verdict={standard_verdict}, Score={result.get('overall_score')}")
            return result

        if settings.STRICT_AI_MODE:
            raise RuntimeError("Gemini AI failed to synthesize final report in strict mode.")

        logger.warning("[Development Fallback]: Synthesizing report via Universal Fallback.")
        return self.fallback.synthesize_final_report(
            candidate_name, target_role, mode, category, difficulty, evaluations, domain, experience_level, language
        )

    def analyze_job_description(
        self,
        job_description: str,
        candidate_skills: List[str],
        target_role: Optional[str] = "Software Engineer"
    ) -> Dict[str, Any]:
        # Always run high-precision 4-way matching
        return self.fallback.analyze_job_description(job_description, candidate_skills, target_role)

    def evaluate_code_solution(
        self,
        problem_title: str,
        language: str,
        candidate_code: str,
        passed_tests: bool,
        test_case_summary: str
    ) -> Dict[str, Any]:
        system_instruction = (
            "You are a Principal Software Engineer and Coding Interviewer evaluating code submissions. "
            "Analyze correctness, time/space complexity (Big-O), code structure, and potential edge-case bugs."
        )

        prompt = f"""
        Problem Title: "{problem_title}"
        Language: {language}
        Automated Tests Passed: {passed_tests}
        Test Case Summary: {test_case_summary}
        Candidate's Code Submission:
        ```{language}
        {candidate_code}
        ```

        Return strictly a JSON object:
        {{
          "correctness_score": float (0-10),
          "efficiency_score": float (0-10),
          "code_quality_score": float (0-10),
          "overall_code_score": float (0-100),
          "time_complexity": "O(...)",
          "space_complexity": "O(...)",
          "strengths": ["specific strength 1", "specific strength 2"],
          "issues_and_bugs": ["potential bug or edge case 1", "issue 2"],
          "optimization_tips": ["how to optimize runtime or memory"],
          "clean_code_suggestions": ["variable naming, modularity, type hints"]
        }}
        """

        result = self._call_gemini(prompt, system_instruction)
        if result and isinstance(result, dict) and "overall_code_score" in result:
            logger.info(f"Evaluated code solution via Gemini API: Score={result.get('overall_code_score')}, Time={result.get('time_complexity')}")
            return result

        return self.fallback.evaluate_code_solution(
            problem_title, language, candidate_code, passed_tests, test_case_summary
        )
