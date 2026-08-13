import gc
import json
import os
import tempfile

import pytest

import db
from agent import Assistant


@pytest.fixture
def temp_db(monkeypatch):
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db.init_db(path)
    monkeypatch.setattr(db, "DEFAULT_DB_PATH", path)
    yield path
    gc.collect()
    try:
        if os.path.exists(path):
            os.remove(path)
    except PermissionError:
        pass


def test_call_recording_and_stats_aggregation(temp_db: str) -> None:
    """Test recording calls and calculating total_calls, successful_calls, and failed_calls."""
    # 1. Record Call 1 (SUCCESS)
    db.record_call_start(call_id="CALL-101", room_name="room_101", db_path=temp_db)
    db.record_call_end(
        call_id="CALL-101",
        status="SUCCESS",
        failure_reason=None,
        db_path=temp_db,
    )

    # 2. Record Call 2 (FAILED - early disconnect)
    db.record_call_start(call_id="CALL-102", room_name="room_102", db_path=temp_db)
    db.record_call_end(
        call_id="CALL-102",
        status="FAILED",
        failure_reason="Caller ended conversation before completing scheme eligibility check or receiving document list",
        db_path=temp_db,
    )

    # 3. Record Call 3 (SUCCESS)
    db.record_call_start(call_id="CALL-103", room_name="room_103", db_path=temp_db)
    db.record_call_end(
        call_id="CALL-103",
        status="SUCCESS",
        failure_reason=None,
        db_path=temp_db,
    )

    # Retrieve call statistics
    stats = db.get_call_stats(db_path=temp_db)

    assert stats["total_calls"] == 3
    assert stats["successful_calls"] == 2
    assert stats["failed_calls"] == 1
    assert len(stats["recent_calls"]) == 3


@pytest.mark.asyncio
async def test_assistant_objective_completion_triggers_success() -> None:
    """Test that executing scheme eligibility tool marks Assistant completed_objective = True."""
    assistant = Assistant()
    assert assistant.completed_objective is False

    # Execute eligibility check tool
    tool_output = await assistant.check_scheme_eligibility_and_docs(
        context=None,  # type: ignore
        scheme_name="PM Kisan",
        is_landowner=True,
    )

    parsed = json.loads(tool_output)
    assert parsed["status"] == "ELIGIBLE"
    assert assistant.completed_objective is True


@pytest.mark.asyncio
async def test_assistant_uncompleted_objective_default() -> None:
    """Test that Assistant created without calling any goal tool remains completed_objective = False."""
    assistant = Assistant()
    assert assistant.completed_objective is False


def test_call_stats_privacy_protection(temp_db: str) -> None:
    """Security/Privacy check: verify call stats payload contains no passwords, OTPs, PINs, or transcripts."""
    db.record_call_start(call_id="CALL-SEC-1", room_name="sec_room", db_path=temp_db)
    db.record_call_end(
        call_id="CALL-SEC-1",
        status="SUCCESS",
        failure_reason=None,
        db_path=temp_db,
    )

    stats = db.get_call_stats(db_path=temp_db)
    stats_str = json.dumps(stats).lower()

    # Ensure sensitive terms/transcripts are NOT present
    sensitive_keywords = ["password", "otp", "pin", "aadhaar", "account_number", "transcript"]
    for kw in sensitive_keywords:
        assert kw not in stats_str, f"Sensitive word '{kw}' should not be in public call stats payload."
