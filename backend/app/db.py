from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from .config import settings
from .models.user import User
from .models.claim import Claim
from .models.ai_result import AIResult
from .models.validation import Validation
from .models.community import CommunityPost, PostLike, PostComment, PostVerification

client = None
database = None

async def init_db():
    global client, database
    client = AsyncIOMotorClient(settings.MONGO_URL)
    database = client[settings.DB_NAME]
    await init_beanie(
        database=database, 
        document_models=[
            User, 
            Claim, 
            AIResult, 
            Validation,
            CommunityPost,
            PostLike,
            PostComment,
            PostVerification
        ]
    )

async def close_db():
    global client
    if client:
        client.close()
