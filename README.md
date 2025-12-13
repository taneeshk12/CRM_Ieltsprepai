# IELTS Admin Dashboard

A Next.js application for administering the IELTS system, built with TypeScript and Tailwind CSS. This admin panel connects to Supabase to display and manage all database records.

## Features

- Admin authentication (username: admin, password: adminielts123)
- Dashboard with overview statistics
- Detailed views for:
  - Users
  - Payments
  - Essays
  - Full Writing Tests
  - User Credits

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Log in with:
   - Username: `admin`
   - Password: `adminielts123`

## Database Schema

The application connects to the following Supabase tables:
- users
- user_payments
- user_essays
- user_full_writing_tests
- user_credits
- And other related tables

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- React
