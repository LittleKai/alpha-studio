# 2026-02-28 — Studio Auth Gate + Daily Free Limit

## Summary
- `/studio` route is now **public** (removed ProtectedRoute) — anyone can browse tools
- When clicking **Generate**, auth is enforced: unauthenticated users see a login modal
- Logged-in users get **3 free uses per day**, tracked on backend
- Admin/Mod users have **unlimited** access

## Files Changed

### `src/App.tsx`
- Removed `<ProtectedRoute>` from `/studio` route; now directly renders `<StudioPage />`

### `src/components/studio/StudioTool.tsx`
- Added `useAuth()`, `useEffect` imports
- Added `showLoginModal`, `usage`, `limitError` state
- `useEffect` fetches current daily usage on mount (when authenticated)
- `handleGenerate`: checks auth → shows login modal if not logged in; calls `consumeStudioUse()` → shows limit error if 429; proceeds with AI generation after both checks pass
- Added usage counter UI near Generate button (color-coded: normal/yellow-warning/red-limit)
- Added inline login prompt banner for unauthenticated users
- Added `Login` modal rendered when `showLoginModal = true`
- Updated `useCallback` deps to include `isAuthenticated`

### `src/services/studioService.ts` (NEW)
- `getStudioUsage()` → `GET /api/studio/usage`
- `consumeStudioUse()` → `POST /api/studio/use` (throws with `.limitReached = true` on 429)

### `src/i18n/locales/vi/app.ts` + `en/app.ts`
- Added `studio.loginRequired`, `studio.loginRequiredDesc`
- Added `studio.dailyLimitReached`, `studio.dailyLimitDesc`
- Added `studio.usageCounter` (template with `{{used}}/{{limit}}`)
- Added `studio.newTransformation`
