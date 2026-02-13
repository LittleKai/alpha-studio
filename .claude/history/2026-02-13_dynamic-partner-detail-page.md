# 2026-02-13: Dynamic Partner Detail Page + Change Password + Social Links

## Summary
1. Rewrote partner detail page to fetch from API instead of static data
2. Added Change Password section to ProfilePage
3. Replaced Behance with TikTok, added Facebook to social links across all components
4. Fixed whitespace-pre-line for description rendering in 7 components

## Files Modified

### Partner Detail Page
- **`src/pages/PartnerPage.tsx`** - Removed static data, fetches via `getPartnerBySlug()`
- **`src/components/viewers/PartnerProfileViewer.tsx`** - Uses API `Partner` type with localized descriptions, keyProjects, socialLinks

### Change Password
- **`src/pages/ProfilePage.tsx`** - Added collapsible Change Password section with current/new/confirm fields, calls `PUT /auth/password`

### Social Links (Behance → TikTok + Facebook added)
- **`alpha-studio-backend/server/models/User.js`** - socials: `{facebook, linkedin, tiktok, github}`
- **`src/auth/context.tsx`** - Updated User and ProfileUpdateData types
- **`src/types.ts`** - Updated UserProfile and FeaturedStudent socials types
- **`src/pages/ProfilePage.tsx`** - Social links inputs: Facebook, LinkedIn, TikTok, GitHub
- **`src/components/modals/ProfileEditModal.tsx`** - Social links display: Facebook, LinkedIn, TikTok, GitHub
- **`src/components/viewers/StudentProfileViewer.tsx`** - Social icons: Fb, in, Tk
- **`src/components/modals/StudentProfileModal.tsx`** - Social link buttons
- **`src/pages/LandingPage.tsx`** - Static student data updated
- **`src/pages/StudentPage.tsx`** - Static student data updated

### Whitespace fix
- Added `whitespace-pre-line` to description rendering in: PartnerProfileViewer, PartnersView, JobsView, JobCard (admin), StudentProfileViewer, CourseViewer

### i18n
- **`src/i18n/locales/en/common.ts`** - Added `profile.password.*` translations
- **`src/i18n/locales/vi/common.ts`** - Added `profile.password.*` translations
- **`src/i18n/locales/en/workflow.ts`** - Added `partners.types.*`, `details.socialLinks`, `details.noProjects`
- **`src/i18n/locales/vi/workflow.ts`** - Same keys in Vietnamese

## Breaking Changes
- `PartnerProfileViewer` now requires API `Partner` type (not `PartnerCompany`)
- User socials schema changed: `behance` removed, `facebook` and `tiktok` added
