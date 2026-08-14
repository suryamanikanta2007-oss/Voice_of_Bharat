import json
from unittest.mock import MagicMock

import pytest
from livekit.agents import AgentSession, inference, llm

from agent import Assistant, SchemeSpecialist, scheme_specialist_instance


def _llm() -> llm.LLM:
    return inference.LLM(model="openai/gpt-4o-mini")


@pytest.mark.asyncio
async def test_transfer_tool_direct_call() -> None:
    """Test transfer_to_scheme_specialist tool method directly."""
    assistant = Assistant()
    mock_context = MagicMock()
    mock_session = MagicMock()
    mock_context.session = mock_session

    res = await assistant.transfer_to_scheme_specialist(
        context=mock_context,
        reason="User asked for PM Kisan document checklist",
    )

    assert "transferred to Government Scheme Specialist" in res
    assert assistant.completed_objective is True
    mock_session.update_agent.assert_called_once_with(scheme_specialist_instance)


@pytest.mark.asyncio
async def test_specialist_tool_direct_call() -> None:
    """Test SchemeSpecialist tool check_scheme_eligibility_and_docs directly."""
    specialist = SchemeSpecialist()
    tool_output = await specialist.check_scheme_eligibility_and_docs(
        context=None,  # type: ignore
        scheme_name="PM Kisan",
        is_landowner=True,
    )
    parsed = json.loads(tool_output)
    assert parsed["status"] == "ELIGIBLE"
    assert "Aadhaar Card" in parsed["required_documents"]
    assert specialist.completed_objective is True


@pytest.mark.asyncio
async def test_normal_question_stays_with_main_agent() -> None:
    """Step 6: Ask one normal question that main agent answers without handoff."""
    async with (
        _llm() as llm,
        AgentSession(llm=llm) as session,
    ):
        assistant = Assistant()
        await session.start(assistant)

        result = await session.run(
            user_input="Hello! What services does Voice of Bharat provide?"
        )

        # Main agent answers directly and session agent remains Assistant
        assert isinstance(session.current_agent, Assistant)
        await result.expect.next_event(type="message").judge(
            llm,
            intent="""
            Greets the user and explains the services provided by Voice of Bharat.
            Does NOT perform an agent handoff or say it is transferring to a specialist.
            """,
        )


@pytest.mark.asyncio
async def test_scheme_question_triggers_handoff_to_specialist() -> None:
    """Step 6: Ask a question needing specialist; main agent announces handoff to specialist."""
    async with (
        _llm() as llm,
        AgentSession(llm=llm) as session,
    ):
        assistant = Assistant()
        await session.start(assistant)

        # Run user turn asking for PM Kisan scheme documents/eligibility
        result = await session.run(
            user_input="What are the eligibility criteria and documents required to apply for the PM Kisan scheme?"
        )

        # Evaluate that main agent announces transfer to the government scheme specialist out loud
        await result.expect.next_event(type="message").judge(
            llm,
            intent="""
            Recognizes that the caller is asking for government scheme eligibility or document checklists.
            States out loud that it will connect or transfer the caller to the government scheme specialist (e.g. 'I will connect you to our government scheme specialist').
            """,
        )
