import asyncio
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams

MCP_SERVER_PATH = "/app/mcp_servers/main.py"

root_agent = Agent(
    model=LiteLlm(model="gpt-5-mini"),
    name="root_agent",
    description="Tells the current time in a specified city.",
    instruction="You are a helpful assistant that tells the current time in cities.",
    tools=[
        McpToolset(
            connection_params=SseConnectionParams(
                url="http://time-server:8001/sse",
            )
        )
    ],
)

session_service = InMemorySessionService()

APP_NAME = "weather_tutorial_app"
USER_ID = "user_1"
SESSION_ID = "session_001"


async def init_session(
    app_name: str, user_id: str, session_id: str
) -> InMemorySessionService:
    session = await session_service.create_session(
        app_name=app_name, user_id=user_id, session_id=session_id
    )
    print(
        f"Session created: App='{app_name}', User='{user_id}', Session='{session_id}'"
    )
    return session


session = asyncio.run(init_session(APP_NAME, USER_ID, SESSION_ID))

runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=session_service,
)
