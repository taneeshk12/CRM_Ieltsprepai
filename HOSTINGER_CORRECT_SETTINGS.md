# ✅ CORRECTED - Your Hostinger SMTP Settings

## Your Correct Configuration

Based on Hostinger's official settings, here's what you need:

```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
HOSTINGER_EMAIL=your-email@yourdomain.com
HOSTINGER_PASSWORD=your-email-password
```

**Key Points:**
- ✅ Port: **465** (NOT 587)
- ✅ Secure: **true** (SSL encryption)
- ✅ Host: **smtp.hostinger.com**

---

## 📋 Complete Hostinger Server Details

### Incoming (IMAP)
```
Server: imap.hostinger.com
Port: 993
Security: SSL
```

### Incoming (POP3)
```
Server: pop.hostinger.com
Port: 995
Security: SSL
```

### Outgoing (SMTP) ← THIS IS WHAT WE USE
```
Server: smtp.hostinger.com
Port: 465
Security: SSL
```

---

## 🚀 Quick Fix Steps

### 1. Update Your `.env.local`

Open `.env.local` and make sure it has:

```bash
# Hostinger Email Configuration
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
HOSTINGER_EMAIL=your-full-email@yourdomain.com
HOSTINGER_PASSWORD=your-actual-email-password
```

**Replace these:**
- `your-full-email@yourdomain.com` → Your actual email
- `your-actual-email-password` → Your email password

### 2. Restart Server

```bash
# Stop: Ctrl+C
# Start:
npm run dev
```

### 3. Test Connection

```bash
node smtp-connection-test.js
```

Should show:
```
✅ SUCCESS! SMTP Connection Works!
```

### 4. Send Test Email

Go to: http://localhost:3000/send-email
- Select 1 user
- Click "Send Emails"
- Check response

---

## ✨ Why This Works

**Old Config (Port 587) - FAILS:**
```
Port: 587
Secure: false
→ Not compatible with Hostinger
```

**New Config (Port 465) - WORKS:**
```
Port: 465
Secure: true (SSL)
→ Exactly what Hostinger uses
```

---

## 🎯 Common Hostinger Server Configurations

| Service | Server | Port | Security |
|---------|--------|------|----------|
| IMAP | imap.hostinger.com | 993 | SSL |
| POP3 | pop.hostinger.com | 995 | SSL |
| SMTP | smtp.hostinger.com | 465 | SSL ✓ |

---

## ✅ Your Updated Config is Ready

Your `.env.local` has been updated to:

```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=465
HOSTINGER_SMTP_SECURE=true
```

**This matches exactly what Hostinger specifies!**

---

## 📞 Next Steps

1. ✅ Restart server: `npm run dev`
2. ✅ Test SMTP: `node smtp-connection-test.js`
3. ✅ Send email: Go to http://localhost:3000/send-email
4. ✅ Verify it works!

---

**This should solve your authentication error! 🎉**

The port 465 with SSL is what Hostinger officially recommends for SMTP.
