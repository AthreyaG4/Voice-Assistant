from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from typing import Optional

MCP_SERVER_PATH = "/app/mcp-servers/main.py"

session_service = InMemorySessionService()

APP_NAME = "spotify_tutorial_app"
USER_ID = "user_1"
SESSION_ID = "session_001"


runner: Optional[Runner] = None


def initialize_agent(spotify_token: str):
    global runner
    agent = Agent(
        model=LiteLlm(model="gpt-4o-mini"),
        name="root_agent",
        description="An agent that interacts with Spotify on behalf of the user.",
        instruction="""You are a helpful Spotify assistant. You can interact with the user's Spotify account to retrieve information and control playback.\n"""
        """When the user asks about their profile, playlists, currently playing track, or anything Spotify related, use the available tools to fetch the information and respond in a friendly, conversational way.\n"""
        """If a tool call fails with SPOTIFY_AUTH_EXPIRED, stop and inform the user that their Spotify session has expired and they need to reconnect.""",
        tools=[
            McpToolset(
                connection_params=StdioConnectionParams(
                    server_params=StdioServerParameters(
                        command="uv",
                        args=[
                            "run",
                            "--project",
                            "/app/mcp-servers",
                            "fastmcp",
                            "run",
                            MCP_SERVER_PATH,
                        ],
                        env={"SPOTIFY_TOKEN": spotify_token},
                    )
                )
            )
        ],
    )
    runner = Runner(agent=agent, app_name=APP_NAME, session_service=session_service)
