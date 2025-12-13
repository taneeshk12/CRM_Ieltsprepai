# 🆘 SMTP Authentication Error Fix

## Error Details
```
Error: Invalid login: 535 5.7.8 Error: authentication failed
```

This means Hostinger is rejecting your login credentials.

---

## ✅ Quick Fix Checklist

### 1. Verify Email Account Status

Go to **Hostinger Control Panel** → **Email**:

- [ ] Email account **exists** and is **active** (not deleted/suspended)
- [ ] Email account is **enabled** 
- [ ] No recent password changes that might need verification
- [ ] Email is not locked due to too many failed login attempts

**Action**: If account is suspended, contact Hostinger support to reactivate.

---

### 2. Get CORRECT Credentials from Hostinger

Follow these EXACT steps:

1. Log into https://hpanel.hostinger.com
2. Click **Email** (left sidebar)
3. Click the email account you want to use
4. Click **"Email Client Configuration"** (or similar button)
5. Under **IMAP/SMTP** section, you'll see:

```
SMTP Server: smtp.hostinger.com
SMTP Port: 587
SMTP Username: _______________  ← COPY THIS EXACTLY
SMTP Password: _______________  ← COPY THIS EXACTLY
```

**Important**: 
- Copy the **full email address** as username
- Copy the **email account password** (not hosting password)
- Look for any special characters carefully

---

### 3. Update `.env.local`

Replace the template values with your copied credentials:

```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587
HOSTINGER_SMTP_SECURE=false
HOSTINGER_EMAIL=PUT_YOUR_EMAIL_HERE
HOSTINGER_PASSWORD=PUT_YOUR_PASSWORD_HERE
```

**Example** (replace with your actual credentials):
```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587
HOSTINGER_SMTP_SECURE=false
HOSTINGER_EMAIL=support@mycompany.com
HOSTINGER_PASSWORD=SecurePass123!
```

⚠️ **DO NOT share this file or commit to Git!**

---

### 4. Restart Server

```bash
# Stop current server (Ctrl+C in terminal)
# Restart with:
npm run dev
```

---

### 5. Test Again

1. Go to: http://localhost:3000/send-email
2. Select 1 user
3. Click **"Send Emails"**
4. Check response

**Success**: Should show "Emails sent: 1 successful, 0 failed"

---

## 🔧 Advanced Troubleshooting

### If Still Failing - Try Alternative Port

Some SMTP services work better with different ports:

**Option A: Port 465 (Implicit TLS)**
```bash
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
```

**Option B: Port 25 (Rarely)**
```bash
HOSTINGER_SMTP_PORT=25
HOSTINGER_SMTP_SECURE=false
```

Restart server and test again.

---

### Check for Common Credential Issues

| Issue | Fix |
|-------|-----|
| Copied with spaces | Use `CTRL+A` to select, check for leading/trailing spaces |
| Used hosting password | Use the **email account password** instead |
| Typos in email | Copy directly from Hostinger, don't retype |
| Special characters | Some passwords with `!@#$%` may need escaping |
| Account locked | Wait 24 hours or contact Hostinger |
| Password expired | Reset password in Hostinger control panel |

---

### Manual SMTP Test

Create a test file to verify SMTP works:

**File: `test-smtp.js`**
```javascript
const nodemailer = require('nodemailer');

// Update these with your ACTUAL credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@yourdomain.com',  // PUT YOUR EMAIL
    pass: 'your-password'                 // PUT YOUR PASSWORD
  }
});

console.log('Testing SMTP connection...');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ FAILED:', error.message);
    console.log('\nDebugging info:');
    console.log('Error code:', error.code);
    console.log('Error response:', error.response);
  } else {
    console.log('✅ SUCCESS: SMTP connection works!');
    console.log('Now you can send emails.');
  }
  process.exit(0);
});
```

Run test:
```bash
node test-smtp.js
```

---

## 📞 When to Contact Hostinger Support

Contact Hostinger if:

1. ✅ You've verified credentials are correct in their control panel
2. ✅ Email account is active and enabled
3. ✅ You've tried both port 587 and 465
4. ✅ `test-smtp.js` still fails with authentication error

**Tell them:**
- SMTP Host: `smtp.hostinger.com`
- Port: `587` or `465`
- You're getting error: `535 5.7.8 authentication failed`
- Can you verify credentials are working?

---

## ✨ If Everything Works

Once authentication is fixed, you can:

1. **Send bulk emails** to users
2. **Create templates** in the UI
3. **Preview** emails before sending
4. **Track** delivery status

Great job! 🎉

---

## 🚨 Emergency: No Email Account Yet?

If you don't have an email account in Hostinger:

1. Go to **Hostinger Control Panel** → **Email**
2. Click **"Create Email Account"**
3. Enter details:
   - Email: `support@yourdomain.com` (or similar)
   - Password: Strong password
4. Create account
5. Wait 5 minutes for activation
6. Use credentials in `.env.local`

---

## 📝 Checklist Summary

Before asking for help, verify:

- [ ] Email account exists in Hostinger
- [ ] Email account is ACTIVE (not suspended/deleted)
- [ ] Credentials copied EXACTLY from Hostinger (with no extra spaces)
- [ ] `.env.local` has correct values
- [ ] Dev server restarted after updating `.env.local`
- [ ] Tried both port 587 and port 465
- [ ] `test-smtp.js` verification completed
- [ ] No typos in email/password

---

**Once this is fixed, your email sending will work perfectly! 🚀**
