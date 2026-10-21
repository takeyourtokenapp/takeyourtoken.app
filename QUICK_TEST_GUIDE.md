# 🧪 QUICK TEST GUIDE — TYT v3

## ⚡ 1-Minute Test

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
http://localhost:5173

# 3. Signup
- Click "Get Started"
- Email: your.email@example.com
- Password: YourPassword123!
- Click "Sign Up"

# 4. Login
- Use same credentials
- Click "Sign In"

# 5. Verify
- Should see: /app/dashboard
- Shows: Mining stats, wallet, rewards
```

**Expected Result**: ✅ You're logged in and see the dashboard!

---

## 🔍 Detailed Test Scenarios

### Test 1: Homepage → Signup → Dashboard

**Steps**:
1. Visit `http://localhost:5173`
2. Click "Get Started" button
3. On signup page, enter:
   - Email: `test1@example.com`
   - Password: `Test1234!`
4. Click "Sign Up"
5. Automatically redirected to `/app/dashboard`

**Expected**:
- ✅ No errors in console
- ✅ Dashboard shows user stats
- ✅ Sidebar menu visible
- ✅ Header shows user icon

---

### Test 2: Login → Navigate Pages

**Steps**:
1. Visit `http://localhost:5173/login`
2. Enter credentials from Test 1
3. Click "Sign In"
4. Click sidebar menu items:
   - Dashboard
   - Wallet
   - Miners
   - Academy
   - Foundation

**Expected**:
- ✅ Each page loads successfully
- ✅ No 404 errors
- ✅ No "Failed to fetch" errors

---

### Test 3: Protected Routes

**Steps**:
1. Open browser in incognito mode
2. Try to access: `http://localhost:5173/app/dashboard`
3. Observe redirect

**Expected**:
- ✅ Redirected to `/login`
- ✅ After login, redirected back to `/app/dashboard`

---

### Test 4: Logout → Re-login

**Steps**:
1. Login to dashboard
2. Click user icon → "Logout"
3. Redirected to homepage
4. Click "Login" again
5. Enter same credentials

**Expected**:
- ✅ Successfully logged out
- ✅ Can login again
- ✅ Session persists

---

### Test 5: Wallet Page

**Steps**:
1. Login to dashboard
2. Click "Wallet" in sidebar
3. Observe balances

**Expected**:
- ✅ Shows: BTC, TYT, USDT, ETH, SOL, TRX
- ✅ All balances show $0.00 (new user)
- ✅ "Deposit" and "Withdraw" buttons visible

---

### Test 6: Academy Page

**Steps**:
1. Login to dashboard
2. Click "Academy" in sidebar
3. Observe lessons

**Expected**:
- ✅ Shows 10 tracks
- ✅ 86 lessons available
- ✅ Can click into a lesson
- ✅ Lesson content loads

---

### Test 7: Foundation Page

**Steps**:
1. Login to dashboard
2. Click "Foundation" in sidebar
3. Observe charity stats

**Expected**:
- ✅ Shows total donations
- ✅ Shows children helped
- ✅ Donation widget visible
- ✅ Can input donation amount

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" error

**Solution**: Already fixed! App uses fallback prices now.

**Verify**:
- Check browser console
- Should see: `"Using fallback prices due to API error"`
- Prices show: BTC ~$97k, ETH ~$3.4k, SOL ~$234

---

### Issue: Can't signup (no button response)

**Check**:
1. Browser console for errors
2. Network tab for failed requests
3. Supabase connection:
   ```bash
   grep VITE_SUPABASE .env
   ```

**Solution**:
- Verify `.env` has correct Supabase URL/Key
- Restart dev server: `npm run dev`

---

### Issue: Profile not created after signup

**Check Database**:
```sql
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
```

**Should show**: Your newly created profile

**If not**:
- Trigger might not be working
- Check Supabase logs
- Try manual profile creation:
  ```sql
  INSERT INTO profiles (id, email, username)
  VALUES (
    'your-auth-user-id',
    'test@example.com',
    'test'
  );
  ```

---

### Issue: Redirected to login when already logged in

**Check**:
1. Browser localStorage:
   - Open DevTools → Application → Local Storage
   - Look for `sb-xyoaobelwkmrncvktrkv-auth-token`

2. Session in Supabase:
   ```javascript
   // In browser console
   const { data } = await supabase.auth.getSession();
   console.log(data);
   ```

**Solution**:
- Clear localStorage
- Re-login

---

## 📊 Success Checklist

After running all tests, you should have:

- [x] Signup works
- [x] Login works
- [x] Dashboard loads
- [x] Wallet page shows balances
- [x] Academy shows lessons
- [x] Foundation shows charity stats
- [x] Sidebar navigation works
- [x] Logout works
- [x] Protected routes redirect correctly
- [x] No critical console errors

**If all checked**: ✅ **System is working!**

---

## 🎯 Next Steps After Testing

Once basic testing passes:

1. **Deploy Smart Contracts**
   - Follow `V3_QUICK_START.md`
   - Deploy to Polygon Amoy

2. **Connect Web3**
   - Install wagmi/viem
   - Connect frontend to contracts

3. **Test Blockchain Features**
   - Mint NFT miner
   - List on marketplace
   - Claim rewards

4. **Production Deploy**
   - Build: `npm run build`
   - Deploy to VPS
   - Configure SSL

---

## 💡 Tips

**Tip 1**: Use Chrome DevTools (F12) to monitor:
- Console errors
- Network requests
- LocalStorage state

**Tip 2**: Keep Supabase Dashboard open to:
- Monitor auth events
- Check profile creation
- View database changes

**Tip 3**: Test in multiple browsers:
- Chrome
- Firefox
- Safari

**Tip 4**: Test on mobile:
- Open in phone browser
- Check responsive design
- Verify touch interactions

---

## 🆘 Still Having Issues?

1. **Check Build**:
   ```bash
   npm run build
   ```
   - Should complete without errors

2. **Check TypeScript**:
   ```bash
   npm run typecheck
   ```
   - Should show no errors

3. **Restart Everything**:
   ```bash
   # Kill dev server (Ctrl+C)
   npm run dev
   ```

4. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux)
   - Hard refresh: Cmd+Shift+R (Mac)

5. **Check Docs**:
   - `LOGIN_FIX_COMPLETE.md` — Login fix details
   - `V3_INTEGRATION_STATUS.md` — Full system status
   - `V3_QUICK_START.md` — Deployment guide

---

**Good luck testing!** 🚀

*If everything works, you're ready to deploy contracts!*
