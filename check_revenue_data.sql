-- Check User Payments Data
-- Run this in your Supabase SQL Editor to diagnose revenue issues

-- 1. Check total count of payments
SELECT COUNT(*) as total_payments FROM user_payments;

-- 2. Check payment status distribution
SELECT 
  status, 
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM user_payments 
GROUP BY status
ORDER BY count DESC;

-- 3. Check all payments with their details
SELECT 
  id,
  user_id,
  status,
  amount,
  credits_added,
  email,
  created_at
FROM user_payments 
ORDER BY created_at DESC 
LIMIT 20;

-- 4. Check for NULL or zero amounts
SELECT 
  COUNT(*) as payments_with_null_amount
FROM user_payments 
WHERE amount IS NULL;

SELECT 
  COUNT(*) as payments_with_zero_amount
FROM user_payments 
WHERE amount = 0;

-- 5. Check completed/succeeded/paid payments specifically
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_revenue
FROM user_payments 
WHERE status IN ('completed', 'succeeded', 'paid')
GROUP BY status;

-- 6. Show sample of completed payments
SELECT 
  id,
  status,
  amount,
  credits_added,
  created_at
FROM user_payments 
WHERE status IN ('completed', 'succeeded', 'paid')
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Calculate total revenue (what the dashboard should show)
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as completed_payment_count,
  AVG(amount) as average_transaction_value
FROM user_payments 
WHERE status IN ('completed', 'succeeded', 'paid');

-- 8. Check if amount is stored as string or has formatting issues
SELECT 
  amount,
  pg_typeof(amount) as amount_type,
  amount::text as amount_as_text
FROM user_payments 
WHERE status IN ('completed', 'succeeded', 'paid')
LIMIT 5;
