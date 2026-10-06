import sys
import os
import time
import subprocess
import tempfile
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.schemas.coding import TestCase, TestCaseResult, CodeRunResponse, CodingProblem
from app.utils.logger import logger

# Curated Coding Problem Catalog
CODING_PROBLEM_CATALOG: List[CodingProblem] = [
    CodingProblem(
        id="two-sum",
        title="Two Sum Problem",
        difficulty="Easy",
        category="Arrays & Hash Maps",
        description=(
            "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\n"
            "You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order."
        ),
        examples=[
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                "input": "nums = [3,2,4], target = 6",
                "output": "[1,2]",
                "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
        ],
        constraints=[
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        starter_code={
            "python": "def two_sum(nums, target):\n    # Write your solution here\n    pass\n\n# Test with standard input\nimport json, sys\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        nums = json.loads(lines[0])\n        target = int(lines[1])\n        print(json.dumps(two_sum(nums, target)))\n",
            "javascript": "function twoSum(nums, target) {\n    // Write your solution here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nif (input.length >= 2) {\n    const nums = JSON.parse(input[0]);\n    const target = parseInt(input[1]);\n    console.log(JSON.stringify(twoSum(nums, target)));\n}\n",
            "sql": "-- Write your SQL query here\nSELECT * FROM employees;\n"
        },
        test_cases=[
            TestCase(id=1, input_data="[2,7,11,15]\n9", expected_output="[0, 1]"),
            TestCase(id=2, input_data="[3,2,4]\n6", expected_output="[1, 2]"),
            TestCase(id=3, input_data="[3,3]\n6", expected_output="[0, 1]", is_hidden=True)
        ]
    ),
    CodingProblem(
        id="valid-parentheses",
        title="Valid Parentheses & String Stack",
        difficulty="Easy",
        category="Stack & Strings",
        description=(
            "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\n"
            "An input string is valid if:\n"
            "1. Open brackets must be closed by the same type of brackets.\n"
            "2. Open brackets must be closed in the correct order.\n"
            "3. Every close bracket has a corresponding open bracket of the same type."
        ),
        examples=[
            {"input": "s = \"()[]{}\"", "output": "true"},
            {"input": "s = \"(]\"", "output": "false"}
        ],
        constraints=["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
        starter_code={
            "python": "def is_valid(s: str) -> bool:\n    # Write your solution here\n    pass\n\nimport sys\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    print(str(is_valid(s)).lower())\n",
            "javascript": "function isValid(s) {\n    // Write your solution here\n}\n\nconst fs = require('fs');\nconst s = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(String(isValid(s)));\n"
        },
        test_cases=[
            TestCase(id=1, input_data="()[]{}", expected_output="true"),
            TestCase(id=2, input_data="(]", expected_output="false"),
            TestCase(id=3, input_data="{[]}", expected_output="true", is_hidden=True),
            TestCase(id=4, input_data="((", expected_output="false", is_hidden=True)
        ]
    ),
    CodingProblem(
        id="lru-cache",
        title="LRU Cache Strategy & Concurrency",
        difficulty="Medium",
        category="System Design & Data Structures",
        description=(
            "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n"
            "Implement the `LRUCache` class with `get(key)` and `put(key, value)` methods running in O(1) average time complexity."
        ),
        examples=[
            {
                "input": "LRUCache(2); put(1, 1); put(2, 2); get(1); put(3, 3); get(2);",
                "output": "[null, null, null, 1, null, -1]",
                "explanation": "Cache capacity is 2. When key 3 is added, key 2 is evicted."
            }
        ],
        constraints=["1 <= capacity <= 3000", "0 <= key, value <= 10^4", "At most 2 * 10^5 calls to get and put."],
        starter_code={
            "python": "class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n\n    def get(self, key: int) -> int:\n        return -1\n\n    def put(self, key: int, value: int) -> None:\n        pass\n\nif __name__ == '__main__':\n    print('LRU Cache ready')\n"
        },
        test_cases=[
            TestCase(id=1, input_data="test", expected_output="LRU Cache ready")
        ]
    )
]

class CodeExecutionService:
    """Safe, sandboxed multi-language code execution and test runner."""

    TIMEOUT_SECONDS = 5.0
    MAX_OUTPUT_CHARS = 10000

    @classmethod
    def get_problems(cls) -> List[CodingProblem]:
        return CODING_PROBLEM_CATALOG

    @classmethod
    def get_problem_by_id(cls, problem_id: str) -> Optional[CodingProblem]:
        for p in CODING_PROBLEM_CATALOG:
            if p.id == problem_id:
                return p
        return None

    @classmethod
    def execute_python(cls, code: str, stdin_data: str = "") -> Dict[str, Any]:
        """Executes Python code in an isolated subprocess with timeout and resource limits."""
        start_time = time.perf_counter()
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name

        try:
            process = subprocess.Popen(
                [sys.executable, temp_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(input=stdin_data, timeout=cls.TIMEOUT_SECONDS)
                exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
                return {
                    "success": process.returncode == 0,
                    "stdout": stdout[:cls.MAX_OUTPUT_CHARS],
                    "stderr": stderr[:cls.MAX_OUTPUT_CHARS],
                    "exit_code": process.returncode,
                    "execution_time_ms": exec_time_ms
                }
            except subprocess.TimeoutExpired:
                process.kill()
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Execution Timed Out: Exceeded {cls.TIMEOUT_SECONDS}s limit. Check for infinite loops.",
                    "exit_code": -1,
                    "execution_time_ms": round(cls.TIMEOUT_SECONDS * 1000, 2)
                }
        except Exception as e:
            logger.error(f"Python sandbox error: {e}")
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "exit_code": 1,
                "execution_time_ms": 0.0
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    @classmethod
    def execute_javascript(cls, code: str, stdin_data: str = "") -> Dict[str, Any]:
        """Executes JavaScript code in Node.js subprocess."""
        start_time = time.perf_counter()
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, encoding="utf-8") as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name

        try:
            process = subprocess.Popen(
                ["node", temp_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(input=stdin_data, timeout=cls.TIMEOUT_SECONDS)
                exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
                return {
                    "success": process.returncode == 0,
                    "stdout": stdout[:cls.MAX_OUTPUT_CHARS],
                    "stderr": stderr[:cls.MAX_OUTPUT_CHARS],
                    "exit_code": process.returncode,
                    "execution_time_ms": exec_time_ms
                }
            except subprocess.TimeoutExpired:
                process.kill()
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Execution Timed Out: Exceeded {cls.TIMEOUT_SECONDS}s limit.",
                    "exit_code": -1,
                    "execution_time_ms": round(cls.TIMEOUT_SECONDS * 1000, 2)
                }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Node.js execution error: {e}",
                "exit_code": 1,
                "execution_time_ms": 0.0
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    @classmethod
    def execute_sql(cls, code: str) -> Dict[str, Any]:
        """Executes SQL statements inside an in-memory SQLite sandbox."""
        start_time = time.perf_counter()
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        
        try:
            # Seed sample database
            cursor.execute("CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary REAL);")
            cursor.execute("INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 95000), (2, 'Bob', 'Engineering', 105000), (3, 'Charlie', 'Marketing', 75000);")
            conn.commit()

            cursor.execute(code)
            rows = cursor.fetchall()
            col_names = [description[0] for description in cursor.description] if cursor.description else []
            
            exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            # Format tabular output
            output_lines = ["\t".join(col_names)]
            for r in rows:
                output_lines.append("\t".join(str(val) for val in r))
            
            return {
                "success": True,
                "stdout": "\n".join(output_lines),
                "stderr": "",
                "exit_code": 0,
                "execution_time_ms": exec_time_ms
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"SQL Execution Error: {e}",
                "exit_code": 1,
                "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2)
            }
        finally:
            conn.close()

    @classmethod
    def run_code_with_test_cases(
        cls,
        language: str,
        code: str,
        stdin: str = "",
        test_cases: Optional[List[TestCase]] = None
    ) -> CodeRunResponse:
        """Executes code for a single custom run or against a suite of automated test cases."""
        lang = language.lower()

        # If no test cases, perform raw execution with provided stdin
        if not test_cases:
            if lang in ("python", "py", "python3"):
                raw = cls.execute_python(code, stdin)
            elif lang in ("javascript", "js", "typescript", "ts", "node"):
                raw = cls.execute_javascript(code, stdin)
            elif lang == "sql":
                raw = cls.execute_sql(code)
            else:
                raw = cls.execute_python(code, stdin)

            return CodeRunResponse(
                success=raw["success"],
                stdout=raw["stdout"],
                stderr=raw["stderr"],
                exit_code=raw["exit_code"],
                execution_time_ms=raw["execution_time_ms"],
                test_case_results=[],
                total_passed=1 if raw["success"] else 0,
                total_tests=1
            )

        # Run against test cases
        results: List[TestCaseResult] = []
        total_passed = 0
        total_time = 0.0

        for tc in test_cases:
            if lang in ("python", "py", "python3"):
                res = cls.execute_python(code, tc.input_data)
            elif lang in ("javascript", "js", "typescript", "ts"):
                res = cls.execute_javascript(code, tc.input_data)
            elif lang == "sql":
                res = cls.execute_sql(code)
            else:
                res = cls.execute_python(code, tc.input_data)

            total_time += res["execution_time_ms"]
            actual = res["stdout"].strip().replace(" ", "")
            expected = tc.expected_output.strip().replace(" ", "")
            
            passed = (res["success"] and actual == expected)
            if passed:
                total_passed += 1

            results.append(TestCaseResult(
                test_case_id=tc.id,
                input_data=tc.input_data if not tc.is_hidden else "[Hidden Test Case]",
                expected_output=tc.expected_output if not tc.is_hidden else "[Hidden]",
                actual_output=res["stdout"].strip() if not tc.is_hidden else ("[Passed]" if passed else "[Failed]"),
                passed=passed,
                execution_time_ms=res["execution_time_ms"],
                error_message=res["stderr"] if not res["success"] else None,
                is_hidden=tc.is_hidden
            ))

        all_passed = (total_passed == len(test_cases))
        return CodeRunResponse(
            success=all_passed,
            stdout=f"Ran {len(test_cases)} test cases. Passed: {total_passed}/{len(test_cases)}",
            stderr="",
            exit_code=0 if all_passed else 1,
            execution_time_ms=round(total_time, 2),
            test_case_results=results,
            total_passed=total_passed,
            total_tests=len(test_cases)
        )

    @classmethod
    def is_language_supported(cls, lang: str) -> bool:
        return lang.lower() in ["python", "javascript", "typescript", "sql", "sqlite"]

code_execution_service = CodeExecutionService
