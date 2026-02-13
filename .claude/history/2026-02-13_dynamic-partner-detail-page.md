# 2026-02-13: Dynamic Partner Detail Page (API-powered)

## Summary
Rewrote the partner detail page to fetch data from the API instead of using static hardcoded data. Updated the viewer component to display all new API fields including localized descriptions, key projects with captions, and social links.

## Files Modified

### `src/pages/PartnerPage.tsx`
- Removed static `staticPartners` array and `PartnerCompany` import
- Imported `getPartnerBySlug` from `partnerService` and `Partner` type
- Fetches partner dynamically via `getPartnerBySlug(id)` in a `useEffect`
- Handles loading, error, and not-found states

### `src/components/viewers/PartnerProfileViewer.tsx`
- Changed props from `PartnerCompany` to API `Partner` type
- Field mapping changes:
  - `partner.name` → `partner.companyName`
  - `partner.coverImage` → `partner.backgroundImage`
  - `partner.description` (string) → `partner.description[language]` (localized)
  - `partner.type` → `partner.partnerType` (with i18n label lookup)
  - `partner.location` → `partner.address`
  - `partner.specialties` → `partner.services`
  - `partner.isVerified` → `partner.featured`
  - `partner.contact.email/phone/website` → `partner.email`, `partner.phone`, `partner.website`
  - `partner.projects` (string[]) → `partner.keyProjects` (array with image + localized description)
- Logo now supports image URLs (`<img>`) or emoji/text fallback
- New Key Projects section: shows project image + localized description caption
- New Social Links section: Facebook, LinkedIn, Twitter icons
- Uses `language` from `useTranslation()` to pick localized content

### `src/i18n/locales/en/workflow.ts`
- Added `partners.types.*`: technology, education, enterprise, startup, government, other
- Added `partners.details.socialLinks` and `partners.details.noProjects`

### `src/i18n/locales/vi/workflow.ts`
- Added `partners.types.*`: Corresponding Vietnamese translations
- Added `partners.details.socialLinks` ("Mạng xã hội") and `partners.details.noProjects`

## Breaking Changes
- `PartnerProfileViewer` no longer accepts `PartnerCompany` type — now requires API `Partner` type
- `PartnerPage` no longer has static data — requires backend API to be running

## Notes
- The route param is still called `id` but accepts slugs (e.g., `/partners/visionary-events`)
- The old `PartnerCompany` type in `types.ts` is no longer used by these files but kept for potential other references
