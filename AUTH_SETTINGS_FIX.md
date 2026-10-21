# Fix Auth Registration Issues

## Problem
Users cannot sign up - registration fails with "Database error saving new user"

## Root Cause
Supabase Auth settings require email confirmation or have other restrictions enabled.

## Solution Steps

### 1. Check Supabase Auth Settings

Go to your Supabase Dashboard:
1. Navigate to https://supabase.com/dashboard/project/xyvzpezqavqujpxodtre
2. Click on "Authentication" in the left sidebar
3. Go to "Settings" tab
4. Check the following settings:

### 2. Required Settings

**Email Auth Settings:**
- ✅ Enable Email Signup: **MUST BE ENABLED**
- ❌ Confirm Email: **MUST BE DISABLED** (for development)
- ❌ Enable Email OTP: Can be disabled

**Email Template Settings:**
- If "Confirm Email" is enabled, disable it for now
- You can enable it later after basic auth works

**Site URL:**
- Set to: `http://localhost:5173` (or your dev URL)

**Redirect URLs:**
- Add: `http://localhost:5173/**`
- This allows redirects to any page in your app

### 3. Save Changes

After making these changes:
1. Click "Save" button
2. Wait 30 seconds for changes to propagate
3. Clear browser cache and reload the app
4. Try signing up again

### 4. Test Registration

Try these steps:
1. Go to `/signup`
2. Use a new email (e.g., test@example.com)
3. Use a password with at least 6 characters
4. Submit the form
5. Check browser console (F12) for detailed logs

### 5. Verify User Creation

After successful signup, check:
```sql
-- Run in Supabase SQL Editor
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

You should see the new user in the results.

### 6. Common Issues

**"Database error saving new user"**
- Cause: Email confirmation is required but user isn't confirming
- Fix: Disable email confirmation in Auth settings

**"Network error"**
- Cause: Browser can't reach Supabase
- Fix: Check .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

**"Invalid email or password"**
- Cause: User doesn't exist or wrong password
- Fix: First create account via signup, then login

## Alternative: Create Test User via Dashboard

If signup still doesn't work:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" button
3. Enter email and password
4. Click "Create user"
5. Try logging in with these credentials

## Debug Mode

Visit `/test-supabase` to check:
- Supabase connection status
- Environment variables
- Database connectivity

## Need Help?

If issues persist, check:
1. Browser console logs (F12 → Console tab)
2. Supabase Dashboard → Authentication → Logs
3. Network tab in browser DevTools
