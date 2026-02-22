# 2026-02-23 — ProfileViewPage: User Profile View Page

## Changes Made

### 1. New Page: `src/pages/ProfileViewPage.tsx`
- Route: `/profile/view` (ProtectedRoute)
- Displays the current user's full profile as a polished read-only view
- Layout: cover image → left sidebar (avatar card + socials card) + right content area
- **Cover section:** uses `user.backgroundImage` if set, else purple→blue gradient; back button + "Edit Profile" button overlay
- **Avatar card:** avatar (or initial letter fallback), name, role (mapped to label), email, location, birthDate (if `showBirthDate`), phone, member since (formatted from `createdAt`)
- **Socials card:** Facebook, LinkedIn, GitHub, custom[] links — shown only when at least one exists
- **Right column sections:**
  - Bio — with "no bio" empty state
  - Skills — hidden if empty
  - Featured Works — grid 1-2 cols, image + title + description
  - Attachments — download links with file type emoji + size + download icon
- Helpers: `formatBytes`, `formatDate`, `getRoleLabel`, `getFileIcon`

### 2. Route Added: `src/App.tsx`
- Lazy loaded `ProfileViewPage`
- Added `<Route path="/profile/view">` inside ProtectedRoute

### 3. ProfilePage Header Button: `src/pages/ProfilePage.tsx`
- Added "View Profile" (`EyeIcon`) button next to Save in the header
- Navigates to `/profile/view`
- Label hidden on mobile (`hidden sm:inline`)

### 4. i18n Keys Added
**`src/i18n/locales/vi/common.ts`** and **`src/i18n/locales/en/common.ts`**:
- `profile.viewProfile`: "Xem hồ sơ" / "View Profile"
- `profile.memberSince`: "Thành viên từ" / "Member since"
- `profile.download`: "Tải xuống" / "Download"
- `profile.noBio`: "Chưa có giới thiệu bản thân" / "No bio available"
