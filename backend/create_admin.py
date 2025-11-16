"""
Admin User Creation Script
Creates an admin user for the AI-Assisted Land Registry System
"""
import asyncio
import sys
from getpass import getpass
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add parent directory to path to import app modules
sys.path.append('/home/munga/Desktop/innocent/land_registry/backend')

from app.config import settings
from app.models.user import User
from app.auth.auth import get_password_hash


async def create_admin_user(
    name: str,
    email: str,
    password: str,
    role: str = "admin"
):
    """Create an admin user in the database"""
    
    print("\n🔧 Connecting to database...")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    database = client[settings.DB_NAME]
    
    try:
        # Initialize Beanie with User model
        await init_beanie(database=database, document_models=[User])
        print("✅ Connected to database")
        
        # Check if user already exists
        existing_user = await User.find_one(User.email == email)
        if existing_user:
            print(f"\n❌ User with email '{email}' already exists!")
            response = input("Do you want to update this user to admin? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                existing_user.role = role
                existing_user.name = name
                existing_user.hashed_password = get_password_hash(password)
                await existing_user.save()
                print(f"✅ User '{email}' updated to admin role!")
                return existing_user
            else:
                print("Operation cancelled.")
                return None
        
        # Create new admin user
        print(f"\n👤 Creating admin user: {name} ({email})")
        admin_user = User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            role=role
        )
        
        await admin_user.insert()
        print(f"\n✅ Admin user created successfully!")
        print(f"   Name: {admin_user.name}")
        print(f"   Email: {admin_user.email}")
        print(f"   Role: {admin_user.role}")
        print(f"   ID: {admin_user.id}")
        
        return admin_user
        
    except Exception as e:
        print(f"\n❌ Error creating admin user: {str(e)}")
        raise
    finally:
        client.close()
        print("\n🔌 Database connection closed")


async def interactive_create_admin():
    """Interactive mode to create admin user"""
    print("\n" + "="*60)
    print("  🏛️  AI-Assisted Land Registry System")
    print("     Admin User Creation Tool")
    print("="*60 + "\n")
    
    name = input("Enter admin name: ").strip()
    if not name:
        print("❌ Name cannot be empty!")
        return
    
    email = input("Enter admin email: ").strip()
    if not email or '@' not in email:
        print("❌ Invalid email format!")
        return
    
    password = getpass("Enter admin password: ")
    if len(password) < 8:
        print("❌ Password must be at least 8 characters!")
        return
    
    password_confirm = getpass("Confirm password: ")
    if password != password_confirm:
        print("❌ Passwords do not match!")
        return
    
    # Confirm creation
    print(f"\n📋 Admin User Details:")
    print(f"   Name: {name}")
    print(f"   Email: {email}")
    print(f"   Role: admin")
    
    confirm = input("\nCreate this admin user? (yes/no): ")
    if confirm.lower() not in ['yes', 'y']:
        print("Operation cancelled.")
        return
    
    await create_admin_user(name, email, password, "admin")


async def quick_create_default_admin():
    """Quickly create a default admin user"""
    print("\n🚀 Creating default admin user...")
    
    default_name = "System Administrator"
    default_email = "admin@landregistry.gov"
    default_password = "Admin@123456"  # Change this in production!
    
    print(f"\n⚠️  Default credentials:")
    print(f"   Email: {default_email}")
    print(f"   Password: {default_password}")
    print(f"\n⚠️  IMPORTANT: Change these credentials after first login!")
    
    confirm = input("\nProceed with default admin creation? (yes/no): ")
    if confirm.lower() not in ['yes', 'y']:
        print("Operation cancelled.")
        return
    
    await create_admin_user(default_name, default_email, default_password, "admin")


async def list_all_users():
    """List all users in the database"""
    print("\n📋 Fetching all users...")
    
    client = AsyncIOMotorClient(settings.MONGO_URL)
    database = client[settings.DB_NAME]
    
    try:
        await init_beanie(database=database, document_models=[User])
        
        users = await User.find_all().to_list()
        
        if not users:
            print("\n📭 No users found in database.")
            return
        
        print(f"\n✅ Found {len(users)} user(s):\n")
        print(f"{'ID':<26} {'Name':<25} {'Email':<30} {'Role':<15}")
        print("-" * 100)
        
        for user in users:
            print(f"{str(user.id):<26} {user.name:<25} {user.email:<30} {user.role:<15}")
        
    except Exception as e:
        print(f"\n❌ Error listing users: {str(e)}")
    finally:
        client.close()


async def delete_user_by_email(email: str):
    """Delete a user by email"""
    print(f"\n🗑️  Deleting user: {email}")
    
    client = AsyncIOMotorClient(settings.MONGO_URL)
    database = client[settings.DB_NAME]
    
    try:
        await init_beanie(database=database, document_models=[User])
        
        user = await User.find_one(User.email == email)
        if not user:
            print(f"\n❌ User with email '{email}' not found!")
            return
        
        print(f"\n⚠️  Found user:")
        print(f"   Name: {user.name}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        
        confirm = input("\nAre you sure you want to delete this user? (yes/no): ")
        if confirm.lower() not in ['yes', 'y']:
            print("Operation cancelled.")
            return
        
        await user.delete()
        print(f"\n✅ User '{email}' deleted successfully!")
        
    except Exception as e:
        print(f"\n❌ Error deleting user: {str(e)}")
    finally:
        client.close()


async def main():
    """Main menu"""
    while True:
        print("\n" + "="*60)
        print("  🏛️  Land Registry - Admin User Management")
        print("="*60)
        print("\n1. Create admin user (interactive)")
        print("2. Create default admin user (quick)")
        print("3. List all users")
        print("4. Delete user by email")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == "1":
            await interactive_create_admin()
        elif choice == "2":
            await quick_create_default_admin()
        elif choice == "3":
            await list_all_users()
        elif choice == "4":
            email = input("\nEnter email of user to delete: ").strip()
            if email:
                await delete_user_by_email(email)
        elif choice == "5":
            print("\n👋 Goodbye!")
            break
        else:
            print("\n❌ Invalid choice! Please enter 1-5.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        sys.exit(1)
