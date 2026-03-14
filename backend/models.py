from beanie import Document
from pydantic import Field
from datetime import datetime, timezone


class Auth(Document):
    access_token: str
    refresh_token: str
    expires_in: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
