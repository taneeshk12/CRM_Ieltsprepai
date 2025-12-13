# Email Sending Setup Guide

## Overview
This guide explains how to set up the email sending feature for your IELTS Admin Dashboard using Hostinger's SMTP server and Nodemailer.

## Features
- ✅ Bulk email sending to selected or all users
- ✅ Customizable HTML email templates
- ✅ Live preview before sending
- ✅ User selection with "Select All" option
- ✅ Success/error notifications
- ✅ Default professional email template included

## Prerequisites
1. Hostinger email account with SMTP access enabled
2. Your Hostinger email credentials

## Setup Steps

### 1. Get Your Hostinger SMTP Credentials

1. Log in to your Hostinger control panel
2. Go to **Email** → **Accounts**
3. Find your email account and click **Manage**
4. Look for **SMTP Settings** or **Email Client Settings**
5. You'll find:
   - **SMTP Host**: `smtp.hostinger.com`
   - **SMTP Port**: `587` (TLS) or `465` (SSL)
   - **Email Address**: Your full email (e.g., noreply@yourdomain.com)
   - **Password**: Your email account password

### 2. Update Environment Variables

Edit `.env.local` in your project root and update these values:

```bash
HOSTINGER_SMTP_HOST=smtp.hostinger.com
HOSTINGER_SMTP_PORT=587
HOSTINGER_SMTP_SECURE=false
HOSTINGER_EMAIL=your-email@yourdomain.com
HOSTINGER_PASSWORD=your-hostinger-password
```

**Note**: 
- For port `587`, use `HOSTINGER_SMTP_SECURE=false`
- For port `465`, use `HOSTINGER_SMTP_SECURE=true`

### 3. Verify Installation

The following packages have been installed:
- `nodemailer` - SMTP email client
- `@types/nodemailer` - TypeScript types

```bash
npm list nodemailer @types/nodemailer
```

## Usage

### Accessing the Email Sending Page

1. Go to your admin dashboard: `http://localhost:3000/dashboard`
2. Click on the **"Send Emails"** quick action card
3. Or navigate directly to: `http://localhost:3000/send-email`

### Sending Emails

#### Step 1: Select Recipients
- Check individual users, or
- Click **"Select All"** to send to all users
- The counter shows: "Selected: X of Y"

#### Step 2: Compose Email
- **Email Subject**: Enter the email subject line
- **Email Template**: Edit the HTML template or use the default

#### Step 3: Preview Email
- Click **"Show Preview"** to see how the email will look
- The preview shows the subject and rendered HTML
- Click **"Hide Preview"** to close

#### Step 4: Send
- Click **"Send Emails"** button
- Status message shows: "Emails sent: X successful, Y failed"

## Email Template

### Default Template Includes:
- Professional header with branding
- Formatted content section
- Call-to-action button
- Footer with branding/disclaimer

### Customizing Templates

You can use any HTML for your email. Common sections:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Your CSS here */
  </style>
</head>
<body>
  <h1>Your Title</h1>
  <p>Your content here</p>
  <a href="https://example.com" style="color: white; background: blue; padding: 10px;">Button</a>
</body>
</html>
```

### Template Best Practices

1. **Use inline CSS** - External stylesheets may not work in email clients
2. **Avoid complex layouts** - Use simple tables or divs
3. **Test in preview** - Always preview before sending
4. **Mobile-friendly** - Keep line lengths reasonable
5. **Images** - Use absolute URLs (not relative)
6. **Call-to-Action** - Make buttons obvious and clickable

## API Endpoint

### POST `/api/send-email`

**Request Body:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "subject": "Welcome to IELTS Prep!",
  "template": "<html>...</html>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Emails sent: 2 successful, 0 failed",
  "details": [
    {
      "email": "user1@example.com",
      "status": "sent",
      "messageId": "..."
    }
  ]
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message here"
}
```

## Troubleshooting

### "Failed to send emails" error
**Solutions:**
- Verify SMTP credentials in `.env.local`
- Check if email account is active in Hostinger
- Ensure port number is correct (587 for TLS, 465 for SSL)
- Check if "Less secure apps" need to be enabled (if applicable)

### No users showing in the list
**Solutions:**
- Ensure users exist in the `users` table
- Check Supabase connection
- Verify admin authentication

### Some emails fail but others succeed
**Solutions:**
- Check the error details in the response
- Invalid email addresses will fail
- Some email addresses may have delivery issues
- Re-send to failed recipients only

### Email content looks wrong in preview
**Solutions:**
- Some HTML/CSS features aren't supported in email clients
- Use simpler HTML structure
- Test with inline styles
- Avoid JavaScript (it won't work)

## Security Notes

1. ⚠️ Store credentials in `.env.local` - never in code
2. ⚠️ Don't commit `.env.local` to Git (add to `.gitignore`)
3. ⚠️ Use a dedicated email account for bulk sending
4. ⚠️ Consider rate limiting for production use
5. ⚠️ Always get user consent before sending marketing emails

## Rate Limiting (Optional)

For production, consider adding rate limiting to prevent abuse:

```javascript
// Add to API route
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

app.post('/api/send-email', limiter, async (req, res) => {
  // ... your code
});
```

## Advanced Features

### Personalizing Emails

To add user names in templates, you could modify the API to loop and send individual emails:

```javascript
for (const email of emails) {
  const user = await getUser(email);
  const personalizedTemplate = template.replace('{name}', user.name);
  await transporter.sendMail({
    to: email,
    subject: subject,
    html: personalizedTemplate,
  });
}
```

Then use `{name}` in your template.

### Email Scheduling

To schedule emails for later, add a `scheduledTime` parameter and use a job queue like Bull or Agenda.

## Support

For issues with:
- **Hostinger email**: Contact Hostinger support
- **SMTP settings**: Check Hostinger documentation
- **Code issues**: Review error messages and logs
- **Nodemailer**: See [nodemailer.com](https://nodemailer.com)
