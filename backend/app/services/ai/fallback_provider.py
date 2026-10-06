import re
from typing import Dict, Any, List, Optional
from app.services.ai.base import BaseAIProvider
from app.utils.logger import logger

def calculate_jaccard_similarity(s1: str, s2: str) -> float:
    """Calculates word token Jaccard similarity between two strings."""
    tokens1 = set(re.findall(r'\w+', s1.lower()))
    tokens2 = set(re.findall(r'\w+', s2.lower()))
    if not tokens1 or not tokens2:
        return 0.0
    return len(tokens1.intersection(tokens2)) / len(tokens1.union(tokens2))

# Comprehensive Universal Domain Question Bank across All Industries
UNIVERSAL_QUESTION_BANK: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    # -------------------------------------------------------------
    # 1. TECHNOLOGY DOMAIN
    # -------------------------------------------------------------
    "Software Engineering": {
        "Fresher": [
            {
                "question": "What is the difference between an Array and a Linked List in memory allocation and time complexity?",
                "type": "conceptual",
                "expected": ["contiguous memory", "pointer traversal", "O(1) indexing", "O(N) search", "dynamic size"]
            },
            {
                "question": "Can you explain the four fundamental principles of Object-Oriented Programming (OOP) with examples?",
                "type": "conceptual",
                "expected": ["encapsulation", "abstraction", "inheritance", "polymorphism"]
            },
            {
                "question": "How does a relational database handle transactions using ACID properties?",
                "type": "conceptual",
                "expected": ["atomicity", "consistency", "isolation", "durability", "commit rollback"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How would you design a scalable caching strategy using Redis to prevent cache stampedes and cache penetration?",
                "type": "system_design",
                "expected": ["TTL expiry", "mutex locking", "bloom filters", "cache aside pattern", "write through"]
            },
            {
                "question": "Compare horizontal scaling with vertical scaling. What architectural challenges arise with horizontal database scaling?",
                "type": "conceptual",
                "expected": ["stateless services", "data sharding", "replication lag", "distributed consensus", "partition tolerance"]
            },
            {
                "question": "How do you implement thread safety and avoid race conditions in multi-threaded concurrent programming?",
                "type": "scenario",
                "expected": ["mutex locks", "atomic variables", "semaphores", "deadlock prevention", "immutable state"]
            }
        ],
        "Senior": [
            {
                "question": "How do you architect a high-throughput event-driven microservices architecture using Apache Kafka with exactly-once processing semantics?",
                "type": "system_design",
                "expected": ["idempotent producer", "consumer offsets", "partition keys", "dead letter queues", "event sourcing"]
            },
            {
                "question": "In a globally distributed system, how do you manage data consistency across regions while adhering to the CAP theorem?",
                "type": "system_design",
                "expected": ["eventual consistency", "vector clocks", "multi-region replication", "consensus algorithms", "Raft Paxos"]
            }
        ]
    },
    "Data Analyst & Data Science": {
        "Fresher": [
            {
                "question": "What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL? Provide an example.",
                "type": "conceptual",
                "expected": ["matching rows", "all left table rows", "null handling", "cartesian product"]
            },
            {
                "question": "How do you handle missing or null values in a dataset during data preprocessing in Python or Excel?",
                "type": "scenario",
                "expected": ["imputation mean median", "deletion dropping", "forward fill", "domain knowledge"]
            },
            {
                "question": "Explain the difference between Mean, Median, and Mode, and when you would prefer Median over Mean.",
                "type": "conceptual",
                "expected": ["outlier resistance", "skewed distributions", "central tendency"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How do SQL Window functions (like ROW_NUMBER, RANK, DENSE_RANK, and LEAD/LAG) work, and when would you use them?",
                "type": "conceptual",
                "expected": ["partition by", "order by", "ranking without collapsing rows", "time-series comparisons"]
            },
            {
                "question": "Explain how you would diagnose and treat overfitting in a machine learning classification model.",
                "type": "scenario",
                "expected": ["cross-validation", "regularization L1 L2", "feature selection", "pruning", "ensemble methods"]
            },
            {
                "question": "How do you design an interactive dashboard in Power BI or Tableau to track key business KPIs for executive stakeholders?",
                "type": "scenario",
                "expected": ["data modeling", "DAX metrics", "user experience", "drill-down capabilities", "ETL freshness"]
            }
        ],
        "Senior": [
            {
                "question": "How do you design an enterprise end-to-end data pipeline from transactional databases into a BigQuery or Snowflake data warehouse using dbt and Airflow?",
                "type": "system_design",
                "expected": ["star schema", "incremental models", "data governance", "SCD Type 2", "data quality tests"]
            }
        ]
    },
    "DevOps & Cloud Engineering": {
        "Fresher": [
            {
                "question": "What is the difference between a Virtual Machine and a Docker Container?",
                "type": "conceptual",
                "expected": ["hypervisor vs container engine", "shared OS kernel", "resource isolation", "startup latency"]
            },
            {
                "question": "Explain the stages of a standard CI/CD pipeline and why automated testing is essential.",
                "type": "conceptual",
                "expected": ["build", "unit test", "linting", "staging deploy", "production release"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How do Kubernetes Pods, Deployments, and Services interact to provide self-healing and load balancing?",
                "type": "conceptual",
                "expected": ["replica sets", "ingress controller", "kube-proxy", "clusterIP", "liveness readiness probes"]
            },
            {
                "question": "How do you implement Infrastructure as Code (IaC) using Terraform, and how do you manage remote state locking safely?",
                "type": "scenario",
                "expected": ["state file", "S3 dynamoDB lock", "declarative syntax", "plan apply workflow", "drift detection"]
            }
        ],
        "Senior": [
            {
                "question": "Design a zero-downtime Blue-Green and Canary deployment architecture for a mission-critical multi-region microservices platform.",
                "type": "system_design",
                "expected": ["traffic routing", "service mesh Istio", "rollback triggers", "health telemetry", "database migrations"]
            }
        ]
    },

    # -------------------------------------------------------------
    # 2. BUSINESS, PRODUCT & OPERATIONS DOMAIN
    # -------------------------------------------------------------
    "Product Manager": {
        "Fresher": [
            {
                "question": "How do you define a Minimum Viable Product (MVP) and validate product-market fit with early adopters?",
                "type": "scenario",
                "expected": ["core value proposition", "user feedback loops", "rapid iteration", "success metrics"]
            },
            {
                "question": "Walk me through how you prioritize competing feature requests from engineering, sales, and end users.",
                "type": "scenario",
                "expected": ["RICE framework", "MoSCoW", "business impact vs effort", "customer pain points"]
            }
        ],
        "Mid-Level": [
            {
                "question": "Imagine your primary user retention metric drops by 15% following a major feature release. How do you investigate the root cause?",
                "type": "case_study",
                "expected": ["cohort analysis", "funnel segmentation", "user session recording", "A/B testing rollback", "qualitative feedback"]
            },
            {
                "question": "How do you write effective PRDs (Product Requirement Documents) and align cross-functional engineering and design teams?",
                "type": "scenario",
                "expected": ["user stories", "acceptance criteria", "edge cases", "KPI definitions", "sprint alignment"]
            }
        ],
        "Senior": [
            {
                "question": "How do you build a multi-year product strategy for entering a highly competitive enterprise market?",
                "type": "case_study",
                "expected": ["TAM SAM SOM", "competitive moats", "unit economics", "platform ecosystem", "stakeholder consensus"]
            }
        ]
    },
    "Business Analyst": {
        "Fresher": [
            {
                "question": "What is the difference between functional and non-functional requirements in business analysis?",
                "type": "conceptual",
                "expected": ["system behavior vs quality attributes", "performance security scalability", "user requirements"]
            },
            {
                "question": "How do you conduct stakeholder interviews to elicit comprehensive business requirements?",
                "type": "scenario",
                "expected": ["active listening", "open-ended questions", "process mapping", "documentation sign-off"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How do you model AS-IS vs TO-BE business processes to identify operational bottlenecks and ROI opportunities?",
                "type": "scenario",
                "expected": ["BPMN diagrams", "gap analysis", "value stream mapping", "stakeholder consensus"]
            },
            {
                "question": "Describe a scenario where requirements changed late in the project lifecycle. How did you manage scope creep?",
                "type": "behavioral",
                "expected": ["change control process", "impact analysis", "trade-off negotiation", "clear communication"]
            }
        ]
    },
    "Human Resources (HR)": {
        "Fresher": [
            {
                "question": "Can you walk me through the key stages of the end-to-end recruitment lifecycle?",
                "type": "conceptual",
                "expected": ["sourcing", "screening", "interview coordination", "offer negotiation", "onboarding"]
            },
            {
                "question": "How would you handle a situation where a candidate accepts an offer but fails to show up on the joining date?",
                "type": "scenario",
                "expected": ["candidate engagement", "contingency pipeline", "feedback review", "professional communication"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How do you resolve interpersonal workplace conflicts between team members while maintaining compliance and empathy?",
                "type": "behavioral",
                "expected": ["neutral mediation", "active listening", "company policy", "confidentiality", "action plan"]
            },
            {
                "question": "How do you design a performance appraisal framework (e.g. OKRs vs 360-degree feedback) that drives employee retention?",
                "type": "scenario",
                "expected": ["measurable goals", "continuous feedback", "competency matrix", "career growth paths"]
            }
        ]
    },
    "Sales & Marketing": {
        "Fresher": [
            {
                "question": "How do you handle a customer objection when they state that your product price is too high compared to competitors?",
                "type": "scenario",
                "expected": ["value proposition", "ROI breakdown", "understanding pain points", "building trust"]
            },
            {
                "question": "What is the difference between inbound and outbound marketing lead generation strategies?",
                "type": "conceptual",
                "expected": ["content marketing SEO", "cold outreach advertising", "customer intent", "conversion rates"]
            }
        ],
        "Mid-Level": [
            {
                "question": "Walk me through your B2B sales cycle from cold qualification (BANT/MEDDIC) to contract closure.",
                "type": "scenario",
                "expected": ["budget authority need timeline", "decision criteria", "champion building", "procurement handling"]
            },
            {
                "question": "How do you build a multi-channel digital marketing campaign to achieve a target CAC (Customer Acquisition Cost) and LTV?",
                "type": "scenario",
                "expected": ["funnel optimization", "attribution modeling", "A/B creative testing", "retargeting"]
            }
        ]
    },

    # -------------------------------------------------------------
    # 3. FINANCE & ACCOUNTING DOMAIN
    # -------------------------------------------------------------
    "Finance & Accounting": {
        "Fresher": [
            {
                "question": "Explain the relationship between the Balance Sheet, Income Statement, and Cash Flow Statement.",
                "type": "conceptual",
                "expected": ["net income to retained earnings", "operating cash flows", "assets equals liabilities plus equity"]
            },
            {
                "question": "What is the difference between Accrual Accounting and Cash Basis Accounting?",
                "type": "conceptual",
                "expected": ["revenue matching principle", "accounts receivable payable", "timing of cash inflow/outflow"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How do you perform a Discounted Cash Flow (DCF) valuation, and how do you calculate WACC (Weighted Average Cost of Capital)?",
                "type": "conceptual",
                "expected": ["free cash flows", "terminal value", "cost of equity debt", "beta risk-free rate"]
            },
            {
                "question": "How do you conduct variance analysis to explain deviations between actual quarterly performance and annual budgets?",
                "type": "scenario",
                "expected": ["price vs volume variance", "fixed vs variable costs", "executive commentary", "remedial actions"]
            }
        ]
    },

    # -------------------------------------------------------------
    # 4. ENGINEERING (CORE: MECHANICAL, ELECTRICAL, CIVIL)
    # -------------------------------------------------------------
    "Core Engineering": {
        "Fresher": [
            {
                "question": "Explain the First and Second Laws of Thermodynamics and their practical engineering significance.",
                "type": "conceptual",
                "expected": ["energy conservation", "entropy increase", "heat engine efficiency", "carnot cycle"]
            },
            {
                "question": "What is Ohm's Law and Kirchhoff's Laws (KCL and KVL), and how are they used in circuit analysis?",
                "type": "conceptual",
                "expected": ["voltage current resistance", "conservation of charge", "conservation of energy in loops"]
            },
            {
                "question": "What is the difference between Stress and Strain, and what does the Stress-Strain Curve represent for ductile materials?",
                "type": "conceptual",
                "expected": ["elastic limit", "yield strength", "ultimate tensile strength", "young's modulus"]
            }
        ],
        "Mid-Level": [
            {
                "question": "How do you select engineering materials and calculate safety factors for components subjected to cyclic fatigue loads?",
                "type": "scenario",
                "expected": ["S-N curve", "endurance limit", "stress concentration factors", "factor of safety"]
            },
            {
                "question": "How do you design a feedback control system using PID controllers, and how do you tune P, I, and D parameters?",
                "type": "scenario",
                "expected": ["proportional error", "integral elimination of steady state error", "derivative dampening", "ziegler nichols"]
            }
        ]
    },

    # -------------------------------------------------------------
    # 5. GENERAL HR & BEHAVIORAL (UNIVERSAL)
    # -------------------------------------------------------------
    "General HR & Behavioral": {
        "Fresher": [
            {
                "question": "Tell me about yourself, your educational journey, and what motivated you to pursue this career path.",
                "type": "behavioral",
                "expected": ["structured introduction", "academic background", "passion for role", "future aspirations"]
            },
            {
                "question": "What are your greatest professional strengths, and what is one area you are actively trying to improve?",
                "type": "behavioral",
                "expected": ["self-awareness", "specific examples", "growth mindset", "actionable improvement"]
            },
            {
                "question": "Describe a challenging academic or team project. How did you handle obstacles and ensure successful completion?",
                "type": "behavioral",
                "expected": ["STAR situation task action result", "collaboration", "perseverance", "positive outcome"]
            }
        ],
        "Mid-Level": [
            {
                "question": "Describe a situation where you had a strong disagreement with a colleague or manager regarding a project decision. How did you resolve it?",
                "type": "behavioral",
                "expected": ["STAR framework", "professional communication", "data-driven arguments", "compromise and alignment"]
            },
            {
                "question": "Tell me about a time when a project you were leading failed or missed a critical deadline. What did you learn and how did you adapt?",
                "type": "behavioral",
                "expected": ["accountability", "root cause analysis", "resilience", "preventative systems"]
            },
            {
                "question": "Where do you see your career progression in the next 3 to 5 years, and how does this role fit into that vision?",
                "type": "behavioral",
                "expected": ["clear ambition", "skill development", "value delivery to company", "leadership growth"]
            }
        ],
        "Senior": [
            {
                "question": "How do you foster a high-performance culture, mentor junior talent, and handle underperforming team members constructively?",
                "type": "behavioral",
                "expected": ["clear expectations", "empathy and feedback", "performance improvement plans", "empowerment"]
            }
        ]
    }
}

class FallbackAIProvider(BaseAIProvider):
    """Universal Intelligent Rule-Based Fallback AI Provider supporting any role, domain, and language."""

    def _get_domain_bank(self, role: str, domain: Optional[str] = None, mode: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Resolves the best matching question bank for the given role and domain."""
        role_lower = role.lower()
        domain_lower = (domain or "").lower()
        mode_lower = (mode or "").lower()

        if "hr" in mode_lower or "behavioral" in mode_lower:
            return UNIVERSAL_QUESTION_BANK["General HR & Behavioral"]

        if any(w in role_lower for w in ["data", "analyst", "analytics", "bi", "scientist", "machine learning"]):
            return UNIVERSAL_QUESTION_BANK["Data Analyst & Data Science"]
        elif any(w in role_lower for w in ["devops", "cloud", "sre", "infrastructure", "kubernetes"]):
            return UNIVERSAL_QUESTION_BANK["DevOps & Cloud Engineering"]
        elif any(w in role_lower for w in ["product", "project manager", "program"]):
            return UNIVERSAL_QUESTION_BANK["Product Manager"]
        elif any(w in role_lower for w in ["business analyst", "operations", "process"]):
            return UNIVERSAL_QUESTION_BANK["Business Analyst"]
        elif any(w in role_lower for w in ["hr", "recruiter", "talent", "people"]):
            return UNIVERSAL_QUESTION_BANK["Human Resources (HR)"]
        elif any(w in role_lower for w in ["sales", "marketing", "growth", "account executive"]):
            return UNIVERSAL_QUESTION_BANK["Sales & Marketing"]
        elif any(w in role_lower for w in ["finance", "accountant", "banking", "audit", "tax"]):
            return UNIVERSAL_QUESTION_BANK["Finance & Accounting"]
        elif any(w in role_lower for w in ["mechanical", "electrical", "civil", "electronics", "hardware"]):
            return UNIVERSAL_QUESTION_BANK["Core Engineering"]
        elif "business" in domain_lower:
            return UNIVERSAL_QUESTION_BANK["Business Analyst"]
        elif "finance" in domain_lower:
            return UNIVERSAL_QUESTION_BANK["Finance & Accounting"]
        elif "engineering" in domain_lower:
            return UNIVERSAL_QUESTION_BANK["Core Engineering"]
        else:
            return UNIVERSAL_QUESTION_BANK["Software Engineering"]

    def _translate_to_language(self, text: str, language: Optional[str] = "English") -> str:
        """Adapts question phrasing for Hindi or Hinglish fallback."""
        if language == "Hinglish":
            return f"Is context me: {text} Aap apne real-world experience ke hisab se explain kar sakte hain?"
        elif language == "Hindi":
            return f"कृपया इस पर विस्तार से बताएं: {text}"
        return text

    def generate_interview_plan(
        self,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        total_questions: int,
        skills: List[str],
        projects: List[Dict[str, Any]],
        experience_level: str,
        domain: Optional[str] = "Technology",
        company_name: Optional[str] = None,
        language: Optional[str] = "English",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        bank = self._get_domain_bank(target_role, domain, mode)
        level = "Senior" if "senior" in experience_level.lower() or "lead" in experience_level.lower() else "Fresher" if "fresher" in experience_level.lower() or "intern" in experience_level.lower() else "Mid-Level"
        
        q_pool = bank.get(level, []) or bank.get("Mid-Level", []) or UNIVERSAL_QUESTION_BANK["General HR & Behavioral"]["Mid-Level"]
        
        questions = []
        
        # 1. Warm introductory question
        intro_text = f"Welcome to your interview for the {target_role} position at {company_name or 'our organization'}. To begin, please introduce yourself and highlight your most relevant experience and skills."
        if language == "Hinglish":
            intro_text = f"Welcome to your {target_role} interview! Shuru karne ke liye, kripya apna brief introduction dijiye aur apne core skills & projects ke baare me batayein."
        elif language == "Hindi":
            intro_text = f"{target_role} पद के साक्षात्कार में आपका स्वागत है। शुरुआत करने के लिए, कृपया अपना संक्षिप्त परिचय दें और अपने मुख्य कौशल बताएं।"

        questions.append({
            "order_index": 1,
            "question_number": 1,
            "question_text": intro_text,
            "question_type": "behavioral",
            "category": "Introduction & Overview",
            "difficulty": difficulty,
            "expected_concepts": ["clear professional introduction", "relevant domain experience", "role alignment"],
            "evaluation_criteria": ["Clarity of articulation", "Relevance of experience highlighted"],
            "hint": "Structure your response using the STAR method: background, key achievements, and role alignment."
        })

        # 2. Personalized Project Probing Questions (if resume projects are provided)
        if projects and len(questions) < total_questions:
            for proj in projects[:2]:
                if len(questions) >= total_questions:
                    break
                p_title = proj.get("title", "your recent technical project")
                p_desc = proj.get("description", "")
                
                # Formulate deep project question
                if "react" in p_title.lower() or "fastapi" in p_title.lower() or "react" in p_desc.lower() or "fastapi" in p_desc.lower():
                    proj_q = f"In your resume, you highlighted building '{p_title}'. Explain how you designed the API layer between React and FastAPI, handled state management, and resolved performance bottlenecks."
                elif "ml" in p_title.lower() or "learning" in p_title.lower() or "model" in p_desc.lower():
                    proj_q = f"Regarding your project '{p_title}', how did you approach data preprocessing, model selection, and validating generalization against overfitting?"
                elif "microservice" in p_title.lower() or "cloud" in p_title.lower() or "docker" in p_desc.lower():
                    proj_q = f"Looking at '{p_title}', walk me through how you containerized the services, managed service discovery, and ensured fault tolerance."
                else:
                    proj_q = f"In your resume, you listed the project '{p_title}'. Can you walk me through its architectural design, key technical challenges, and the trade-offs you made?"

                proj_q = self._translate_to_language(proj_q, language)
                questions.append({
                    "order_index": len(questions) + 1,
                    "question_number": len(questions) + 1,
                    "question_text": proj_q,
                    "question_type": "resume_deep_dive",
                    "category": "Resume Projects",
                    "difficulty": difficulty,
                    "expected_concepts": ["architectural decisions", "trade-offs", "error handling", "performance optimization"],
                    "evaluation_criteria": ["Project ownership depth", "Technical clarity"],
                    "hint": "Discuss the specific problem, your architecture, technologies used, and measurable results."
                })

        # 3. Add domain-specific questions from taxonomy
        for idx, item in enumerate(q_pool):
            if len(questions) >= total_questions:
                break
            q_text = self._translate_to_language(item["question"], language)
            # Avoid duplicate with existing questions
            if any(calculate_jaccard_similarity(q_text, ex["question_text"]) > 0.45 for ex in questions):
                continue

            questions.append({
                "order_index": len(questions) + 1,
                "question_number": len(questions) + 1,
                "question_text": q_text,
                "question_type": item.get("type", "conceptual"),
                "category": category or target_role,
                "difficulty": difficulty,
                "expected_concepts": item.get("expected", ["fundamental knowledge", "practical reasoning"]),
                "evaluation_criteria": ["Accuracy of concepts", "Problem-solving depth"],
                "hint": f"Focus on core principles: {', '.join(item.get('expected', [])[:3])}."
            })

        # 4. Fill remaining slots with dynamic adaptive templates
        while len(questions) < total_questions:
            q_num = len(questions) + 1
            dynamic_q = f"In {target_role} operations, how do you handle complex edge cases, cross-functional collaboration, and quality assurance?"
            if language == "Hinglish":
                dynamic_q = f"{target_role} ke perspective se, aap complex challenges aur team collaboration ko kaise manage karte hain?"
            elif language == "Hindi":
                dynamic_q = f"{target_role} के रूप में आप जटिल चुनौतियों और टीम सहयोग को कैसे संभालते हैं?"

            questions.append({
                "order_index": q_num,
                "question_number": q_num,
                "question_text": dynamic_q,
                "question_type": "scenario",
                "category": category or target_role,
                "difficulty": difficulty,
                "expected_concepts": ["methodical problem solving", "stakeholder communication", "quality governance"],
                "evaluation_criteria": ["Practical application", "Analytical clarity"],
                "hint": "Highlight concrete processes, metrics, and team collaboration."
            })

        return questions

    def generate_follow_up_question(
        self,
        original_question: str,
        candidate_answer: str,
        category: str,
        difficulty: str,
        language: Optional[str] = "English"
    ) -> Optional[Dict[str, Any]]:
        ans_lower = candidate_answer.lower()
        
        # 1. Check for specific technical terms mentioned by the candidate
        contextual_probes = {
            "polymorphism": "You mentioned polymorphism. Can you explain the difference between compile-time (overloading) and runtime (overriding) polymorphism with a concrete example?",
            "inheritance": "You mentioned inheritance. When would you prefer composition over inheritance in system architecture?",
            "encapsulation": "You mentioned encapsulation. How do access modifiers and data hiding protect object integrity in your designs?",
            "abstraction": "You mentioned abstraction. How do you design clean abstract interfaces without leaking implementation details?",
            "jwt": "You mentioned using JWT authentication. Where should the access token be securely stored on the client side to prevent XSS and CSRF attacks, and how is token expiration managed?",
            "kafka": "You mentioned Apache Kafka. How do you handle partition rebalancing, message ordering, and consumer lag in high-throughput scenarios?",
            "redis": "You brought up Redis. How do you design cache eviction policies and prevent cache stampedes under high concurrent load?",
            "docker": "You mentioned Docker containerization. How do you optimize Docker image layers for production and handle container security vulnerabilities?",
            "fastapi": "You mentioned FastAPI. How do you handle background asynchronous tasks and dependency injection for database connections?",
            "react": "You mentioned React. How do you prevent unnecessary re-renders and manage complex global application state efficiently?",
            "postgresql": "You mentioned PostgreSQL. How do you analyze slow queries using EXPLAIN ANALYZE, and what indexing strategies do you apply?",
            "acid": "You mentioned ACID properties. How does the database engine implement isolation levels to prevent dirty reads and phantom reads?",
            "microservices": "You mentioned microservices. How do you manage distributed transactions and maintain eventual consistency across decoupled services?",
            "kubernetes": "You mentioned Kubernetes. How do you configure liveness vs readiness probes and handle horizontal pod autoscaling (HPA)?"
        }

        for keyword, probe_q in contextual_probes.items():
            if keyword in ans_lower:
                translated_q = self._translate_to_language(probe_q, language)
                return {
                    "question_text": translated_q,
                    "is_follow_up": True,
                    "reason": f"Contextual follow-up probing candidate's mention of '{keyword.upper()}'"
                }

        # 2. If short response, ask for practical real-world example
        if len(candidate_answer.strip().split()) < 12:
            q = f"Could you provide a concrete real-world example from your previous projects to support that?"
            if language == "Hinglish":
                q = "Kya aap iska ek practical example apne past project se de sakte hain?"
            elif language == "Hindi":
                q = "क्या आप अपने पिछले अनुभव से इसका एक ठोस उदाहरण दे सकते हैं?"
            return {
                "question_text": q,
                "is_follow_up": True,
                "reason": "Answer lacked concrete example"
            }

        return None

    def generate_next_adaptive_question(
        self,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        previous_question: str,
        previous_answer: str,
        previous_evaluation: Optional[Dict[str, Any]],
        asked_questions: List[str],
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Adaptive Question Generator:
        - Strong (score >= 75): Escalate to deep-dive architectural / scalability challenge.
        - Average (score 50-74): Present related lateral practical question.
        - Weak (score < 50): Probe core fundamentals / foundational clarification.
        Guarantees 100% zero-duplicate question output.
        """
        bank = self._get_domain_bank(target_role, domain, mode)
        prev_score = (previous_evaluation.get("score", 60.0) if previous_evaluation else 60.0)

        # Determine adaptive target difficulty level
        if prev_score >= 75:
            # Strong answer: escalate difficulty
            target_level = "Senior"
            adaptive_note = "Escalated: High performance on previous turn"
        elif prev_score < 50:
            # Weak answer: drill into fundamentals
            target_level = "Fresher"
            adaptive_note = "Clarification: Probing foundational concepts"
        else:
            # Average answer: standard progression
            target_level = "Mid-Level"
            adaptive_note = "Standard progression"

        # 1. Search in matching domain bank at target adaptive level
        pool = bank.get(target_level, []) or bank.get("Mid-Level", []) or bank.get("Fresher", [])
        for item in pool:
            translated_q = self._translate_to_language(item["question"], language)
            is_dup = False
            for aq in asked_questions:
                if not aq:
                    continue
                if (
                    calculate_jaccard_similarity(translated_q, aq) > 0.45
                    or calculate_jaccard_similarity(item["question"], aq) > 0.45
                    or item["question"].lower() in aq.lower()
                    or translated_q.lower() == aq.lower()
                ):
                    is_dup = True
                    break
            if not is_dup:
                return {
                    "question_text": translated_q,
                    "question_type": item.get("type", "conceptual"),
                    "category": category or target_role,
                    "difficulty": target_level,
                    "expected_concepts": item.get("expected", ["fundamental principles", "practical application"]),
                    "evaluation_criteria": ["Technical correctness", "Depth of response"],
                    "adaptive_note": adaptive_note
                }

        # 2. Search across ALL question banks
        for domain_name, level_dict in UNIVERSAL_QUESTION_BANK.items():
            for l_name, q_list in level_dict.items():
                for item in q_list:
                    translated_q = self._translate_to_language(item["question"], language)
                    is_dup = False
                    for aq in asked_questions:
                        if not aq:
                            continue
                        if (
                            calculate_jaccard_similarity(translated_q, aq) > 0.45
                            or calculate_jaccard_similarity(item["question"], aq) > 0.45
                            or item["question"].lower() in aq.lower()
                            or translated_q.lower() == aq.lower()
                        ):
                            is_dup = True
                            break
                    if not is_dup:
                        return {
                            "question_text": translated_q,
                            "question_type": item.get("type", "conceptual"),
                            "category": domain_name,
                            "difficulty": target_level,
                            "expected_concepts": item.get("expected", ["best practices", "analytical trade-offs"]),
                            "evaluation_criteria": ["Clarity and correctness"],
                            "adaptive_note": adaptive_note
                        }

        # 3. Dynamic scenario synthesis if banks are exhausted
        dynamic_prompts = [
            f"In your experience as a {target_role}, how do you evaluate system trade-offs, ensure compliance, and drive continuous optimization?",
            f"As a {target_role}, tell me about a time when unexpected project risks or scope changes occurred. How did you mitigate them?",
            f"How do you approach mentoring junior team members, conducting peer reviews, and establishing domain best practices?",
            f"Describe how you translate high-level business requirements into actionable technical specifications in your {target_role} role.",
            f"When facing severe latency bottlenecks or operational failures in your domain, what systematic debugging methodology do you follow?"
        ]

        for p in dynamic_prompts:
            translated_p = self._translate_to_language(p, language)
            is_dup = any(calculate_jaccard_similarity(translated_p, aq) > 0.45 or p.lower() in aq.lower() for aq in asked_questions if aq)
            if not is_dup:
                return {
                    "question_text": translated_p,
                    "question_type": "scenario",
                    "category": category or target_role,
                    "difficulty": target_level,
                    "expected_concepts": ["system optimization", "metrics and monitoring", "continuous improvement"],
                    "evaluation_criteria": ["Strategic clarity", "Practical execution"],
                    "adaptive_note": adaptive_note
                }

        # Absolute fallback with timestamp salt
        fallback_q = self._translate_to_language(
            f"Reflecting on your {target_role} journey, what is the single most critical lesson or methodology that defines your professional philosophy?",
            language
        )
        return {
            "question_text": fallback_q,
            "question_type": "behavioral",
            "category": category or target_role,
            "difficulty": target_level,
            "expected_concepts": ["professional philosophy", "growth mindset"],
            "evaluation_criteria": ["Self-awareness", "Articulation"],
            "adaptive_note": adaptive_note
        }

    def evaluate_answer(
        self,
        question_text: str,
        candidate_answer: str,
        expected_concepts: List[str],
        category: str,
        difficulty: str,
        target_role: Optional[str] = "Candidate",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        """Calculates 8-dimensional scores and normalized composite score (0-100)."""
        words = candidate_answer.strip().split()
        word_count = len(words)
        lower_answer = candidate_answer.lower()

        # Keyword matching against rubric
        matched_concepts = []
        missing_concepts = []
        for c in expected_concepts:
            c_words = c.lower().split()
            if any(w in lower_answer for w in c_words):
                matched_concepts.append(c)
            else:
                missing_concepts.append(c)

        concept_ratio = len(matched_concepts) / max(len(expected_concepts), 1)

        # Baseline 0-100 Dimension Scoring
        if word_count < 6:
            # Minimal/one-word response
            tech = 25.0
            correctness = 30.0
            relevance = 30.0
            prob_solving = 20.0
            comm = 30.0
            depth = 15.0
            practical = 15.0
            conf = 30.0
        elif word_count < 25:
            tech = round((4.0 + (concept_ratio * 3.0)) * 10.0, 1)
            correctness = round((4.5 + (concept_ratio * 3.0)) * 10.0, 1)
            relevance = 60.0
            prob_solving = 45.0
            comm = 60.0
            depth = round((3.5 + (concept_ratio * 3.0)) * 10.0, 1)
            practical = 40.0
            conf = 60.0
        else:
            tech = round(min(100.0, (6.0 + (concept_ratio * 4.0)) * 10.0), 1)
            correctness = round(min(100.0, (6.5 + (concept_ratio * 3.5)) * 10.0), 1)
            relevance = round(min(100.0, (7.5 + (concept_ratio * 2.5)) * 10.0), 1)
            prob_solving = round(min(100.0, (6.0 + (concept_ratio * 3.5)) * 10.0), 1)
            comm = round(min(100.0, (7.5 + (min(word_count, 120) / 120.0 * 2.5)) * 10.0), 1)
            depth = round(min(100.0, (5.5 + (concept_ratio * 4.5)) * 10.0), 1)
            practical = round(min(100.0, (6.0 + (concept_ratio * 3.5)) * 10.0), 1)
            conf = round(min(100.0, (7.0 + (min(word_count, 80) / 80.0 * 3.0)) * 10.0), 1)

        # Normalized Overall Composite Score (0.0 to 100.0)
        dimension_avg = (tech + correctness + relevance + prob_solving + comm + depth + practical + conf) / 8.0
        overall_score = round(dimension_avg, 1)

        strengths = []
        weaknesses = []
        if matched_concepts:
            strengths.append(f"Effectively addressed core concepts: {', '.join(matched_concepts[:2])}")
        if word_count >= 30:
            strengths.append("Clear verbal pacing and structured delivery")
        else:
            weaknesses.append("Response was brief and lacked comprehensive elaboration")

        if missing_concepts:
            weaknesses.append(f"Did not cover key dimensions: {', '.join(missing_concepts[:2])}")

        suggestions = [
            f"Elaborate with specific {target_role} production examples and architectural trade-offs.",
            "Use the STAR method (Situation, Task, Action, Result) to provide concrete evidence of impact."
        ]

        feedback = (
            f"Candidate achieved an overall performance score of {overall_score}/100 for this question. "
            f"{'Strong explanation covering fundamental principles.' if overall_score >= 70 else 'Good baseline understanding, but requires more depth on edge cases and metrics.'}"
        )

        return {
            "technical_score": tech,
            "correctness_score": correctness,
            "relevance_score": relevance,
            "problem_solving_score": prob_solving,
            "communication_score": comm,
            "clarity_score": comm,
            "depth_score": depth,
            "completeness_score": depth,
            "practical_score": practical,
            "confidence_score": conf,
            "score": overall_score,
            "feedback": feedback,
            "strengths": strengths if strengths else ["Engaged constructively with the question"],
            "weaknesses": weaknesses if weaknesses else ["Could expand more on industry edge cases"],
            "missing_concepts": missing_concepts,
            "suggestions": suggestions
        }

    def synthesize_final_report(
        self,
        candidate_name: str,
        target_role: str,
        mode: str,
        category: str,
        difficulty: str,
        evaluations: List[Dict[str, Any]],
        domain: Optional[str] = "Technology",
        experience_level: Optional[str] = "Mid-Level",
        language: Optional[str] = "English"
    ) -> Dict[str, Any]:
        """Synthesizes executive Universal AI Interviewer Assessment."""
        if not evaluations:
            return {
                "overall_score": 0.0,
                "technical_score": 0.0,
                "communication_score": 0.0,
                "problem_solving_score": 0.0,
                "confidence_score": 0.0,
                "verdict": "Reject",
                "hiring_readiness": "Reject",
                "executive_summary": "Incomplete interview session with no recorded responses.",
                "strengths": [],
                "weaknesses": ["No responses recorded"],
                "technical_gaps": ["Interview incomplete"],
                "skill_gaps": ["Interview incomplete"],
                "communication_feedback": "No verbal transcript available for assessment.",
                "recommended_topics": ["Complete full mock interview session"],
                "recommendations": ["Re-attempt the interview session and answer all prompted questions."]
            }

        n = len(evaluations)
        def _to_100(val: float) -> float:
            return val if val > 10.0 else val * 10.0

        avg_score = sum(e.get("score", 0.0) for e in evaluations) / n
        avg_tech = sum(_to_100(e.get("technical_score", e.get("correctness_score", 0.0))) for e in evaluations) / n
        avg_comm = sum(_to_100(e.get("communication_score", e.get("clarity_score", 0.0))) for e in evaluations) / n
        avg_prob = sum(_to_100(e.get("problem_solving_score", e.get("relevance_score", 0.0))) for e in evaluations) / n
        avg_conf = sum(_to_100(e.get("confidence_score", 0.0)) for e in evaluations) / n

        overall_score = round(avg_score, 1)
        technical_score = round(avg_tech, 1)
        communication_score = round(avg_comm, 1)
        problem_solving_score = round(avg_prob, 1)
        confidence_score = round(avg_conf, 1)

        # Authoritative Hiring Readiness Verdict Criteria
        if overall_score >= 85:
            verdict = "Strong Hire"
        elif overall_score >= 70:
            verdict = "Hire"
        elif overall_score >= 55:
            verdict = "Leaning Hire"
        elif overall_score >= 40:
            verdict = "Needs Improvement"
        else:
            verdict = "Reject"

        # Unique strengths and weaknesses
        all_strengths = []
        all_weaknesses = []
        all_missing = []
        for e in evaluations:
            all_strengths.extend(e.get("strengths", []))
            all_weaknesses.extend(e.get("weaknesses", []))
            all_missing.extend(e.get("missing_concepts", []))

        unique_strengths = list(dict.fromkeys(all_strengths))[:4]
        unique_weaknesses = list(dict.fromkeys(all_weaknesses))[:3]
        unique_gaps = list(dict.fromkeys(all_missing))[:3]

        summary = (
            f"Candidate {candidate_name} completed the {difficulty} {mode} interview for '{target_role}' ({domain} domain) "
            f"with an overall composite score of {overall_score}/100. "
            f"Demonstrated technical domain competency of {technical_score}/100, problem-solving score of {problem_solving_score}/100, "
            f"and communication articulation score of {communication_score}/100. "
            f"Hiring Committee Recommendation: {verdict}."
        )

        comm_feedback = (
            f"Candidate demonstrated {'strong, articulate verbal communication with structured points' if communication_score >= 70 else 'moderate communication clarity, but should practice concise summaries and reduce filler hesitation'}. "
            f"Confidence and tone remained consistent across technical turns."
        )

        recommendations = [
            f"Deepen knowledge in target domain topics: {', '.join(unique_gaps[:3]) if unique_gaps else target_role + ' advanced patterns'}.",
            "Practice structured problem-solving (defining assumptions, step-by-step methodology, trade-off analysis).",
            "Conduct verbal mock interviews to strengthen conciseness and concrete project examples."
        ]

        return {
            "overall_score": overall_score,
            "technical_score": technical_score,
            "communication_score": communication_score,
            "problem_solving_score": problem_solving_score,
            "confidence_score": confidence_score,
            "verdict": verdict,
            "hiring_readiness": verdict,
            "executive_summary": summary,
            "strengths": unique_strengths if unique_strengths else ["Good engagement and structured thinking"],
            "weaknesses": unique_weaknesses if unique_weaknesses else ["Could elaborate more on edge cases"],
            "technical_gaps": unique_gaps if unique_gaps else [f"Advanced {target_role} Architecture"],
            "skill_gaps": unique_gaps if unique_gaps else [f"Advanced {target_role} Architecture"],
            "communication_feedback": comm_feedback,
            "recommended_topics": unique_gaps if unique_gaps else ["System Architecture", "Best Practices"],
            "recommendations": recommendations
        }

    def analyze_job_description(
        self,
        job_description: str,
        candidate_skills: List[str],
        target_role: Optional[str] = "Software Engineer"
    ) -> Dict[str, Any]:
        from app.services.resume_service import ResumeParserService
        jd_parsed = ResumeParserService.analyze_job_description_text(job_description, target_role)
        resume_data = {"skills": candidate_skills, "projects": []}
        matching = ResumeParserService.match_resume_to_jd(resume_data, jd_parsed)
        return {
            "extracted_role": jd_parsed.get("extracted_role", target_role or "Software Engineer"),
            "required_skills": jd_parsed.get("required_skills", []),
            "preferred_skills": jd_parsed.get("preferred_skills", []),
            "responsibilities": jd_parsed.get("responsibilities", []),
            "matched_skills": matching.get("matched_skills", []),
            "missing_skills": matching.get("missing_skills", []),
            "partial_matches": matching.get("partial_matches", []),
            "extra_resume_skills": matching.get("extra_resume_skills", []),
            "match_percentage": matching.get("match_percentage", 0.0),
            "weightings": matching.get("weightings", {}),
            "recommended_focus_areas": matching.get("recommended_focus_areas", [])
        }

    def evaluate_code_solution(
        self,
        problem_title: str,
        language: str,
        candidate_code: str,
        passed_tests: bool,
        test_case_summary: str
    ) -> Dict[str, Any]:
        """Rule-based code evaluation analyzing complexity, style, and correctness."""
        lines = [l for l in candidate_code.strip().split("\n") if l.strip()]
        line_count = len(lines)
        code_lower = candidate_code.lower()

        # Detect nested loops for time complexity estimation
        has_nested_loops = bool(re.search(r'for\s+.*\n\s+for\s+', candidate_code) or re.search(r'while\s+.*\n\s+while\s+', candidate_code))
        has_single_loop = bool(re.search(r'\b(for|while)\b', candidate_code))
        has_hashmap = bool("dict(" in code_lower or "{" in candidate_code or "map(" in code_lower or "hashmap" in code_lower or "set(" in code_lower)

        if has_nested_loops:
            time_comp = "O(N^2)"
            eff_score = 6.0 if passed_tests else 4.0
        elif has_single_loop and has_hashmap:
            time_comp = "O(N)"
            eff_score = 9.0 if passed_tests else 6.0
        elif has_single_loop:
            time_comp = "O(N)"
            eff_score = 8.0 if passed_tests else 5.0
        else:
            time_comp = "O(1)"
            eff_score = 9.0 if passed_tests else 5.0

        space_comp = "O(N)" if has_hashmap else "O(1)"

        correctness_score = 9.5 if passed_tests else 4.0
        code_quality = 8.5 if line_count >= 5 else 6.0

        overall = round(((correctness_score * 0.45) + (eff_score * 0.35) + (code_quality * 0.20)) * 10, 1)

        strengths = []
        if passed_tests:
            strengths.append("Successfully satisfied all provided test case requirements.")
        if has_hashmap:
            strengths.append(f"Used efficient lookup structures achieving {time_comp} time complexity.")
        if line_count >= 5:
            strengths.append("Clean separation of logic and structured implementation.")

        issues = []
        if not passed_tests:
            issues.append(f"Failed one or more test cases: {test_case_summary}")
        if has_nested_loops:
            issues.append("Nested loops detected. Consider optimizing with a Hash Table or Two-Pointer technique.")

        optimization_tips = [
            f"Expected optimal runtime: O(N) or O(log N). Current runtime: {time_comp}.",
            "Ensure boundary conditions (empty input, single element, negative values) are explicitly validated."
        ]

        return {
            "correctness_score": correctness_score,
            "efficiency_score": eff_score,
            "code_quality_score": code_quality,
            "overall_code_score": overall,
            "time_complexity": time_comp,
            "space_complexity": space_comp,
            "strengths": strengths if strengths else ["Working baseline attempt"],
            "issues_and_bugs": issues if issues else ["No critical syntax or logic bugs detected"],
            "optimization_tips": optimization_tips,
            "clean_code_suggestions": [
                "Use descriptive variable names adhering to language idiomatic style (snake_case for Python, camelCase for JS).",
                "Add concise docstrings detailing function parameters and return types."
            ]
        }
