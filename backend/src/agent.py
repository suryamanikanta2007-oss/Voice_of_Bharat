import json
import logging
from typing import Any

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.english import EnglishModel

from db import get_caller, init_db, save_caller

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
SYSTEM_PROMPT = """
IDENTITY
You are Anisha, a voice assistant for a community financial services helpline in India ("Voice of Bharat"). You are helpful, warm, and speak in a natural Indian voice.

VOICE RESPONSE RULES (CRITICAL)
- Keep responses short, direct, and conversational (maximum 2 to 3 short sentences per answer).
- Never use bullet points, bolding, markdown formatting, or symbols—speak plain natural sentences.
- Speak clearly in simple language. If using financial terms like KYC or Jan Dhan, explain them simply in one sentence.
- Always be polite and end with a quick, helpful question like "Would you like to know what documents to bring?" or "Is there anything else I can help with?"
- Understand Indian English accents, local terms, and Speech-to-Text transcription variations smoothly (e.g., Kisan/Kishan, Jan Dhan/Jan Dan).

CALLER MEMORY & LAST CONVERSATION RECALL (CRITICAL)
- If the caller asks ANY question about previous calls (such as "What did we discuss in our last conversation?", "What did I say last time?", "Do you remember me?", "What schemes did we check before?"):
  1. Always call `get_caller_info` immediately to fetch their saved memory.
  2. Answer by stating their name, the exact schemes checked, the last topic discussed, and any follow-up notes from their previous call.
- When welcoming a returning caller at the start of a call, use their saved profile to greet them by name and reference their previous topic (e.g. "Namaste Ramesh, welcome back! Last time we spoke about PM Kisan eligibility. How can I help you today?").

CONSENT REQUIREMENT & AUTOMATIC SAVING (HARD RULE - HARD REQUIREMENT)
- Before invoking `save_caller_info`, you MUST explicitly ask the caller for permission in your response:
  "May I save your name and what we discussed today so I can remember it for your next call?"
- DO NOT call `save_caller_info` until you have asked for permission and received the caller's affirmative response ("Yes", "Sure", "Okay", etc.).
- IF the caller says YES or agrees: call `save_caller_info` with `user_has_consented=True` and pass a JSON string `facts_json` containing `last_topic`, `schemes_checked`, and `follow_up_note`.
- IF the caller says NO or refuses: DO NOT save their details, or call `save_caller_info` with `user_has_consented=False`.

OBJECTIVES
1. Help callers understand basic Indian financial products, schemes (like PM Jan Dhan Yojana, PM Kisan, Sukanya Samriddhi), and banking processes.
2. Direct callers on next steps (which documents to take to a bank branch or CSC center).
3. Track schemes checked and eligibility answers in caller facts (e.g. schemes_checked, eligibility_answers, last_topic, follow_up_note).
4. Warn callers calmly if they describe anything sounding like a scam or fraud.

GUARDRAILS (HARD RULE)
- NEVER ask for, record, or store account numbers, Aadhaar numbers, PAN numbers, PINs, CVVs, passwords, or OTPs.
- Never guarantee loan approvals or confirm exact interest rates.
"""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

    @function_tool
    async def get_caller_info(self, context: RunContext, user_id: str) -> str:
        """Look up saved information for a caller by their user ID, name, or phone number.

        Use this tool when a caller asks "What did we discuss in our last conversation?",
        "Do you remember me?", or introduces themselves, to recall their saved facts from previous visits.

        Args:
            user_id: The unique caller ID, phone number, or name of the caller. If unknown, use 'caller_default_user'.
        """
        target_id = user_id if user_id and user_id.strip() else "caller_default_user"
        logger.info(f"Looking up caller info for user_id: {target_id}")
        record = get_caller(target_id)

        if not record:
            return f"No prior record found for user_id '{target_id}'. This is a new caller."

        return json.dumps(record, indent=2)

    @function_tool
    async def save_caller_info(
        self,
        context: RunContext,
        user_id: str,
        name: str,
        language_preference: str,
        facts_json: str,
        user_has_consented: bool,
    ) -> str:
        """Save or update caller information and key facts learned during the call.

        CRITICAL FINANCIAL SERVICES RULE: You MUST ask the caller for explicit permission
        before invoking this tool. Pass user_has_consented=True ONLY IF the caller agreed.
        NEVER pass or store bank account numbers, Aadhaar numbers, PAN numbers, PINs, or OTPs.

        Args:
            user_id: The unique caller ID, phone number, or handle. If unknown, use caller name or 'caller_default_user'.
            name: Caller's name.
            language_preference: Language spoken (e.g. 'Hindi', 'English').
            facts_json: A JSON string containing 2 to 4 key facts for Financial Services (e.g. '{"schemes_checked": ["PM Kisan"], "eligibility_answers": {"land_owner": "yes"}, "last_topic": "PM Kisan eligibility"}'). Do NOT store account or ID numbers.
            user_has_consented: True if caller explicitly agreed to have their info saved; False otherwise.
        """
        logger.info(
            f"Attempting to save caller info for {user_id} (consent={user_has_consented})"
        )
        if not user_has_consented:
            return "Consent was not given by the caller. Profile data was NOT saved."

        try:
            if isinstance(facts_json, str):
                try:
                    facts_dict: dict[str, Any] = json.loads(facts_json)
                except Exception:
                    facts_dict = {"raw_facts": facts_json}
            else:
                facts_dict = facts_json

            # Default user_id to caller_default_user if not specified
            target_user_id = (
                user_id if user_id and user_id.strip() else "caller_default_user"
            )

            result = save_caller(
                user_id=target_user_id,
                name=name,
                language_preference=language_preference,
                facts=facts_dict,
                explicit_consent_given=user_has_consented,
            )
            return json.dumps(result, indent=2)
        except ValueError as e:
            logger.error(f"Security error saving caller info: {e}")
            return f"Error saving caller info due to security guardrail: {e}"


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    init_db()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Low-latency voice AI pipeline configuration
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="en-IN",
            smart_format=True,
            endpointing_ms=10,
            keyterm=[
                "PM Kisan",
                "Jan Dhan",
                "Sukanya Samriddhi",
                "CSC center",
                "Aadhaar",
                "KYC",
                "Voice of Bharat",
                "Ramesh",
                "Priya",
            ],
        ),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Anisha",
            locale="en-IN",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=4),
            text_pacing=False,
            min_buffer_size=1,
        ),
        turn_detection=EnglishModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    # Start session
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Connect to room
    await ctx.connect()

    # Retrieve existing remote participant or wait for participant safely
    participant = next(iter(ctx.room.remote_participants.values()), None)
    if not participant:
        try:
            participant = await ctx.wait_for_participant()
        except Exception:
            participant = None

    identity = participant.identity if participant else "caller_default_user"
    name_hint = participant.name if participant else None

    # Check SQLite DB for existing caller memory
    caller_profile = (
        get_caller(identity)
        or (get_caller(name_hint) if name_hint else None)
        or get_caller("caller_default_user")
    )

    if caller_profile:
        name = caller_profile.get("name", "friend")
        facts = caller_profile.get("facts", {})
        last_topic = (
            facts.get("last_topic")
            or facts.get("follow_up_note")
            or "your previous financial scheme inquiry"
        )
        greeting_instructions = (
            f"The caller is a returning user named '{name}'. "
            f"Your saved record shows last time you spoke about: '{last_topic}'. "
            f"Greet them warmly with 'Namaste {name}, welcome back!' and reference '{last_topic}' to continue from last time."
        )
        try:
            session.generate_reply(instructions=greeting_instructions)
        except Exception as e:
            logger.debug(f"Could not generate initial greeting reply: {e}")
    else:
        try:
            session.generate_reply(
                instructions="Greet the caller warmly in plain conversational sentences and introduce yourself as Anisha from Voice of Bharat."
            )
        except Exception as e:
            logger.debug(f"Could not generate initial greeting reply: {e}")


if __name__ == "__main__":
    cli.run_app(server)
