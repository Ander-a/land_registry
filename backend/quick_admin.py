#!/usr/bin/env python3
"""
Quick Admin User Creation - Single Command
Usage: python quick_admin.py <name> <email> <password>
Example: python quick_admin.py "Admin User" admin@example.com SecurePass123
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

sys.path.append('/home/munga/Desktop/innocent/land_registry/backend')

from app.config import settings
from app.models.user import User
from app.auth.auth import get_password_hash


async def create_admin(name: str, email: str, password: str):
    """Create admin user with provided credentials"""
    client = AsyncIOMotorClient(settings.MONGO_URL)
    database = client[settings.DB_NAME]
    
    try:
        await init_beanie(database=database, document_models=[User])
        
        # Check if user exists
        existing = await User.find_one(User.email == email)
        if existing:
            print(f"❌ User '{email}' already exists!")
            print(f"   Current role: {existing.role}")
            
            if existing.role != "admin":
                existing.role = "admin"
                existing.hashed_password = get_password_hash(password)
                await existing.save()
                print(f"✅ Updated '{email}' to admin role!")
            return
        
        # Create new admin
        admin = User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            role="admin"
        )
        await admin.insert()
        
        print(f"✅ Admin user created successfully!")
        print(f"   Name: {name}")
        print(f"   Email: {email}")
        print(f"   Role: admin")
        print(f"   ID: {admin.id}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python quick_admin.py <name> <email> <password>")
        print('Example: python quick_admin.py "Admin User" admin@example.com SecurePass123')
        sys.exit(1)
    
    name = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters!")
        sys.exit(1)
    
    # Truncate password if it exceeds bcrypt's 72 byte limit
    if len(password.encode('utf-8')) > 72:
        print("⚠️  Password truncated to 72 bytes (bcrypt limit)")
        password = password[:72]
    
    asyncio.run(create_admin(name, email, password))
