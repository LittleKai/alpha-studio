# 2026-02-22 — CoursePage: Multiple Instructors, i18n, Resume Video, Remove Review Button

## Changes Made

### 1. Remove "Xem đánh giá" button
- **File**: `src/pages/CoursePage.tsx`
- Removed the "View Reviews" button from the sidebar since a "reviews" tab already exists in the main content area
- `showReviewsDialog` state and dialog component retained (still used internally for potential future use)

### 2. Multiple Instructors + i18n in CourseForm
- **File**: `src/components/admin/CourseForm.tsx`
- Added `InstructorFormState` interface: `{ name, avatar, bioVi, bioEn }`
- Replaced `instructorName`, `instructorAvatar`, `instructorBio` + `uploadingAvatar` states with `instructors: InstructorFormState[]` + `uploadingAvatarIdx`
- New handlers: `handleAddInstructor`, `handleRemoveInstructor`, `handleUpdateInstructor`, `handleInstructorAvatarUpload(idx)`
- Form UI: list of instructor cards with add/remove, per-instructor avatar upload, bio textarea responds to vi/en language tab
- Submit: sends both `instructor` (first, for backward compat) and `instructors[]` array

### 3. Instructor display in CoursePage
- **File**: `src/pages/CoursePage.tsx`
- Instructor card now displays from `course.instructors[]` (falls back to `course.instructor` for old data)
- Label "Instructor" → `t('course.instructor')` / `t('course.instructors')` based on count
- Bio handles both `string` (old data) and `{ vi, en }` object (new data)

### 4. Resume Video Button
- **File**: `src/pages/CoursePage.tsx`
- Added `currentLessonLastPosition` (useMemo): finds `lastPosition` from `enrollmentProgress.completedLessons`
- Added `handleResumeVideo`: seeks native video or YouTube player to `lastPosition`
- Added `formatTime(seconds)` helper: formats as `M:SS`
- Resume button added to Video Controls Bar (inside `.glass-card.rounded-xl.px-4.py-3`)
  - Shows only when: enrolled + `currentLessonLastPosition > 5` + video lesson
  - Displays formatted timestamp as button label

### 5. Type Updates
- **File**: `src/services/courseService.ts`
  - `Instructor.bio`: `string` → `string | LocalizedString`
  - `Course`: added `instructors?: Instructor[]`
  - `CourseInput`: added `instructors?: Instructor[]`

### 6. i18n
- **Files**: `src/i18n/locales/vi/course.ts`, `src/i18n/locales/en/course.ts`
- Added: `course.instructor`, `course.instructors`, `course.addInstructor`, `course.resumeFrom`

## Backend Note
To persist multiple instructors and bilingual bio fully, the backend Course model needs:
- Add `instructors: [{ name, avatar, bio: { vi, en } }]` field
- Accept both `instructor` and `instructors` in PUT /api/courses/:id
