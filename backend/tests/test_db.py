import gc
import os
import tempfile

import pytest

from db import get_caller, init_db, sanitize_facts, save_caller


@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    gc.collect()
    try:
        if os.path.exists(path):
            os.remove(path)
    except PermissionError:
        pass


def test_save_caller_with_consent(temp_db):
    facts = {
        "schemes_checked": ["PM Jan Dhan Yojana", "PM Kisan"],
        "eligibility_answers": {"land_owner": "yes"},
        "last_topic": "PM Kisan eligibility",
        "follow_up_note": "Advised to bring land records to CSC",
    }

    res = save_caller(
        user_id="user_999",
        name="Ramesh Kumar",
        language_preference="Hindi",
        facts=facts,
        explicit_consent_given=True,
        db_path=temp_db,
    )

    assert res["success"] is True
    assert res["user_id"] == "user_999"
    assert res["name"] == "Ramesh Kumar"
    assert res["facts"]["last_topic"] == "PM Kisan eligibility"

    fetched = get_caller("user_999", db_path=temp_db)
    assert fetched is not None
    assert fetched["name"] == "Ramesh Kumar"
    assert fetched["language_preference"] == "Hindi"
    assert fetched["facts"]["schemes_checked"] == ["PM Jan Dhan Yojana", "PM Kisan"]
    assert "last_interaction" in fetched


def test_save_caller_without_consent(temp_db):
    facts = {"last_topic": "Banking inquiry"}

    res = save_caller(
        user_id="user_888",
        name="Suresh",
        language_preference="English",
        facts=facts,
        explicit_consent_given=False,
        db_path=temp_db,
    )

    assert res["success"] is False
    assert "Consent not granted" in res["reason"]

    fetched = get_caller("user_888", db_path=temp_db)
    assert fetched is None


def test_sensitive_key_sanitization():
    sensitive_facts = {"account_number": "123456789012"}
    with pytest.raises(ValueError, match="Cannot store sensitive financial attribute"):
        sanitize_facts(sensitive_facts)

    aadhaar_facts = {"aadhaar": "999988887777"}
    with pytest.raises(ValueError, match="Cannot store sensitive financial attribute"):
        sanitize_facts(aadhaar_facts)


def test_sensitive_value_pattern_sanitization():
    numeric_account_facts = {"notes": "Customer account is 9876543210123"}
    with pytest.raises(ValueError, match="Sensitive numeric or ID pattern"):
        sanitize_facts(numeric_account_facts)

    pan_facts = {"notes": "User PAN is ABCDE1234F"}
    with pytest.raises(ValueError, match="Sensitive numeric or ID pattern"):
        sanitize_facts(pan_facts)
