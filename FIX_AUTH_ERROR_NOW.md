# 🚨 QUICK FIX - Authentication Error 535

## Problem You're Facing
```
"error": "Error: Invalid login: 535 5.7.8 Error: authentication failed"
```

---

## 🎯 Solution in 3 Steps

### Step 1: Verify Your Email in Hostinger
1. Log in to https://hpanel.hostinger.com
2. Go to **Email → Email Accounts**
3. Check if your email account status is **ACTIVE** ✓
4. If suspended/deleted, contact Hostinger to reactivate

### Step 2: Get Exact Credentials
1. Click your email account
2. Look for **"Email Client Configuration"**
3. Find **IMAP/SMTP** section
4. **COPY these exactly** (no retype!):
   - Username: `something@domain.com`
   - Password: `your-email-password`

### Step 3: Update & Restart
1. Open `.env.local` in your project
2. Replace:
   ```bash
   HOSTINGER_EMAIL=your-full-email@domain.com
   HOSTINGER_PASSWORD=your-exact-password
   ```
3. Stop server (Ctrl+C)
4. Run: `npm run dev`

---

## 🧪 Test It

Run this to verify SMTP works:
```bash
node smtp-connection-test.js
```

Should show: `✅ SUCCESS! SMTP Connection Works!`

---

## ❌ If Still Failing

**Most Common Reasons:**

1. **Wrong password** - Must be email password, NOT hosting password
2. **Account inactive** - Check Hostinger, must be ACTIVE
3. **Typos in credentials** - Copy directly, don't retype
4. **Extra spaces** - Check for leading/trailing spaces
5. **Server not restarted** - Stop and run `npm run dev` again

---

## 📞 Still Not Working?

Try **Port 465** instead:

```bash
# In .env.local:
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
```

Restart and test again.

---

## ✅ Once It Works

Go to: `http://localhost:3000/send-email`
- Select users
- Compose email
- Click "Send Emails"

**Done! 🎉**
