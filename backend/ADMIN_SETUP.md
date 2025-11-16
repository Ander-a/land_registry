# Admin User Management Guide

## Overview

This guide explains how to create and manage admin users for the AI-Assisted Land Registry System.

---

## 🚀 Quick Start - Create Admin User

### Method 1: Interactive Script (Recommended)

Run the interactive admin creation tool:

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

This opens a menu where you can:
1. Create admin user (interactive with prompts)
2. Create default admin user (quick setup)
3. List all users
4. Delete user by email
5. Exit

### Method 2: Command Line (Quick)

Create admin user with a single command:

```bash
cd backend
source .venv/bin/activate
python quick_admin.py "Admin Name" "admin@example.com" "SecurePassword123"
```

**Example:**
```bash
python quick_admin.py "System Administrator" "admin@landregistry.gov" "Admin@2024!"
```

---

## 📋 Available User Roles

The system supports the following user roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | System administrator | Full system access, user management |
| **government_official** | Government official | Verify claims, final approval |
| **leader** | Community leader | Endorse claims, view community claims |
| **citizen** | Regular citizen | Submit claims, witness claims |
| **land_surveyor** | Land surveyor | Technical validation, boundary verification |

---

## 🛠️ Method 1: Interactive Script

### Features

- ✅ Password confirmation
- ✅ Input validation
- ✅ Check for existing users
- ✅ List all users
- ✅ Delete users
- ✅ Interactive menu

### Usage

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

### Menu Options

**1. Create admin user (interactive)**
- Prompts for name, email, and password
- Validates input
- Confirms password
- Checks for duplicates

**2. Create default admin user (quick)**
- Creates admin with default credentials
- ⚠️ Default email: `admin@landregistry.gov`
- ⚠️ Default password: `Admin@123456`
- **IMPORTANT:** Change these credentials after first login!

**3. List all users**
- Shows all users in database
- Displays: ID, Name, Email, Role

**4. Delete user by email**
- Remove user from database
- Requires confirmation

---

## 🚀 Method 2: Command Line Script

### Quick Creation

```bash
python quick_admin.py "<Name>" "<Email>" "<Password>"
```

### Examples

```bash
# Create system admin
python quick_admin.py "System Admin" "admin@system.com" "SecurePass123"

# Create government official admin
python quick_admin.py "Government Admin" "gov.admin@land.gov" "GovAdmin2024!"

# Create technical admin
python quick_admin.py "Tech Admin" "tech@landregistry.gov" "TechAdmin@2024"
```

### Features

- ✅ Single command execution
- ✅ Duplicate detection
- ✅ Automatic role upgrade
- ✅ Password length validation (minimum 8 characters)

---

## 🔐 Security Best Practices

### Password Requirements

- Minimum 8 characters
- Include uppercase and lowercase letters
- Include numbers
- Include special characters (recommended)

### Recommended Password Examples

✅ Good passwords:
- `Admin@2024!Secure`
- `LandRegistry#Admin2024`
- `Sys!Admin$2024`

❌ Weak passwords:
- `admin123`
- `password`
- `12345678`

### After Creation

1. **Change default passwords immediately**
2. **Use strong, unique passwords**
3. **Enable two-factor authentication (if available)**
4. **Regularly rotate admin passwords**
5. **Limit admin access to necessary personnel**

---

## 📝 Examples

### Example 1: Create First Admin User

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

Then select option 1 and enter:
```
Enter admin name: John Administrator
Enter admin email: john.admin@landregistry.gov
Enter admin password: [hidden]
Confirm password: [hidden]
```

### Example 2: Quick Default Admin

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

Select option 2 to create default admin with:
- Email: `admin@landregistry.gov`
- Password: `Admin@123456`

**Remember to change these credentials!**

### Example 3: Command Line Creation

```bash
cd backend
source .venv/bin/activate
python quick_admin.py "Sarah Admin" "sarah@admin.com" "Sarah@Admin2024!"
```

---

## 🔧 Troubleshooting

### Issue: "User already exists"

**Solution:** The script will offer to update the existing user to admin role.

```bash
❌ User with email 'admin@example.com' already exists!
Do you want to update this user to admin? (yes/no): yes
✅ User 'admin@example.com' updated to admin role!
```

### Issue: "Database connection failed"

**Solution:** Check your `.env` file and ensure MongoDB is running.

```bash
# Check MongoDB connection string in .env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/

# Or for local MongoDB
MONGO_URL=mongodb://localhost:27017/land_registry
```

### Issue: "Module not found"

**Solution:** Ensure virtual environment is activated and dependencies installed.

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Issue: "Password too short"

**Solution:** Use a password with at least 8 characters.

```bash
❌ Password must be at least 8 characters!
```

---

## 📊 List All Users

To see all users in the database:

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

Select option 3 to see:

```
✅ Found 3 user(s):

ID                         Name                      Email                          Role           
----------------------------------------------------------------------------------------------------
507f1f77bcf86cd799439011  John Administrator        john.admin@landregistry.gov    admin          
507f191e810c19729de860ea  Jane Citizen              jane@example.com               citizen        
507f191e810c19729de860eb  Mark Leader               mark.leader@community.org      leader         
```

---

## 🗑️ Delete User

To remove a user from the database:

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

Select option 4 and enter the email:

```
Enter email of user to delete: user@example.com

⚠️  Found user:
   Name: Test User
   Email: user@example.com
   Role: citizen

Are you sure you want to delete this user? (yes/no): yes
✅ User 'user@example.com' deleted successfully!
```

---

## 🔄 Update Existing User to Admin

If you need to promote an existing user to admin:

```bash
python quick_admin.py "User Name" "existing@email.com" "NewPassword123"
```

The script will detect the existing user and update their role to admin.

---

## 🎓 User Management via API

After creating an admin user, you can manage users via the API:

### Login as Admin

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@landregistry.gov",
    "password": "Admin@123456"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Use Admin Token

Include the token in subsequent requests:

```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Additional Resources

- **Main Documentation:** `README.md`
- **API Documentation:** `http://localhost:8000/docs` (when server is running)
- **Environment Configuration:** `.env` file
- **User Model:** `app/models/user.py`
- **Auth Module:** `app/auth/auth.py`

---

## ✅ Checklist

After creating an admin user:

- [ ] Admin user created successfully
- [ ] Default password changed (if using default)
- [ ] Admin can login via API
- [ ] Admin has full access to protected routes
- [ ] Credentials stored securely
- [ ] Other team members informed of admin credentials
- [ ] Backup admin created (recommended)

---

## 🆘 Support

If you encounter issues:

1. Check database connection in `.env`
2. Verify virtual environment is activated
3. Ensure all dependencies are installed
4. Check MongoDB is running and accessible
5. Review error messages carefully

---

**Created:** November 16, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready to Use
