# Course Free Preview Modules Feature
**Date:** 2026-02-22
**Type:** New Feature

## Summary
Added `freePreviewCount` feature for paid courses — admin can set how many modules (from the first) unenrolled users can preview for free.

## Files Changed

### Backend
- `alpha-studio-backend/server/models/Course.js`
  - Added `freePreviewCount: { type: Number, default: 0, min: 0 }` to courseSchema

### Frontend
- `src/services/courseService.ts`
  - Added `freePreviewCount: number` to `Course` interface
  - Added `freePreviewCount?: number` to `CourseInput` interface

- `src/components/admin/CourseForm.tsx`
  - Added `freePreviewCount` state (initialized from course data)
  - Added UI field in pricing section (only shown when price > 0)
  - Included `freePreviewCount` in form submission data (resets to 0 for free courses)

- `src/pages/CoursePage.tsx`
  - Added `isModuleFreePreview(moduleIdx)` useCallback helper
  - Added `isSelectedLessonFreePreview()` useCallback helper
  - Updated `handleSelectLesson` to allow access for free preview modules
  - Updated video player condition to show video for free preview lessons
  - Updated video controls bar condition
  - Updated syllabus module headers: shows "Xem thử"/"Free Preview" badge (green) for preview modules
  - Updated lesson rows: free preview lessons are clickable with ▶ indicator instead of lock icon
  - Documents section: only shows for enrolled users (not free preview)

- `src/i18n/locales/vi/course.ts` — Added `course.freePreviewBadge: "Xem thử"`
- `src/i18n/locales/en/course.ts` — Added `course.freePreviewBadge: "Free Preview"`
- `src/i18n/locales/vi/admin.ts` — Added `freePreviewCount`, `freePreviewCountHint` keys
- `src/i18n/locales/en/admin.ts` — Added `freePreviewCount`, `freePreviewCountHint` keys

## Behavior
- Free courses (`price === 0`): `freePreviewCount` has no effect (always fully accessible)
- Paid courses + `freePreviewCount = 0` (default): all modules locked for unenrolled users (existing behavior)
- Paid courses + `freePreviewCount = N`: first N modules are freely accessible — clickable lessons, video plays, no documents
- Admin form: field only visible in pricing section when price > 0
