import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import api

# Load environment variables from .env.local or .env
env_local = Path(__file__).parent.parent / ".env.local"
if env_local.exists():
    load_dotenv(env_local)
else:
    load_dotenv()


async def main():
    livekit_url = os.environ.get("LIVEKIT_URL")
    api_key = os.environ.get("LIVEKIT_API_KEY")
    api_secret = os.environ.get("LIVEKIT_API_SECRET")

    if not livekit_url or not api_key or not api_secret:
        raise ValueError(
            "LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET must be set in environment or .env.local"
        )

    lk_api = api.LiveKitAPI(
        url=livekit_url,
        api_key=api_key,
        api_secret=api_secret,
    )

    room_name = "outbound-test-room"
    trunk_id = os.environ.get("LIVEKIT_SIP_TRUNK_ID", "ST_YOUR_TRUNK_ID")
    raw_call_to = os.environ.get("LINPHONE_SIP_URI", "your_username")

    # LiveKit sip_call_to expects a phone number or SIP user (e.g., 'username'), not full URI 'sip:user@host'
    call_to = raw_call_to
    if call_to.startswith("sip:"):
        call_to = call_to[4:]
    if "@" in call_to:
        call_to = call_to.split("@")[0]

    print(f"Connecting to LiveKit server: {livekit_url}")

    try:
        # Dispatch the agent into the room first
        await lk_api.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name="my-agent",
                room=room_name,
            )
        )

        print(f"Dispatched agent to room: {room_name}")

        # Now place the SIP call
        participant = await lk_api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                sip_trunk_id=trunk_id,
                sip_call_to=call_to,
                room_name=room_name,
                participant_identity="anisha-outbound-call",
            )
        )

        print(f"Call placed successfully: {participant}")
    finally:
        await lk_api.aclose()


if __name__ == "__main__":
    asyncio.run(main())
