# PNW Battler - Deployment Setup & Issue Resolution

## Project Overview
A Next.js application for Politics & War battle simulation with Discord OAuth authentication.

## Repository Structure
```
pnwbattler/
├── package.json (root-level for Vercel deployment)
└── Battler/ (main Next.js application)
    ├── next.config.js
    ├── package.json
    ├── .env.example
    ├── .gitignore
    └── src/
        ├── app/
        │   ├── page.tsx
        │   ├── layout.tsx
        │   └── api/
        │       ├── auth/[...nextauth]/route.ts
        │       ├── nations/route.ts
        │       └── verify/route.ts
        ├── components/
        │   ├── AuthButton.tsx
        │   └── Providers.tsx
        ├── lib/
        │   ├── apollo-client.ts
        │   ├── auth.ts
        │   └── battle-simulator.ts
        ├── stores/index.ts
        └── types/index.ts
```

## Security Configuration ✅

### Environment Variables Setup
**Status**: ✅ Properly configured with .env.example

**Required Environment Variables for Vercel:**
```bash
# Discord OAuth Configuration
DISCORD_CLIENT_ID=1406354841248202874
DISCORD_CLIENT_SECRET=[REGENERATED_SECRET_NEEDED]
NEXTAUTH_URL=https://pnwbattler.com
NEXTAUTH_SECRET=[RANDOM_32_CHAR_STRING]

# Politics and War API
NEXT_PUBLIC_PW_API_KEY=[YOUR_PW_API_KEY]
PW_BOT_NATION_ID=[YOUR_BOT_NATION_ID]
PW_BOT_API_KEY=[YOUR_BOT_API_KEY]
```

**Security Notes:**
- ✅ `.gitignore` properly excludes `.env` and `.env.local`
- ✅ Only `.env.example` is committed to repository
- ✅ No hardcoded secrets found in codebase
- ⚠️ Discord Client Secret was exposed and needs regeneration

### Discord OAuth Setup
**Required Redirect URIs:**
- Development: `http://localhost:3000/api/auth/callback/discord`
- Production: `https://pnwbattler.com/api/auth/callback/discord`

## Vercel Deployment Configuration ✅

### Build Settings
- **Framework Preset**: Next.js or Other
- **Root Directory**: `Battler` (case-sensitive!)
- **Build Command**: `npm run build`
- **Output Directory**: Default (`.next`)
- **Install Command**: `npm install`

### Root-Level package.json
Created for delegation to Battler subfolder:
```json
{
  "name": "pnwbattler-monorepo",
  "scripts": {
    "build": "cd Battler && npm run build",
    "vercel-build": "cd Battler && npm install && npm run build"
  }
}
```

## Build Issues Resolved ✅

### 1. Linting Errors Fixed
- **Apostrophe escaping**: Changed `nation's` to `nation&apos;s` in page.tsx
- **Image optimization**: Replaced `<img>` with Next.js `<Image>` component in AuthButton.tsx
- **Deprecated config**: Removed obsolete `appDir: true` from next.config.js

### 2. NextAuth Route Handler Issues Fixed
**Problem**: App Router doesn't allow custom exports from route handlers

**Solution**: Refactored auth configuration
- Created `src/lib/auth.ts` with exported `authOptions`
- Updated `[...nextauth]/route.ts` to import from lib file
- Updated `verify/route.ts` to import from lib file

**Before (❌ Broken):**
```typescript
// route.ts
export const authOptions = { ... }; // Not allowed in App Router
```

**After (✅ Working):**
```typescript
// lib/auth.ts
export const authOptions = { ... };

// route.ts
import { authOptions } from "../../../../lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3. Directory Structure Issues Fixed
- **Case sensitivity**: Fixed "battler" vs "Battler" directory name
- **Root directory**: Properly configured to point to `Battler` subfolder

## Current Status
- ✅ Security properly configured (no tokens in repo)
- ✅ Build errors resolved
- ✅ Vercel configuration corrected
- ✅ NextAuth properly configured for App Router
- 🚀 Ready for successful deployment

## Next Steps
1. **Regenerate Discord Client Secret** (was compromised)
2. **Add all environment variables to Vercel dashboard**
3. **Add Discord OAuth redirect URIs**
4. **Deploy should now succeed**

## Technical Stack
- **Framework**: Next.js 15.4.6 with App Router
- **Authentication**: NextAuth.js with Discord provider
- **Styling**: Tailwind CSS
- **API Integration**: Apollo GraphQL for Politics & War API
- **State Management**: Zustand
- **Deployment**: Vercel with custom domain (pnwbattler.com)

## Lessons Learned
1. App Router has strict rules about route handler exports
2. Case sensitivity matters in Vercel root directory configuration
3. Monorepo structure requires careful build script configuration
4. Never commit actual environment variables to repositories
5. NextAuth configuration needs to be in a separate file for reusability in App Router
