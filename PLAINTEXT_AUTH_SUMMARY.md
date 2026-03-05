# Plain Text Authentication Summary

## Changes Made (March 5, 2026)

### Admin Credentials
- **Username**: `admin`
- **Password**: `adminielts1234`

### Files Updated

#### 1. Database Schema (`admin_users_schema.sql`)
- Removed `pgcrypto` extension
- Removed bcrypt hashing from INSERT statement
- Password stored as plain text in `password_hash` column

#### 2. Login Route (`src/app/api/auth/login/route.ts`)
- Removed `bcrypt` import
- Changed password verification from `bcrypt.compare()` to plain text comparison: `password === adminUser.password_hash`

#### 3. Register Route (`src/app/api/auth/register/route.ts`)
- Removed `bcrypt` import
- Changed password storage from `bcrypt.hash()` to plain text: `password_hash = password`

#### 4. Change Password Route (`src/app/api/auth/change-password/route.ts`)
- Removed `bcrypt` import
- Changed current password verification to plain text comparison
- Changed new password storage to plain text

## How to Apply

### 1. Run the Database Schema
Execute the SQL file in your Supabase SQL Editor:
```sql
-- Copy and paste contents of admin_users_schema.sql
```

### 2. Test Login
- Navigate to `/login`
- Enter username: `admin`
- Enter password: `adminielts1234`
- Click Login

## Security Warning
⚠️ **This configuration stores passwords as plain text and is INSECURE.**
- Only use for local development/testing
- Never deploy to production with plain text passwords
- For production, restore bcrypt hashing

## To Restore Secure Authentication Later
1. Add back `bcrypt` import to auth routes
2. Update password comparison to use `bcrypt.compare()`
3. Update password storage to use `bcrypt.hash()`
4. Re-enable `pgcrypto` in schema and use `crypt()` function
5. Migrate existing passwords using a script
