# 🎯 Quick Reference Guide

## What's New? 🆕

### ✅ Blog Management System
- Create, edit, and delete blog posts
- Publish/unpublish with one click
- Auto-generated SEO slugs
- Tag management
- Search and filter

### ✅ Secure Authentication
- Password encryption with bcrypt
- API-based login system
- Password change functionality
- Multiple admin support

### ✅ Currency Fixed
- All amounts now show ₹ (rupees) instead of $
- Dashboard and analytics updated

## 🚀 3-Minute Setup

### Step 1: Database (2 minutes)
Open Supabase SQL Editor and run these two commands:

**Command 1 - Create blog_posts table:**
```sql
CREATE TABLE blog_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  author text DEFAULT 'IELTSPrepAI',
  published_at timestamp with time zone,
  is_published boolean DEFAULT false,
  image_url text,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id)
);
```

**Command 2 - Create admin_users table and insert admin:**
```sql
CREATE TABLE admin_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  email text,
  full_name text,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_admin_users_username ON admin_users(username);

INSERT INTO admin_users (username, password_hash, email, full_name)
VALUES (
  'admin',
  '$2b$10$IRFCc9yk18cikoqLuyF72eap6Y5H6gb7ZhZ83xh/sI7u6w2QDYOlW',
  'admin@ieltsprepai.com',
  'System Administrator'
);
```

### Step 2: Login (30 seconds)
1. Go to: `http://localhost:3000/login`
2. Username: `admin`
3. Password: `adminielts123`
4. Click "Sign in"

### Step 3: Start Blogging (30 seconds)
1. Click "Blog Management" in dashboard header
2. Click "+ New Blog Post"
3. Fill in details and publish!

## 🔑 Default Credentials

```
URL: http://localhost:3000/login
Username: admin
Password: adminielts123
```

**⚠️ Change password after first login!**

## 📝 Using the Blog System

### Create a Blog Post
1. Go to `/blog`
2. Click "+ New Blog Post"
3. Enter:
   - **Title** → Slug auto-generates
   - **Description** → For SEO
   - **Content** → Your blog post (HTML/Markdown)
   - **Author** → Default: IELTSPrepAI
   - **Image URL** → Featured image
   - **Tags** → Comma-separated (IELTS, Writing, Tips)
4. Check "Publish immediately" or save as draft
5. Click "Create & Publish"

### Edit a Blog Post
1. Go to `/blog`
2. Find your post
3. Click "Edit"
4. Make changes
5. Click "Save Changes"

### Publish/Unpublish
- Click "Publish" on drafts
- Click "Unpublish" to revert to draft

## 🔐 Change Password

Run this in terminal:

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "current_password": "adminielts123",
    "new_password": "YourNewSecurePassword123!"
  }'
```

## 🎨 Features Overview

| Feature | Status | Location |
|---------|--------|----------|
| Blog List | ✅ Ready | `/blog` |
| Create Post | ✅ Ready | `/blog/new` |
| Edit Post | ✅ Ready | `/blog/edit/[id]` |
| Secure Login | ✅ Ready | `/login` |
| Password Encryption | ✅ Active | API |
| Revenue in ₹ | ✅ Fixed | Dashboard & Analytics |
| Search & Filter | ✅ Ready | `/blog` |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `COMPLETE_SETUP_SUMMARY.md` | Full documentation |
| `BLOG_SETUP_GUIDE.md` | Detailed blog guide |
| `admin_users_schema.sql` | Admin table schema |
| `setup-admin.js` | Password hash generator |

## ❓ Troubleshooting

### Can't login?
- Check if `admin_users` table exists in Supabase
- Verify password hash was inserted
- Check browser console for errors

### Blog not saving?
- Check if `blog_posts` table exists
- Verify Supabase credentials
- Check browser console for errors

### Need help?
See `COMPLETE_SETUP_SUMMARY.md` for full troubleshooting guide.

## ✨ You're Done!

Everything is ready to use. Just run the SQL commands in Supabase and start blogging!

**Login → Blog Management → Create Post → Publish** 🚀
