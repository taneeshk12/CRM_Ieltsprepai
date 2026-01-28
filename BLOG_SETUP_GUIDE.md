# Blog Management & Secure Authentication Setup

## Overview

This document provides instructions for setting up the blog management system and implementing secure password authentication with encryption.

## Features Added

### 1. Blog Management System
- Create, edit, and delete blog posts
- Publish/unpublish functionality
- Tag management
- SEO-friendly slugs (auto-generated from titles)
- Featured images
- Search and filter capabilities
- Draft and published post tracking

### 2. Secure Authentication
- Encrypted password storage using bcrypt
- API-based authentication
- Session management
- Password change functionality
- Admin user management

## Database Setup

### Blog Posts Table
The blog posts table has been created with the following structure:

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

### Admin Users Table

1. Go to your Supabase SQL Editor
2. Run the SQL script from `admin_users_schema.sql`

This creates the `admin_users` table with:
- Encrypted password storage
- User activity tracking
- Account status management

## Initial Admin Setup

### Option 1: Using the Setup Script (Recommended)

1. Run the setup script to generate the password hash:
   ```bash
   node setup-admin.js
   ```

2. Copy the SQL command from the output and run it in Supabase SQL Editor

### Option 2: Using the API

1. Make sure your Next.js app is running
2. Use curl or Postman to create the admin user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "adminielts123",
    "email": "admin@ieltsprepai.com",
    "full_name": "System Administrator"
  }'
```

### Option 3: Manual SQL

Run this in Supabase SQL Editor (replace the hash with one generated from `setup-admin.js`):

```sql
INSERT INTO admin_users (username, password_hash, email, full_name)
VALUES (
  'admin',
  '$2a$10$...[your_generated_hash]',
  'admin@ieltsprepai.com',
  'System Administrator'
) ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    updated_at = now();
```

## Default Credentials

**Important:** Change these credentials after first login!

- **Username:** admin
- **Password:** adminielts123

## How to Use

### Accessing Blog Management

1. Login to admin panel at `http://localhost:3000/login`
2. Click "Blog Management" in the header
3. Create, edit, or manage blog posts

### Creating a Blog Post

1. Go to `/blog` page
2. Click "+ New Blog Post"
3. Fill in:
   - Title (slug auto-generated)
   - Description (for SEO)
   - Content (supports HTML/Markdown)
   - Author name
   - Featured image URL
   - Tags (comma-separated)
4. Choose "Publish immediately" or save as draft
5. Click "Create & Publish" or "Save as Draft"

### Editing a Blog Post

1. Go to `/blog` page
2. Find the post you want to edit
3. Click "Edit"
4. Make your changes
5. Click "Save Changes"

### Publishing/Unpublishing

- Click "Publish" on draft posts to make them live
- Click "Unpublish" on published posts to convert them back to drafts

### Filtering and Search

- Use the search bar to find posts by title, description, or tags
- Filter by: All, Published, or Drafts

## Security Features

### Password Encryption
- All passwords are hashed using bcrypt with 10 salt rounds
- Passwords are never stored in plain text
- Password hashes cannot be reversed

### Authentication Flow
1. User enters credentials
2. API validates username and password hash
3. Session token stored in localStorage
4. Last login time tracked
5. Inactive users can be disabled

### Changing Password

To change an admin password, use the change password API:

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "current_password": "adminielts123",
    "new_password": "new_secure_password"
  }'
```

## API Endpoints

### Authentication

#### POST /api/auth/login
Login with username and password
```json
{
  "username": "admin",
  "password": "adminielts123"
}
```

#### POST /api/auth/register
Create new admin user
```json
{
  "username": "newadmin",
  "password": "secure_password",
  "email": "admin@example.com",
  "full_name": "Admin Name"
}
```

#### POST /api/auth/change-password
Change password for existing user
```json
{
  "username": "admin",
  "current_password": "old_password",
  "new_password": "new_password"
}
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts
│   │       ├── register/route.ts
│   │       └── change-password/route.ts
│   ├── blog/
│   │   ├── page.tsx (Blog management list)
│   │   ├── new/page.tsx (Create new post)
│   │   └── edit/[id]/page.tsx (Edit post)
│   └── login/page.tsx (Secure login)
├── admin_users_schema.sql
├── setup-admin.js
└── BLOG_SETUP_GUIDE.md
```

## Security Best Practices

1. **Change Default Password**: Immediately change the default admin password after first login
2. **Use Strong Passwords**: Use passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols
3. **Regular Updates**: Regularly update admin passwords
4. **Monitor Access**: Check last_login timestamps to detect suspicious activity
5. **Disable Unused Accounts**: Set is_active = false for accounts no longer in use

## Troubleshooting

### Can't Login After Setup
1. Verify the admin_users table exists in Supabase
2. Run `setup-admin.js` to get the correct password hash
3. Verify the hash was inserted correctly in the database
4. Check browser console for errors

### Blog Posts Not Saving
1. Verify the blog_posts table exists
2. Check that uuid_generate_v4() extension is enabled in Supabase
3. Check browser console for errors

### API Errors
1. Ensure bcryptjs is installed: `npm install bcryptjs`
2. Check Supabase connection in `/lib/supabase.ts`
3. Verify environment variables are set correctly

## Revenue Display Fix

All revenue amounts are now displayed in Indian Rupees (₹) instead of dollars ($) across:
- Dashboard summary cards
- Revenue analytics detail page
- All revenue-related tables and calculations

Payment status filtering now correctly handles multiple status values:
- 'completed'
- 'succeeded'
- 'paid'

## Next Steps

1. ✅ Create blog posts for SEO
2. ✅ Set up proper authentication
3. ✅ Change default admin password
4. Add user roles (super admin, editor, viewer)
5. Implement blog API for public website
6. Add rich text editor for blog content
7. Set up image upload functionality
8. Configure email notifications

## Support

For issues or questions, check:
- Supabase logs
- Browser console
- Next.js terminal output
- API response errors
