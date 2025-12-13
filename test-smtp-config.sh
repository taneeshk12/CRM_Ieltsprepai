#!/bin/bash

# Email SMTP Test Script for Hostinger
# This script helps diagnose SMTP connection issues

echo "🔍 Hostinger SMTP Connection Tester"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "📋 Current Configuration in .env.local:"
echo "---"
grep "HOSTINGER_" .env.local
echo "---"
echo ""

# Ask user for credentials
echo "⚠️  The credentials above will be used for testing."
echo ""

# Read from env file
source .env.local

# Basic validation
echo "🧪 Running validation checks..."
echo ""

if [ -z "$HOSTINGER_EMAIL" ] || [ "$HOSTINGER_EMAIL" = "your-email@yourdomain.com" ]; then
    echo "❌ HOSTINGER_EMAIL is not set correctly"
    echo "   Current: $HOSTINGER_EMAIL"
    echo "   Expected: your-actual-email@yourdomain.com"
    exit 1
fi

if [ -z "$HOSTINGER_PASSWORD" ] || [ "$HOSTINGER_PASSWORD" = "your-hostinger-password" ]; then
    echo "❌ HOSTINGER_PASSWORD is not set correctly"
    echo "   Current: [not shown for security]"
    echo "   Please update .env.local with your actual password"
    exit 1
fi

echo "✅ Email configured: $HOSTINGER_EMAIL"
echo "✅ SMTP Host: $HOSTINGER_SMTP_HOST"
echo "✅ SMTP Port: $HOSTINGER_SMTP_PORT"
echo "✅ SMTP Secure: $HOSTINGER_SMTP_SECURE"
echo ""

echo "💡 Next Steps:"
echo "1. Verify these credentials match Hostinger control panel"
echo "2. Restart your dev server: npm run dev"
echo "3. Try sending an email again"
echo ""

echo "🆘 If still failing:"
echo "- Double-check email is ACTIVE in Hostinger"
echo "- Copy credentials directly from Hostinger (don't retype)"
echo "- Try with port 465 and SECURE=true"
echo "- Contact Hostinger support for account verification"
