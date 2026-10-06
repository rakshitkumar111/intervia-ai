from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TestCase(BaseModel):
    id: Optional[int] = None
    input_data: str
    expected_output: str
    is_hidden: bool = False

class CodeRunRequest(BaseModel):
    language: str  # python, javascript, typescript, sql, cpp, java
    code: str
    stdin: Optional[str] = ""
    test_cases: Optional[List[TestCase]] = []

class TestCaseResult(BaseModel):
    test_case_id: Optional[int] = None
    input_data: str
    expected_output: str
    actual_output: str
    passed: bool
    execution_time_ms: float
    error_message: Optional[str] = None
    is_hidden: bool = False

class CodeRunResponse(BaseModel):
    success: bool
    stdout: str = ""
    stderr: str = ""
    exit_code: int = 0
    execution_time_ms: float = 0.0
    memory_used_mb: Optional[float] = None
    test_case_results: List[TestCaseResult] = []
    total_passed: int = 0
    total_tests: int = 0

class CodeSubmitRequest(BaseModel):
    interview_id: int
    question_id: Optional[int] = None
    problem_title: str
    language: str
    code: str
    test_cases: Optional[List[TestCase]] = []

class AICodeReview(BaseModel):
    correctness_score: float = 0.0  # 0 - 10
    efficiency_score: float = 0.0   # 0 - 10
    code_quality_score: float = 0.0 # 0 - 10
    overall_code_score: float = 0.0 # 0 - 100
    time_complexity: str = "O(N)"
    space_complexity: str = "O(1)"
    strengths: List[str] = []
    issues_and_bugs: List[str] = []
    optimization_tips: List[str] = []
    clean_code_suggestions: List[str] = []
    ideal_solution_snippet: Optional[str] = None

class CodeSubmitResponse(BaseModel):
    success: bool
    run_result: CodeRunResponse
    ai_review: AICodeReview
    passed_all_tests: bool

class CodingProblem(BaseModel):
    id: str
    title: str
    difficulty: str  # Easy, Medium, Hard
    category: str    # Arrays, Strings, Dynamic Programming, SQL, Trees, etc.
    description: str
    examples: List[Dict[str, str]]
    constraints: List[str]
    starter_code: Dict[str, str]  # language -> code template
    test_cases: List[TestCase]
