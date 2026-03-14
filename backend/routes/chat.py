from fastapi import APIRouter
from schemas import ChatRequest, ChatResponse
from google.genai import types
from agent.agent import USER_ID, SESSION_ID, runner

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def call_agent_async(query: str, runner, user_id, session_id):
    content = types.Content(role="user", parts=[types.Part(text=query)])

    final_response_text = "Agent did not produce a final response."

    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif event.actions and event.actions.escalate:
                final_response_text = (
                    f"Agent escalated: {event.error_message or 'No specific message.'}"
                )
            break

    return final_response_text


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    print(payload.message)
    agent_message = await call_agent_async(
        payload.message, runner=runner, user_id=USER_ID, session_id=SESSION_ID
    )
    return ChatResponse(message=agent_message)
