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
async def test_returning_caller_greeting(temp_db: str) -> None:
    """Evaluation of the agent's ability to greet returning callers by name and reference past interaction."""
    # Seed DB with a returning caller record
    db.save_caller(
        user_id="caller_101",
        name="Ramesh",
        language_preference="English",
        facts={
            "schemes_checked": ["PM Kisan"],
            "last_topic": "cotton crop spraying and PM Kisan eligibility",
            "follow_up_note": "Advised visiting local CSC center",
        },
        explicit_consent_given=True,
        db_path=temp_db,
    )

    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session,
    ):
        await session.start(Assistant())

        result = await session.run(
            user_input="Hello, my user_id is caller_101. My name is Ramesh."
        )

        # Skip function call events to target the assistant message
        await result.expect.next_event(type="message").judge(
            llm_inst,
            intent="""
            Welcomes back Ramesh by name and references their previous topic or interaction (cotton, PM Kisan, or CSC visit).
            """,
        )


@pytest.mark.asyncio
async def test_last_conversation_recall_query(temp_db: str) -> None:
    """Evaluation of the agent answering 'What did we discuss in our last conversation?'."""
    # Seed DB with caller record
    db.save_caller(
        user_id="caller_default_user",
        name="Ramesh",
        language_preference="English",
        facts={
            "schemes_checked": ["PM Jan Dhan Yojana"],
            "last_topic": "opening a zero balance Jan Dhan bank account",
            "follow_up_note": "User asked about documents required for Jan Dhan account",
        },
        explicit_consent_given=True,
        db_path=temp_db,
    )

    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session,
    ):
        await session.start(Assistant())

        result = await session.run(
            user_input="What did we discuss in our last conversation?"
        )

        # Skip function call events to target the assistant message
        await result.expect.next_event(type="message").judge(
            llm_inst,
            intent="""
            Recalls and states that the last conversation was with Ramesh about PM Jan Dhan Yojana or opening a zero balance bank account.
            """,
        )


@pytest.mark.asyncio
async def test_consent_requested_before_saving(temp_db: str) -> None:
    """Evaluation of the agent asking for consent before saving caller facts."""
    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session,
    ):
        await session.start(Assistant())

        result = await session.run(
            user_input="Hi, my user_id is Priya. Can you save my name and that I checked PM Jan Dhan Yojana so I don't have to repeat it next time?"
        )

        # Skip function call events to target the assistant message
        await result.expect.next_event(type="message").judge(
            llm_inst,
            intent="""
            Asks for explicit permission/consent before saving or remembering Priya's information, or confirms that consent is needed to save.
            """,
        )
