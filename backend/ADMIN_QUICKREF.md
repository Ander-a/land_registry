# Admin User - Quick Reference

## 🚀 Create Admin User (3 Ways)

### 1️⃣ Interactive Menu (Easiest)
```bash
cd backend
./admin.sh
```
Then follow the menu prompts.

### 2️⃣ Direct Python Script
```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

### 3️⃣ Command Line (Fastest)
```bash
cd backend
source .venv/bin/activate
python quick_admin.py "Admin Name" "email@example.com" "Password123"
```

---

## 📋 Quick Commands

| Task | Command |
|------|---------|
| Create admin interactively | `./admin.sh` |
| Create with command | `python quick_admin.py "Name" "email" "pass"` |
| List all users | Run `create_admin.py` → Option 3 |
| Delete user | Run `create_admin.py` → Option 4 |

---

## 🔐 Default Admin Credentials

**Quick Setup Option:**
- Email: `admin@landregistry.gov`
- Password: `Admin@123456`

⚠️ **CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

---

## ✅ Example: Create Your First Admin

```bash
# Navigate to backend
cd backend

# Run admin tool
./admin.sh

# Select: 1 (Create admin user - interactive)
# Enter name: John Smith
# Enter email: john@admin.com
# Enter password: [your secure password]
# Confirm password: [same password]
# Confirm: yes
```

✅ Done! Admin user created.

---

## 🎯 Test Admin Login

```bash
# Login via API
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@landregistry.gov",
    "password": "Admin@123456"
  }'
```

---

## 📞 Need Help?

See full documentation: `ADMIN_SETUP.md`
