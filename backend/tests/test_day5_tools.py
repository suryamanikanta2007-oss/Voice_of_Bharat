import json

import pytest

from agent import Assistant
from scheme_data import DATA_AS_OF, evaluate_eligibility


def test_day5_pm_kisan_eligibility_and_documents() -> None:
    """Verify PM-Kisan eligibility logic, document checklist, and timestamp metadata."""
    res_eligible = evaluate_eligibility("PM Kisan", is_landowner=True)
    assert res_eligible["status"] == "ELIGIBLE"
    assert res_eligible["is_eligible"] is True
    assert "Aadhaar Card" in res_eligible["required_documents"]
    assert res_eligible["data_as_of"] == DATA_AS_OF

    res_ineligible = evaluate_eligibility("PM Kisan", is_landowner=False)
    assert res_ineligible["status"] == "INELIGIBLE"
    assert res_ineligible["is_eligible"] is False
    assert any("cultivable agricultural land" in r for r in res_ineligible["reasons"])


def test_day5_sukanya_samriddhi_gender_and_age_rules() -> None:
    """Verify Sukanya Samriddhi Yojana gender and age validation."""
    res_valid = evaluate_eligibility(
        "Sukanya Samriddhi", child_gender="female", child_age=5
    )
    assert res_valid["status"] == "ELIGIBLE"
    assert res_valid["data_as_of"] == DATA_AS_OF

    res_male = evaluate_eligibility(
        "Sukanya Samriddhi", child_gender="male", child_age=5
    )
    assert res_male["status"] == "INELIGIBLE"
    assert any("exclusively for girl children" in r for r in res_male["reasons"])

    res_overage = evaluate_eligibility(
        "Sukanya Samriddhi", child_gender="female", child_age=12
    )
    assert res_overage["status"] == "INELIGIBLE"
    assert any("10 years or younger" in r for r in res_overage["reasons"])


def test_day5_jan_dhan_and_mudra_eligibility() -> None:
    """Verify Jan Dhan and Mudra Loan eligibility checks."""
    res_jandhan = evaluate_eligibility("Jan Dhan Yojana", applicant_age=25)
    assert res_jandhan["status"] == "ELIGIBLE"
    assert (
        "Aadhaar Card OR Voter ID OR Driving License OR Job Card issued by NREGA"
        in res_jandhan["required_documents"]
    )

    res_mudra = evaluate_eligibility("Mudra Loan", applicant_age=30)
    assert res_mudra["status"] == "ELIGIBLE"
    assert "Bank statements for last 6 months" in res_mudra["required_documents"]


def test_day5_unknown_scheme_handling() -> None:
    """Verify unknown scheme query fallback."""
    res_unknown = evaluate_eligibility("Random Unknown Scheme")
    assert res_unknown["status"] == "NOT_FOUND"
    assert "available_schemes" in res_unknown
    assert res_unknown["data_as_of"] == DATA_AS_OF


def test_day5_timeout_fallback_out_loud_handling() -> None:
    """Verify timeout fallback response includes out-loud spoken guidance and cached data date."""
    res_timeout = evaluate_eligibility("PM Kisan", simulate_timeout=True)
    assert res_timeout["status"] == "TIMEOUT_FALLBACK"
    assert "spoken_guidance" in res_timeout
    assert res_timeout["data_as_of"] == DATA_AS_OF
    assert "timed out" in res_timeout["message"]


@pytest.mark.asyncio
async def test_day5_assistant_tool_direct_invocation() -> None:
    """Verify Assistant tool check_scheme_eligibility_and_docs direct invocation."""
    assistant = Assistant()
    tool_output = await assistant.check_scheme_eligibility_and_docs(
        context=None,  # type: ignore
        scheme_name="PM Kisan",
        is_landowner=True,
    )
    parsed = json.loads(tool_output)
    assert parsed["status"] == "ELIGIBLE"
    assert parsed["data_as_of"] == DATA_AS_OF

    # Test tool invocation with simulate_timeout=True
    timeout_output = await assistant.check_scheme_eligibility_and_docs(
        context=None,  # type: ignore
        scheme_name="PM Kisan",
        simulate_timeout=True,
    )
    parsed_timeout = json.loads(timeout_output)
    assert parsed_timeout["status"] == "TIMEOUT_FALLBACK"
    assert "spoken_guidance" in parsed_timeout
    assert parsed_timeout["data_as_of"] == DATA_AS_OF


if __name__ == "__main__":
    import asyncio

    test_day5_pm_kisan_eligibility_and_documents()
    test_day5_sukanya_samriddhi_gender_and_age_rules()
    test_day5_jan_dhan_and_mudra_eligibility()
    test_day5_unknown_scheme_handling()
    test_day5_timeout_fallback_out_loud_handling()
    asyncio.run(test_day5_assistant_tool_direct_invocation())
    print("ALL DAY 5 TESTS PASSED SUCCESSFULLY!")
