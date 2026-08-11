"""Financial schemes dataset and eligibility evaluator for Voice of Bharat."""

from typing import Any, Optional

# Data recency timestamp (Step 5 requirement)
DATA_AS_OF = "August 10, 2026 (Official Portal Records)"

SCHEMES_DATABASE: dict[str, dict[str, Any]] = {
    "pm_kisan": {
        "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "aliases": ["pm kisan", "kisan samman", "pm-kisan", "farmer scheme"],
        "category": "Agriculture & Farmers",
        "benefits": "6000 Rupees per year directly transferred to bank accounts in 3 equal installments of 2000 Rupees every 4 months.",
        "documents_required": [
            "Aadhaar Card",
            "Landholding ownership documents (Khasra/Khatauni)",
            "Active bank account linked with Aadhaar (e-KYC completed)",
            "Mobile number registered with Aadhaar",
        ],
        "eligibility_rules": {
            "target_group": "Small and marginal landholder farmer families",
            "landowner_required": True,
            "exclusions": "Institutional landholders, serving/retired government employees, income tax payers in last assessment year, professionals (doctors, engineers, lawyers).",
        },
        "last_updated": DATA_AS_OF,
    },
    "jan_dhan": {
        "scheme_name": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
        "aliases": ["jan dhan", "pmjdy", "jan dhan yojana", "zero balance account"],
        "category": "Banking & Financial Inclusion",
        "benefits": "Zero balance savings account, free RuPay debit card with 2 Lakh Rupees accidental insurance cover, and 10000 Rupees overdraft facility after 6 months of satisfactory account operation.",
        "documents_required": [
            "Aadhaar Card OR Voter ID OR Driving License OR Job Card issued by NREGA",
            "Two recent passport size photographs",
        ],
        "eligibility_rules": {
            "min_age": 10,
            "citizenship": "Indian citizen",
            "target_group": "Any unbanked individual without a basic savings bank deposit account",
        },
        "last_updated": DATA_AS_OF,
    },
    "sukanya_samriddhi": {
        "scheme_name": "Sukanya Samriddhi Yojana (SSY)",
        "aliases": ["sukanya samriddhi", "sukanya", "ssy", "girl child scheme"],
        "category": "Small Savings & Girl Child",
        "benefits": "Current interest rate of 8.2% per annum (compounded annually, tax-free under Section 80C). Maturity after 21 years or upon marriage after age 18.",
        "documents_required": [
            "Girl child's birth certificate",
            "Identity proof of parent/guardian (Aadhaar/PAN)",
            "Address proof of parent/guardian (Voter ID/Utility bill)",
            "Passport size photographs of child and parent",
        ],
        "eligibility_rules": {
            "target_gender": "female",
            "max_child_age": 10,
            "limit_per_family": "Maximum 2 girl children per family (exceptions for twins/triplets)",
            "min_deposit_annual": "250 Rupees per financial year",
            "max_deposit_annual": "1500000 Rupees per financial year",
        },
        "last_updated": DATA_AS_OF,
    },
    "atal_pension": {
        "scheme_name": "Atal Pension Yojana (APY)",
        "aliases": ["atal pension", "apy", "pension scheme"],
        "category": "Pension & Social Security",
        "benefits": "Guaranteed monthly pension between 1000 Rupees and 5000 Rupees per month starting at age 60, based on monthly contribution amount.",
        "documents_required": [
            "Aadhaar Card",
            "Savings bank account number linked with mobile number",
        ],
        "eligibility_rules": {
            "min_age": 18,
            "max_age": 40,
            "target_group": "Unorganized sector workers who are Indian citizens and non-income tax payers",
        },
        "last_updated": DATA_AS_OF,
    },
    "pm_mudra": {
        "scheme_name": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "aliases": ["pm mudra", "mudra loan", "mudra yojana", "business loan"],
        "category": "Micro Enterprise Credit",
        "benefits": "Collateral-free micro loans: Shishu (up to 50000 Rupees), Kishor (50000 Rupees to 5 Lakh Rupees), and Tarun (5 Lakh Rupees to 10 Lakh Rupees) with attractive bank interest rates.",
        "documents_required": [
            "Aadhaar Card and PAN Card",
            "Proof of business address and registration/license",
            "Bank statements for last 6 months",
            "Quotation of machinery or equipment to be purchased",
        ],
        "eligibility_rules": {
            "target_group": "Non-corporate, non-farm small/micro enterprises engaged in manufacturing, trading, or services",
            "min_age": 18,
        },
        "last_updated": DATA_AS_OF,
    },
    "suraksha_bima": {
        "scheme_name": "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
        "aliases": ["suraksha bima", "pmsby", "accident insurance"],
        "category": "Accident Insurance",
        "benefits": "Accidental death and full disability cover of 2 Lakh Rupees (partial disability 1 Lakh Rupees) for a premium of just 20 Rupees per year auto-debited from bank account.",
        "documents_required": [
            "Aadhaar Card",
            "Savings bank account with auto-debit facility enabled",
            "Nominee details",
        ],
        "eligibility_rules": {
            "min_age": 18,
            "max_age": 70,
            "target_group": "Savings bank account holders",
        },
        "last_updated": DATA_AS_OF,
    },
}


def find_scheme_by_name(query: str) -> Optional[dict[str, Any]]:
    """Match scheme by name or alias."""
    query_clean = query.strip().lower()

    # 1. First pass: Check for direct alias or scheme ID matches
    for scheme_id, data in SCHEMES_DATABASE.items():
        if query_clean == scheme_id or any(
            alias == query_clean or alias in query_clean for alias in data["aliases"]
        ):
            return data

    # 2. Second pass: Check if scheme_name contains query or query contains scheme_name
    for _scheme_id, data in SCHEMES_DATABASE.items():
        if (
            query_clean in data["scheme_name"].lower()
            or data["scheme_name"].lower() in query_clean
        ):
            return data

    # 3. Third pass: Word token overlap excluding common generic terms
    ignore_words = {"pradhan", "mantri", "yojana", "scheme", "pm"}
    query_words = set(query_clean.split()) - ignore_words
    if query_words:
        for _scheme_id, data in SCHEMES_DATABASE.items():
            name_words = set(data["scheme_name"].lower().split()) - ignore_words
            alias_words = set(" ".join(data["aliases"]).lower().split()) - ignore_words
            if query_words & (name_words | alias_words):
                return data

    return None


def evaluate_eligibility(
    scheme_query: str,
    applicant_age: Optional[int] = None,
    annual_income_inr: Optional[float] = None,
    occupation_category: Optional[str] = None,
    is_landowner: Optional[bool] = None,
    child_gender: Optional[str] = None,
    child_age: Optional[int] = None,
    simulate_timeout: Optional[bool] = False,
) -> dict[str, Any]:
    """Evaluate applicant eligibility and return document checklist for financial schemes."""
    if simulate_timeout:
        return {
            "status": "TIMEOUT_FALLBACK",
            "scheme_query": scheme_query,
            "message": "Live government portal connection timed out. Using verified offline records as of August 2026.",
            "spoken_guidance": "Tell the caller out loud that the live portal lookup timed out, but state standard eligibility and document requirements based on August 2026 records.",
            "data_as_of": DATA_AS_OF,
        }

    scheme = find_scheme_by_name(scheme_query)

    if not scheme:
        available_schemes = [s["scheme_name"] for s in SCHEMES_DATABASE.values()]
        return {
            "status": "NOT_FOUND",
            "message": f"Scheme '{scheme_query}' not recognized in official portal.",
            "available_schemes": available_schemes,
            "data_as_of": DATA_AS_OF,
        }

    rules = scheme["eligibility_rules"]
    reasons: list[str] = []
    is_eligible = True
    missing_info: list[str] = []

    # PM Kisan check
    if scheme["scheme_name"] == "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)":
        if is_landowner is False:
            is_eligible = False
            reasons.append("PM-Kisan requires owning cultivable agricultural land.")
        elif is_landowner is None:
            missing_info.append("Do you own cultivable agricultural land?")

    # Sukanya Samriddhi check
    if "Sukanya" in scheme["scheme_name"]:
        if child_gender and child_gender.lower() not in ["female", "girl", "daughter"]:
            is_eligible = False
            reasons.append("Sukanya Samriddhi Yojana is exclusively for girl children.")
        if child_age is not None and child_age > 10:
            is_eligible = False
            reasons.append(
                f"Girl child must be 10 years or younger (provided age: {child_age})."
            )
        elif child_age is None and child_gender is None:
            missing_info.append(
                "Is the account being opened for a girl child under 10 years of age?"
            )

    # Age checks
    if applicant_age is not None:
        min_age = rules.get("min_age")
        max_age = rules.get("max_age")
        if min_age and applicant_age < min_age:
            is_eligible = False
            reasons.append(
                f"Minimum age required is {min_age} years (provided: {applicant_age})."
            )
        if max_age and applicant_age > max_age:
            is_eligible = False
            reasons.append(
                f"Maximum age allowed is {max_age} years (provided: {applicant_age})."
            )

    status_str = (
        "ELIGIBLE"
        if is_eligible and not missing_info
        else ("INELIGIBLE" if not is_eligible else "NEEDS_CLARIFICATION")
    )

    return {
        "status": status_str,
        "scheme_name": scheme["scheme_name"],
        "category": scheme["category"],
        "benefits": scheme["benefits"],
        "is_eligible": is_eligible,
        "reasons": reasons,
        "missing_information": missing_info,
        "required_documents": scheme["documents_required"],
        "data_as_of": scheme["last_updated"],
    }
