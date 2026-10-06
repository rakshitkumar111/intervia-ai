import sys
import os
from fastapi.testclient import TestClient

from app.main import app
from app.services.architecture_service import ArchitectureService
from app.schemas.architecture import ArchitectureDiagram, ArchitectureNode, ArchitectureEdge

def test_system_design_whiteboard():
    print("\n=======================================================")
    print("TESTING PHASE 3.4: SYSTEM DESIGN WHITEBOARD & REVIEW")
    print("=======================================================")

    # 1. Test Client Authentication
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={"email": "candidate@interviewer.ai", "password": "Candidate@12345"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Candidate Authentication: PASS")

    # 2. Test Fetching Curated Architecture Problem Templates
    tmpl_res = client.get("/api/architecture/templates", headers=headers)
    assert tmpl_res.status_code == 200, f"Failed fetching templates: {tmpl_res.text}"
    templates = tmpl_res.json()
    assert len(templates) >= 3
    print(f"[PASS] Curated Problem Templates: PASS (Found {len(templates)} templates: {[t['title'] for t in templates]})")

    # 3. Test Problem Template Detail
    t1_res = client.get("/api/architecture/templates/url-shortener", headers=headers)
    assert t1_res.status_code == 200
    t1_data = t1_res.json()
    assert len(t1_data["suggested_components"]) >= 4
    print("[PASS] Template Retrieval: PASS")

    # 4. Create an Interview Session for Architecture Evaluation
    create_res = client.post("/api/interview/create", headers=headers, json={
        "target_role": "Principal Systems Architect",
        "mode": "Technical",
        "difficulty": "Hard",
        "total_questions": 3,
        "language": "English"
    })
    assert create_res.status_code == 201
    interview_id = create_res.json()["id"]

    # 5. Evaluate High-Performance Enterprise Architecture (TinyURL)
    good_diagram = {
        "title": "Scalable URL Shortener Enterprise Design",
        "description": "High read throughput design",
        "nodes": [
            {"id": "n1", "type": "client", "label": "Global Web / Mobile Clients", "x": 50, "y": 180},
            {"id": "n2", "type": "load_balancer", "label": "Cloud Load Balancer", "x": 220, "y": 180},
            {"id": "n3", "type": "service", "label": "URL Redirect Service Cluster", "x": 420, "y": 180},
            {"id": "n4", "type": "cache", "label": "Distributed Redis Cache", "x": 620, "y": 100},
            {"id": "n5", "type": "database", "label": "Cassandra / NoSQL Cluster", "x": 620, "y": 260}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "label": "HTTPS"},
            {"id": "e2", "source": "n2", "target": "n3", "label": "Round-Robin"},
            {"id": "e3", "source": "n3", "target": "n4", "label": "Cache Lookup"},
            {"id": "e4", "source": "n3", "target": "n5", "label": "DB Fetch on Cache Miss"}
        ]
    }

    eval_res = client.post(
        "/api/architecture/evaluate",
        headers=headers,
        json={"interview_id": interview_id, "diagram": good_diagram}
    )
    assert eval_res.status_code == 200, f"Evaluation failed: {eval_res.text}"
    good_eval = eval_res.json()
    assert good_eval["overall_score"] >= 80.0
    assert len(good_eval["single_points_of_failure"]) == 0
    print(f"[PASS] Enterprise Architecture Evaluation: PASS (Score={good_eval['overall_score']}/100, Scale={good_eval['scalability_score']}/10)")
    print(f"[PASS] Strengths Identified: {good_eval['strengths'][:2]}")

    # 6. Evaluate Flawed Architecture (Direct Client-to-DB Connection)
    flawed_diagram = {
        "title": "Flawed Unsecured Design",
        "description": "Anti-pattern test",
        "nodes": [
            {"id": "n1", "type": "client", "label": "Web Client", "x": 50, "y": 180},
            {"id": "n2", "type": "database", "label": "Direct Database", "x": 300, "y": 180}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "label": "Direct Connection"}
        ]
    }

    flawed_eval_res = client.post(
        "/api/architecture/evaluate",
        headers=headers,
        json={"interview_id": interview_id, "diagram": flawed_diagram}
    )
    assert flawed_eval_res.status_code == 200
    flawed_eval = flawed_eval_res.json()
    assert flawed_eval["overall_score"] < 70.0
    assert len(flawed_eval["single_points_of_failure"]) >= 1
    print(f"[PASS] Flawed Architecture Detection: PASS (SPOF Detected: \"{flawed_eval['single_points_of_failure'][0]}\")")

    print("\nALL PHASE 3.4 SYSTEM DESIGN WHITEBOARD TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_system_design_whiteboard()
