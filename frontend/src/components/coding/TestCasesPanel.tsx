import React, { useState } from "react";
import { TestCase, TestCaseResult, CodeRunResponse, AICodeReview } from "../../services/codingApi";
import { CheckCircle2, XCircle, Clock, Cpu, Award, Zap, AlertTriangle, Sparkles } from "lucide-react";

interface TestCasesPanelProps {
  testCases: TestCase[];
  runResult: CodeRunResponse | null;
  aiReview: AICodeReview | null;
  customInput: string;
  onCustomInputChange: (val: string) => void;
  isRunning: boolean;
  isSubmitting: boolean;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({
  testCases,
  runResult,
  aiReview,
  customInput,
  onCustomInputChange,
  isRunning,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState<"testcases" | "custom" | "ai_review">("testcases");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-800 text-slate-200">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("testcases")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "testcases"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Test Cases ({testCases.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "custom"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Custom Stdin
          </button>
          {aiReview && (
            <button
              onClick={() => setActiveTab("ai_review")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "ai_review"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-300 hover:text-white hover:bg-purple-900/40"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Code Review ({aiReview.overall_code_score}/100)
            </button>
          )}
        </div>

        {runResult && (
          <div className="flex items-center gap-3 text-xs">
            <span
              className={`flex items-center gap-1 font-semibold ${
                runResult.total_passed === runResult.total_tests
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {runResult.total_passed === runResult.total_tests ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Passed: {runResult.total_passed}/{runResult.total_tests}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {runResult.execution_time_ms} ms
            </span>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {activeTab === "testcases" && (
          <div className="space-y-4">
            {/* Case Selector Pills */}
            <div className="flex items-center gap-2">
              {testCases.map((tc, idx) => {
                const res = runResult?.test_case_results[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCaseIdx(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs transition-all ${
                      selectedCaseIdx === idx
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {res ? (
                      res.passed ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-400" />
                      )
                    ) : null}
                    Case {idx + 1} {tc.is_hidden ? "(Hidden)" : ""}
                  </button>
                );
              })}
            </div>

            {/* Selected Test Case Details */}
            {testCases[selectedCaseIdx] && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Input:</span>
                  <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {testCases[selectedCaseIdx].input_data || "(Empty)"}
                  </pre>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Expected Output:</span>
                  <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                    {testCases[selectedCaseIdx].expected_output}
                  </pre>
                </div>

                {/* Actual Output if Run */}
                {runResult?.test_case_results[selectedCaseIdx] && (
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-slate-400 font-medium">Actual Output:</span>
                    <pre
                      className={`p-2.5 rounded-lg border font-mono text-xs overflow-x-auto whitespace-pre-wrap ${
                        runResult.test_case_results[selectedCaseIdx].passed
                          ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                          : "bg-rose-950/30 border-rose-800/50 text-rose-300"
                      }`}
                    >
                      {runResult.test_case_results[selectedCaseIdx].actual_output ||
                        runResult.test_case_results[selectedCaseIdx].error_message ||
                        "(No output)"}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Console Output & Errors */}
            {runResult?.stderr && (
              <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300">
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Runtime Error / Traceback:
                </div>
                <pre className="font-mono text-xs whitespace-pre-wrap">{runResult.stderr}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "custom" && (
          <div className="space-y-2">
            <span className="text-slate-400">Enter custom input (passed via standard input `stdin`):</span>
            <textarea
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="e.g. [2, 7, 11, 15]&#10;9"
              rows={4}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            {runResult?.stdout && (
              <div className="mt-3">
                <span className="text-slate-400 font-medium">Standard Output (stdout):</span>
                <pre className="p-2.5 mt-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                  {runResult.stdout}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "ai_review" && aiReview && (
          <div className="space-y-4">
            {/* Top Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Overall Score</span>
                <span className="text-lg font-bold text-indigo-400">{aiReview.overall_code_score}/100</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Time Complexity</span>
                <span className="text-sm font-semibold text-emerald-400 font-mono">{aiReview.time_complexity}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Space Complexity</span>
                <span className="text-sm font-semibold text-cyan-400 font-mono">{aiReview.space_complexity}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Code Quality</span>
                <span className="text-sm font-semibold text-amber-400">{aiReview.code_quality_score}/10</span>
              </div>
            </div>

            {/* Strengths & Bugs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Award className="w-3.5 h-3.5" /> Strengths
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {aiReview.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Zap className="w-3.5 h-3.5" /> Optimization & Edge Cases
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {aiReview.optimization_tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
