import sys
import os
import json
from fastapi.testclient import TestClient

from app.main import app
from app.services.code_execution_service import CodeExecutionService
from app.schemas.coding import TestCase, CodeRunRequest
from app.services.ai.fallback_provider import FallbackAIProvider

def test_code_execution_engine():
    print("\n=======================================================")
    print("TESTING PHASE 3.1: CODE EXECUTION ENGINE & SANDBOX")
    print("=======================================================")
    
    # 1. Test Simple Python Execution
    py_code = "print('Hello, Universal AI Interviewer!')"
    res1 = CodeExecutionService.execute_python(py_code)
    assert res1["success"] is True
    assert "Hello, Universal AI Interviewer!" in res1["stdout"]
    print("[PASS] Python Simple Execution: PASS (Output:", res1["stdout"].strip(), ")")

    # 2. Test Python Stdin Execution
    stdin_code = "import sys\ndata = sys.stdin.read().strip()\nprint('Received:', data)"
    res2 = CodeExecutionService.execute_python(stdin_code, stdin_data="FastAPI Test Input")
    assert res2["success"] is True
    assert "Received: FastAPI Test Input" in res2["stdout"]
    print("[PASS] Python Stdin Execution: PASS")

    # 3. Test Timeout Protection (Infinite Loop)
    inf_code = "while True:\n    pass"
    res3 = CodeExecutionService.execute_python(inf_code)
    assert res3["success"] is False
    assert "Timed Out" in res3["stderr"]
    print("[PASS] Infinite Loop Timeout Protection (5s): PASS")

    # 4. Test SQL Execution
    sql_code = "SELECT name, salary FROM employees WHERE department = 'Engineering' ORDER BY salary DESC;"
    res4 = CodeExecutionService.execute_sql(sql_code)
    assert res4["success"] is True
    assert "Bob" in res4["stdout"]
    print("[PASS] SQL Execution Sandbox: PASS\n" + res4["stdout"])

    # 5. Test Automated Test Cases Runner
    two_sum_code = """
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []

import json, sys
if __name__ == '__main__':
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(json.dumps(two_sum(nums, target)))
"""
    test_cases = [
        TestCase(id=1, input_data="[2,7,11,15]\n9", expected_output="[0, 1]"),
        TestCase(id=2, input_data="[3,2,4]\n6", expected_output="[1, 2]"),
        TestCase(id=3, input_data="[3,3]\n6", expected_output="[0, 1]", is_hidden=True)
    ]
    tc_res = CodeExecutionService.run_code_with_test_cases("python", two_sum_code, test_cases=test_cases)
    assert tc_res.success is True
    assert tc_res.total_passed == 3
    print(f"[PASS] Automated Test Cases Runner: PASS (Passed {tc_res.total_passed}/{tc_res.total_tests})")

    # 6. Test AI Code Review Complexity & Quality Scoring
    provider = FallbackAIProvider()
    ai_rev = provider.evaluate_code_solution(
        problem_title="Two Sum Problem",
        language="python",
        candidate_code=two_sum_code,
        passed_tests=True,
        test_case_summary="Passed 3/3 test cases."
    )
    assert ai_rev["time_complexity"] == "O(N)"
    assert ai_rev["overall_code_score"] >= 80.0
    print(f"[PASS] AI Code Review: PASS (Score={ai_rev['overall_code_score']}/100, Time={ai_rev['time_complexity']}, Space={ai_rev['space_complexity']})")

    # 7. Test FastAPI Coding Endpoints via TestClient
    client = TestClient(app)
    resp = client.get("/api/coding/problems")
    assert resp.status_code == 200
    problems = resp.json()
    assert len(problems) >= 3
    print(f"[PASS] GET /api/coding/problems: PASS (Found {len(problems)} curated problems)")

    run_payload = {
        "language": "python",
        "code": two_sum_code,
        "test_cases": [
            {"id": 1, "input_data": "[2,7,11,15]\n9", "expected_output": "[0, 1]", "is_hidden": False}
        ]
    }
    run_resp = client.post("/api/coding/run", json=run_payload)
    assert run_resp.status_code == 200
    assert run_resp.json()["total_passed"] == 1
    print("[PASS] POST /api/coding/run: PASS")

    print("\nALL BACKEND CODE EXECUTION & AI REVIEW TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_code_execution_engine()
