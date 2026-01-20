# Project Summary
**Last Updated:** 2026-01-20 (Remove Chinese language support)
**Updated By:** Claude Code

---

## 1. Project Overview
- **Name:** Alpha Studio (Frontend)
- **Type:** AI Academy Platform / Learning Management System with integrated AI Studio tools
- **Tech Stack:**
  - React 19.1.0 + TypeScript 5.8
  - Vite 6.2 (Build tool)
  - CSS (Pure CSS with CSS Custom Properties for theming)
  - Google Generative AI (@google/genai) - Gemini 2.5 Flash API
- **i18n:** Custom React Context solution (supports: en, vi)
- **Theming:** Light/Dark mode via CSS Custom Properties + data-theme attribute
- **Deployment:** Vercel
- **Backend:** Separate repository - [alpha-studio-backend](../alpha-studio-backend)

---

## 2. Current Architecture

### File Structure (Key Files Only)
```
src/
├── App.tsx                    # Main app component with React Router routes
├── main.tsx                   # React entry point with providers
├── pages/
│   ├── LandingPage.tsx        # Landing page component with featured courses
│   ├── CoursesPage.tsx        # Courses catalog with filters/pagination
│   ├── CoursePage.tsx         # Single course detail page
│   ├── StudentPage.tsx        # Student profile page
│   └── PartnerPage.tsx        # Partner profile page
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
│   └── vi.ts                  # Vietnamese translations (default)
│
├── theme/
│   └── context.tsx            # ThemeProvider, useTheme hook
│
├── services/
│   ├── geminiService.ts       # Gemini API integration (editImage function)
│   ├── jobService.ts          # Job management API service
│   ├── partnerService.ts      # Partner management API service
│   └── courseService.ts       # Course management API service
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
│       ├── PartnerRegistrationModal.tsx
│       ├── PartnerEditModal.tsx       # Partner edit modal with skills
│       └── JobManagementModal.tsx     # Job create/edit modal
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

### Authentication (Frontend)
- **Context:** `src/auth/context.tsx` - AuthProvider + useAuth hook
- **Backend API:** Separate repository (alpha-studio-backend)
- **Token Storage:** localStorage (token + user data)
- **API URL:** Configured via `VITE_API_URL` environment variable

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
- **Gemini Service:** `geminiService.ts` handles all Gemini API calls
- **Model:** `gemini-2.5-flash-preview-05-20`
- **Features:** Image editing with optional mask support
- **Error Handling:** Centralized with user-friendly messages

### Routing
- **Pattern:** React Router v6 with `<BrowserRouter>`
- **Routes:** `/`, `/courses`, `/courses/:slug`, `/studio`, `/workflow`, `/server`, `/students/:id`, `/partners/:id`, `/admin/courses`
- **Protected Routes:** Login dialog for studio/workflow/server/admin
- **Layout:** Shared Layout component with navigation header

### i18n Pattern
- **Dot notation keys:** `t('landing.hero.title1')`
- **Fallback:** Falls back to English if key not found
- **Default language:** Vietnamese (vi)

---

## 4. Active Features & Status

| Feature | Status | Files Involved | Notes |
|---------|--------|----------------|-------|
| Landing Page | ✅ Complete | LandingPage.tsx | Featured courses from API, students, partners |
| Courses Catalog | ✅ Complete | CoursesPage.tsx | Full catalog with filters, search, pagination |
| Course Detail | ✅ Complete | CoursePage.tsx | Single course view with curriculum |
| AI Studio | ✅ Complete | components/studio/* | 20+ transformations, mask support |
| Workflow Dashboard | ✅ Complete | WorkflowDashboard.tsx | Large component (~29k tokens) |
| AI Server Connect | ✅ Complete | AIServerConnect.tsx | GPU server mock UI |
| Theme Switching | ✅ Complete | theme/context.tsx | Light/Dark with persistence |
| i18n (EN/VI) | ✅ Complete | i18n/* | Full translations |
| Authentication | ✅ Complete | auth/context.tsx, Login.tsx | JWT auth (backend separate) |
| Image Mask Editor | ✅ Complete | ImageEditorCanvas.tsx | Canvas-based drawing |
| User Registration | ✅ Complete | Login.tsx | Email + password + confirm password |
| User Profile Menu | ✅ Complete | LandingPage.tsx | Enhanced dropdown with account info section |
| Password Toggle | ✅ Complete | Login.tsx | Show/hide password visibility |
| Remember Me | ✅ Complete | Login.tsx | Saves email to localStorage |
| React Router | ✅ Complete | App.tsx, pages/* | Full routing with React Router v6 |
| Theme-aware Search | ✅ Complete | WorkflowDashboard.tsx | CSS variable-based theming |
| Jobs CRUD | ✅ Complete | JobsView.tsx, JobManagementModal.tsx | Full job management with admin controls |
| Partners CRUD | ✅ Complete | PartnersView.tsx, PartnerEditModal.tsx | Full partner management with edit/publish |
| Course Management | ✅ Complete | CourseManagement.tsx | Admin course route at /admin/courses |

---

## 5. Known Issues & TODOs

### High Priority
- [x] ~~No real authentication~~ (Completed: JWT auth implemented)
- [ ] API key exposed via environment variable only

### Medium Priority
- [ ] WorkflowDashboard.tsx is very large (~29k tokens) - consider splitting
- [ ] No testing framework configured
- [ ] No ESLint/Prettier configuration visible
- [ ] Forgot password / password reset not implemented

### Low Priority
- [x] ~~State-based routing~~ (Migrated to React Router v6)
- [x] ~~Hardcoded courses in LandingPage.tsx~~ (Now fetches from API)
- [ ] Some hardcoded data in LandingPage.tsx (students, partners still static)
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
5. Add translations to ALL language files (en.ts, vi.ts)
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
- `VITE_API_URL` - Backend API URL

### Production URLs:
- **Frontend:** https://alphastudio.vercel.app
- **Backend:** https://alpha-studio-backend.onrender.com/api

---

## 7. Recent Changes (Last 3 Sessions)

1. **2026-01-20** - Course Management Integration & Remove Chinese
   - Integrated Course Management API into frontend Landing Page
   - Replaced hardcoded "Training Programs" section with dynamic "Featured Courses" from API
   - Created CoursesPage.tsx - full courses catalog with filters (category, level), search, sort, pagination
   - Updated CoursePage.tsx to fetch course details from API (was using hardcoded data)
   - Added /courses route in App.tsx with Layout wrapper
   - Added i18n translations for courses section in en.ts, vi.ts (landing.courses.*, courseCatalog.*)
   - Landing page now fetches 6 featured courses sorted by enrollment count
   - Course cards display: thumbnail, title (multilang), level badge, price/finalPrice, duration, lessons, enrollment count
   - Removed Chinese language support: deleted zh.ts, updated context.tsx and PROJECT_SUMMARY.md

2. **2026-01-19** - Jobs & Partners CRUD, Card Redesign
   - Fixed /admin/courses 404 error by adding route and AdminCoursesPage component
   - Fixed job creation experienceLevel enum mismatch ('entry' → 'fresher')
   - Fixed partner creation userId duplicate key error (added index cleanup in backend)
   - Fixed jobs/partners not appearing after creation (admin sees all statuses, users see published)
   - Fixed job/partner update "Route not found" error (changed PATCH to PUT in services)
   - Redesigned job cards with new layout: job type badge, experience level badge, time ago, salary in green, skill tags with #, deadline, applicants count
   - Redesigned partner cards with new layout: logo, verified badge, location, description, skill tags, contact/website buttons
   - Created PartnerEditModal.tsx for editing partners with skills input
   - Added skills field to Partner model in backend
   - Added getExperienceLabel and getExperienceColor helper functions for job cards

3. **2026-01-19** - UI Improvements & Translations
   - Migrated from state-based routing to React Router v6
   - Enhanced account dropdown with better account info section
   - Fixed search input theme colors in WorkflowDashboard
   - Added missing translations (account.*, workflow.jobs.noJobs, workflow.partners.noPartners)
   - Fixed token key mismatch in jobService.ts and partnerService.ts

---

## 8. Quick Commands
```bash
# Development
npm run dev          # Start Vite dev server

# Build
npm run build        # TypeScript check + Vite build

# Preview
npm run preview      # Preview production build
```

### Backend (Separate Repository)
See [alpha-studio-backend](../alpha-studio-backend) for backend setup:
```bash
cd ../alpha-studio-backend
npm install
npm run dev          # Start backend API server
```

---

**NOTE TO CLAUDE CODE:**
Read this file FIRST before making any changes.
Update Section 4, 5, 7 after each session.
Create history entry with details of changes made.
