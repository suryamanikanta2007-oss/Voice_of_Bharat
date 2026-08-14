import gc
import os
import tempfile

import pytest
from livekit.agents import AgentSession, inference, llm

import db
from agent import Assistant


def _llm() -> llm.LLM:
    return inference.LLM(model="openai/gpt-4o-mini")


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


@pytest.mark.asyncio
async def test_step6_full_flow_memory_and_reconnect(temp_db: str) -> None:
    """Step 6 End-to-End Test:

    Call 1: User introduces themselves, checks PM Kisan eligibility, gives consent to save.
    Call 2: Same user reconnects; agent greets them by name and references previous PM Kisan interaction.
    """
    user_id = "test_caller_flow_123"

    # --- FIRST CALL ---
    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session1,
    ):
        await session1.start(Assistant())

        # User introduces themselves and asks for scheme help
        result1 = await session1.run(
            user_input=f"Hi, my user_id is {user_id}. My name is Ramesh and I am a small farmer checking PM Kisan eligibility."
        )

        # Agent responds and asks for consent or handles initial query
        await result1.expect.next_event(type="message").judge(
            llm_inst,
            intent="Responds politely about PM Kisan eligibility or states that it will connect the caller to our government scheme specialist.",
        )

        # Save caller facts with explicit consent
        save_res = db.save_caller(
            user_id=user_id,
            name="Ramesh",
            language_preference="English",
            facts={
                "schemes_checked": ["PM Kisan"],
                "eligibility_answers": {"small_farmer": "yes"},
                "last_topic": "PM Kisan eligibility check for small farmer",
                "follow_up_note": "User wants to know required documents for PM Kisan",
            },
            explicit_consent_given=True,
            db_path=temp_db,
        )

        assert save_res["success"] is True

    # --- SECOND CALL (RECONNECT) ---
    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session2,
    ):
        await session2.start(Assistant())

        # Second call reconnects with same user_id
        result2 = await session2.run(
            user_input=f"Hello, my user_id is {user_id}. I am back."
        )

        # Evaluate that the agent greets Ramesh by name and mentions PM Kisan
        await result2.expect.next_event(type="message").judge(
            llm_inst,
            intent="""
            Welcomes Ramesh back by name and references their previous interaction about PM Kisan eligibility or small farmer scheme.
            """,
        )


@pytest.mark.asyncio
async def test_step5_refusal_does_not_save(temp_db: str) -> None:
    """Step 5 Guardrail Test: If caller says NO to saving, no data is written to DB."""
    user_id = "privacy_caller_999"

    # Save attempt with consent = False
    res = db.save_caller(
        user_id=user_id,
        name="Anil",
        language_preference="Hindi",
        facts={"last_topic": "Jan Dhan Yojana"},
        explicit_consent_given=False,
        db_path=temp_db,
    )

    assert res["success"] is False
    assert "Consent not granted" in res["reason"]

    # Verify database record is empty
    profile = db.get_caller(user_id, db_path=temp_db)
    assert profile is None
