import React, { useState, useEffect, useRef } from "react";
import {
  ArchitectureDiagram,
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureProblemTemplate,
  ArchitectureEvaluationResponse,
  architectureApi,
} from "../../services/architectureApi";
import {
  Server,
  Database,
  Layers,
  HardDrive,
  Cpu,
  Radio,
  Globe,
  Share2,
  Trash2,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Loader2,
} from "lucide-react";

interface SystemDesignWhiteboardProps {
  interviewId: number;
  questionId?: number;
  onArchitectureEvaluated?: (score: number, res: ArchitectureEvaluationResponse) => void;
}

const PALETTE_ITEMS = [
  { type: "client", label: "Web / Mobile Client", icon: Globe, color: "border-sky-500 bg-sky-950/40 text-sky-300" },
  { type: "api_gateway", label: "API Gateway / NGINX", icon: Layers, color: "border-purple-500 bg-purple-950/40 text-purple-300" },
  { type: "service", label: "App Microservice", icon: Cpu, color: "border-indigo-500 bg-indigo-950/40 text-indigo-300" },
  { type: "cache", label: "Redis Cache", icon: Zap, color: "border-amber-500 bg-amber-950/40 text-amber-300" },
  { type: "database", label: "Database (SQL/NoSQL)", icon: Database, color: "border-emerald-500 bg-emerald-950/40 text-emerald-300" },
  { type: "queue", label: "Kafka Message Queue", icon: Radio, color: "border-rose-500 bg-rose-950/40 text-rose-300" },
  { type: "storage", label: "S3 Object Storage", icon: HardDrive, color: "border-cyan-500 bg-cyan-950/40 text-cyan-300" },
];

export const SystemDesignWhiteboard: React.FC<SystemDesignWhiteboardProps> = ({
  interviewId,
  questionId,
  onArchitectureEvaluated,
}) => {
  const [templates, setTemplates] = useState<ArchitectureProblemTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ArchitectureProblemTemplate | null>(null);
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);

  // Connecting & Dragging State
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<ArchitectureEvaluationResponse | null>(null);

  // Load Templates
  useEffect(() => {
    architectureApi
      .getTemplates()
      .then((data) => {
        setTemplates(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedTemplate(first);
          if (first.starter_diagram) {
            setNodes(first.starter_diagram.nodes);
            setEdges(first.starter_diagram.edges);
          }
        }
      })
      .catch((err) => console.error("Error loading architecture templates:", err));
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const t = templates.find((item) => item.id === templateId);
    if (t) {
      setSelectedTemplate(t);
      if (t.starter_diagram) {
        setNodes(t.starter_diagram.nodes);
        setEdges(t.starter_diagram.edges);
      } else {
        setNodes([]);
        setEdges([]);
      }
      setEvalResult(null);
    }
  };

  const handleAddNode = (type: string, defaultLabel: string) => {
    const newId = `node_${Date.now()}`;
    const newNode: ArchitectureNode = {
      id: newId,
      type,
      label: defaultLabel,
      x: 100 + (nodes.length % 5) * 60,
      y: 100 + Math.floor(nodes.length / 5) * 80,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  const handleNodeClick = (nodeId: string) => {
    if (connectSourceId) {
      if (connectSourceId !== nodeId) {
        // Create connection edge
        const newEdge: ArchitectureEdge = {
          id: `edge_${Date.now()}`,
          source: connectSourceId,
          target: nodeId,
          label: "gRPC / HTTPS",
        };
        setEdges((prev) => [...prev, newEdge]);
      }
      setConnectSourceId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setConnectSourceId(null);
  };

  const handleEvaluateArchitecture = async () => {
    if (!selectedTemplate) return;
    setIsEvaluating(true);
    try {
      const diagram: ArchitectureDiagram = {
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        nodes,
        edges,
      };
      const res = await architectureApi.evaluateDiagram(interviewId, diagram, questionId);
      setEvalResult(res);
      if (onArchitectureEvaluated) {
        onArchitectureEvaluated(res.overall_score, res);
      }
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-sm text-purple-400">
            <Share2 className="w-4 h-4" />
            <span>System Design Whiteboard</span>
          </div>

          {/* Template Selector */}
          <select
            value={selectedTemplate?.id || ""}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-purple-500"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.difficulty})
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {connectSourceId && (
            <span className="text-[11px] text-amber-400 animate-pulse bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-md font-medium">
              Click target component to connect arrow...
            </span>
          )}

          <button
            onClick={() => {
              if (selectedNodeId) {
                setConnectSourceId(selectedNodeId);
              } else {
                alert("Please select a source component first to start connecting.");
              }
            }}
            disabled={!selectedNodeId}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs border border-slate-700 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Connect Arrow</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedNodeId}
            className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-md border border-slate-700 disabled:opacity-40 transition-colors"
            title="Delete selected component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleEvaluateArchitecture}
            disabled={isEvaluating || nodes.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-md shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            {isEvaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Evaluate Architecture</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Problem & Component Palette Sidebar (3 Cols) */}
        <div className="lg:col-span-3 p-3.5 border-r border-slate-800 overflow-y-auto space-y-4 bg-slate-900/40 text-xs">
          {/* Palette */}
          <div>
            <span className="font-semibold text-slate-200 block mb-2 uppercase tracking-wider text-[10px]">
              Add Component
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PALETTE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleAddNode(item.type, item.label)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all group"
                  >
                    <Icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-slate-300 group-hover:text-white font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problem Details */}
          {selectedTemplate && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="font-semibold text-slate-200 block text-xs">{selectedTemplate.title}</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">{selectedTemplate.description}</p>
              <div className="space-y-1">
                <span className="font-medium text-purple-300 text-[11px]">System Requirements:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[10px]">
                  {selectedTemplate.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Center: Interactive Canvas (6 Cols or 9 Cols if no eval) */}
        <div className={`relative flex flex-col h-full bg-slate-950/80 overflow-hidden ${evalResult ? "lg:col-span-6" : "lg:col-span-9"}`}>
          {/* SVG Diagram Canvas */}
          <div className="flex-1 relative overflow-auto p-4 select-none">
            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Render Connecting Edges (SVG Lines & Arrows) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
                </marker>
              </defs>
              {edges.map((e) => {
                const src = nodes.find((n) => n.id === e.source);
                const tgt = nodes.find((n) => n.id === e.target);
                if (!src || !tgt) return null;
                const sx = (src.x || 0) + 70;
                const sy = (src.y || 0) + 30;
                const tx = (tgt.x || 0) + 70;
                const ty = (tgt.y || 0) + 30;
                return (
                  <g key={e.id}>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Component Nodes */}
            {nodes.map((node) => {
              const item = PALETTE_ITEMS.find((p) => p.type === node.type) || PALETTE_ITEMS[2];
              const Icon = item.icon;
              const isSelected = selectedNodeId === node.id;
              const isConnectSource = connectSourceId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  style={{
                    left: `${node.x || 50}px`,
                    top: `${node.y || 50}px`,
                  }}
                  className={`absolute w-36 p-2.5 rounded-xl border cursor-pointer shadow-lg transition-all ${
                    isConnectSource
                      ? "ring-2 ring-amber-400 scale-105 border-amber-400 bg-amber-950/80"
                      : isSelected
                      ? "ring-2 ring-purple-400 scale-105 border-purple-400 bg-slate-900"
                      : "bg-slate-900/90 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {node.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{node.label}</div>
                </div>
              );
            })}
          </div>

          {/* Canvas Footer Status */}
          <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Components: {nodes.length} | Connections: {edges.length}
            </span>
            <span className="italic">Click a component to select or draw arrows</span>
          </div>
        </div>

        {/* Right: AI Architecture Review Scorecard (3 Cols if evaluated) */}
        {evalResult && (
          <div className="lg:col-span-3 p-4 border-l border-slate-800 overflow-y-auto space-y-4 bg-slate-900/60 text-xs">
            {/* Top Score */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Architecture Score
              </span>
              <div className="text-2xl font-bold text-purple-400 mt-0.5">
                {evalResult.overall_score}/100
              </div>
            </div>

            {/* Score Metrics */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Scale</span>
                <span className="font-bold text-emerald-400">{evalResult.scalability_score}/10</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Reliability</span>
                <span className="font-bold text-cyan-400">{evalResult.reliability_score}/10</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Efficiency</span>
                <span className="font-bold text-amber-400">{evalResult.efficiency_score}/10</span>
              </div>
            </div>

            {/* Single Points of Failure */}
            {evalResult.single_points_of_failure.length > 0 && (
              <div className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5" /> Single Points of Failure
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-rose-300 text-[10px]">
                  {evalResult.single_points_of_failure.map((spof, idx) => (
                    <li key={idx}>{spof}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {evalResult.strengths.length > 0 && (
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                  {evalResult.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {evalResult.recommendations.length > 0 && (
              <div className="p-2.5 bg-indigo-950/20 border border-indigo-800/40 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px]">
                  <Zap className="w-3.5 h-3.5" /> Recommendations
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                  {evalResult.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
