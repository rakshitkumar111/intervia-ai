from typing import List, Dict, Any, Optional
from app.schemas.architecture import (
    ArchitectureDiagram,
    ArchitectureNode,
    ArchitectureEdge,
    ArchitectureProblemTemplate,
    ArchitectureEvaluationResponse
)
from app.utils.logger import logger

SYSTEM_DESIGN_TEMPLATES: List[ArchitectureProblemTemplate] = [
    ArchitectureProblemTemplate(
        id="url-shortener",
        title="Design a Scalable URL Shortener (TinyURL)",
        difficulty="Medium",
        description="Design a globally distributed service like TinyURL that takes long URLs and shortens them to 7-character aliases with high read availability.",
        requirements=[
            "100M new URLs generated per month",
            "10:1 Read to Write ratio",
            "URL redirects should have sub-10ms latency",
            "High availability and fault tolerance (99.99%)"
        ],
        suggested_components=["Client", "CDN", "Load Balancer", "URL Redirection Service", "Redis Cache", "Distributed NoSQL DB"],
        starter_diagram=ArchitectureDiagram(
            title="TinyURL Architecture",
            description="Initial baseline draft",
            nodes=[
                ArchitectureNode(id="n1", type="client", label="Web / Mobile Clients", x=50, y=180),
                ArchitectureNode(id="n2", type="load_balancer", label="NGINX Load Balancer", x=240, y=180),
                ArchitectureNode(id="n3", type="service", label="Shortener App API", x=440, y=180),
                ArchitectureNode(id="n4", type="cache", label="Redis URL Cache", x=640, y=100),
                ArchitectureNode(id="n5", type="database", label="MongoDB / Cassandra", x=640, y=260)
            ],
            edges=[
                ArchitectureEdge(id="e1", source="n1", target="n2", label="HTTPS"),
                ArchitectureEdge(id="e2", source="n2", target="n3", label="HTTP Round-Robin"),
                ArchitectureEdge(id="e3", source="n3", target="n4", label="Cache Lookup"),
                ArchitectureEdge(id="e4", source="n3", target="n5", label="Persistent Store")
            ]
        )
    ),
    ArchitectureProblemTemplate(
        id="ecommerce-checkout",
        title="Design E-Commerce Checkout & Flash Sale System",
        difficulty="Hard",
        description="Design a resilient e-commerce checkout and inventory deduction pipeline that handles sudden traffic spikes of 100,000 concurrent purchases without overselling.",
        requirements=[
            "Strict consistency on inventory allocation (no double booking)",
            "Asynchronous order fulfillment and invoice generation",
            "Resilient payment gateway integration with idempotency keys",
            "Sub-second order confirmation response"
        ],
        suggested_components=["Clients", "API Gateway", "Order Service", "Inventory Service", "Redis Distributed Lock", "Kafka Event Broker", "PostgreSQL ACID DB"],
        starter_diagram=ArchitectureDiagram(
            title="Flash Sale Checkout Architecture",
            description="High-concurrency order pipeline",
            nodes=[
                ArchitectureNode(id="n1", type="client", label="Candidate Clients", x=50, y=180),
                ArchitectureNode(id="n2", type="api_gateway", label="Kong API Gateway", x=240, y=180),
                ArchitectureNode(id="n3", type="service", label="Checkout Service", x=440, y=180),
                ArchitectureNode(id="n4", type="queue", label="Kafka Orders Topic", x=640, y=180),
                ArchitectureNode(id="n5", type="database", label="PostgreSQL (ACID)", x=640, y=300)
            ],
            edges=[
                ArchitectureEdge(id="e1", source="n1", target="n2", label="HTTPS / TLS"),
                ArchitectureEdge(id="e2", source="n2", target="n3", label="gRPC Internal"),
                ArchitectureEdge(id="e3", source="n3", target="n4", label="OrderPlaced Event"),
                ArchitectureEdge(id="e4", source="n3", target="n5", label="Transactional Commit")
            ]
        )
    ),
    ArchitectureProblemTemplate(
        id="chat-messenger",
        title="Design Real-Time Messaging App (WhatsApp / Slack)",
        difficulty="Hard",
        description="Design a globally distributed real-time messaging platform supporting 500M daily active users with message persistence, delivery receipts, and group chats.",
        requirements=[
            "Low latency real-time bidirectional messaging (<50ms)",
            "Offline message delivery queuing",
            "End-to-end delivery status (Sent, Delivered, Read receipts)",
            "Media attachments storage (Photos, Voice notes)"
        ],
        suggested_components=["Mobile Clients", "WebSocket Gateway", "Chat Service", "Redis Pub/Sub", "Kafka", "Cassandra Message Store", "S3 Media Storage"],
        starter_diagram=ArchitectureDiagram(
            title="Real-time Chat Architecture",
            description="WebSocket & Pub/Sub messaging",
            nodes=[
                ArchitectureNode(id="n1", type="client", label="Mobile App (iOS/Android)", x=50, y=180),
                ArchitectureNode(id="n2", type="load_balancer", label="WebSocket Gateway", x=240, y=180),
                ArchitectureNode(id="n3", type="service", label="Messaging Engine", x=440, y=180),
                ArchitectureNode(id="n4", type="cache", label="Redis Presence / PubSub", x=640, y=100),
                ArchitectureNode(id="n5", type="storage", label="S3 Object Store", x=640, y=260)
            ],
            edges=[
                ArchitectureEdge(id="e1", source="n1", target="n2", label="WSS (WebSocket)"),
                ArchitectureEdge(id="e2", source="n2", target="n3", label="Internal gRPC"),
                ArchitectureEdge(id="e3", source="n3", target="n4", label="Session Tracking"),
                ArchitectureEdge(id="e4", source="n3", target="n5", label="Media Uploads")
            ]
        )
    )
]

class ArchitectureService:
    """Evaluates candidate system design whiteboard diagrams for scalability, reliability, and SPOFs."""

    @classmethod
    def get_templates(cls) -> List[ArchitectureProblemTemplate]:
        return SYSTEM_DESIGN_TEMPLATES

    @classmethod
    def get_template_by_id(cls, template_id: str) -> Optional[ArchitectureProblemTemplate]:
        for t in SYSTEM_DESIGN_TEMPLATES:
            if t.id == template_id:
                return t
        return None

    @classmethod
    def evaluate_diagram(cls, diagram: ArchitectureDiagram) -> ArchitectureEvaluationResponse:
        nodes = diagram.nodes
        edges = diagram.edges

        node_types = [n.type.lower() for n in nodes]
        node_map = {n.id: n for n in nodes}

        has_client = "client" in node_types
        has_lb = "load_balancer" in node_types or "api_gateway" in node_types
        has_service = "service" in node_types
        has_db = "database" in node_types
        has_cache = "cache" in node_types
        has_queue = "queue" in node_types

        spofs = []
        strengths = []
        bottlenecks = []
        recommendations = []

        scalability = 7.0
        reliability = 7.0
        efficiency = 7.0

        # Check: Client connected directly to Database
        direct_db_exposure = False
        for e in edges:
            src = node_map.get(e.source)
            tgt = node_map.get(e.target)
            if src and tgt:
                if src.type.lower() == "client" and tgt.type.lower() == "database":
                    direct_db_exposure = True
                    break

        if direct_db_exposure:
            spofs.append("Security Vulnerability: Client has direct unauthenticated access to database.")
            reliability -= 3.0
            scalability -= 2.0
            bottlenecks.append("Clients directly querying database without an intermediary API layer will overload connection pools.")
            recommendations.append("Route all client traffic through an API Gateway and application service layer.")
        else:
            strengths.append("Proper decoupling: Database is secured behind application service tiers.")

        # Check: Load balancer presence
        if has_lb:
            strengths.append("Load Balancer / Gateway layer provides horizontal scaling and traffic distribution.")
            scalability += 1.5
        else:
            spofs.append("Single Point of Failure: No Load Balancer detected to distribute traffic across service instances.")
            scalability -= 1.5
            recommendations.append("Introduce a Load Balancer (e.g., NGINX / Cloud ALB) before application services.")

        # Check: Caching layer
        if has_cache:
            strengths.append("Caching layer (Redis/Memcached) mitigates database read hotspot bottlenecks.")
            efficiency += 1.5
            scalability += 1.0
        else:
            bottlenecks.append("Absence of in-memory caching could lead to high database I/O latency under heavy read load.")
            recommendations.append("Deploy a Redis or Memcached caching cluster with TTL expiration for read-heavy entities.")

        # Check: Asynchronous Queueing
        if has_queue:
            strengths.append("Message broker (Kafka/RabbitMQ) decouples synchronous request-response bottlenecks.")
            reliability += 1.5
        else:
            recommendations.append("Consider an asynchronous message queue (e.g. Kafka) for decoupled background job processing.")

        # Compute normalized scores
        scalability_score = round(max(min(scalability, 10.0), 2.0), 1)
        reliability_score = round(max(min(reliability, 10.0), 2.0), 1)
        efficiency_score = round(max(min(efficiency, 10.0), 2.0), 1)

        overall_score = round(((scalability_score * 0.4) + (reliability_score * 0.35) + (efficiency_score * 0.25)) * 10.0, 1)

        summary = (
            f"Candidate designed a system topology with {len(nodes)} components and {len(edges)} connections. "
            f"Achieved an overall architecture score of {overall_score}/100. "
            f"{'Solid enterprise-grade design with high scalability.' if overall_score >= 80 else 'Good baseline topology, but needs attention on caching and redundancy.'}"
        )

        return ArchitectureEvaluationResponse(
            success=True,
            overall_score=overall_score,
            scalability_score=scalability_score,
            reliability_score=reliability_score,
            efficiency_score=efficiency_score,
            single_points_of_failure=spofs,
            strengths=strengths,
            bottlenecks=bottlenecks,
            recommendations=recommendations,
            ai_feedback_summary=summary
        )
