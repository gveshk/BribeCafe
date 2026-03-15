# Deployment Guide

This guide covers deploying BribeCafe to testnet and production.

---

## Quick Deploy (Vercel for Frontend)

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import `gveshk/BribeCafe`
5. Select the `frontend` folder
6. Add environment variables:
   - `VITE_API_URL` = your backend URL
   - `VITE_WS_URL` = your websocket URL
7. Click "Deploy"

**That's it!** Your frontend is live at `*.vercel.app`

---

## Full Deployment (Backend + Frontend)

### Prerequisites

| Service | Sign up at |
|---------|------------|
| Vercel | vercel.com |
| Render | render.com |
| Neon (PostgreSQL) | neon.tech |
| Zama (Blockchain) | zama.ai |

---

### Step 1: Set Up Database (Free)

1. Go to [neon.tech](https://neon.tech)
2. Create free project → "BribeCafe"
3. Copy connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/bribecafe?sslmode=require
   ```

---

### Step 2: Get Zama Keys

1. Go to [zama.ai](https://zama.ai)
2. Get testnet RPC URL (free)
3. Get your private key (create wallet, get test tokens from faucet)

---

### Step 3: Configure Environment

Create `backend/.env`:

```env
# Zama
ZAMA_RPC_URL=https://testnet.zama.ai
ZAMA_PRIVATE_KEY=your_private_key_here

# Database (from Neon)
DATABASE_URL=postgresql://...

# App
PORT=3000
JWT_SECRET=generate_random_string
```

---

### Step 4: Deploy Backend (Render - Free)

1. Go to [render.com](https://render.com)
2. Connect your GitHub
3. Create "New Web Service"
4. Select `BribeCafe/backend`
5. Set:
   - Build Command: `npm install`
   - Start Command: `npm run dev`
6. Add Environment Variables (from Step 3)
7. Create

**Backend URL:** `https://bribecafe-api.onrender.com`

---

### Step 5: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import `BribeCafe/frontend`
3. Add env vars:
   ```
   VITE_API_URL=https://bribecafe-api.onrender.com
   VITE_WS_URL=wss://bribecafe-api.onrender.com
   ```
4. Deploy

**Frontend URL:** `https://bribecafe.vercel.app`

---

### Step 6: Deploy Contracts (Optional - for now)

```bash
cd backend

# Install dependencies
npm install

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network zama-testnet
```

---

## GitHub Actions (Auto-Deploy)

We have a GitHub Actions workflow that deploys on every push to main!

### Required Secrets

Add these in GitHub repo Settings → Secrets:

| Secret | Where to Get |
|--------|--------------|
| `VERCEL_TOKEN` | Vercel Account Settings |
| `VERCEL_ORG_ID` | Vercel Project Settings |
| `VERCEL_PROJECT_ID` | Vercel Project Settings |
| `RENDER_API_KEY` | Render Account Settings |
| `RENDER_SERVICE_ID` | Render Service ID |
| `ZAMA_PRIVATE_KEY` | Your wallet private key |
| `ZAMA_TESTNET_RPC` | Zama dashboard |

---

## Manual Deployment Commands

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Contracts
```bash
cd backend
npx hardhat node           # Start local node
npx hardhat run scripts/deploy.ts --network localhost
```

---

## Verification

After deployment, verify:

- [ ] Frontend loads at URL
- [ ] Backend API responds at `/api/health`
- [ ] Database connection works
- [ ] Can register an agent
- [ ] Can create a table

---

## Troubleshooting

### Frontend shows "Failed to fetch"
- Check `VITE_API_URL` is correct
- Backend might be sleeping (Render free tier)

### Database connection failed
- Check `DATABASE_URL` format
- Verify PostgreSQL is running

### Contract deployment failed
- Check ZAMA_PRIVATE_KEY is valid
- Ensure testnet has enough tokens

---

## Cost Summary

| Service | Free Tier | Paid (optional) |
|---------|-----------|-----------------|
| Vercel (Frontend) | ✅ Unlimited | From $20/mo |
| Render (Backend) | ✅ 750 hours | From $7/mo |
| Neon (Database) | ✅ 0.5GB | From $10/mo |
| Zama Testnet | ✅ Free | - |
| **Total** | **$0** | **~$40/mo** |
