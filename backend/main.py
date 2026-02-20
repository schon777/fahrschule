import base64
import hashlib
import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "app.db")
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


CONFIG = load_config()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY,
            name TEXT,
            topic_area TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            topic_id TEXT,
            type TEXT,
            data TEXT,
            explanation TEXT,
            source_ref TEXT,
            tags TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS attempts (
            id TEXT PRIMARY KEY,
            username TEXT,
            question_id TEXT,
            selected TEXT,
            correct INTEGER,
            graded_by_user INTEGER,
            timestamp TEXT,
            time_ms INTEGER
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            username TEXT,
            title TEXT,
            start TEXT,
            end TEXT,
            notes TEXT,
            category TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def seed_data():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS count FROM questions")
    if cur.fetchone()["count"] > 0:
        conn.close()
        return

    topics = [
        {"id": "netzwerk", "name": "Netzwerk Grundlagen", "topic_area": "netzwerk"},
        {"id": "elektro", "name": "Elektrotechnik", "topic_area": "elektrotechnik"},
        {"id": "it", "name": "IT Systeme", "topic_area": "it-systeme"},
    ]

    questions = [
        {
            "id": "q1",
            "topicId": "netzwerk",
            "type": "multi",
            "prompt": "Welche Aussagen zu IPv4 sind korrekt?",
            "options": [
                "IPv4 nutzt 32 Bit Adressen",
                "IPv4 hat 128 Bit Adressen",
                "Private Netze nutzen z.B. 192.168.0.0/16",
                "IPv4 kann keine Subnetze nutzen",
            ],
            "correctIndexes": [0, 2],
            "explanation": "IPv4 nutzt 32 Bit und private Netze sind definiert.",
            "source_ref": "Library/Netzwerk/Grundlagen/ip-adressierung-v4-v6.md",
        },
        {
            "id": "q2",
            "topicId": "netzwerk",
            "type": "multi",
            "prompt": "Welche Protokolle sind Layer 2?",
            "options": ["Ethernet", "IP", "TCP", "ARP"],
            "correctIndexes": [0, 3],
            "explanation": "Ethernet und ARP arbeiten am Link Layer.",
            "source_ref": "Library/Netzwerk/Grundlagen/osi-tcpip-ethernet.md",
        },
        {
            "id": "q3",
            "topicId": "elektro",
            "type": "multi",
            "prompt": "Welche Aussagen zum Ohmschen Gesetz stimmen?",
            "options": ["U = R * I", "I = U / R", "R = U * I", "R = U / I"],
            "correctIndexes": [0, 1, 3],
            "explanation": "Ohmsches Gesetz: U = R * I.",
            "source_ref": "Library/Elektrotechnik/Grundlagen/spannung-strom-ohm.md",
        },
        {
            "id": "q4",
            "topicId": "elektro",
            "type": "multi",
            "prompt": "Welche Schutzeinrichtungen koennen Fehlerstrom erfassen?",
            "options": ["RCD", "LS Schalter", "FI", "NH Sicherung"],
            "correctIndexes": [0, 2],
            "explanation": "RCD und FI sind Fehlerstromschutz.",
            "source_ref": "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md",
        },
        {
            "id": "q5",
            "topicId": "it",
            "type": "multi",
            "prompt": "Welche Aussagen zur CIA Triad sind korrekt?",
            "options": [
                "C steht fuer Confidentiality",
                "I steht fuer Integrity",
                "A steht fuer Availability",
                "C steht fuer Compliance",
            ],
            "correctIndexes": [0, 1, 2],
            "explanation": "CIA Triad: Confidentiality, Integrity, Availability.",
            "source_ref": "Library/IT-Systeme/Grundlagen/cia-triad-datenschutz-datensicherheit.md",
        },
        {
            "id": "q6",
            "topicId": "it",
            "type": "multi",
            "prompt": "Welche Aussagen zu Backups stimmen?",
            "options": [
                "3-2-1 Regel: 3 Kopien auf 2 Medien, 1 extern",
                "RAID ist immer ein Backup",
                "Backups sollten regelmaessig getestet werden",
                "Snapshots ersetzen alle Backups",
            ],
            "correctIndexes": [0, 2],
            "explanation": "RAID ist kein Backup, Tests sind wichtig.",
            "source_ref": "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md",
        },
        {
            "id": "tf1",
            "topicId": "netzwerk",
            "type": "truefalse",
            "prompt": "IPv4 nutzt 32 Bit Adressen.",
            "correctBoolean": True,
            "explanation": "IPv4 ist 32 Bit.",
            "source_ref": "Library/Netzwerk/Grundlagen/ip-adressierung-v4-v6.md",
        },
        {
            "id": "tf2",
            "topicId": "netzwerk",
            "type": "truefalse",
            "prompt": "VLANs arbeiten auf Layer 3.",
            "correctBoolean": False,
            "explanation": "VLANs sind Layer 2 Segmentierung.",
            "source_ref": "Library/Netzwerk/VLAN/vlan-grundlagen-trunk-tagging.md",
        },
        {
            "id": "tf3",
            "topicId": "elektro",
            "type": "truefalse",
            "prompt": "RCD und FI sind Fehlerstromschutz.",
            "correctBoolean": True,
            "explanation": "RCD/FI sind Fehlerstromschutz.",
            "source_ref": "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md",
        },
        {
            "id": "tf4",
            "topicId": "elektro",
            "type": "truefalse",
            "prompt": "Der Schutzleiter darf geschaltet werden.",
            "correctBoolean": False,
            "explanation": "Der Schutzleiter darf nicht geschaltet werden.",
            "source_ref": "Library/Elektrotechnik/Sicherheit/fuenf-sicherheitsregeln.md",
        },
        {
            "id": "tf5",
            "topicId": "it",
            "type": "truefalse",
            "prompt": "RAID ersetzt ein Backup.",
            "correctBoolean": False,
            "explanation": "RAID ist kein Backup.",
            "source_ref": "Library/IT-Systeme/Dienste/raid-grundlagen.md",
        },
        {
            "id": "m1",
            "topicId": "netzwerk",
            "type": "matching",
            "prompt": "Match protocol to function.",
            "pairs": [
                {"left": "DHCP", "right": "IP Address Assignment"},
                {"left": "DNS", "right": "Name Resolution"},
                {"left": "NAT", "right": "Address Translation"},
            ],
            "explanation": "These are core network services.",
            "source_ref": "Library/Netzwerk/Dienste/dhcp-dns.md",
        },
        {
            "id": "m2",
            "topicId": "netzwerk",
            "type": "matching",
            "prompt": "Match OSI layer to example.",
            "pairs": [
                {"left": "Layer 2", "right": "Ethernet"},
                {"left": "Layer 3", "right": "IP"},
                {"left": "Layer 4", "right": "TCP"},
            ],
            "explanation": "OSI layers have typical protocols.",
            "source_ref": "Library/Netzwerk/Grundlagen/osi-tcpip-ethernet.md",
        },
        {
            "id": "m3",
            "topicId": "elektro",
            "type": "matching",
            "prompt": "Match device to role.",
            "pairs": [
                {"left": "LS", "right": "Overcurrent protection"},
                {"left": "RCD", "right": "Residual current protection"},
                {"left": "SLS", "right": "Selective main protection"},
            ],
            "explanation": "Protection devices have different roles.",
            "source_ref": "Library/Elektrotechnik/Schutztechnik/selektivitaet-sls.md",
        },
        {
            "id": "m4",
            "topicId": "it",
            "type": "matching",
            "prompt": "Match term to meaning.",
            "pairs": [
                {"left": "CIA", "right": "Security goals"},
                {"left": "VM", "right": "Virtual machine"},
                {"left": "NAS", "right": "Network storage"},
            ],
            "explanation": "Common IT terms.",
            "source_ref": "Library/IT-Systeme/Virtualisierung/virtualisierung-hypervisor-grundlagen.md",
        },
        {
            "id": "m5",
            "topicId": "it",
            "type": "matching",
            "prompt": "Match service to type.",
            "pairs": [
                {"left": "SaaS", "right": "Software as a Service"},
                {"left": "PaaS", "right": "Platform as a Service"},
                {"left": "IaaS", "right": "Infrastructure as a Service"},
            ],
            "explanation": "Cloud service models.",
            "source_ref": "Library/IT-Systeme/Dienste/cloud-services-saas-paas-iaas.md",
        },
        {
            "id": "fb1",
            "topicId": "netzwerk",
            "type": "fillblank",
            "prompt": "Fill in the blank: IPv4 has ___ bits.",
            "expectedAnswers": ["32"],
            "explanation": "IPv4 uses 32-bit addresses.",
            "source_ref": "Library/Netzwerk/Grundlagen/ip-adressierung-v4-v6.md",
        },
        {
            "id": "fb2",
            "topicId": "netzwerk",
            "type": "fillblank",
            "prompt": "Fill in the blank: VLAN tags use standard ___ .",
            "expectedAnswers": ["802.1q", "8021q"],
            "explanation": "VLAN tagging uses IEEE 802.1Q.",
            "source_ref": "Library/Netzwerk/VLAN/vlan-grundlagen-trunk-tagging.md",
        },
        {
            "id": "fb3",
            "topicId": "elektro",
            "type": "fillblank",
            "prompt": "Fill in the blank: U = R * ___.",
            "expectedAnswers": ["I", "i"],
            "explanation": "Ohmsches Gesetz.",
            "source_ref": "Library/Elektrotechnik/Grundlagen/spannung-strom-ohm.md",
        },
        {
            "id": "fb4",
            "topicId": "elektro",
            "type": "fillblank",
            "prompt": "Fill in the blank: A FI is a ___ device.",
            "expectedAnswers": ["fehlerstromschutz", "rcd"],
            "explanation": "FI is a residual current device.",
            "source_ref": "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md",
        },
        {
            "id": "fb5",
            "topicId": "it",
            "type": "fillblank",
            "prompt": "Fill in the blank: CIA stands for Confidentiality, Integrity, and ___.",
            "expectedAnswers": ["availability"],
            "explanation": "CIA triad.",
            "source_ref": "Library/IT-Systeme/Grundlagen/cia-triad-datenschutz-datensicherheit.md",
        },
        {
            "id": "s1",
            "topicId": "netzwerk",
            "type": "single",
            "prompt": "Which port is standard for HTTPS?",
            "options": ["80", "443", "53", "22"],
            "correctIndex": 1,
            "explanation": "HTTPS uses port 443.",
            "source_ref": "Library/Netzwerk/Grundlagen/osi-tcpip-ethernet.md",
        },
        {
            "id": "s2",
            "topicId": "elektro",
            "type": "single",
            "prompt": "Which unit is for electrical current?",
            "options": ["Volt", "Ampere", "Ohm", "Watt"],
            "correctIndex": 1,
            "explanation": "Current is measured in Ampere.",
            "source_ref": "Library/Elektrotechnik/Grundlagen/spannung-strom-ohm.md",
        },
        {
            "id": "s3",
            "topicId": "it",
            "type": "single",
            "prompt": "Which is a backup rule?",
            "options": ["3-2-1", "4-4-2", "1-1-1", "2-3-5"],
            "correctIndex": 0,
            "explanation": "3-2-1 is common backup rule.",
            "source_ref": "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md",
        },
        {
            "id": "g1",
            "topicId": "netzwerk",
            "type": "guess",
            "prompt": "Guess the word: Protocol that assigns IP addresses automatically.",
            "expectedAnswers": ["dhcp"],
            "explanation": "DHCP assigns IP addresses.",
            "source_ref": "Library/Netzwerk/Dienste/dhcp-dns.md",
        },
        {
            "id": "g2",
            "topicId": "elektro",
            "type": "guess",
            "prompt": "Guess the word: Device that protects against residual current.",
            "expectedAnswers": ["rcd", "fi"],
            "explanation": "RCD/FI is residual current device.",
            "source_ref": "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md",
        },
        {
            "id": "g3",
            "topicId": "it",
            "type": "guess",
            "prompt": "Guess the word: Security goals trio (C, I, A).",
            "expectedAnswers": ["cia"],
            "explanation": "CIA triad.",
            "source_ref": "Library/IT-Systeme/Grundlagen/cia-triad-datenschutz-datensicherheit.md",
        },
        {
            "id": "e1",
            "topicId": "netzwerk",
            "type": "explain",
            "prompt": "Explain VLANs in one or two sentences.",
            "expectedAnswer": "Segmentiert Layer 2 Netzwerke logisch, trennt Broadcast Domains.",
            "explanation": "VLANs segment networks at Layer 2.",
            "source_ref": "Library/Netzwerk/VLAN/vlan-grundlagen-trunk-tagging.md",
        },
        {
            "id": "e2",
            "topicId": "elektro",
            "type": "explain",
            "prompt": "Explain the purpose of protective earth (PE).",
            "expectedAnswer": "Sichert gegen Fehlerstrom und leitet ihn ab.",
            "explanation": "PE protects against fault current.",
            "source_ref": "Library/Elektrotechnik/Sicherheit/schutz-gegen-elektrischen-schlag.md",
        },
        {
            "id": "e3",
            "topicId": "it",
            "type": "explain",
            "prompt": "Explain the 3-2-1 backup rule.",
            "expectedAnswer": "3 copies, 2 media, 1 offsite.",
            "explanation": "3-2-1 is a backup best practice.",
            "source_ref": "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md",
        },
        {
            "id": "x1",
            "topicId": "netzwerk",
            "type": "exam",
            "prompt": "Exam scenario: Design a small VLAN plan for 3 departments with 60 clients. Outline VLAN IDs and subnets.",
            "expectedAnswer": "Provide VLAN IDs and /26 or /25 subnets per department.",
            "explanation": "Keep subnets per department and document VLAN IDs.",
            "source_ref": "Library/Netzwerk/Methoden/checkliste-vlan-plan.md",
        },
        {
            "id": "x2",
            "topicId": "elektro",
            "type": "exam",
            "prompt": "Exam scenario: Describe steps for safe work on electrical equipment.",
            "expectedAnswer": "Five safety rules in order.",
            "explanation": "Use five safety rules.",
            "source_ref": "Library/Elektrotechnik/Sicherheit/fuenf-sicherheitsregeln.md",
        },
        {
            "id": "x3",
            "topicId": "it",
            "type": "exam",
            "prompt": "Exam scenario: Plan a backup strategy for a small office.",
            "expectedAnswer": "Define 3-2-1, schedule, and test plan.",
            "explanation": "Use 3-2-1 and test restores.",
            "source_ref": "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md",
        },
        {
            "id": "o1",
            "topicId": "netzwerk",
            "type": "ordering",
            "prompt": "Order the steps for basic network troubleshooting.",
            "items": ["Check link", "Check IP config", "Ping gateway"],
            "correct_order": [0, 1, 2],
            "explanation": "Start physical, then config, then reachability.",
            "source_ref": "Library/Netzwerk/Methoden/troubleshooting-dhcp.md",
        },
        {
            "id": "o2",
            "topicId": "elektro",
            "type": "ordering",
            "prompt": "Order the five safety rules (simplified).",
            "items": ["Disconnect", "Secure against restart", "Verify absence of voltage"],
            "correct_order": [0, 1, 2],
            "explanation": "First disconnect, secure, then verify.",
            "source_ref": "Library/Elektrotechnik/Sicherheit/fuenf-sicherheitsregeln.md",
        },
        {
            "id": "o3",
            "topicId": "it",
            "type": "ordering",
            "prompt": "Order a simple backup workflow.",
            "items": ["Plan", "Run backup", "Test restore"],
            "correct_order": [0, 1, 2],
            "explanation": "Plan first, then run, then test.",
            "source_ref": "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md",
        },
    ]

    for t in topics:
        cur.execute(
            "INSERT INTO topics (id, name, topic_area) VALUES (?, ?, ?)",
            (t["id"], t["name"], t.get("topic_area", "")),
        )
    for q in questions:
        cur.execute(
            """
            INSERT INTO questions (id, topic_id, type, data, explanation, source_ref, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                q["id"],
                q["topicId"],
                q["type"],
                json.dumps(q),
                q.get("explanation", ""),
                q.get("source_ref", ""),
                json.dumps(q.get("tags", [])),
            ),
        )
    conn.commit()
    conn.close()


def hash_password(password, salt_b64):
    salt = base64.b64decode(salt_b64)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200000)
    return base64.b64encode(dk).decode()


def authenticate_user(username, password):
    for user in CONFIG.get("users", []):
        if user["username"] == username:
            hashed = hash_password(password, user["salt"])
            return hashed == user["hash"]
    return False


def create_token(username):
    exp_days = CONFIG.get("token_exp_days", 7)
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=exp_days),
    }
    token = jwt.encode(payload, CONFIG["jwt_secret"], algorithm="HS256")
    return token


def get_current_user(request: Request):
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, CONFIG["jwt_secret"], algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.on_event("startup")
def on_startup():
    init_db()
    seed_data()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing credentials")
    if not authenticate_user(username, password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(username)
    return {"token": token, "username": username}


@app.get("/questions")
def get_questions(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM topics")
    topics = [dict(row) for row in cur.fetchall()]
    cur.execute("SELECT * FROM questions")
    questions = []
    for row in cur.fetchall():
        q = json.loads(row["data"])
        questions.append(q)
    conn.close()
    return {"topics": topics, "questions": questions}


@app.post("/questions")
def create_question(data: dict, user=Depends(get_current_user)):
    if "id" not in data or "topicId" not in data or "type" not in data:
        raise HTTPException(status_code=400, detail="Missing fields")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM questions WHERE id = ?", (data["id"],))
    if cur.fetchone():
        raise HTTPException(status_code=409, detail="Duplicate id")
    cur.execute(
        "SELECT 1 FROM topics WHERE id = ?",
        (data["topicId"],),
    )
    if not cur.fetchone():
        cur.execute(
            "INSERT INTO topics (id, name, topic_area) VALUES (?, ?, ?)",
            (data["topicId"], data.get("topicName", data["topicId"]), data.get("topic_area", "")),
        )
    cur.execute(
        """
        INSERT INTO questions (id, topic_id, type, data, explanation, source_ref, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["id"],
            data["topicId"],
            data["type"],
            json.dumps(data),
            data.get("explanation", ""),
            data.get("source_ref", ""),
            json.dumps(data.get("tags", [])),
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "created", "id": data["id"]}


def slug_to_title(slug):
    return " ".join([part.capitalize() for part in slug.replace("_", "-").split("-")])


def normalize_question(input_q, topic_map, errors):
    if not input_q or "id" not in input_q or "type" not in input_q:
        errors.append("Question missing id or type.")
        return None
    type_map = {"guessword": "guess", "explainterm": "explain"}
    q_type = type_map.get(input_q["type"], input_q["type"])
    topic_slug = input_q.get("topic_slug") or input_q.get("topicId")
    if not topic_slug:
        errors.append(f"Question {input_q['id']} missing topic_slug.")
        return None
    if topic_slug not in topic_map:
        topic_map[topic_slug] = {
            "id": topic_slug,
            "name": slug_to_title(topic_slug),
            "topic_area": "",
        }
    prompt = input_q.get("prompt") or input_q.get("statement") or input_q.get("text")
    if not prompt:
        errors.append(f"Question {input_q['id']} missing prompt.")
        return None

    base = {
        "id": input_q["id"],
        "topicId": topic_slug,
        "type": q_type,
        "prompt": prompt,
        "explanation": input_q.get("explanation", ""),
        "source_ref": input_q.get("source_ref", "internal:import"),
        "tags": input_q.get("tags", []),
    }

    if q_type == "single":
        if not isinstance(input_q.get("options"), list) or not isinstance(input_q.get("correct"), list):
            errors.append(f"Single {input_q['id']} missing options/correct.")
            return None
        return {**base, "options": input_q["options"], "correctIndex": input_q["correct"][0]}
    if q_type == "multi":
        if not isinstance(input_q.get("options"), list) or not isinstance(input_q.get("correct"), list):
            errors.append(f"Multi {input_q['id']} missing options/correct.")
            return None
        return {**base, "options": input_q["options"], "correctIndexes": input_q["correct"]}
    if q_type == "truefalse":
        if not isinstance(input_q.get("correct"), bool):
            errors.append(f"TrueFalse {input_q['id']} missing boolean correct.")
            return None
        return {**base, "correctBoolean": input_q["correct"]}
    if q_type == "fillblank":
        if not isinstance(input_q.get("answers"), list):
            errors.append(f"Fillblank {input_q['id']} missing answers.")
            return None
        return {**base, "answers": input_q["answers"]}
    if q_type == "matching":
        left = input_q.get("left")
        right = input_q.get("right")
        pairs = input_q.get("pairs")
        if not isinstance(left, list) or not isinstance(right, list):
            errors.append(f"Matching {input_q['id']} missing left/right.")
            return None
        if isinstance(pairs, list) and len(pairs) > 0:
            mapped = [{"left": left[p[0]], "right": right[p[1]]} for p in pairs]
        elif len(left) == len(right):
            mapped = [{"left": l, "right": right[i]} for i, l in enumerate(left)]
        else:
            errors.append(f"Matching {input_q['id']} missing pairs.")
            return None
        return {**base, "pairs": mapped}
    if q_type == "ordering":
        if not isinstance(input_q.get("items"), list) or not isinstance(input_q.get("correct_order"), list):
            errors.append(f"Ordering {input_q['id']} missing items/correct_order.")
            return None
        return {**base, "items": input_q["items"], "correct_order": input_q["correct_order"]}
    if q_type == "guess":
        if not isinstance(input_q.get("answers"), list):
            errors.append(f"Guess {input_q['id']} missing answers.")
            return None
        return {**base, "expectedAnswers": input_q["answers"]}
    if q_type == "explain":
        return {**base, "expectedAnswer": ", ".join(input_q.get("keywords", []))}
    if q_type == "exam":
        return {**base, "expectedAnswer": input_q.get("answer_key", "")}
    errors.append(f"Unknown type {q_type} for {input_q['id']}.")
    return None


@app.post("/questions/import")
def import_questions(data: dict, replace_duplicates: bool = False, user=Depends(get_current_user)):
    if data.get("schema") != "ap2-questionpack-v1":
        raise HTTPException(status_code=400, detail="Invalid schema")
    topics_input = data.get("topics", [])
    questions_input = data.get("questions", [])
    errors = []
    topic_map = {}
    for t in topics_input:
        if "slug" in t:
            topic_map[t["slug"]] = {
                "id": t["slug"],
                "name": t.get("title", slug_to_title(t["slug"])),
                "topic_area": t.get("topic_area", ""),
            }
        else:
            errors.append("Topic missing slug.")

    normalized = []
    summary = {"total": 0, "valid": 0, "invalid": 0, "types": {}, "topics": {}}
    for q in questions_input:
        summary["total"] += 1
        nq = normalize_question(q, topic_map, errors)
        if nq:
            normalized.append(nq)
            summary["valid"] += 1
            summary["types"][nq["type"]] = summary["types"].get(nq["type"], 0) + 1
            summary["topics"][nq["topicId"]] = summary["topics"].get(nq["topicId"], 0) + 1
        else:
            summary["invalid"] += 1

    conn = get_db()
    cur = conn.cursor()
    added = 0
    skipped = 0
    replaced = 0

    for t in topic_map.values():
        cur.execute("SELECT 1 FROM topics WHERE id = ?", (t["id"],))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO topics (id, name, topic_area) VALUES (?, ?, ?)",
                (t["id"], t["name"], t.get("topic_area", "")),
            )

    for q in normalized:
        cur.execute("SELECT 1 FROM questions WHERE id = ?", (q["id"],))
        exists = cur.fetchone() is not None
        if exists and not replace_duplicates:
            skipped += 1
            continue
        if exists and replace_duplicates:
            cur.execute(
                "UPDATE questions SET topic_id = ?, type = ?, data = ?, explanation = ?, source_ref = ?, tags = ? WHERE id = ?",
                (
                    q["topicId"],
                    q["type"],
                    json.dumps(q),
                    q.get("explanation", ""),
                    q.get("source_ref", ""),
                    json.dumps(q.get("tags", [])),
                    q["id"],
                ),
            )
            replaced += 1
            continue
        cur.execute(
            "INSERT INTO questions (id, topic_id, type, data, explanation, source_ref, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                q["id"],
                q["topicId"],
                q["type"],
                json.dumps(q),
                q.get("explanation", ""),
                q.get("source_ref", ""),
                json.dumps(q.get("tags", [])),
            ),
        )
        added += 1

    conn.commit()
    conn.close()

    return {
        "summary": summary,
        "errors": errors[:5],
        "added": added,
        "skipped": skipped,
        "replaced": replaced,
    }


@app.get("/questions/export")
def export_questions(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM topics")
    topics = [dict(row) for row in cur.fetchall()]
    cur.execute("SELECT * FROM questions")
    questions = [json.loads(row["data"]) for row in cur.fetchall()]
    conn.close()
    pack = {
        "schema": "ap2-questionpack-v1",
        "meta": {
            "title": "AP2 Export",
            "generated_by": "AP2 Trainer",
            "created_at": datetime.now().strftime("%Y-%m-%d"),
        },
        "topics": [
            {"slug": t["id"], "title": t["name"], "topic_area": t.get("topic_area", "")}
            for t in topics
        ],
        "questions": [],
    }
    for q in questions:
        base = {
            "id": q["id"],
            "topic_slug": q["topicId"],
            "type": q["type"],
            "prompt": q.get("prompt"),
            "explanation": q.get("explanation", ""),
            "source_ref": q.get("source_ref", ""),
            "tags": q.get("tags", []),
        }
        if q["type"] == "single":
            pack["questions"].append({**base, "options": q["options"], "correct": [q["correctIndex"]]})
        elif q["type"] == "multi":
            pack["questions"].append({**base, "options": q["options"], "correct": q["correctIndexes"]})
        elif q["type"] == "truefalse":
            pack["questions"].append({**base, "correct": q["correctBoolean"]})
        elif q["type"] == "fillblank":
            pack["questions"].append({**base, "text": q.get("prompt"), "answers": q.get("answers", q.get("expectedAnswers", []))})
        elif q["type"] == "matching":
            left = [p["left"] for p in q["pairs"]]
            right = [p["right"] for p in q["pairs"]]
            pairs = [[i, i] for i in range(len(q["pairs"]))]
            pack["questions"].append({**base, "left": left, "right": right, "pairs": pairs})
        elif q["type"] == "ordering":
            pack["questions"].append({**base, "items": q["items"], "correct_order": q["correct_order"]})
        elif q["type"] == "guess":
            pack["questions"].append({**base, "type": "guessword", "answers": q.get("expectedAnswers", [])})
        elif q["type"] == "explain":
            pack["questions"].append({**base, "type": "explainterm", "keywords": q.get("expectedAnswer", "").split(",")})
        elif q["type"] == "exam":
            pack["questions"].append({**base, "grading": "self"})
        else:
            pack["questions"].append(base)
    return pack


@app.get("/attempts")
def get_attempts(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM attempts WHERE username = ?", (user,))
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"attempts": rows}


@app.post("/attempts")
def create_attempt(data: dict, user=Depends(get_current_user)):
    if "questionId" not in data:
        raise HTTPException(status_code=400, detail="Missing questionId")
    attempt_id = data.get("id") or f"att_{int(datetime.now().timestamp()*1000)}"
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO attempts (id, username, question_id, selected, correct, graded_by_user, timestamp, time_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            attempt_id,
            user,
            data["questionId"],
            json.dumps(data.get("selected")),
            1 if data.get("correct") else 0,
            1 if data.get("graded_by_user") else 0,
            data.get("timestamp") or datetime.now(timezone.utc).isoformat(),
            data.get("timeMs"),
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "created", "id": attempt_id}


@app.get("/appointments")
def get_appointments(user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM appointments WHERE username = ?", (user,))
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"appointments": rows}


@app.post("/appointments")
def create_appointment(data: dict, user=Depends(get_current_user)):
    if "title" not in data or "start" not in data:
        raise HTTPException(status_code=400, detail="Missing fields")
    appt_id = data.get("id") or f"appt_{int(datetime.now().timestamp()*1000)}"
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO appointments (id, username, title, start, end, notes, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            appt_id,
            user,
            data["title"],
            data["start"],
            data.get("end", ""),
            data.get("notes", ""),
            data.get("category", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "created", "id": appt_id}


@app.put("/appointments/{appt_id}")
def update_appointment(appt_id: str, data: dict, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE appointments SET title = ?, start = ?, end = ?, notes = ?, category = ?
        WHERE id = ? AND username = ?
        """,
        (
            data.get("title"),
            data.get("start"),
            data.get("end", ""),
            data.get("notes", ""),
            data.get("category", ""),
            appt_id,
            user,
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "updated"}


@app.delete("/appointments/{appt_id}")
def delete_appointment(appt_id: str, user=Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM appointments WHERE id = ? AND username = ?",
        (appt_id, user),
    )
    conn.commit()
    conn.close()
    return {"status": "deleted"}
