from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from models import Auth


async def init_db():
    client = AsyncIOMotorClient(
        f"mongodb://{settings.MONGO_INITDB_ROOT_USERNAME}:{settings.MONGO_INITDB_ROOT_PASSWORD}@mongo:27017"
    )
    await init_beanie(database=client.myapp, document_models=[Auth])
