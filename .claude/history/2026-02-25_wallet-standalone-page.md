# 2026-02-25 — Wallet Standalone Page + Course Top-up Link

## Summary
Moved the Credit Wallet from the WorkflowDashboard sidebar into a dedicated `/wallet` route with the standard Layout header (same nav as the landing page). Also added a direct link to the wallet page in the course "Insufficient Credits" notification.

## Files Changed

### New Files
- `src/pages/WalletPage.tsx` — New page with Layout header section (icon, title, current balance); wraps `WalletView` inside the full-page container

### Modified Files
- `src/App.tsx`
  - Lazy import `WalletPage`
  - Added `WalletPageWrapper` component (uses `<Layout>`)
  - Added `/wallet` protected route

- `src/components/layout/Layout.tsx`
  - Added `isWalletPage` active state detection
  - Credits balance chip in account dropdown is now a `<Link to="/wallet">` with active highlight

- `src/components/dashboard/WorkflowDashboard.tsx`
  - Wallet sidebar button now calls `navigate('/wallet')` instead of `setActiveView('wallet')`
  - Added external-link icon to wallet sidebar button
  - Removed `'wallet'` from `activeView` union type
  - Removed `WalletView` import (no longer used here)
  - Removed `case 'wallet'` from `renderContent()`

- `src/pages/CoursePage.tsx`
  - Added `Link` import from react-router-dom
  - Insufficient credits paragraph now renders `<Link to="/wallet">` with `t('course.topUpLink')`

- `src/i18n/locales/vi/course.ts`
  - `insufficientCredits` → "Không đủ Credits."
  - Added `topUpLink: "Nạp thêm tại đây →"`

- `src/i18n/locales/en/course.ts`
  - `insufficientCredits` → "Insufficient Credits."
  - Added `topUpLink: "Top up here →"`

## User Flow
- `/wallet` — Accessible from: Layout Credits chip (account dropdown), WorkflowDashboard sidebar button, CoursePage insufficient credits link
- All `/wallet` access requires login (ProtectedRoute)
