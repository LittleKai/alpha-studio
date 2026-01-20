# Course Management Integration

**Date:** 2026-01-20
**Author:** Claude Code
**Type:** Feature Integration

---

## Summary

Integrated Course Management API into the frontend Landing Page and created a full Courses Catalog page. Replaced hardcoded course data with dynamic content fetched from the backend API.

---

## Changes Made

### 1. Course Service (`src/services/courseService.ts`)
- Added `getFeaturedCourses(limit)` function to fetch popular courses for landing page
- Service already had complete CRUD functions from previous implementation

### 2. Landing Page (`src/pages/LandingPage.tsx`)
- Replaced hardcoded `courses` array with API data fetched using `getFeaturedCourses(6)`
- Added state management: `courses`, `coursesLoading`, `coursesError`
- Added `useEffect` to fetch courses on component mount
- Added helper functions: `getLocalizedText()`, `formatPrice()`
- Updated course cards to display:
  - Thumbnail image (with gradient fallback)
  - Title (multilingual - vi/en based on current language)
  - Level badge (beginner/intermediate/advanced)
  - Price/finalPrice with discount display
  - Duration in hours
  - Total lessons count
  - Enrollment count
- Added loading, error, and empty states
- Changed "View all courses" link to use React Router `<Link to="/courses">`

### 3. Courses Catalog Page (`src/pages/CoursesPage.tsx`) - NEW FILE
- Full courses catalog with pagination (9 courses per page)
- Filters:
  - Search by title (debounced 300ms)
  - Category filter (ai-basic, ai-advanced, ai-studio, ai-creative)
  - Level filter (beginner, intermediate, advanced)
- Sort options:
  - Newest (-createdAt)
  - Price: Low to High (price)
  - Price: High to Low (-price)
  - Most Popular (-enrolledCount)
- Responsive grid layout (1/2/3 columns)
- Loading, error, and empty states
- Pagination with prev/next buttons

### 4. App Routing (`src/App.tsx`)
- Added lazy import for `CoursesPage`
- Created `CoursesCatalogPage` wrapper component with Layout
- Added route: `/courses` → `<CoursesCatalogPage />`

### 5. i18n Translations
Added translations to all 3 language files:

**English (`src/i18n/en.ts`):**
- `landing.courses.*`: loading, error, noCourses, enrolled, free
- `courseCatalog.*`: Full catalog page translations

**Vietnamese (`src/i18n/vi.ts`):**
- `landing.courses.*`: loading, error, noCourses, enrolled, free
- `courseCatalog.*`: Full catalog page translations

**Chinese (`src/i18n/zh.ts`):**
- `landing.courses.*`: loading, error, noCourses, enrolled, free
- `courseCatalog.*`: Full catalog page translations
- `course.*`: Added missing course detail translations

### 6. Pages Index (`src/pages/index.ts`)
- Added export for `CoursesPage`

---

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/services/courseService.ts` | Modified | Added `getFeaturedCourses()` function |
| `src/pages/LandingPage.tsx` | Modified | Replaced hardcoded courses with API data |
| `src/pages/CoursesPage.tsx` | Created | New courses catalog page |
| `src/pages/index.ts` | Modified | Added CoursesPage export |
| `src/App.tsx` | Modified | Added /courses route |
| `src/i18n/en.ts` | Modified | Added course translations |
| `src/i18n/vi.ts` | Modified | Added course translations |
| `src/i18n/zh.ts` | Modified | Added course translations |
| `.claude/PROJECT_SUMMARY.md` | Modified | Updated documentation |

---

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses?status=published&limit=6&sort=-enrolledCount` | GET | Featured courses for landing |
| `/api/courses?status=published&page=X&limit=9&...` | GET | Paginated courses catalog |

---

## Technical Notes

1. **Language Detection**: Uses `useLanguage()` hook to get current language and displays course title/description in that language
2. **Price Formatting**: Uses `Intl.NumberFormat` with 'vi-VN' locale and VND currency
3. **Debounced Search**: 300ms debounce on search input to avoid excessive API calls
4. **Responsive Design**: Grid adapts from 1 column (mobile) to 3 columns (desktop)
5. **Error Handling**: Displays user-friendly error messages with retry button
6. **Loading States**: Shows spinner while fetching data

---

## Testing Checklist

- [ ] Landing page loads featured courses from API
- [ ] Course cards display correct multilingual content
- [ ] Price displays correctly (with discount if applicable)
- [ ] "View all courses" button navigates to /courses
- [ ] Courses catalog page loads all published courses
- [ ] Search filters courses by title
- [ ] Category filter works correctly
- [ ] Level filter works correctly
- [ ] Sort options work correctly
- [ ] Pagination works correctly
- [ ] Clicking course card navigates to /courses/:slug
- [ ] Loading states display correctly
- [ ] Error states display with retry button
- [ ] Empty state displays when no courses match filters

---

## Related Issues

- Resolves: Hardcoded courses in LandingPage.tsx
- Enables: Dynamic course management through admin panel
