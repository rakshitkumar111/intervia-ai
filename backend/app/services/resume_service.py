import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.utils.logger import logger

# Comprehensive Technology & Skill Taxonomy
SKILL_TAXONOMY = {
    # Programming Languages
    "Python": ["python", "py", "python3", "cpython"],
    "Java": ["java", "j2ee", "spring boot", "spring"],
    "C++": ["c++", "cpp"],
    "C": ["\\bc\\b", "c language"],
    "C#": ["c#", "csharp", ".net"],
    "JavaScript": ["javascript", "js", "ecmascript", "es6"],
    "TypeScript": ["typescript", "ts"],
    "Go": ["\\bgo\\b", "golang"],
    "Rust": ["rust", "rustlang"],
    "PHP": ["php", "laravel"],
    "Ruby": ["ruby", "rails", "ruby on rails"],
    "Kotlin": ["kotlin", "android"],
    "Swift": ["swift", "ios development"],
    "SQL": ["sql", "mysql", "postgresql", "sqlite", "oracle sql", "plsql"],
    
    # Web & Fullstack Frameworks
    "React": ["react", "react.js", "reactjs", "react-native"],
    "Next.js": ["next.js", "nextjs"],
    "Node.js": ["node", "node.js", "nodejs", "express", "express.js"],
    "Angular": ["angular", "angularjs"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "FastAPI": ["fastapi"],
    "Django": ["django", "drf", "django rest framework"],
    "Flask": ["flask"],
    "Tailwind CSS": ["tailwind", "tailwindcss"],
    "HTML/CSS": ["html", "html5", "css", "css3", "sass", "scss"],
    "GraphQL": ["graphql", "apollo"],
    "REST API": ["rest", "restful", "rest api", "apis"],

    # Databases & Storage
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "nosql", "mongoose"],
    "Redis": ["redis", "in-memory cache"],
    "Elasticsearch": ["elasticsearch", "elastic search"],
    "Cassandra": ["cassandra"],
    "SQLite": ["sqlite", "sqlite3"],
    "Firebase": ["firebase", "firestore"],

    # AI, ML & Data Science
    "Machine Learning": ["machine learning", "ml", "supervised learning", "unsupervised learning"],
    "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "lstm", "transformers"],
    "PyTorch": ["pytorch", "torch"],
    "TensorFlow": ["tensorflow", "keras"],
    "Scikit-Learn": ["scikit-learn", "sklearn"],
    "NLP": ["nlp", "natural language processing", "spacy", "nltk", "bert", "llm", "genai", "generative ai"],
    "Computer Vision": ["computer vision", "opencv", "yolo", "image processing"],
    "Pandas & NumPy": ["pandas", "numpy", "matplotlib", "seaborn"],

    # DevOps, Cloud & Architecture
    "Docker": ["docker", "containerization"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "Google Cloud": ["gcp", "google cloud platform", "bigquery"],
    "Azure": ["azure", "microsoft azure"],
    "CI/CD": ["ci/cd", "github actions", "jenkins", "gitlab ci"],
    "Git": ["git", "github", "gitlab", "bitbucket"],
    "Microservices": ["microservices", "service-oriented architecture", "soa"],
    "Linux": ["linux", "unix", "ubuntu", "bash", "shell scripting"],

    # Core Computer Science & Security
    "Data Structures & Algorithms": ["data structures", "algorithms", "dsa", "leetcode"],
    "Object-Oriented Programming": ["oop", "oops", "object oriented programming", "polymorphism", "inheritance"],
    "Operating Systems": ["operating systems", "os", "multithreading", "concurrency", "deadlock"],
    "Computer Networks": ["computer networks", "tcp/ip", "http", "https", "dns", "osi model"],
    "Cybersecurity": ["cybersecurity", "information security", "penetration testing", "owasp", "cryptography"]
}

SKILL_CATEGORIES = {
    "programming_languages": ["Python", "Java", "C++", "C", "C#", "JavaScript", "TypeScript", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "SQL"],
    "frameworks": ["React", "Next.js", "Node.js", "Angular", "Vue.js", "FastAPI", "Django", "Flask", "Tailwind CSS", "HTML/CSS", "GraphQL", "REST API"],
    "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "SQLite", "Firebase"],
    "tools": ["Git", "Docker", "Kubernetes", "Linux", "CI/CD"],
    "cloud_devops": ["AWS", "Google Cloud", "Azure", "Microservices", "Docker", "Kubernetes", "CI/CD"],
    "ai_ml": ["Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Scikit-Learn", "NLP", "Computer Vision", "Pandas & NumPy"]
}

class ResumeParserService:
    @staticmethod
    def extract_text_from_file(file_path: Path) -> str:
        """Extracts plain text from PDF, DOCX, or text files."""
        suffix = file_path.suffix.lower()
        extracted_text = ""

        try:
            if suffix == ".pdf":
                # Try pypdf first
                try:
                    import pypdf
                    reader = pypdf.PdfReader(str(file_path))
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            extracted_text += text + "\n"
                except Exception as e:
                    logger.warning(f"pypdf failed on {file_path}, trying pdfplumber: {e}")
                
                # If text is still empty, fallback to pdfplumber
                if not extracted_text.strip():
                    try:
                        import pdfplumber
                        with pdfplumber.open(str(file_path)) as pdf:
                            for page in pdf.pages:
                                page_text = page.extract_text()
                                if page_text:
                                    extracted_text += page_text + "\n"
                    except Exception as e:
                        logger.error(f"pdfplumber also failed: {e}")

            elif suffix in [".docx", ".doc"]:
                try:
                    import docx
                    doc = docx.Document(str(file_path))
                    paragraphs = [p.text for p in doc.paragraphs if p.text]
                    for table in doc.tables:
                        for row in table.rows:
                            for cell in row.cells:
                                if cell.text.strip():
                                    paragraphs.append(cell.text.strip())
                    extracted_text = "\n".join(paragraphs)
                except Exception as e:
                    logger.error(f"docx extraction error: {e}")

            elif suffix in [".txt", ".md", ".json"]:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()

        except Exception as e:
            logger.error(f"General extraction error for {file_path}: {e}")

        return extracted_text.strip()

    @classmethod
    def analyze_resume(cls, text: str, filename: str) -> Dict[str, Any]:
        """Performs structured NLP analysis and skill extraction from resume text."""
        lower_text = text.lower()
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # 1. Extract Candidate Name
        candidate_name = ""
        for line in lines[:5]:
            # Look for line that looks like a name (2-4 words, alphabetic, not heading)
            if not re.search(r'(resume|curriculum|vitae|email|phone|contact|profile|skills|github|linkedin|education)', line, re.IGNORECASE):
                words = line.split()
                if 2 <= len(words) <= 4 and all(re.match(r'^[A-Za-z\.]+$', w) for w in words):
                    candidate_name = line.strip()
                    break
        if not candidate_name and lines:
            candidate_name = lines[0][:50]

        # 2. Match Skills across Taxonomy
        detected_skills = []
        for skill_name, patterns in SKILL_TAXONOMY.items():
            for pat in patterns:
                if pat.startswith("\\b") or pat.endswith("\\b"):
                    if re.search(pat, lower_text):
                        detected_skills.append(skill_name)
                        break
                else:
                    pattern = r'\b' + re.escape(pat) + r'\b'
                    if re.search(pattern, lower_text):
                        detected_skills.append(skill_name)
                        break

        # Categorize detected skills
        programming_languages = [s for s in detected_skills if s in SKILL_CATEGORIES["programming_languages"]]
        frameworks = [s for s in detected_skills if s in SKILL_CATEGORIES["frameworks"]]
        databases = [s for s in detected_skills if s in SKILL_CATEGORIES["databases"]]
        tools = [s for s in detected_skills if s in SKILL_CATEGORIES["tools"]]
        cloud_devops = [s for s in detected_skills if s in SKILL_CATEGORIES["cloud_devops"]]
        ai_ml = [s for s in detected_skills if s in SKILL_CATEGORIES["ai_ml"]]

        # 3. Extract Education entries
        education_entries = []
        edu_keywords = ["b.tech", "btech", "bachelor", "b.e.", "b.s.", "m.tech", "master", "mca", "bca", "computer science", "information technology", "phd", "diploma", "degree", "university", "college", "institute"]
        for line in lines:
            line_lower = line.lower()
            for kw in edu_keywords:
                if kw in line_lower:
                    clean_line = re.sub(r'^[•\-\*]\s*', '', line).strip()
                    if clean_line and clean_line not in [e["degree"] for e in education_entries]:
                        education_entries.append({
                            "degree": clean_line[:120],
                            "keyword": kw.upper()
                        })
                    break
        if not education_entries and "degree" in lower_text:
            education_entries.append({"degree": "Bachelor of Technology in Computer Science", "keyword": "B.TECH"})

        # 4. Extract Projects hints
        project_entries = []
        in_project_section = False
        for line in lines:
            if re.search(r'^(projects?|featured projects|academic projects|key projects|notable projects|personal projects|technical projects)', line, re.IGNORECASE):
                in_project_section = True
                continue
            if in_project_section:
                if re.search(r'^(skills|education|experience|professional experience|work history|certifications|achievements|contact|languages)', line, re.IGNORECASE):
                    in_project_section = False
                    continue
                if len(line) > 10:
                    clean_line = re.sub(r'^[•\-\*0-9\.]+\s*', '', line).strip()
                    if len(clean_line) > 12:
                        title = clean_line.split(":")[0][:80] if ":" in clean_line else clean_line.split("–")[0].split("-")[0][:80]
                        desc = clean_line[:250]
                        project_entries.append({
                            "title": title.strip(),
                            "description": desc
                        })
                if len(project_entries) >= 6:
                    break

        # 5. Extract Certifications
        certifications = []
        cert_matches = re.findall(r'(certified [a-zA-Z0-9\s]+|aws [a-zA-Z\s]+|google cloud [a-zA-Z\s]+|azure [a-zA-Z\s]+|coursera [a-zA-Z\s]+|oracle [a-zA-Z\s]+|kubernetes [a-zA-Z\s]+)', text, re.IGNORECASE)
        for c in cert_matches:
            c_clean = c.strip()
            if len(c_clean) > 5 and c_clean not in certifications:
                certifications.append(c_clean[:80])

        # Also search in certification sections
        in_cert_section = False
        for line in lines:
            if re.search(r'^(certifications?|licenses?|professional certifications|certificates|certifications & achievements)', line, re.IGNORECASE):
                in_cert_section = True
                continue
            if in_cert_section:
                if re.search(r'^(skills|education|experience|projects|contact|languages)', line, re.IGNORECASE):
                    in_cert_section = False
                    continue
                clean_line = re.sub(r'^[•\-\*0-9\.]+\s*', '', line).strip()
                if len(clean_line) > 5 and clean_line not in certifications:
                    certifications.append(clean_line[:80])
                if len(certifications) >= 5:
                    break

        # 6. Extract Experience / Internships
        experience_entries = []
        exp_matches = re.findall(r'(\b(?:intern|internship|software engineer|developer|analyst|trainee|lead|architect|consultant)\b[^\n]{0,100})', text, re.IGNORECASE)
        for exp in exp_matches[:5]:
            clean_exp = exp.strip()
            if len(clean_exp) > 8 and clean_exp not in [e["role"] for e in experience_entries]:
                experience_entries.append({
                    "role": clean_exp[:80],
                    "details": clean_exp
                })

        # 7. Extract Achievements
        achievements = []
        in_achieve_section = False
        for line in lines:
            if re.search(r'^(achievements?|awards?|honors?|publications?|extracurricular|certifications & achievements)', line, re.IGNORECASE):
                in_achieve_section = True
                continue
            if in_achieve_section:
                if re.search(r'^(skills|education|experience|projects|contact)', line, re.IGNORECASE):
                    in_achieve_section = False
                    continue
                clean_line = re.sub(r'^[•\-\*0-9\.]+\s*', '', line).strip()
                if len(clean_line) > 8:
                    achievements.append(clean_line[:150])
                if len(achievements) >= 4:
                    break

        # 8. Suggested Domain mapping
        suggested_domains = []
        if any(s in detected_skills for s in ["React", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", "Vue.js"]):
            suggested_domains.append("Frontend & Fullstack Development")
        if any(s in detected_skills for s in ["FastAPI", "Django", "Flask", "Node.js", "Java", "Go", "SQL", "PostgreSQL"]):
            suggested_domains.append("Backend & API Engineering")
        if any(s in detected_skills for s in ["Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "NLP", "Computer Vision"]):
            suggested_domains.append("AI / Machine Learning")
        if any(s in detected_skills for s in ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"]):
            suggested_domains.append("Cloud & DevOps Engineering")
        if any(s in detected_skills for s in ["Data Structures & Algorithms", "C++", "Java", "Object-Oriented Programming"]):
            suggested_domains.append("Core Software Development & Problem Solving")
        if not suggested_domains:
            suggested_domains.append("General Software Engineering")

        summary = f"Candidate {candidate_name or 'Profile'} with {len(detected_skills)} identified competencies. Core strengths: {', '.join(detected_skills[:6]) if detected_skills else 'Software Engineering Fundamentals'}."

        return {
            "filename": filename,
            "name": candidate_name,
            "skills": detected_skills,
            "programming_languages": programming_languages,
            "frameworks": frameworks,
            "databases": databases,
            "tools": tools,
            "cloud_devops": cloud_devops,
            "ai_ml": ai_ml,
            "education": education_entries,
            "projects": project_entries,
            "experience": experience_entries,
            "certifications": certifications,
            "achievements": achievements,
            "suggested_domains": suggested_domains,
            "summary": summary
        }

    @classmethod
    def analyze_job_description_text(cls, jd_text: str, target_role: Optional[str] = None) -> Dict[str, Any]:
        """Extracts required skills, preferred skills, responsibilities, and experience from JD text."""
        lower_text = jd_text.lower()
        lines = [line.strip() for line in jd_text.split("\n") if line.strip()]

        # 1. Extracted Role
        extracted_role = target_role or "Software Engineer"
        for line in lines[:6]:
            if re.search(r'\b(engineer|developer|architect|analyst|manager|specialist|lead|consultant)\b', line, re.IGNORECASE):
                extracted_role = re.sub(r'^(job title|role|position|opening)[:\s-]*', '', line, flags=re.IGNORECASE).strip()[:60]
                break

        # 2. Extract Technologies & Required Skills
        matched_skills = []
        for skill_name, patterns in SKILL_TAXONOMY.items():
            for pat in patterns:
                if pat.startswith("\\b") or pat.endswith("\\b"):
                    if re.search(pat, lower_text):
                        matched_skills.append(skill_name)
                        break
                else:
                    pattern = r'\b' + re.escape(pat) + r'\b'
                    if re.search(pattern, lower_text):
                        matched_skills.append(skill_name)
                        break

        # Distinguish required vs preferred skills
        required_skills = matched_skills[:min(8, len(matched_skills))]
        preferred_skills = matched_skills[8:14] if len(matched_skills) > 8 else [s for s in ["Docker", "Kubernetes", "GraphQL", "Redis", "CI/CD"] if s not in required_skills][:3]

        # 3. Extract Responsibilities
        responsibilities = []
        in_resp_section = False
        for line in lines:
            if re.search(r'^(responsibilities|what you.ll do|key tasks|duties|the role)', line, re.IGNORECASE):
                in_resp_section = True
                continue
            if in_resp_section:
                if re.search(r'^(requirements|qualifications|skills|who you are|benefits)', line, re.IGNORECASE):
                    in_resp_section = False
                    continue
                clean_line = re.sub(r'^[•\-\*]\s*', '', line).strip()
                if len(clean_line) > 15:
                    responsibilities.append(clean_line[:180])
                if len(responsibilities) >= 5:
                    break

        if not responsibilities:
            responsibilities = [
                f"Design, build, and maintain efficient, reusable, and reliable code for {extracted_role}.",
                "Collaborate with cross-functional teams to define architecture and deliver scalable features.",
                "Ensure high performance, security, and quality standards across deployed applications."
            ]

        # 4. Experience Requirements
        exp_match = re.search(r'(\d+[\+\-–\sto]*\d*\s*(?:years?|yrs?)(?:\s*of)?\s*experience)', jd_text, re.IGNORECASE)
        experience_requirement = exp_match.group(1).strip() if exp_match else "3+ years of professional experience"

        return {
            "extracted_role": extracted_role,
            "required_skills": required_skills or ["Python", "SQL", "REST API", "Git"],
            "preferred_skills": preferred_skills,
            "responsibilities": responsibilities,
            "technologies": matched_skills,
            "experience_requirements": experience_requirement
        }

    @classmethod
    def match_resume_to_jd(
        cls,
        resume_data: Dict[str, Any],
        jd_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Performs 4-way matching between resume competencies and job requirements:
        - MATCHED_SKILLS
        - MISSING_SKILLS
        - PARTIAL_MATCHES
        - EXTRA_RESUME_SKILLS
        Calculates Skill Match Score / 100 and dynamic interview plan weights.
        """
        resume_skills = set(resume_data.get("skills", []))
        jd_req_skills = set(jd_data.get("required_skills", []))
        jd_pref_skills = set(jd_data.get("preferred_skills", []))
        all_jd_skills = jd_req_skills.union(jd_pref_skills)

        # 1. Matched Skills (Strict intersection)
        matched_skills = sorted(list(resume_skills.intersection(jd_req_skills)))
        
        # 2. Partial Matches (Intersection with preferred skills or related categories)
        partial_matches = sorted(list(resume_skills.intersection(jd_pref_skills)))
        
        # 3. Missing Skills (In JD requirements but not found on resume)
        missing_skills = sorted(list(jd_req_skills - resume_skills))
        
        # 4. Extra Resume Skills (On resume but not specified in JD)
        extra_resume_skills = sorted(list(resume_skills - all_jd_skills))

        # 5. Calculate Weighted Match Score
        if jd_req_skills:
            req_score = (len(matched_skills) / len(jd_req_skills)) * 75.0
            pref_score = (len(partial_matches) / max(1, len(jd_pref_skills))) * 25.0
            match_percentage = round(min(100.0, req_score + pref_score), 1)
        elif resume_skills:
            match_percentage = 80.0
        else:
            match_percentage = 50.0

        # 6. Dynamic Personalized Interview Plan Weightings based on JD & Resume
        has_projects = bool(resume_data.get("projects"))
        weightings = {
            "resume_projects": 25 if has_projects else 10,
            "required_skills": 30,
            "technical_questions": 20,
            "problem_solving": 10,
            "behavioral": 10,
            "communication": 5
        }

        # Normalize weights to sum to 100
        total_w = sum(weightings.values())
        if total_w != 100:
            diff = 100 - total_w
            weightings["technical_questions"] += diff

        # Recommended Focus Areas
        focus_areas = []
        if missing_skills:
            focus_areas.extend([f"Assess fundamentals of missing requirement: {s}" for s in missing_skills[:3]])
        if matched_skills:
            focus_areas.extend([f"Deep-dive into verified core competency: {s}" for s in matched_skills[:3]])
        if resume_data.get("projects"):
            focus_areas.append("Probe architecture & trade-offs in candidate's documented projects")

        return {
            "extracted_role": jd_data.get("extracted_role", "Software Engineer"),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "partial_matches": partial_matches,
            "extra_resume_skills": extra_resume_skills,
            "match_percentage": match_percentage,
            "weightings": weightings,
            "recommended_focus_areas": focus_areas
        }
