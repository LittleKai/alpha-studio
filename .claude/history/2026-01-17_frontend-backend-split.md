# Frontend/Backend Split
**Date:** 2026-01-17
**Type:** Architecture / Refactoring

---

## Summary
Separated the monorepo into two independent repositories:
- **Frontend:** alpha-studio (this repo) - React + Vite, deployed to Vercel
- **Backend:** alpha-studio-backend (separate repo) - Express.js API, deployed to Railway/Render

## Changes Made

### Removed Files
- `server/` folder (moved to alpha-studio-backend)
  - `server/index.js`
  - `server/db/`
  - `server/models/`
  - `server/middleware/`
  - `server/routes/`

### Modified Files
1. **package.json**
   - Removed backend dependencies: express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv, cookie-parser, nodemon, concurrently
   - Removed backend scripts: server, dev:full, db:test, db:init, db:migrate-passwords
   - Kept only frontend dependencies and scripts

2. **.env.example** (created)
   - Contains only frontend environment variables
   - `VITE_GEMINI_API_KEY` - Gemini AI API key
   - `VITE_API_URL` - Backend API URL

3. **.claude/PROJECT_SUMMARY.md**
   - Updated to reflect frontend-only architecture
   - Updated tech stack section
   - Updated file structure
   - Added reference to backend repository

## Architecture After Split

### Frontend (this repo)
```
alpha-studio/
├── src/                    # React application
├── public/                 # Static assets
├── .claude/                # Documentation
├── package.json            # Frontend dependencies only
├── vite.config.ts
├── tsconfig.json
└── .env.example            # Frontend env template
```

### Backend (separate repo)
```
alpha-studio-backend/
├── server/                 # Express.js API
├── .claude/                # Documentation
├── package.json            # Backend dependencies only
└── .env.example            # Backend env template
```

## Deployment Architecture
- **Frontend:** Vercel (existing deployment)
- **Backend:** Railway or Render (to be configured)

## Environment Configuration

### Frontend (.env)
```env
VITE_GEMINI_API_KEY=your_key
VITE_API_URL=http://localhost:3001/api  # or production URL
```

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
PORT=3001
NODE_ENV=development
FRONTEND_URL=https://your-frontend.vercel.app
```

## Migration Notes
1. Backend CORS is configured to accept requests from both localhost and production frontend URL
2. Frontend API URL is configurable via environment variable
3. Both projects can be developed independently

---

## Related
- Backend repository: `../alpha-studio-backend`
- Previous session: Authentication System Implementation
