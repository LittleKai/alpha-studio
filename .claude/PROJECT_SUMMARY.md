# Project Summary
**Last Updated:** 2026-01-24 (Course Learning System & Video Player)
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
│   ├── CoursePage.tsx         # Single course detail with video player, enrollment, reviews
│   ├── MyCoursesPage.tsx      # User's enrolled courses with progress tracking
│   ├── StudentPage.tsx        # Student profile page
│   ├── PartnerPage.tsx        # Partner profile page
│   ├── ProfilePage.tsx        # User profile edit page (avatar, bio, skills, works)
│   └── AdminPage.tsx          # Admin management (users, transactions, webhooks)
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
│   ├── en.ts                  # English translations (imports from locales/en)
│   ├── vi.ts                  # Vietnamese translations (imports from locales/vi)
│   └── locales/               # Modular translation files
│       ├── en/                # English modules
│       │   ├── index.ts       # Combines all modules
│       │   ├── app.ts         # App, history, imageEditor, studio
│       │   ├── auth.ts        # Account, login
│       │   ├── common.ts      # Common, profile
│       │   ├── entities.ts    # Server, imagePreview, student, partner, job
│       │   ├── course.ts      # Course, courseCatalog
│       │   ├── result.ts      # ResultDisplay, transformationSelector
│       │   ├── transformations.ts  # AI transformations
│       │   ├── workflow.ts    # Workflow dashboard
│       │   ├── landing.ts     # Landing page
│       │   └── admin.ts       # Admin panel
│       └── vi/                # Vietnamese modules (same structure)
│
├── theme/
│   └── context.tsx            # ThemeProvider, useTheme hook
│
├── services/
│   ├── geminiService.ts       # Gemini API integration (editImage function)
│   ├── jobService.ts          # Job management API service
│   ├── partnerService.ts      # Partner management API service
│   ├── courseService.ts       # Course management API service
│   ├── cloudinaryService.ts   # Cloudinary upload service with compression
│   ├── imageCompression.ts    # Image compression utility (avatar, featured_work, logo, attachment)
│   ├── paymentService.ts      # Payment API service (create, confirm, cancel, history)
│   ├── adminService.ts        # Admin API service (users, transactions, webhooks)
│   ├── promptService.ts       # Prompt sharing API service (CRUD, like, bookmark, rate)
│   └── resourceService.ts     # Resource hub API service (CRUD, like, bookmark, download)
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
│   │   ├── AIServerConnect.tsx      # GPU server connection UI
│   │   └── views/
│   │       ├── WalletView.tsx       # Credit wallet with VietQR payment
│   │       ├── PromptsView.tsx      # Share Prompts listing with filters
│   │       ├── ResourcesView.tsx    # Resource Hub listing with filters
│   │       ├── JobsView.tsx         # Jobs listing
│   │       └── PartnersView.tsx     # Partners listing
│   │
│   ├── cards/                 # Card components for listings
│   │   ├── PromptCard.tsx           # Prompt card with like, bookmark, rating
│   │   └── ResourceCard.tsx         # Resource card with download, rating
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
│       ├── JobManagementModal.tsx     # Job create/edit modal
│       ├── ProfileEditModal.tsx       # Profile view modal (view-only, links to ProfilePage)
│       ├── PromptFormModal.tsx        # Create/edit prompt with multiple contents
│       ├── PromptDetailModal.tsx      # Prompt detail view with comments
│       ├── ResourceFormModal.tsx      # Create/edit resource with file upload
│       └── ResourceDetailModal.tsx    # Resource detail view with download
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
- **Routes:** `/`, `/courses`, `/courses/:slug`, `/my-courses`, `/studio`, `/workflow`, `/server`, `/students/:id`, `/partners/:id`, `/admin/courses`, `/profile`
- **Protected Routes:** Login dialog for studio/workflow/server/admin/my-courses
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
| Profile Edit | ✅ Complete | ProfilePage.tsx, ProfileEditModal.tsx | Full profile editing with avatar, bio, skills, works, attachments |
| Image Compression | ✅ Complete | imageCompression.ts, cloudinaryService.ts | Auto-compress based on upload type (avatar, featured_work, logo, attachment) |
| Modular i18n | ✅ Complete | i18n/locales/* | Split translations into 10 modules per language |
| Wallet View | ✅ Complete | WalletView.tsx, paymentService.ts | Credit packages, VietQR, payment history |
| Admin Page | ✅ Complete | AdminPage.tsx, adminService.ts | Users, transactions, webhook management |
| Payment System | ✅ Complete | paymentService.ts | Create, confirm, cancel payments with Casso webhook |
| Share Prompts | ✅ Complete | PromptsView.tsx, PromptCard.tsx, PromptFormModal.tsx, PromptDetailModal.tsx, promptService.ts | Multi-prompt support, like, bookmark, rate, comments |
| Resource Hub | ✅ Complete | ResourcesView.tsx, ResourceCard.tsx, ResourceFormModal.tsx, ResourceDetailModal.tsx, resourceService.ts | File upload (50MB), download, like, bookmark, rate |
| Course Enrollment | ✅ Complete | CoursePage.tsx, courseService.ts | Enroll, track progress, resume learning |
| My Courses Page | ✅ Complete | MyCoursesPage.tsx | Enrolled courses list with progress, filters |
| Video Player | ✅ Complete | CoursePage.tsx | Native video + YouTube IFrame API, skip ±10s |
| Lesson Progress | ✅ Complete | CoursePage.tsx | Mark complete, auto-track video progress |
| Course Reviews | ✅ Complete | CoursePage.tsx, courseService.ts | Rating 1-5, comments, helpful votes |
| Lesson Documents | ✅ Complete | ModuleEditor.tsx, CoursePage.tsx | Upload/download lesson documents |

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
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for image upload
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset (unsigned)

### Production URLs:
- **Frontend:** https://alphastudio.vercel.app
- **Backend:** https://alpha-studio-backend.onrender.com/api

---

## 7. Recent Changes (Last 3 Sessions)

1. **2026-01-24** - Course Learning System & Video Player
   - Created MyCoursesPage.tsx - enrolled courses list with progress, filters (all/active/completed), stats
   - Major CoursePage.tsx rewrite:
     - Course enrollment system with API integration
     - Video player supporting native video, YouTube (IFrame API), Vimeo
     - Lesson selection with progress tracking
     - Completed lesson indicators (checkmark)
     - Auto-select last accessed lesson on return
     - Documents section per lesson with download
     - Reviews system with rating distribution, write/view reviews
     - +10s/-10s skip buttons (floating overlay + control bar) for native & YouTube
   - Updated ModuleEditor.tsx:
     - Video URL input OR Cloudinary upload per lesson
     - Document upload per lesson (multiple files)
   - Updated courseService.ts:
     - Added enrollment APIs (check, enroll, progress, update)
     - Added review APIs (list, create, my-review, helpful)
     - Added LessonDocument, Enrollment, Review types
   - Updated translations (vi/en): course.viewReviews, myCourses.*
   - Updated Layout.tsx: Added My Courses link in user dropdown
   - Fixed YouTube video seek: implemented YouTube IFrame Player API for skip controls
   - Fixed review statistics: proper ObjectId conversion in MongoDB aggregation

2. **2026-01-23** - Share Prompts & Resource Hub
   - Created Share Prompts system in WorkflowDashboard
     - PromptsView.tsx - listing with filters (category, platform), search, pagination
     - PromptCard.tsx - card with thumbnail, rating, like/bookmark buttons
     - PromptFormModal.tsx - create/edit with multiple prompt contents support
     - PromptDetailModal.tsx - detail view with copy, comments, rating
     - promptService.ts - full API service (CRUD, like, bookmark, download, rate)
   - Created Resource Hub system
     - ResourcesView.tsx - listing with filters (resource type), search, pagination
     - ResourceCard.tsx - card with file info, download button
     - ResourceFormModal.tsx - create/edit with file upload (50MB limit)
     - ResourceDetailModal.tsx - detail view with download, comments
     - resourceService.ts - full API service (CRUD, like, bookmark, download, rate)
   - Features: Categories (image-gen, text-gen, code, workflow), Platforms (Midjourney, SD, DALLE, ComfyUI, ChatGPT, Claude)
   - Resource types: template, dataset, design-asset, project-file, 3d-model, font
   - Shared components: LikeButton, BookmarkButton, RatingStars, CommentSection, ImageLightbox
   - Fixed: whitespace-pre-line for description newlines display

3. **2026-01-22** - Payment System, Wallet View, Admin Page
   - Created WalletView.tsx - credit packages with VietQR payment, QR code modal, payment history
   - Credit packages: 10k=10, 100k=100, 200k=210(+5%), 500k=550(+10%), 1M=1120(+12%)
   - Bank: OCB, Account: CASS55252503, Holder: NGUYEN ANH DUC
   - Created paymentService.ts - API service for create, confirm, cancel, history, status
   - Created AdminPage.tsx - admin management with 3 tabs: Users, Transactions, Webhooks
   - Created adminService.ts - API service for admin operations
   - Admin can: search users, view transaction history, manual top-up, assign webhooks to users
   - Transaction statuses: pending, completed, failed, cancelled, timeout
   - Webhook assignment: admin can assign unmatched webhooks to users (auto-credits)
   - Replaced emoji icons with SVG icons in WalletView and WorkflowDashboard sidebar
   - Added /admin route in App.tsx

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
