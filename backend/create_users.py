"""
Script to create initial users for the Land Registry System
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from app.models.user import User
from app.models.roles import UserRole
from app.models.claim import Claim
from app.models.ai_result import AIResult
from app.models.validation import Validation

def hash_password(password: str) -> str:
    """Hash a password using bcrypt. Truncates to 72 bytes if needed."""
    # Bcrypt has a 72 byte limit
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

async def create_users():
    """Create initial users for the system."""
    
    # MongoDB connection
    MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://cluster0.t3sajof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    DB_NAME = os.getenv("DB_NAME", "land_registry_db")
    
    print(f"Connecting to MongoDB: {DB_NAME}")
    
    # Initialize MongoDB client
    client = AsyncIOMotorClient(MONGO_URL)
    database = client[DB_NAME]
    
    # Initialize Beanie
    await init_beanie(
        database=database,
        document_models=[User, Claim, AIResult, Validation]
    )
    
    print("Connected to MongoDB successfully!")
    
    # Define users to create
    users_data = [
        {
            "name": "Resident User",
            "email": "anderainnocent@gmail.com",
            "password": "pass123",
            "role": UserRole.RESIDENT
        },
        {
            "name": "Admin User",
            "email": "anderaian43@gmail.com",
            "password": "pass123",
            "role": UserRole.ADMIN
        },
        {
            "name": "Community Member",
            "email": "araudo@kabarak.ac.ke",
            "password": "pass123",
            "role": UserRole.COMMUNITY_MEMBER
        },
        {
            "name": "Local Leader",
            "email": "ianinnocent550@gmail.com",
            "password": "pass123",
            "role": UserRole.LOCAL_LEADER
        }
    ]
    
    created_users = []
    skipped_users = []
    
    for user_data in users_data:
        # Check if user already exists
        existing_user = await User.find_one(User.email == user_data["email"])
        
        if existing_user:
            print(f"⚠️  User already exists: {user_data['email']} ({user_data['role'].value})")
            skipped_users.append(user_data["email"])
            continue
        
        # Create new user
        new_user = User(
            name=user_data["name"],
            email=user_data["email"],
            hashed_password=hash_password(user_data["password"]),
            role=user_data["role"],
            is_active=True
        )
        
        await new_user.insert()
        created_users.append(user_data["email"])
        print(f"✅ Created user: {user_data['email']} (Role: {user_data['role'].value})")
    
    # Summary
    print("\n" + "="*60)
    print("USER CREATION SUMMARY")
    print("="*60)
    print(f"✅ Created: {len(created_users)} users")
    print(f"⚠️  Skipped: {len(skipped_users)} users (already exist)")
    print("\n📋 USER CREDENTIALS:")
    print("-" * 60)
    
    for user_data in users_data:
        status = "✅ NEW" if user_data["email"] in created_users else "⏭️  EXISTS"
        print(f"{status} | {user_data['role'].value.upper():20} | {user_data['email']}")
    
    print("\n🔑 PASSWORD: pass123 (for all users)")
    print("="*60)
    
    # Close connection
    client.close()
    print("\n✅ Database connection closed.")

if __name__ == "__main__":
    print("🚀 Starting user creation script...")
    print("="*60)
    asyncio.run(create_users())
