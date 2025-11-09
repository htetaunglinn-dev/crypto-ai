# Setup Guide - Crypto AI Analysis Platform

## ✅ Implementation Complete!

All features have been successfully implemented. Here's what's ready:

### Backend (100% Complete)
- ✅ User authentication with NextAuth.js
- ✅ MongoDB models for users, prices, indicators, and analyses
- ✅ User registration and login
- ✅ API key management (users provide their own Anthropic keys)
- ✅ Secure API routes with authentication checks
- ✅ Binance API integration for real-time prices
- ✅ Technical indicators calculation
- ✅ Claude AI integration using user-provided keys

### Frontend (100% Complete)
- ✅ Sign-in page ([/auth/signin](http://localhost:3000/auth/signin))
- ✅ Sign-up page ([/auth/signup](http://localhost:3000/auth/signup))
- ✅ Settings page for API key management ([/settings](http://localhost:3000/settings))
- ✅ Main dashboard with candlestick charts
- ✅ Navigation header with user menu
- ✅ Indicator cards (RSI, MACD, Bollinger Bands, EMA)
- ✅ Claude AI insights panel
- ✅ Authentication flow integrated throughout

## 🚀 Quick Start

### Step 1: Start MongoDB

```bash
# If using local MongoDB
mongod

# OR use MongoDB Atlas (recommended for production)
# Update MONGODB_URI in .env.local with your Atlas connection string
```

### Step 2: Run the Development Server

```bash
bun dev
```

### Step 3: Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 User Flow

### First-Time User Journey

1. **Visit Homepage** → See real-time prices, charts, and indicators (no login required)

2. **Click "Sign Up"** → Create account with name, email, password

3. **Redirected to Settings** → Add Anthropic API key
   - Get key from: https://console.anthropic.com
   - Paste key starting with `sk-ant-`

4. **Return to Dashboard** → Now see full AI analysis features!

### Returning User Journey

1. **Click "Sign In"** → Enter email and password

2. **View Dashboard** → Access all features including AI analysis

3. **Update Settings** → Manage API key anytime via user menu → Settings

## 🔑 Environment Variables (Already Configured)

Your `.env.local` file has been set up with:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=S/TgfYiZIO4fn14nu6laJ0/JtPqRIkww/Pc1u6HIP84=
MONGODB_URI=mongodb://localhost:27017/crypto-ai
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: The `NEXTAUTH_SECRET` has been auto-generated for you. For production, generate a new one.

## 🎯 Testing the Application

### Test Authentication

1. Create a test user:
   - Go to `/auth/signup`
   - Enter: Name: "Test User", Email: "test@example.com", Password: "test123"
   - Submit form

2. You'll be auto-signed in and redirected to `/settings`

3. Add a placeholder API key (or real one if you have it):
   - Enter: `sk-ant-api03-test123` (just for testing UI)
   - Click "Save API Key"

4. Return to dashboard - you'll see:
   - ✅ User menu in header
   - ✅ Charts with real data
   - ✅ Technical indicators
   - ⚠️ AI analysis will show error without valid API key

### Test with Real API Key

1. Get your Anthropic API key:
   - Visit https://console.anthropic.com
   - Sign up / Sign in
   - Navigate to API Keys
   - Create new key
   - Copy the key (starts with `sk-ant-`)

2. Add to Settings:
   - Click your name in header → Settings
   - Paste real API key
   - Save

3. Return to dashboard:
   - AI analysis will now work!
   - See trading signals, pattern recognition, risk assessment

## 📂 Important Files & Folders

```
app/
├── auth/signin/page.tsx        ← Sign-in UI
├── auth/signup/page.tsx        ← Sign-up UI
├── settings/page.tsx           ← API key management
├── page.tsx                    ← Main dashboard
└── api/
    ├── auth/
    │   ├── [...nextauth]/      ← NextAuth handlers
    │   └── register/           ← User registration endpoint
    ├── user/api-key/           ← API key CRUD
    ├── analysis/generate/      ← Claude AI analysis (protected)
    └── ...

components/
├── Header.tsx                  ← Navigation with user menu
├── Providers.tsx               ← NextAuth SessionProvider
├── charts/
│   └── CandlestickChart.tsx   ← Price charts
└── ...

lib/
├── auth.ts                     ← NextAuth config
├── db/
│   ├── models/User.ts         ← User model (with API key)
│   └── mongodb-client.ts      ← MongoDB client
└── ai/claude.ts               ← Claude service (uses user API key)
```

## 🧪 Testing Checklist

- [ ] MongoDB is running
- [ ] App starts with `bun dev`
- [ ] Can access homepage at http://localhost:3000
- [ ] Can create new account at `/auth/signup`
- [ ] Can sign in at `/auth/signin`
- [ ] Can access settings at `/settings`
- [ ] Can add/update/remove API key
- [ ] Prices load on dashboard
- [ ] Charts display historical data
- [ ] Indicators show (RSI, MACD, etc.)
- [ ] With API key: AI analysis works
- [ ] Without API key: Shows prompt to add key
- [ ] Can sign out via user menu

## ⚡ Performance Notes

- **Price Updates**: Every 30 seconds
- **Caching**:
  - Prices: 5 minutes
  - Indicators: 1 minute
  - AI Analysis: 5 minutes
  - Historical Data: 7 days TTL

## 🔒 Security Features

1. **Password Security**: Hashed with bcryptjs (12 rounds)
2. **API Keys**: Stored in database (not exposed to client)
3. **Session Management**: JWT tokens via NextAuth
4. **Protected Routes**: Analysis requires authentication
5. **Environment Secrets**: In `.env.local` (gitignored)

## 🐛 Common Issues & Solutions

### Issue: "MongoDB connection failed"
**Solution**: Make sure MongoDB is running (`mongod` command)

### Issue: "Cannot sign in"
**Solution**:
- Check MongoDB connection
- Verify `NEXTAUTH_SECRET` is set in `.env.local`
- Clear browser cookies

### Issue: "AI analysis not working"
**Solution**:
- Ensure you're signed in
- Add valid Anthropic API key in Settings
- Key must start with `sk-ant-`
- Check API key has credits at console.anthropic.com

### Issue: "Charts not showing"
**Solution**:
- Check browser console for errors
- Verify Binance API is accessible
- Try refreshing the page

## 📊 What Works Without Authentication

✅ Homepage access
✅ Real-time prices
✅ Candlestick charts
✅ Technical indicators (RSI, MACD, EMA, Bollinger Bands)
✅ Volume profile

## 🔐 What Requires Authentication

🔒 Claude AI market analysis
🔒 Pattern recognition
🔒 Risk assessment
🔒 Trading signals
🔒 Suggested entry/exit prices

## 🎉 Ready to Use!

Your application is fully functional and ready for:
- Local development
- Testing
- Deployment to Vercel
- Adding new features

### Next Steps (Optional)

1. **Get Your API Key**: Visit https://console.anthropic.com
2. **Deploy**: Push to GitHub and deploy on Vercel
3. **Customize**: Modify colors, add more indicators, etc.
4. **Extend**: Add more crypto pairs, timeframes, or features

---

**Need Help?** Check the main [README.md](./README.md) for more details.
