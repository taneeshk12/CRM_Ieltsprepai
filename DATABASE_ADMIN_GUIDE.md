# 🎯 Database-Based Free Mode Toggle - Admin Implementation Guide

Since your admin app shares the same Supabase database as the IELTS app, you can directly update the `app_settings` table. This is the simplest and fastest approach!

---

## 📋 Prerequisites

- ✅ You ran `supabase-free-mode-setup.sql` in Supabase (creates `app_settings` table)
- ✅ Your admin app has Supabase client configured
- ✅ Your admin app can access the same database

---

## 🚀 Implementation (3 Steps - 15 minutes)

### Step 1: Create Database Service File (5 min)

Create a new file in your admin app: `lib/freeModeService.js` (or `services/freeModeService.js`)

```javascript
// lib/freeModeService.js

import { supabase } from './supabase'; // Your existing Supabase client

/**
 * Get current free mode status from database
 * @returns {Promise<{success: boolean, freeMode: boolean, error: string|null}>}
 */
export async function getFreeModeStatus() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'free_mode')
      .single();

    if (error) {
      console.error('Error fetching free mode status:', error);
      throw error;
    }

    return {
      success: true,
      freeMode: data?.setting_value || false,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      freeMode: false,
      error: error.message || 'Failed to fetch free mode status'
    };
  }
}

/**
 * Toggle free mode on/off
 * @param {boolean} enable - true to enable, false to disable
 * @returns {Promise<{success: boolean, freeMode: boolean, message: string, error: string|null}>}
 */
export async function setFreeMode(enable) {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ 
        setting_value: enable,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'free_mode')
      .select()
      .single();

    if (error) {
      console.error('Error setting free mode:', error);
      throw error;
    }

    return {
      success: true,
      freeMode: data.setting_value,
      message: `Free mode ${enable ? 'enabled' : 'disabled'} successfully`,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      freeMode: null,
      message: null,
      error: error.message || 'Failed to update free mode'
    };
  }
}
```

---

### Step 2: Create the UI Component (5 min)

Create: `components/FreeModeToggle.jsx` (or `components/FreeModeToggle.js`)

```javascript
// components/FreeModeToggle.jsx

import { useState, useEffect } from 'react';
import { getFreeModeStatus, setFreeMode } from '../lib/freeModeService';

export default function FreeModeToggle() {
  const [freeMode, setFreeModeState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch status when component mounts
  useEffect(() => {
    fetchStatus();
  }, []);

  // Fetch current free mode status
  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    const result = await getFreeModeStatus();
    
    if (result.success) {
      setFreeModeState(result.freeMode);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Handle toggle button click
  const handleToggle = async (enable) => {
    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    const result = await setFreeMode(enable);

    if (result.success) {
      setFreeModeState(result.freeMode);
      setSuccessMessage(result.message);
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.error);
    }

    setProcessing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-4">
            <div className="h-12 bg-gray-200 rounded flex-1"></div>
            <div className="h-12 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🎛️ Free Mode Control
        </h2>
        <button
          onClick={fetchStatus}
          disabled={processing}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh status"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg p-6 mb-6 transition-all ${
        freeMode 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300' 
          : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {freeMode ? '🟢' : '🔴'}
              </span>
              <span className={`text-3xl font-bold ${
                freeMode ? 'text-green-700' : 'text-gray-700'
              }`}>
                {freeMode ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${
              freeMode ? 'text-green-700' : 'text-gray-600'
            }`}>
              {freeMode ? '✅ All tests are FREE' : '💳 Credit-based mode'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {freeMode ? 'No credits deducted' : 'Normal operation'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Enable Button */}
        <button
          onClick={() => handleToggle(true)}
          disabled={processing || freeMode}
          className={`py-4 px-6 rounded-lg font-semibold text-white transition-all ${
            freeMode
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {processing && !freeMode ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Enabling...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🟢</span>
              <span>Enable Free Mode</span>
            </span>
          )}
        </button>

        {/* Disable Button */}
        <button
          onClick={() => handleToggle(false)}
          disabled={processing || !freeMode}
          className={`py-4 px-6 rounded-lg font-semibold text-white transition-all ${
            !freeMode
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {processing && freeMode ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Disabling...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🔴</span>
              <span>Disable Free Mode</span>
            </span>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          <span>What happens in IELTS app when enabled:</span>
        </h3>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Green banner shows "🎉 FREE MODE ACTIVE" on home page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Pricing links hidden in navigation menu</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Credit balance hidden on user dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>No credits deducted for evaluations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>All users get unlimited free tests</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
```

---

### Step 3: Add to Your Admin Dashboard (5 min)

Add the component to your admin dashboard page:

```javascript
// pages/admin/dashboard.js (or wherever your admin dashboard is)

import FreeModeToggle from '../components/FreeModeToggle';
// ... your other imports

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>
        
        {/* Your existing admin sections */}
        <div className="grid gap-6">
          
          {/* Free Mode Toggle - Add this */}
          <FreeModeToggle />
          
          {/* Your other admin components */}
          {/* <UserManagement /> */}
          {/* <Analytics /> */}
          {/* etc... */}
          
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Styling (Optional)

The component uses Tailwind CSS. If you don't have Tailwind, add this CSS:

```css
/* styles/FreeModeToggle.css */

.free-mode-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.status-active {
  background: linear-gradient(to right, #dcfce7, #d1fae5);
  border: 2px solid #86efac;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.status-inactive {
  background: linear-gradient(to right, #f9fafb, #f1f5f9);
  border: 2px solid #d1d5db;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.btn-enable {
  background: linear-gradient(to right, #10b981, #059669);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn-enable:hover:not(:disabled) {
  background: linear-gradient(to right, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-disable {
  background: linear-gradient(to right, #ef4444, #dc2626);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn-disable:hover:not(:disabled) {
  background: linear-gradient(to right, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
}
```

---

## 🧪 Testing

### 1. Start Your Admin App
```bash
npm run dev
```

### 2. Navigate to Admin Dashboard

### 3. Test the Toggle

**Enable Free Mode:**
1. Click "Enable Free Mode" button
2. Should see: ✅ "Free mode enabled successfully"
3. Status changes to: 🟢 ACTIVE
4. Button becomes disabled (grayed out)

**Verify in IELTS App:**
1. Open IELTS app in another tab
2. Should see green banner at top
3. Pricing link should be hidden
4. Dashboard should hide credits

**Disable Free Mode:**
1. Click "Disable Free Mode" button
2. Should see: ✅ "Free mode disabled successfully"
3. Status changes to: 🔴 INACTIVE
4. IELTS app returns to normal

---

## 🔍 Verify Database Changes

You can check the database directly in Supabase:

```sql
-- Check current status
SELECT * FROM app_settings WHERE setting_key = 'free_mode';

-- You should see:
-- setting_key | setting_value | updated_at
-- free_mode   | true/false    | 2026-01-31...
```

---

## 🎯 What Happens in IELTS App

When you toggle free mode from your admin panel:

| Component | Change |
|-----------|--------|
| **Home Page** | Green banner appears: "🎉 FREE MODE ACTIVE" |
| **Navbar** | "Pricing" link hidden (for logged-in users) |
| **Dashboard** | Credit balance hidden, shows free mode notice |
| **Pricing Page** | Shows "Free mode active" notice |
| **Evaluations** | Credits NOT deducted |

**Update Time:** Changes visible within 30 seconds (IELTS app polls every 30s)

---

## 🔧 Customizations

### Change Colors

```javascript
// Enable button - change from green to blue
className="bg-gradient-to-r from-blue-500 to-blue-600"

// Disable button - change from red to orange  
className="bg-gradient-to-r from-orange-500 to-orange-600"

// Status card - change active color
className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300"
```

### Add Confirmation Dialog

```javascript
const handleToggle = async (enable) => {
  // Add confirmation
  const action = enable ? 'enable' : 'disable';
  const confirmed = window.confirm(
    `Are you sure you want to ${action} free mode?\n\n` +
    `This will ${enable ? 'make all tests FREE' : 'restore credit-based system'} for all users.`
  );
  
  if (!confirmed) return;
  
  // Continue with toggle
  setProcessing(true);
  // ... rest of code
};
```

### Add Admin Activity Log

```javascript
const handleToggle = async (enable) => {
  setProcessing(true);
  
  const result = await setFreeMode(enable);
  
  if (result.success) {
    setFreeModeState(result.freeMode);
    setSuccessMessage(result.message);
    
    // Log the action
    await logAdminAction({
      action: 'free_mode_toggle',
      status: enable ? 'enabled' : 'disabled',
      timestamp: new Date().toISOString(),
      admin_id: currentUser.id // Your admin user ID
    });
  }
  
  setProcessing(false);
};
```

### Auto-refresh Status

```javascript
useEffect(() => {
  fetchStatus(); // Initial fetch
  
  // Auto-refresh every 60 seconds
  const interval = setInterval(fetchStatus, 60000);
  
  return () => clearInterval(interval);
}, []);
```

---

## 🆘 Troubleshooting

### Issue: "relation 'app_settings' does not exist"

**Solution:** You need to run the SQL setup first!

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of supabase-free-mode-setup.sql
# 3. Click "Run"
```

### Issue: "permission denied for table app_settings"

**Solution:** Check RLS policies in Supabase:

```sql
-- Allow authenticated users to read
CREATE POLICY "Anyone can read app settings"
  ON app_settings FOR SELECT
  USING (true);

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update app settings"
  ON app_settings FOR UPDATE
  USING (auth.role() = 'authenticated');
```

### Issue: Changes not showing in IELTS app

**Solution:** 
- Wait 30 seconds (IELTS app polls every 30s)
- Or refresh the IELTS app page manually
- Check database: `SELECT * FROM app_settings WHERE setting_key = 'free_mode'`

### Issue: Button not working

**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Check network tab for failed requests
4. Verify Supabase client is initialized correctly

---

## 📊 Database Schema Reference

The `app_settings` table structure:

```sql
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text
);

-- Free mode row
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES ('free_mode', false, 'When enabled, users can use the app without credits');
```

---

## ✅ Implementation Checklist

Before you start:
- [ ] `supabase-free-mode-setup.sql` executed in Supabase
- [ ] Supabase client configured in your admin app

While implementing:
- [ ] Created `lib/freeModeService.js`
- [ ] Created `components/FreeModeToggle.jsx`
- [ ] Added component to admin dashboard
- [ ] Tested in development

After implementation:
- [ ] Tested enable/disable toggle
- [ ] Verified changes in IELTS app
- [ ] Checked database updates
- [ ] Tested error scenarios
- [ ] Ready for production!

---

## 🎉 You're Done!

That's it! You now have a fully functional Free Mode toggle in your admin panel.

**What you can do:**
- ✅ Enable free mode with one click
- ✅ Disable anytime
- ✅ See real-time status
- ✅ Get instant feedback
- ✅ Control IELTS app from your admin panel

**Next:** Just copy the code, paste it into your admin app, and test! 🚀

---

**Questions?** The code is complete and production-ready. Just adapt the imports to match your file structure!
