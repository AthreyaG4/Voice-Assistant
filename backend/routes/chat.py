from fastapi import APIRouter, HTTPException, UploadFile, File
from schemas import ChatResponse
from google.genai import types
from agent import agent
from models import Auth
from utils.refresh_tokens import refresh_spotify_token
from litellm import atranscription

router = APIRouter(prefix="/api/chat", tags=["chat"])


class SpotifyAuthError(Exception):
    pass


async def call_agent_async(query: str, runner, user_id, session_id):
    if runner is None:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")

    content = types.Content(role="user", parts=[types.Part(text=query)])

    final_response_text = "Agent did not produce a final response."

    print(f"{query=}")
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        print("=" * 60)
        print(event)
        print("=" * 60)
        if event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, "function_response") and part.function_response:
                    response = part.function_response.response

                    if response.get("isError"):
                        content_blocks = response.get("content", [])
                        for block in content_blocks:
                            text = block.get("text", "")
                            if "SPOTIFY_AUTH_EXPIRED" in text:
                                raise SpotifyAuthError()

        if event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif event.actions and event.actions.escalate:
                final_response_text = (
                    f"Agent escalated: {event.error_message or 'No specific message.'}"
                )
            break

    return final_response_text


@router.post("")
async def chat(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()

    transcript = await atranscription(
        model="whisper-1",
        file=(audio.filename, audio_bytes, audio.content_type),
    )

    print(transcript)

    try:
        agent_message = await call_agent_async(
            transcript.text,
            runner=agent.runner,
            user_id=agent.USER_ID,
            session_id=agent.SESSION_ID,
        )
    except SpotifyAuthError:
        auth = await Auth.find_one()
        tokens = await refresh_spotify_token(auth.refresh_token)

        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        expires_in = tokens["expires_in"]

        auth.access_token = access_token
        auth.refresh_token = refresh_token
        auth.expires_in = expires_in

        print("*" * 60)
        print("REFRESHED TOKENS")
        print("*" * 60)

        await auth.save()

        agent.initialize_agent(access_token)

        agent_message = await call_agent_async(
            transcript.text,
            runner=agent.runner,
            user_id=agent.USER_ID,
            session_id=agent.SESSION_ID,
        )
    return ChatResponse(message=agent_message)
