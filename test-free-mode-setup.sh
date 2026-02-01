#!/bin/bash

# Free Mode Toggle - Quick Test Script
# This script checks if all the necessary files are in place

echo "🔍 Checking Free Mode Toggle Implementation..."
echo ""

# Check if files exist
FILES=(
  "src/lib/freeModeService.ts"
  "src/components/FreeModeToggle.tsx"
  "supabase-free-mode-setup.sql"
)

ALL_GOOD=true

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
    ALL_GOOD=false
  fi
done

echo ""

# Check if component is imported in dashboard
if grep -q "FreeModeToggle" "src/app/dashboard/page.tsx"; then
  echo "✅ FreeModeToggle imported in dashboard"
else
  echo "❌ FreeModeToggle not imported in dashboard"
  ALL_GOOD=false
fi

echo ""

# Check environment variables
if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
  
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" ".env.local"; then
    echo "✅ NEXT_PUBLIC_SUPABASE_URL is configured"
  else
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    ALL_GOOD=false
  fi
  
  if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" ".env.local"; then
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is configured"
  else
    echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local"
    ALL_GOOD=false
  fi
else
  echo "⚠️  .env.local not found"
  echo "   Make sure you have Supabase credentials configured"
  ALL_GOOD=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_GOOD" = true ]; then
  echo "✅ All checks passed!"
  echo ""
  echo "Next steps:"
  echo "1. Run the SQL setup in Supabase:"
  echo "   - Open: supabase-free-mode-setup.sql"
  echo "   - Copy the contents"
  echo "   - Paste in Supabase SQL Editor"
  echo "   - Click 'Run'"
  echo ""
  echo "2. Start the development server:"
  echo "   npm run dev"
  echo ""
  echo "3. Open http://localhost:3000/dashboard"
  echo ""
  echo "4. Scroll down to see 'Free Mode Control' section"
else
  echo "⚠️  Some checks failed. Please fix the issues above."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
