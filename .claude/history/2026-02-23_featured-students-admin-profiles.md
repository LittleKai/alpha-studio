# 2026-02-23 — Featured Students Admin + User Profile Pages

## Changes Made

### New Pages
- `src/pages/ProfileViewPage.tsx` — Current user's profile at `/profile/view` (read-only, fetches fresh data via `refreshUser()`)
- `src/pages/UserProfilePage.tsx` — Any user's public profile at `/users/:id` (fetches via `GET /api/workflow/users/:id`)

### Modified Pages
- `src/pages/ProfilePage.tsx` — Added "View Profile" button linking to `/profile/view`
- `src/pages/LandingPage.tsx`:
  - Removed static `featuredStudents` array (6 hardcoded entries)
  - Added import `getFeaturedStudents` from `featuredStudentsService`
  - Added state: `featuredStudents`, `studentsLoading`
  - Added `useEffect` to fetch from `GET /api/featured-students` on mount
  - Updated card links: `/students/${id}` → `/users/${id}`
  - Added loading spinner while fetching
  - Added fallback for missing `work`/`image` (gradient bg / initial letter)
- `src/pages/AdminPage.tsx` — Added 3rd top-tab "Community" with Featured Students sub-tab

### New Components
- `src/components/admin/FeaturedStudentsAdminTab.tsx` — Admin UI:
  - Debounced user search with dropdown
  - Ordered list with drag-and-drop reorder (HTML5 native API)
  - Inline label input (save on blur)
  - Hired toggle button
  - Remove button
  - Auto-saves order after drag

### New Services
- `src/services/featuredStudentsService.ts` — All API calls:
  - `getFeaturedStudents()` — public
  - `getAdminFeaturedStudents()` — admin
  - `addFeaturedStudent(userId)`
  - `updateFeaturedStudent(userId, { label?, hired? })`
  - `reorderFeaturedStudents(orderedIds)`
  - `removeFeaturedStudent(userId)`

### i18n Updates
- `src/i18n/locales/vi/admin.ts` — Added `tabs.community`, new `community` section
- `src/i18n/locales/en/admin.ts` — Same keys in English
- `src/i18n/locales/vi/common.ts` — Added `profile.viewProfile`, `profile.memberSince`, `profile.download`, `profile.noBio`
- `src/i18n/locales/en/common.ts` — Same keys
- `src/i18n/locales/en/entities.ts` — `backgroundImage: "Background Image"` → `"Cover Image"`

### Routing (App.tsx)
- Added `/profile/view` → `ProfileViewPage` (ProtectedRoute)
- Added `/users/:id` → `UserProfilePage` (public)

## Bug Fixes
- Back button in ProfileViewPage: `navigate(-1)` → `navigate('/profile')` (works when accessed directly)
- WorkflowDashboard team tab: `/students/${id}` → `/users/${id}` (StudentPage used static data)
- stale auth data in ProfileViewPage: calls `refreshUser()` on mount
