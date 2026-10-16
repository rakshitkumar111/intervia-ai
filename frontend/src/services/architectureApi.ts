const API_BASE = "/api";

export interface ArchitectureNode {
  id: string;
  type: string; // client, load_balancer, api_gateway, service, database, cache, queue, storage, cdn
  label: string;
  x: number;
  y: number;
  properties?: Record<string, any>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
}

export interface ArchitectureDiagram {
  title: string;
  description?: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface ArchitectureEvaluationResponse {
  success: boolean;
  overall_score: number;
  scalability_score: number;
  reliability_score: number;
  efficiency_score: number;
  single_points_of_failure: string[];
  strengths: string[];
  bottlenecks: string[];
  recommendations: string[];
  ai_feedback_summary: string;
}

export interface ArchitectureProblemTemplate {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  requirements: string[];
  suggested_components: string[];
  starter_diagram?: ArchitectureDiagram;
}

export const architectureApi = {
  async getTemplates(): Promise<ArchitectureProblemTemplate[]> {
    const res = await fetch(`${API_BASE}/architecture/templates`);
    if (!res.ok) throw new Error("Failed to load architecture templates");
    return res.json();
  },

  async getTemplate(templateId: string): Promise<ArchitectureProblemTemplate> {
    const res = await fetch(`${API_BASE}/architecture/templates/${templateId}`);
    if (!res.ok) throw new Error(`Failed to load template ${templateId}`);
    return res.json();
  },

  async evaluateDiagram(
    interviewId: number,
    diagram: ArchitectureDiagram,
    questionId?: number
  ): Promise<ArchitectureEvaluationResponse> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/architecture/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        interview_id: interviewId,
        question_id: questionId,
        diagram,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Architecture evaluation failed" }));
      throw new Error(err.detail || "Architecture evaluation failed");
    }
    return res.json();
  },
};
