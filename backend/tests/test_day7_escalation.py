import json

import pytest
from livekit.agents import AgentSession, inference, llm

from agent import Assistant
from db import create_escalation_record, get_escalations


def _llm() -> llm.LLM:
    return inference.LLM(model="openai/gpt-4o-mini")


def test_create_escalation_record_success(tmp_path) -> None:
    """Test successful creation of human help escalation record in SQLite."""
    db_file = str(tmp_path / "test_escalations.db")

    res = create_escalation_record(
        caller_name="Ramesh Kumar",
        reason_category="fraud_report",
        issue_summary="Caller reported receiving a fake SMS demanding money for PM Kisan.",
        agent_checks="Verified active PM Kisan status. Advised caller never to pay fees.",
        urgency="High",
        caller_language="English",
        preferred_contact_method="Phone call",
        user_has_consented=True,
        db_path=db_file,
    )

    assert res["success"] is True
    assert res["reference_id"].startswith("ESC-")
    assert res["status"] == "OPEN"

    # Verify retrieval from DB
    records = get_escalations(db_path=db_file)
    assert len(records) == 1
    assert records[0]["caller_name"] == "Ramesh Kumar"
    assert records[0]["reason_category"] == "fraud_report"
    assert records[0]["urgency"] == "High"


def test_create_escalation_record_no_consent(tmp_path) -> None:
    """Test rejection when caller consent is not given."""
    db_file = str(tmp_path / "test_escalations.db")

    res = create_escalation_record(
        caller_name="Priya Sharma",
        reason_category="complex_decision",
        issue_summary="Caller requested income eligibility waiver.",
        agent_checks="Checked scheme limits.",
        urgency="Medium",
        caller_language="Hindi",
        preferred_contact_method="SMS",
        user_has_consented=False,
        db_path=db_file,
    )

    assert res["success"] is False
    assert "not given" in res["reason"]

    # Verify DB remains empty
    records = get_escalations(db_path=db_file)
    assert len(records) == 0


def test_create_escalation_record_sensitive_guardrail(tmp_path) -> None:
    """Test security guardrail blocking sensitive numeric IDs / PINs / passwords."""
    db_file = str(tmp_path / "test_escalations.db")

    with pytest.raises(ValueError, match="Security Guardrail"):
        create_escalation_record(
            caller_name="Ramesh",
            reason_category="fraud_report",
            issue_summary="Caller shared their secret 4-digit PIN 4829 to verify account.",
            agent_checks="Told caller not to share PIN.",
            urgency="High",
            caller_language="English",
            preferred_contact_method="Phone call",
            user_has_consented=True,
            db_path=db_file,
        )


@pytest.mark.asyncio
async def test_assistant_create_escalation_tool() -> None:
    """Direct invocation test of Assistant.create_escalation function tool."""
    assistant = Assistant()
    tool_output = await assistant.create_escalation(
        context=None,  # type: ignore
        caller_name="Anil Verma",
        reason_category="complex_decision",
        issue_summary="Requested custom loan rate override.",
        agent_checks_done="Explained Mudra loan policy.",
        urgency="Medium",
        caller_language="English",
        preferred_contact_method="Email",
        user_has_consented=True,
    )

    parsed = json.loads(tool_output)
    assert parsed["success"] is True
    assert parsed["reference_id"].startswith("ESC-")
    assert parsed["urgency"] == "Medium"


@pytest.mark.asyncio
async def test_agent_asks_permission_before_escalating() -> None:
    """LLM evaluation test: Verify agent asks for permission before creating a human help request."""
    async with (
        _llm() as llm_inst,
        AgentSession(llm=llm_inst) as session,
    ):
        await session.start(Assistant())

        # Caller reports possible fraud
        result = await session.run(
            user_input="I got a suspicious phone call asking for money to release my PM Kisan payment. I think it is a scam."
        )

        # Judge evaluating if agent explains payload and asks for permission before escalating
        await result.expect.next_event(type="message").judge(
            llm_inst,
            intent="""
            Recognizes potential fraud/scam report, reassures the caller, explains that a human support ticket can be created, and explicitly asks for permission/consent from the caller before submitting their request.
            """,
        )
