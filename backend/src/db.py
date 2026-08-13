import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_DB_PATH = str(Path(__file__).parent.parent / "caller_data.db")

SENSITIVE_KEY_PATTERNS = [
    r"account",
    r"acc_no",
    r"aadhaar",
    r"aadhar",
    r"pan",
    r"card",
    r"cvv",
    r"pin",
    r"otp",
    r"password",
    r"govt_id",
]

SENSITIVE_VALUE_PATTERNS = [
    r"\b\d{9,18}\b",  # Bank account numbers / Aadhaar (12 digits) / card numbers
    r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",  # PAN number
    r"\b\d{4,6}\b",  # PINs / OTPs standalone
]


def sanitize_facts(facts: dict[str, Any]) -> dict[str, Any]:
    """Sanitize facts dictionary to ensure no account numbers, ID numbers, or sensitive financial data are saved."""
    cleaned_facts: dict[str, Any] = {}
    for key, val in facts.items():
        key_lower = str(key).lower()
        if any(re.search(pat, key_lower) for pat in SENSITIVE_KEY_PATTERNS):
            raise ValueError(
                f"Security Guardrail: Cannot store sensitive financial attribute '{key}'."
            )

        val_str = json.dumps(val) if isinstance(val, (dict, list)) else str(val)
        for val_pat in SENSITIVE_VALUE_PATTERNS:
            if re.search(val_pat, val_str):
                raise ValueError(
                    f"Security Guardrail: Sensitive numeric or ID pattern detected in value for '{key}'."
                )

        cleaned_facts[key] = val
    return cleaned_facts


def sanitize_text(text: str) -> str:
    """Check text for sensitive information like account numbers, PINs, OTPs, Aadhaar numbers, or passwords."""
    if not text:
        return text
    for val_pat in SENSITIVE_VALUE_PATTERNS:
        if re.search(val_pat, text):
            raise ValueError(
                "Security Guardrail: Sensitive numeric, PIN, OTP, card, or ID pattern detected in request summary."
            )
    return text


def init_db(db_path: str | None = None) -> None:
    """Initialize SQLite database and create users and escalations tables if not exist."""
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                language_preference TEXT DEFAULT 'en-IN',
                facts TEXT NOT NULL,
                last_interaction TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS escalations (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                caller_name TEXT NOT NULL,
                reason_category TEXT NOT NULL,
                issue_summary TEXT NOT NULL,
                agent_checks TEXT NOT NULL,
                urgency TEXT NOT NULL,
                caller_language TEXT NOT NULL,
                preferred_contact_method TEXT NOT NULL,
                status TEXT DEFAULT 'OPEN',
                created_at TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY,
                room_name TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                duration_seconds INTEGER DEFAULT 0,
                failure_reason TEXT
            )
            """
        )
        conn.commit()


def get_caller(
    user_id_or_name: str, db_path: str | None = None
) -> dict[str, Any] | None:
    """Retrieve caller record from SQLite database by user_id or name.

    If no exact match is found, falls back to returning the most recent caller record.
    """
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    init_db(target_path)
    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        if user_id_or_name:
            cursor.execute(
                """
                SELECT user_id, name, language_preference, facts, last_interaction
                FROM users
                WHERE user_id = ? OR LOWER(name) = LOWER(?) OR LOWER(user_id) = LOWER(?)
                ORDER BY last_interaction DESC
                LIMIT 1
                """,
                (user_id_or_name, user_id_or_name, user_id_or_name),
            )
            row = cursor.fetchone()
        else:
            row = None

        if not row:
            # Fallback: retrieve the most recently updated caller profile in database
            cursor.execute(
                """
                SELECT user_id, name, language_preference, facts, last_interaction
                FROM users
                ORDER BY last_interaction DESC
                LIMIT 1
                """
            )
            row = cursor.fetchone()

        if not row:
            return None

        u_id, name, lang, facts_json, last_interaction = row
        try:
            facts = json.loads(facts_json)
        except Exception:
            facts = {}

        return {
            "user_id": u_id,
            "name": name,
            "language_preference": lang,
            "facts": facts,
            "last_interaction": last_interaction,
        }


def save_caller(
    user_id: str,
    name: str,
    language_preference: str,
    facts: dict[str, Any],
    explicit_consent_given: bool = False,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Save or update a caller record in SQLite database.

    Requires explicit_consent_given=True. Fails if consent is False.
    """
    if not explicit_consent_given:
        return {
            "success": False,
            "reason": "Consent not granted by caller. Data was NOT saved.",
        }

    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    cleaned_facts = sanitize_facts(facts)
    init_db(target_path)
    timestamp = datetime.now(timezone.utc).isoformat()
    facts_json = json.dumps(cleaned_facts)

    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (user_id, name, language_preference, facts, last_interaction)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name = excluded.name,
                language_preference = excluded.language_preference,
                facts = excluded.facts,
                last_interaction = excluded.last_interaction
            """,
            (user_id, name, language_preference, facts_json, timestamp),
        )
        conn.commit()

    return {
        "success": True,
        "user_id": user_id,
        "name": name,
        "language_preference": language_preference,
        "facts": cleaned_facts,
        "last_interaction": timestamp,
    }


def create_escalation_record(
    caller_name: str,
    reason_category: str,
    issue_summary: str,
    agent_checks: str,
    urgency: str,
    caller_language: str,
    preferred_contact_method: str,
    user_has_consented: bool = False,
    user_id: str = "caller_default_user",
    db_path: str | None = None,
) -> dict[str, Any]:
    """Create a human help escalation record in SQLite database.

    Requires user_has_consented=True. Sanitizes text against sensitive numeric/ID patterns.
    """
    if not user_has_consented:
        return {
            "success": False,
            "reason": "Caller permission was not given. Human help request was NOT created.",
        }

    # Security guardrails: check for sensitive patterns
    sanitize_text(issue_summary)
    sanitize_text(agent_checks)
    sanitize_text(caller_name)

    import random

    ref_id = f"ESC-{random.randint(10000, 99999)}"
    timestamp = datetime.now(timezone.utc).isoformat()
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    init_db(target_path)

    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO escalations (
                id, user_id, caller_name, reason_category, issue_summary, agent_checks, urgency, caller_language, preferred_contact_method, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ref_id,
                user_id,
                caller_name,
                reason_category,
                issue_summary,
                agent_checks,
                urgency,
                caller_language,
                preferred_contact_method,
                "OPEN",
                timestamp,
            ),
        )
        conn.commit()

    return {
        "success": True,
        "reference_id": ref_id,
        "caller_name": caller_name,
        "reason_category": reason_category,
        "issue_summary": issue_summary,
        "agent_checks": agent_checks,
        "urgency": urgency,
        "caller_language": caller_language,
        "preferred_contact_method": preferred_contact_method,
        "status": "OPEN",
        "created_at": timestamp,
    }


def get_escalations(db_path: str | None = None) -> list[dict[str, Any]]:
    """Retrieve all human help escalation records ordered by creation timestamp."""
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    init_db(target_path)
    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, user_id, caller_name, reason_category, issue_summary, agent_checks, urgency, caller_language, preferred_contact_method, status, created_at
            FROM escalations
            ORDER BY created_at DESC
            """
        )
        rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append(
            {
                "id": r[0],
                "user_id": r[1],
                "caller_name": r[2],
                "reason_category": r[3],
                "issue_summary": r[4],
                "agent_checks": r[5],
                "urgency": r[6],
                "caller_language": r[7],
                "preferred_contact_method": r[8],
                "status": r[9],
                "created_at": r[10],
            }
        )
    return results


def record_call_start(
    call_id: str, room_name: str, db_path: str | None = None
) -> dict[str, Any]:
    """Record a newly initiated voice session in SQLite database."""
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    init_db(target_path)
    timestamp = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO calls (id, room_name, status, started_at)
            VALUES (?, ?, 'IN_PROGRESS', ?)
            ON CONFLICT(id) DO UPDATE SET
                room_name = excluded.room_name,
                status = 'IN_PROGRESS',
                started_at = excluded.started_at
            """,
            (call_id, room_name, timestamp),
        )
        conn.commit()
    return {
        "id": call_id,
        "room_name": room_name,
        "status": "IN_PROGRESS",
        "started_at": timestamp,
    }


def record_call_end(
    call_id: str,
    status: str = "SUCCESS",
    failure_reason: str | None = None,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Record call session completion status, duration, and optional failure reason."""
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    init_db(target_path)
    timestamp = datetime.now(timezone.utc).isoformat()

    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT started_at FROM calls WHERE id = ?", (call_id,))
        row = cursor.fetchone()

        duration_seconds = 0
        if row and row[0]:
            try:
                start_dt = datetime.fromisoformat(row[0])
                end_dt = datetime.fromisoformat(timestamp)
                duration_seconds = max(0, int((end_dt - start_dt).total_seconds()))
            except Exception:
                duration_seconds = 0

        cursor.execute(
            """
            UPDATE calls
            SET status = ?, ended_at = ?, duration_seconds = ?, failure_reason = ?
            WHERE id = ?
            """,
            (status, timestamp, duration_seconds, failure_reason, call_id),
        )
        conn.commit()

    return {
        "id": call_id,
        "status": status,
        "ended_at": timestamp,
        "duration_seconds": duration_seconds,
        "failure_reason": failure_reason,
    }


def get_call_stats(db_path: str | None = None) -> dict[str, Any]:
    """Retrieve overall call statistics (total, successful, failed) and recent logs."""
    target_path = db_path if db_path is not None else DEFAULT_DB_PATH
    init_db(target_path)
    with sqlite3.connect(target_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM calls")
        total_calls = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM calls WHERE status IN ('SUCCESS', 'COMPLETED')"
        )
        successful_calls = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM calls WHERE status IN ('FAILED', 'ERROR')"
        )
        failed_calls = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT id, room_name, status, started_at, ended_at, duration_seconds, failure_reason
            FROM calls
            ORDER BY started_at DESC
            LIMIT 20
            """
        )
        rows = cursor.fetchall()

    recent_calls = []
    for r in rows:
        recent_calls.append(
            {
                "id": r[0],
                "room_name": r[1],
                "status": r[2],
                "started_at": r[3],
                "ended_at": r[4],
                "duration_seconds": r[5] or 0,
                "failure_reason": r[6],
            }
        )

    return {
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "failed_calls": failed_calls,
        "recent_calls": recent_calls,
    }

