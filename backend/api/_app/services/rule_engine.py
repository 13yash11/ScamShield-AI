import re
from dataclasses import dataclass, field

from .privacy import redact
from .url_analyzer import analyze_url


@dataclass
class RuleAssessment:
    score: int = 5
    indicators: list[str] = field(default_factory=list)
    phrases: list[str] = field(default_factory=list)


def assess_text(text: str) -> RuleAssessment:
    result = RuleAssessment()
    # Advice such as "never share your OTP" must not be treated as a request.
    sentences = re.split(r"[.!?\n]+(?=\s|$)", text.lower())
    actionable = " ".join(
        s
        for s in sentences
        if not re.search(
            r"\b(never|do not|don't|not to|refuse to)\b.{0,35}\b(share|send|give|disclose|pay|click|enter)\b",
            s,
        )
    )
    request = bool(
        re.search(
            r"\b(share|send|give|provide|tell|enter|confirm|submit|reply|verify)\b", actionable
        )
    )
    payment = bool(re.search(r"\b(pay|payment|transfer|deposit|send money|upi)\b", actionable))

    def add(condition: bool, weight: int, label: str, pattern: str | None = None):
        if not condition:
            return
        result.score += weight
        result.indicators.append(f"{label} (+{weight} heuristic points)")
        if pattern and (match := re.search(pattern, actionable)):
            result.phrases.append(redact(match.group())[:100])

    otp = bool(
        re.search(r"\b(otp|one.time.password|verification code|security code)\b", actionable)
    )
    password = bool(re.search(r"\b(password|pin|cvv|card details|bank credentials)\b", actionable))
    fee = bool(
        re.search(r"\b(fee|registration charge|security deposit|processing charge)\b", actionable)
    )
    lottery = bool(re.search(r"\b(won|winner|lottery|jackpot|prize money)\b", actionable))
    job = bool(re.search(r"\b(job|recruitment|hiring|work from home|employment)\b", actionable))
    urgent = bool(
        re.search(
            r"\b(urgent|immediately|today only|act now|within \d+ (?:hours|minutes))\b", actionable
        )
    )
    suspension = bool(
        re.search(r"\b(suspend|suspended|blocked|deactivated|closed|freeze)\b", actionable)
    )
    bank = bool(re.search(r"\b(bank|sbi|hdfc|icici|rbi|kyc|income tax)\b", actionable))
    add(
        request and otp,
        35,
        "Request to disclose or enter an OTP/verification code",
        r".{0,24}\b(?:otp|verification code)\b.{0,24}",
    )
    add(
        request and password,
        40,
        "Request for passwords, PINs, or sensitive financial credentials",
        r".{0,20}\b(?:password|pin|cvv|card details)\b.{0,20}",
    )
    add(
        payment and fee,
        25,
        "Payment of a fee is requested before a promised benefit",
        r".{0,20}\b(?:fee|security deposit)\b.{0,20}",
    )
    add(
        lottery and (payment or request),
        20,
        "Prize or lottery claim combined with a request for action",
    )
    add(job and payment and fee, 20, "Job offer combined with an upfront payment")
    add(urgent and (request or payment), 10, "Urgency pressures the recipient to act")
    add(
        suspension and (request or payment),
        15,
        "Account-blocking threat combined with an action request",
    )
    add(
        bank and (request or payment) and (otp or password or suspension),
        10,
        "Banking identity is used alongside a sensitive request or threat",
    )
    add(
        bool(
            re.search(
                r"\b(guaranteed (?:profit|returns?)|double your money|risk.free (?:profit|investment)|\d+% (?:daily|per day))\b",
                actionable,
            )
        ),
        25,
        "Unrealistic or guaranteed financial-return promise",
    )
    urls = re.findall(r"https?://[^\s<>\"]+", text)[:10]
    url_scores = []
    for url in urls:
        try:
            checked = analyze_url(url.rstrip(".,);"))
            url_scores.append(checked.score)
            result.indicators.extend(v for v in checked.indicators if v not in result.indicators)
        except ValueError:
            result.indicators.append(
                "A malformed web link appears in the message (+5 heuristic points)"
            )
            url_scores.append(5)
    # Cap combined link influence; repeated links cannot inflate the score indefinitely.
    result.score += min(35, max(url_scores, default=0))
    if urls and (request or payment) and (urgent or suspension):
        add(True, 10, "Link accompanies an urgent request or account threat")
    result.score = min(100, result.score)
    return result
