from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ArchitectureNode(BaseModel):
    id: str
    type: str  # client, load_balancer, api_gateway, service, database, cache, queue, cdn, storage
    label: str
    x: Optional[float] = 0.0
    y: Optional[float] = 0.0
    properties: Optional[Dict[str, Any]] = {}

class ArchitectureEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = "REST / gRPC"
    protocol: Optional[str] = "HTTP"

class ArchitectureDiagram(BaseModel):
    title: str
    description: Optional[str] = ""
    nodes: List[ArchitectureNode]
    edges: List[ArchitectureEdge]

class ArchitectureEvaluationRequest(BaseModel):
    interview_id: int
    question_id: Optional[int] = None
    diagram: ArchitectureDiagram

class ArchitectureEvaluationResponse(BaseModel):
    success: bool
    overall_score: float  # 0 - 100
    scalability_score: float # 0 - 10
    reliability_score: float # 0 - 10
    efficiency_score: float  # 0 - 10
    single_points_of_failure: List[str] = []
    strengths: List[str] = []
    bottlenecks: List[str] = []
    recommendations: List[str] = []
    ai_feedback_summary: str

class ArchitectureProblemTemplate(BaseModel):
    id: str
    title: str
    difficulty: str
    description: str
    requirements: List[str]
    suggested_components: List[str]
    starter_diagram: Optional[ArchitectureDiagram] = None
