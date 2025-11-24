import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def create_admin():
    # Connect to MongoDB Atlas
    client = AsyncIOMotorClient('mongodb+srv://anderainnocent_db_user:NIczNzqXVquUkrrm@cluster0.t3sajof.mongodb.net/land_registry_db')
    db = client['land_registry_db']
    
    # Hash the password
    hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create admin user document
    admin_user = {
        "name": "Admin User",
        "email": "admin@landregistry.gov",
        "hashed_password": hashed_password,
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    
    # Check if user already exists
    existing = await db.users.find_one({"email": "admin@landregistry.gov"})
    if existing:
        print("Admin user already exists!")
        print(f"Email: admin@landregistry.gov")
        print(f"Role: {existing.get('role')}")
    else:
        # Insert admin user
        result = await db.users.insert_one(admin_user)
        print(f"Admin user created successfully!")
        print(f"Email: admin@landregistry.gov")
        print(f"Password: admin123")
        print(f"Role: admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
