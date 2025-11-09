# Crypto AI Analysis Platform

A real-time cryptocurrency analysis platform powered by Claude AI, featuring user authentication, technical indicators, candlestick charts, and intelligent market analysis.

## Features

- **User Authentication**: Secure sign-up/sign-in with NextAuth.js
- **Personal API Keys**: Users bring their own Anthropic API keys for AI analysis
- **Real-time Crypto Data**: Live price tracking for BTC, ETH, BNB, SOL, and ADA via Binance API
- **Candlestick Charts**: Interactive price charts with lightweight-charts library
- **Technical Indicators**: RSI, MACD, EMA (9, 21, 50, 200), Bollinger Bands, and Volume Profile
- **Claude AI Analysis**: Intelligent market analysis with trading signals, pattern recognition, and risk assessment
- **Interactive Dashboard**: Clean, dark-mode optimized interface with real-time updates
- **MongoDB Storage**: User accounts, API keys, and analysis caching

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js v5 with credentials provider
- **Charts**: lightweight-charts (TradingView library)
- **Backend**: Next.js API Routes, Node.js
- **AI**: Anthropic Claude API (user-provided keys)
- **Database**: MongoDB with Mongoose ODM
- **Data Sources**: Binance API, CoinGecko API
- **Package Manager**: Bun

## Prerequisites

- **Bun** (recommended) or Node.js 18+
- **MongoDB** (local or Atlas)
- **Anthropic API Key** (users add their own in settings after sign-up)

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd cryptography-ai
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up MongoDB

Start MongoDB locally:
```bash
mongod
```

Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available).

### 4. Configure environment variables

The `.env.local` file is already created with a generated `NEXTAUTH_SECRET`. Update MongoDB URI if needed:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<already-generated>

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/crypto-ai
```

### 5. Run the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting Started

### For New Users

1. **Sign Up**: Click "Sign Up" in the header
2. **Create Account**: Enter your name, email, and password
3. **Add API Key**: You'll be redirected to settings - add your Anthropic API key
4. **Start Analyzing**: Return to dashboard to access AI-powered market analysis

### Get an Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into Settings page in the app

## Features by Authentication Status

### Without Sign In
✅ View real-time crypto prices
✅ See technical indicators (RSI, MACD, EMA, Bollinger Bands)
✅ View candlestick charts
❌ Claude AI market analysis
❌ Pattern recognition
❌ Risk assessment
❌ Trading signals

### With Sign In + API Key
✅ All public features
✅ Claude AI market analysis
✅ Pattern recognition and chart patterns
✅ Risk assessment with detailed factors
✅ Trading signals (Buy/Sell/Hold with confidence)
✅ Suggested entry/exit prices and stop-loss levels

## Security

- **Password Hashing**: bcryptjs with 12 rounds
- **API Keys**: Stored encrypted in MongoDB, never exposed to client
- **Session Management**: JWT-based sessions with NextAuth.js
- **Private Routes**: API routes check authentication before accessing user data
- **Environment Variables**: Sensitive configs in `.env.local` (gitignored)

## Development

### Running ESLint

```bash
bun run lint
# or
npx eslint "**/*.{tsx,jsx}" --quiet
```

### Type Checking

```bash
bunx tsc --noEmit
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env.local`
- For Atlas: verify IP whitelist and credentials

### Authentication Issues
- Clear browser cookies and try again
- Verify `NEXTAUTH_SECRET` is set
- Check MongoDB connection

### AI Analysis Not Working
- Sign in to your account
- Add your Anthropic API key in Settings
- Verify API key starts with `sk-ant-`
- Check API key has available credits at console.anthropic.com

## License

MIT License

---

Built with Next.js, Claude AI, NextAuth.js, and ❤️ for the crypto community.
