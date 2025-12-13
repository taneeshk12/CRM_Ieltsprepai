# Email Authentication Error - Complete Solution

## Problem
```
Error: Invalid login: 535 5.7.8 Error: authentication failed
```

This error means Hostinger is rejecting your SMTP login credentials.

---

## 🎯 Solution Steps (Follow Exactly)

### Step 1: Verify Email Account in Hostinger (5 minutes)

1. Open https://hpanel.hostinger.com
2. Go to **Email** → **Email Accounts**
3. Look for the email you want to use
4. Check:
   - [ ] Account status is **ACTIVE** (not suspended/deleted)
   - [ ] Account is **ENABLED**
   - [ ] No warning icons

**If account is NOT active:**
- Contact Hostinger to reactivate
- Wait for activation email
- Then continue to Step 2

**If account is ACTIVE:**
- Continue to Step 2 ✓

---

### Step 2: Copy Exact Credentials from Hostinger (3 minutes)

**DO NOT retype credentials - COPY them exactly!**

1. In Hostinger, click the email account
2. Find **"Email Client Configuration"** button
3. Look for **IMAP/SMTP** section
4. You'll see:
   ```
   SMTP Server: smtp.hostinger.com
   SMTP Port: 587
   SMTP Username: [something like user@domain.com]  ← COPY THIS
   SMTP Password: [your email password]              ← COPY THIS
   ```

5. **Copy both username and password** (use CTRL+C / CMD+C)

---

### Step 3: Update `.env.local` (2 minutes)

Open `.env.local` in your project:

**BEFORE:**
```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587
HOSTINGER_SMTP_SECURE=false
HOSTINGER_EMAIL=your-email@yourdomain.com
HOSTINGER_PASSWORD=your-hostinger-password
```

**AFTER** (paste your copied credentials):
```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587
HOSTINGER_SMTP_SECURE=false
HOSTINGER_EMAIL=support@mycompany.com
HOSTINGER_PASSWORD=MyPassword123
```

**Important:**
- Paste EXACTLY as copied (including special characters)
- Do NOT add extra spaces
- Do NOT edit the credentials
- Keep the file secret (never commit to Git)

---

### Step 4: Restart Dev Server (1 minute)

```bash
# Press CTRL+C to stop current server
# Then run:
npm run dev
```

Wait for: `✓ Ready in XXXms`

---

### Step 5: Test SMTP Connection (2 minutes)

**Option A: Run diagnostic script**
```bash
node smtp-connection-test.js
```

You should see:
```
✅ SUCCESS! SMTP Connection Works!
✓ Host: smtp.hostinger.com
✓ Port: 587
✓ Email: your-email@yourdomain.com
✓ Authentication: Verified
```

**Option B: Test from dashboard**
1. Go to http://localhost:3000/send-email
2. Select 1 user
3. Click "Send Emails"
4. Check response

---

### Step 6: If Still Failing - Try Alternative Port (3 minutes)

Update `.env.local`:

```bash
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
```

Restart server and test again.

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Used hosting password | Use **email account password** instead |
| Username is just "admin" | Use **full email: user@domain.com** |
| Extra spaces in credentials | Copy directly from Hostinger, check for spaces |
| Wrong port | Try 587 (default) or 465 (if 587 fails) |
| SECURE value wrong | 587 = false, 465 = true |
| Didn't restart server | Stop (Ctrl+C) and `npm run dev` again |
| Account suspended | Contact Hostinger support |

---

## 🔍 Diagnostic Checklist

Before asking for help, verify ALL of these:

```
Configuration:
- [ ] HOSTINGER_SMTP_HOST = smtp.hostinger.com
- [ ] HOSTINGER_SMTP_PORT = 587 or 465
- [ ] HOSTINGER_SMTP_SECURE = false (for 587) or true (for 465)

Credentials:
- [ ] HOSTINGER_EMAIL = full email address (user@domain.com)
- [ ] HOSTINGER_PASSWORD = email account password (NOT hosting password)
- [ ] No extra spaces in credentials
- [ ] No typos in email or password

Account Status:
- [ ] Email account exists in Hostinger
- [ ] Email account is ACTIVE (not suspended)
- [ ] Email account is ENABLED
- [ ] No warning icons on account

Server:
- [ ] Dev server restarted after updating .env.local
- [ ] No errors on startup
- [ ] Can access http://localhost:3000

Testing:
- [ ] Ran diagnostic script (smtp-connection-test.js)
- [ ] Tried both port 587 and 465
- [ ] Checked browser console for errors
- [ ] Verified all credentials one more time
```

---

## 📞 When to Contact Hostinger Support

If you've completed ALL steps above, contact Hostinger with:

**Subject:** SMTP Authentication Error - Email Account

**Message:**
```
I'm trying to send emails via SMTP with these settings:
- Host: smtp.hostinger.com
- Port: 587
- Email: your-email@yourdomain.com
- Error: 535 5.7.8 authentication failed

Can you verify:
1. This email account is active and enabled?
2. SMTP access is enabled for this account?
3. These credentials are correct for SMTP?

Thank you!
```

---

## ✅ Success Indicators

Once working, you'll see:

**In smtp-connection-test.js output:**
```
✅ SUCCESS! SMTP Connection Works!
```

**When sending email:**
```
{
  "success": true,
  "message": "Emails sent: 1 successful, 0 failed",
  "details": [
    {
      "email": "recipient@example.com",
      "status": "sent",
      "messageId": "..."
    }
  ]
}
```

**On dashboard:**
- Green success message appears
- Email count updates
- No error notifications

---

## 🚀 Next Steps After Fix

Once SMTP is working:

1. **Create professional templates**
   - Use the default template as starting point
   - Preview before sending
   - Test with yourself first

2. **Send to test user**
   - Select 1 user
   - Send test email
   - Check their inbox

3. **Bulk send campaigns**
   - Select multiple users
   - Send announcements
   - Track results

4. **Set up automation** (future)
   - Welcome emails for new users
   - Payment confirmations
   - Account notifications

---

## 📚 Resources

- **Hostinger Email Setup:** https://support.hostinger.com/
- **Nodemailer Documentation:** https://nodemailer.com/
- **SMTP Port Guide:** https://www.mailgun.com/blog/email/25-587-465-ports/

---

**You're almost there! Follow these steps carefully and it will work. 💪**
