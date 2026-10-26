# Render — Required Environment Variables

Copy these **names** into the Render dashboard for the `backend` web service.  
**Do not commit real secrets.** Replace placeholders with values from Supabase, Vercel, and your secret store.

```env
NODE_ENV=production
PORT=10000

DATABASE_URL=<SUPABASE_POOLED_CONNECTION_URI>
DIRECT_URL=<SUPABASE_DIRECT_CONNECTION_URI_PORT_5432>

SEPOLIA_RPC_URL=<SEPOLIA_HTTPS_RPC>
CHAIN_ID=11155111

CAMP_TOKEN_ADDRESS=0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918
BADGE_CONTRACT_ADDRESS=0x515677D8B9fe03998173032d7be9a0e7Ee78429c

JWT_SECRET=<RANDOM_SECRET_MIN_16_CHARS>
FRONTEND_ORIGIN=https://block-chain-project-rust.vercel.app

CONFIRMATION_BLOCKS=3
ENABLE_INDEXER_LOOP=false

START_BLOCK=<OPTIONAL_DEPLOY_BLOCK>
INDEXER_BLOCK_CHUNK=1000
```

## Render commands (from repository)

| Setting | Value |
|--------|--------|
| Root directory | `backend` |
| Build command | `npm ci && npm run prisma:generate && npm run build` |
| Start command | `npm run prisma:deploy && npm start` |
| Health check | `/health` |

After Render is live, set Vercel `VITE_API_URL` to `https://<your-service>.onrender.com` and redeploy the frontend.
