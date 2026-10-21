# Test Login - Quick Guide

## Credentials Updated

New Supabase credentials are now active (Legacy JWT token):

```env
VITE_SUPABASE_URL=https://xyoaobelwkmrncvktrkv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b2FvYmVsd2ttcm5jdmt0cmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTYxMjgsImV4cCI6MjA4MDkzMjEyOH0.5w5K25BXMlZeVPVeuBAFEF7sEOT7LrNwn17kyjdjOas
```

## Testing Steps

### 1. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Clear Browser State

- Open DevTools (F12)
- Go to Application tab
- Click "Clear site data"
- Refresh page

### 3. Test Sign Up

Navigate to `/signup` and watch browser console for detailed logs.

Expected console output:
```
Initializing Supabase client
Signup form submitted
Sign up successful
```

### 4. Test Sign In

Use same credentials at `/login` - should redirect to `/app`.

## Success Criteria

✅ Console shows Supabase client initialized
✅ Sign up works without errors
✅ Sign in redirects to /app
✅ Session persists on reload

---

**Action:** Restart dev server and test
