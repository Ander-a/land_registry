from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from .config import settings
from .models.user import User

client = None
database = None

async def init_db():
    global client, database
    client = AsyncIOMotorClient(settings.MONGO_URL)
    database = client[settings.DB_NAME]
    await init_beanie(database=database, document_models=[User])

async def close_db():
    global client
    if client:
        client.close()
