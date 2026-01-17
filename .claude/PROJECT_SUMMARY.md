# Project Summary
**Last Updated:** 2026-01-17 (Authentication System)
**Updated By:** Claude Code

---

## 1. Project Overview
- **Name:** Alpha Studio
- **Type:** AI Academy Platform / Learning Management System with integrated AI Studio tools
- **Tech Stack:**
  - React 19.1.0 + TypeScript 5.8
  - Vite 6.2 (Build tool)
  - CSS (Pure CSS with CSS Custom Properties for theming)
  - Google Generative AI (@google/genai) - Gemini 2.5 Flash API
- **i18n:** Custom React Context solution (supports: en, vi, zh)
- **Theming:** Light/Dark mode via CSS Custom Properties + data-theme attribute
- **Deployment:** Vercel (based on recent commits)
- **Backend:** Node.js + Express.js (ES Module)
  - **Database:** MongoDB Atlas (Cloud Database)
  - **ODM:** Mongoose 8.x
---

## 2. Current Architecture

### File Structure (Key Files Only)
```
src/
├── App.tsx                    # Main app component, routing logic, landing page
├── main.tsx                   # React entry point with providers
├── index.css                  # Global styles, animations, utilities
├── types.ts                   # TypeScript interfaces/types
├── constants.ts               # TRANSFORMATIONS array for AI tools
├── vite-env.d.ts              # Vite environment type declarations
│
├── auth/
│   └── context.tsx            # AuthProvider, useAuth hook (JWT authentication)
│
├── i18n/
│   ├── context.tsx            # LanguageProvider, useTranslation hook
│   ├── en.ts                  # English translations
│   ├── vi.ts                  # Vietnamese translations (default)
│   └── zh.ts                  # Chinese translations
│
├── theme/
│   └── context.tsx            # ThemeProvider, useTheme hook
│
├── services/
│   └── geminiService.ts       # Gemini API integration (editImage function)
│
├── utils/
│   └── fileUtils.ts           # File utilities (downloadImage, etc.)
│
├── components/
│   ├── ui/                    # Shared UI components
│   │   ├── ThemeSwitcher.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── Login.tsx          # Login/Register modal with real auth
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── studio/                # AI Studio tool components
│   │   ├── StudioTool.tsx           # Main studio page
│   │   ├── TransformationSelector.tsx
│   │   ├── ImageEditorCanvas.tsx    # Canvas with mask drawing
│   │   ├── PromptSelector.tsx
│   │   ├── ResultDisplay.tsx
│   │   └── HistoryPanel.tsx
│   │
│   ├── upload/                # Image upload components
│   │   ├── UploaderBox.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── MultiImageUploader.tsx
│   │   └── MultiImageGridUploader.tsx
│   │
│   ├── dashboard/             # Workflow/Dashboard components
│   │   ├── WorkflowDashboard.tsx    # Large feature (project management)
│   │   └── AIServerConnect.tsx      # GPU server connection UI
│   │
│   ├── viewers/               # Detail view components
│   │   ├── CourseViewer.tsx
│   │   ├── StudentProfileViewer.tsx
│   │   └── PartnerProfileViewer.tsx
│   │
│   └── modals/                # Modal components
│       ├── ImagePreviewModal.tsx
│       ├── StudentProfileModal.tsx
│       └── PartnerRegistrationModal.tsx
```

### Component Dependencies
```
App.tsx
├── ThemeProvider (wraps entire app)
│   └── LanguageProvider
│       └── AuthProvider
│           └── App content
│               ├── StudioTool (protected route)
│               │   ├── ImageEditorCanvas
│               │   ├── TransformationSelector
│               │   └── ResultDisplay
│               ├── WorkflowDashboard (protected route)
│               ├── AIServerConnect (protected route)
│               ├── CourseViewer
│               ├── StudentProfileViewer
│               └── PartnerProfileViewer
```

### Server Structure
```
server/
├── index.js                   # Express server entry point
├── db/
│   ├── connection.js          # MongoDB connection
│   ├── init-collections.js    # Database initialization
│   ├── test-connection.js     # Connection test script
│   └── migrate-passwords.js   # Password hashing migration
├── models/
│   └── User.js                # User model with bcrypt
├── middleware/
│   └── auth.js                # JWT auth middleware
└── routes/
    └── auth.js                # Auth API routes (login/register/logout)
```

---

## 3. Key Decisions & Patterns

### State Management
- **Pattern:** React Context API for global state
- **Providers:**
  - `ThemeProvider`: Manages light/dark theme with localStorage persistence
  - `LanguageProvider`: Manages i18n with localStorage persistence
  - `AuthProvider`: Manages authentication state with JWT + localStorage
- **Local State:** useState/useCallback for component-level state
- **No Redux/Zustand:** Simple app, Context is sufficient

### Authentication System
- **Backend:** Express.js REST API
- **Database:** MongoDB Atlas (users collection)
- **Password Security:** bcrypt with 12 salt rounds
- **Token:** JWT with 7-day expiration
- **Storage:** localStorage (token + user data) + httpOnly cookie
- **API Endpoints:**
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - Logout (clears cookie)
  - `GET /api/auth/me` - Get current user
  - `PUT /api/auth/profile` - Update profile
  - `PUT /api/auth/password` - Change password

### Styling Approach
- **Pure CSS:** No Tailwind/CSS-in-JS
- **CSS Custom Properties:** Extensive use for theming
  - `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`
  - `--text-primary`, `--text-secondary`, `--text-tertiary`
  - `--accent-primary`, `--accent-secondary`, `--accent-shadow`
  - `--border-primary`, `--border-secondary`
- **Theme Switching:** `data-theme` attribute on `<html>`
- **Utility Classes:** Custom utilities (line-clamp-2, line-clamp-3, animations)
- **Glass Effect:** `glass-card` class for glassmorphism

### API Integration
- **Service:** `geminiService.ts` handles all Gemini API calls
- **Model:** `gemini-2.5-flash-preview-05-20`
- **Features:** Image editing with optional mask support
- **Error Handling:** Centralized with user-friendly messages

### Routing
- **Pattern:** State-based "routing" in App.tsx
- **Views:** home, studio, workflow, server + detail views
- **Protected Routes:** Login dialog for studio/workflow/server

### i18n Pattern
- **Dot notation keys:** `t('landing.hero.title1')`
- **Fallback:** Falls back to English if key not found
- **Default language:** Vietnamese (vi)
### Database Architecture (MongoDB Atlas)
- **Connection:** MongoDB Atlas Cloud (Cluster0)
- **Database Name:** `alpha-studio`
- **Collections:** 8 collections (users, courses, students, partners, projects, studio_sessions, transformations, api_usage)
- **Indexes:** Optimized for common queries
- **Sample Data:** 2 admin users (admin@alphastudio.com, tanthanh@alphastudio.com)
- **Documentation:** See DATABASE.md for detailed schema
---

## 4. Active Features & Status

| Feature | Status | Files Involved | Notes |
|---------|--------|----------------|-------|
| Landing Page | ✅ Complete | App.tsx | Courses, students, partners showcase |
| AI Studio | ✅ Complete | components/studio/* | 20+ transformations, mask support |
| Workflow Dashboard | ✅ Complete | WorkflowDashboard.tsx | Large component (~29k tokens) |
| AI Server Connect | ✅ Complete | AIServerConnect.tsx | GPU server mock UI |
| Theme Switching | ✅ Complete | theme/context.tsx | Light/Dark with persistence |
| i18n (EN/VI/ZH) | ✅ Complete | i18n/* | Full translations |
| Authentication | ✅ Complete | auth/context.tsx, Login.tsx, server/routes/auth.js | JWT auth with bcrypt |
| Image Mask Editor | ✅ Complete | ImageEditorCanvas.tsx | Canvas-based drawing |
| User Registration | ✅ Complete | Login.tsx | Email + password + confirm password |
| User Profile Menu | ✅ Complete | App.tsx | Dropdown with user info + logout |
| Password Toggle | ✅ Complete | Login.tsx | Show/hide password visibility |
| Remember Me | ✅ Complete | Login.tsx | Saves email to localStorage |

---

## 5. Known Issues & TODOs

### High Priority
- [x] ~~No real authentication - currently using mock login~~ (Completed: JWT auth implemented)
- [ ] API key exposed via environment variable only

### Medium Priority
- [ ] WorkflowDashboard.tsx is very large (~29k tokens) - consider splitting
- [ ] No testing framework configured
- [ ] No ESLint/Prettier configuration visible
- [ ] Forgot password / password reset not implemented

### Low Priority
- [ ] Some hardcoded data in App.tsx (courses, students, partners)
- [ ] No loading states for language switching
- [ ] Consider extracting landing page sections into components
- [ ] Email verification not implemented

---

## 6. Important Context for Claude

### When making changes:
1. Always update this file's "Last Updated" timestamp
2. Create new history entry in `.claude/history/`
3. Follow naming conventions in CONVENTIONS.md
4. Use CSS Custom Properties for any styling changes
5. Add translations to ALL language files (en.ts, vi.ts, zh.ts)
6. Use `useTranslation()` hook for any user-facing text
7. Keep components under 500 lines when possible

### Critical Files (read before major changes):
- `src/types.ts` - All TypeScript interfaces
- `src/constants.ts` - TRANSFORMATIONS definitions
- `src/i18n/vi.ts` - Primary translation file
- `src/index.css` - Global styles and CSS variables
- `src/services/geminiService.ts` - API integration

### Environment Variables:
- `VITE_GEMINI_API_KEY` - Required for AI features
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)
- `MONGODB_URI` - MongoDB connection string (server-side)
- `JWT_SECRET` - Secret key for JWT tokens (server-side)

---

## 7. Recent Changes (Last 3 Sessions)

1. **2026-01-17** - Authentication System Implementation + Bug Fixes
   - Implemented JWT authentication with bcrypt password hashing
   - Created AuthProvider context for frontend state management
   - Added Login/Register modal with form validation
   - Built Express.js API routes: login, register, logout, profile
   - Added user profile dropdown menu with logout functionality
   - Updated translations (en, vi, zh) with auth-related strings
   - Added password migration script for existing users
   - **Bug Fixes:**
     - Fixed Mongoose 8+ pre-save hook (removed `next` callback)
     - Fixed login route 500 error (use updateOne for lastLogin)
     - Fixed register route duplicate key error handling
   - **UI Enhancements:**
     - Added password visibility toggle (eye icon)
     - Added "Remember me" checkbox (saves email)
     - Added confirm password field for registration

2. **2025-01-17** - Initial project setup and documentation
   - Created `.claude/` documentation structure
   - Generated PROJECT_SUMMARY.md, CONVENTIONS.md, INSTRUCTIONS_FOR_CLAUDE.md

---

## 8. Quick Commands
```bash
# Development
npm run dev          # Start Vite dev server (frontend)
npm run server       # Start Express API server (backend)
npm run dev:full     # Start both frontend + backend concurrently

# Build
npm run build        # TypeScript check + Vite build

# Preview
npm run preview      # Preview production build

# Database
npm run db:test      # Test MongoDB connection
npm run db:init      # Initialize database with sample data
npm run db:migrate-passwords  # Hash existing passwords with bcrypt
```

---

**NOTE TO CLAUDE CODE:**
Read this file FIRST before making any changes.
Update Section 4, 5, 7 after each session.
Create history entry with details of changes made.
