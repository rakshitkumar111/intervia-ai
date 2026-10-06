const API_BASE = "http://127.0.0.1:8000/api";

export interface TestCase {
  id?: number;
  input_data: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface TestCaseResult {
  test_case_id?: number;
  input_data: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  execution_time_ms: number;
  error_message?: string | null;
  is_hidden: boolean;
}

export interface CodeRunResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  memory_used_mb?: number | null;
  test_case_results: TestCaseResult[];
  total_passed: number;
  total_tests: number;
}

export interface AICodeReview {
  correctness_score: number;
  efficiency_score: number;
  code_quality_score: number;
  overall_code_score: number;
  time_complexity: string;
  space_complexity: string;
  strengths: string[];
  issues_and_bugs: string[];
  optimization_tips: string[];
  clean_code_suggestions: string[];
  ideal_solution_snippet?: string | null;
}

export interface CodeSubmitResponse {
  success: boolean;
  run_result: CodeRunResponse;
  ai_review: AICodeReview;
  passed_all_tests: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  starter_code: Record<string, string>;
  test_cases: TestCase[];
}

export const codingApi = {
  async getProblems(): Promise<CodingProblem[]> {
    const res = await fetch(`${API_BASE}/coding/problems`);
    if (!res.ok) throw new Error("Failed to fetch coding problems");
    return res.json();
  },

  async getProblem(problemId: string): Promise<CodingProblem> {
    const res = await fetch(`${API_BASE}/coding/problems/${problemId}`);
    if (!res.ok) throw new Error(`Failed to fetch coding problem ${problemId}`);
    return res.json();
  },

  async runCode(
    language: string,
    code: string,
    stdin: string = "",
    testCases: TestCase[] = []
  ): Promise<CodeRunResponse> {
    const res = await fetch(`${API_BASE}/coding/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        code,
        stdin,
        test_cases: testCases,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Code run failed" }));
      throw new Error(err.detail || "Code run failed");
    }
    return res.json();
  },

  async submitCode(
    interviewId: number,
    problemTitle: string,
    language: string,
    code: string,
    testCases: TestCase[] = [],
    questionId?: number
  ): Promise<CodeSubmitResponse> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/coding/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        interview_id: interviewId,
        question_id: questionId,
        problem_title: problemTitle,
        language,
        code,
        test_cases: testCases,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Code submission failed" }));
      throw new Error(err.detail || "Code submission failed");
    }
    return res.json();
  },
};
