# Quick Reference - Email Sending Feature

## 🚀 Quick Start (5 minutes)

### 1. Get Hostinger SMTP Credentials
```
Login to Hostinger → Email → Manage Account → Email Client Settings
Copy: Host, Port, Email, Password
```

### 2. Update .env.local
```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587
HOSTINGER_SMTP_SECURE=false
HOSTINGER_EMAIL=your-email@yourdomain.com
HOSTINGER_PASSWORD=your-password
```

### 3. Restart Dev Server
```bash
npm run dev
```

### 4. Go to Send Emails Page
```
http://localhost:3000/dashboard → Click "Send Emails" card
or direct: http://localhost:3000/send-email
```

## 📝 Usage Flow

```
1. Select Users
   └─ Check individual boxes or "Select All"

2. Compose Email
   ├─ Subject: "Your email subject here"
   └─ Template: Edit HTML or use default

3. Preview (Optional)
   └─ Click "Show Preview" to see how it looks

4. Send
   └─ Click "Send Emails"
   └─ See success/failure message
```

## 📁 Files Created/Modified

```
NEW:
✨ src/app/api/send-email/route.ts        (Backend API)
✨ src/app/send-email/page.tsx            (UI Page)
✨ EMAIL_SETUP_GUIDE.md                   (Full guide)
✨ EMAIL_FEATURE_SUMMARY.md               (Feature overview)

UPDATED:
📝 src/app/dashboard/page.tsx             (Added email link)
📝 .env.local                             (Added SMTP config)
📝 package.json                           (Added nodemailer)
```

## 🔑 Key Features

| Feature | Details |
|---------|---------|
| **Bulk Send** | Send to multiple users at once |
| **Select All** | Quick way to select all users |
| **Preview** | See email before sending |
| **Templates** | HTML editor with default template |
| **Status** | Real-time feedback on success/failures |
| **Secure** | Credentials in env, not in code |
| **Fast** | Asynchronous sending |

## ⚙️ Configuration

```env
# SMTP Connection
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587                  # TLS
HOSTINGER_SMTP_SECURE=false               # false for 587, true for 465

# Email Account
HOSTINGER_EMAIL=noreply@yourdomain.com
HOSTINGER_PASSWORD=your-password
```

## 🧪 Test Example

```javascript
// Sample API request
POST /api/send-email

{
  "emails": ["user@example.com"],
  "subject": "Test Email",
  "template": "<h1>Hello</h1><p>This is a test</p>"
}

// Response
{
  "success": true,
  "message": "Emails sent: 1 successful, 0 failed",
  "details": [
    {
      "email": "user@example.com",
      "status": "sent",
      "messageId": "abc123"
    }
  ]
}
```

## 🚨 Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| "Connection refused" | Check SMTP host/port in env |
| "Invalid credentials" | Verify email/password correct |
| No users in list | Check Supabase connection |
| Preview blank | Ensure HTML is valid |
| Send button disabled | Select at least 1 user |

## 📧 Email Template Tips

### ✅ Do's
- Use inline CSS
- Test in preview first
- Keep HTML simple
- Use absolute image URLs
- Mobile-friendly layout

### ❌ Don'ts
- Don't use external CSS files
- Don't use JavaScript
- Don't rely on unsupported HTML5
- Don't use relative image paths
- Don't make it too complex

### Basic Template
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Title</h1>
    <p>Your content here</p>
  </div>
</body>
</html>
```

## 🔒 Security Checklist

- [ ] Credentials in .env.local (never in code)
- [ ] .env.local in .gitignore (don't commit)
- [ ] Using dedicated email account
- [ ] Admin authentication required
- [ ] Input validation enabled
- [ ] Error handling in place

## 📞 Support Resources

- **Hostinger SMTP Help**: Login → Help Center → Email
- **Nodemailer Docs**: https://nodemailer.com
- **Email Best Practices**: RFC 5322, RFC 6854
- **HTML Email Guide**: https://mailchimp.com/resources/email-client-css-support/

## 🎯 Next Steps

1. ✅ Setup Hostinger SMTP
2. ✅ Update .env.local
3. ✅ Restart server
4. ✅ Test sending email
5. ⏭️ (Optional) Add rate limiting
6. ⏭️ (Optional) Add email tracking
7. ⏭️ (Optional) Create email templates library

## 📊 Monitoring Tips

### Check email logs
```bash
# In Node.js server
console.log(info.messageId)  // Message ID for tracking
```

### Monitor SMTP quota
- Check Hostinger dashboard → Email Statistics
- Watch for bounce rates
- Review delivery reports

---

**Ready to send?** Go to http://localhost:3000/send-email
