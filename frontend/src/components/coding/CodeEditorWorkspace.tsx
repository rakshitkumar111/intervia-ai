import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  CodingProblem,
  TestCase,
  CodeRunResponse,
  AICodeReview,
  codingApi,
} from "../../services/codingApi";
import { TestCasesPanel } from "./TestCasesPanel";
import {
  Play,
  CheckCircle,
  RotateCcw,
  Code2,
  BookOpen,
  Terminal,
  Loader2,
  Sparkles,
} from "lucide-react";

interface CodeEditorWorkspaceProps {
  interviewId: number;
  questionId?: number;
  onCodeSubmitted?: (score: number, aiReview: AICodeReview) => void;
}

export const CodeEditorWorkspace: React.FC<CodeEditorWorkspaceProps> = ({
  interviewId,
  questionId,
  onCodeSubmitted,
}) => {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<CodeRunResponse | null>(null);
  const [aiReview, setAiReview] = useState<AICodeReview | null>(null);

  useEffect(() => {
    // Load coding problems catalog
    codingApi
      .getProblems()
      .then((data) => {
        setProblems(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedProblem(first);
          setCode(first.starter_code["python"] || first.starter_code["javascript"] || "");
        }
      })
      .catch((err) => console.error("Error loading coding problems:", err));
  }, []);

  const handleProblemChange = (problemId: string) => {
    const prob = problems.find((p) => p.id === problemId);
    if (prob) {
      setSelectedProblem(prob);
      setCode(prob.starter_code[language] || prob.starter_code["python"] || "");
      setRunResult(null);
      setAiReview(null);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (selectedProblem && selectedProblem.starter_code[newLang]) {
      setCode(selectedProblem.starter_code[newLang]);
    }
  };

  const handleResetCode = () => {
    if (selectedProblem) {
      setCode(selectedProblem.starter_code[language] || "");
      setRunResult(null);
    }
  };

  const handleRunCode = async () => {
    if (!selectedProblem) return;
    setIsRunning(true);
    try {
      const res = await codingApi.runCode(
        language,
        code,
        customInput,
        customInput ? [] : selectedProblem.test_cases
      );
      setRunResult(res);
    } catch (err: any) {
      setRunResult({
        success: false,
        stdout: "",
        stderr: err.message || "Execution error",
        exit_code: 1,
        execution_time_ms: 0,
        test_case_results: [],
        total_passed: 0,
        total_tests: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!selectedProblem) return;
    setIsSubmitting(true);
    try {
      const res = await codingApi.submitCode(
        interviewId,
        selectedProblem.title,
        language,
        code,
        selectedProblem.test_cases,
        questionId
      );
      setRunResult(res.run_result);
      setAiReview(res.ai_review);
      if (onCodeSubmitted) {
        onCodeSubmitted(res.ai_review.overall_code_score, res.ai_review);
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Workspace Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-sm text-indigo-400">
            <Code2 className="w-4 h-4" />
            <span>Coding Sandbox</span>
          </div>

          {/* Problem Selector */}
          <select
            value={selectedProblem?.id || ""}
            onChange={(e) => handleProblemChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="sql">SQL (SQLite)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCode}
            title="Reset to starter code"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-medium text-xs rounded-md border border-slate-700 hover:border-emerald-600/50 transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Run Code</span>
          </button>

          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting || isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-md shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span>Submit Solution</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Problem Statement Sidebar (4 Cols) */}
        {selectedProblem && (
          <div className="lg:col-span-4 p-4 border-r border-slate-800 overflow-y-auto space-y-4 bg-slate-900/50 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-slate-100">{selectedProblem.title}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    selectedProblem.difficulty === "Easy"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : selectedProblem.difficulty === "Medium"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {selectedProblem.difficulty}
                </span>
              </div>
              <span className="text-[11px] text-indigo-400">{selectedProblem.category}</span>
            </div>

            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {selectedProblem.description}
            </div>

            {/* Examples */}
            {selectedProblem.examples.length > 0 && (
              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Examples:</span>
                {selectedProblem.examples.map((ex, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <div>
                      <span className="text-slate-400">Input: </span>
                      <code className="text-indigo-300 font-mono">{ex.input}</code>
                    </div>
                    <div>
                      <span className="text-slate-400">Output: </span>
                      <code className="text-emerald-300 font-mono">{ex.output}</code>
                    </div>
                    {ex.explanation && (
                      <div className="text-[11px] text-slate-400 italic">
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {selectedProblem.constraints.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200">Constraints:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono text-[11px]">
                  {selectedProblem.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Right: Monaco Editor + Test Cases Panel (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          {/* Monaco Code Editor */}
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              language={language === "sql" ? "sql" : language === "javascript" ? "javascript" : language === "typescript" ? "typescript" : "python"}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 13,
                fontFamily: "Fira Code, Menlo, Monaco, 'Courier New', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
              }}
            />
          </div>

          {/* Bottom Test Cases Panel (Collapsible / Resizable) */}
          <div className="h-[220px]">
            <TestCasesPanel
              testCases={selectedProblem?.test_cases || []}
              runResult={runResult}
              aiReview={aiReview}
              customInput={customInput}
              onCustomInputChange={setCustomInput}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
