# 2026-01-24: Course Learning System & Video Player

## Summary
Implemented comprehensive course learning system with enrollment, video playback, progress tracking, reviews, and YouTube IFrame Player API integration.

## Changes Made

### New Files
- `src/pages/MyCoursesPage.tsx` - Enrolled courses page with progress tracking, filters (all/active/completed), stats cards

### Major Updates

#### CoursePage.tsx (Complete Rewrite)
- Course enrollment system with API integration
- Video player supporting:
  - Native HTML5 video
  - YouTube embedded videos (via IFrame Player API)
  - Vimeo embedded videos
- Lesson selection with progress tracking
- Completed lesson indicators (green checkmark)
- Auto-select last accessed lesson on return
- Documents section per lesson with download links
- Reviews system:
  - Rating distribution chart (1-5 stars)
  - Write review form
  - Reviews list with helpful votes
  - View Reviews dialog modal
- Skip controls (+10s/-10s):
  - Floating overlay buttons on video (appear on hover)
  - Control bar buttons below video
  - Works with both native video and YouTube

#### ModuleEditor.tsx (Admin Course Editor)
- Video URL input field for lessons
- Cloudinary video upload button
- Document upload per lesson (multiple files)
- Document list with delete functionality

#### courseService.ts
New types:
- `LessonDocument` - document with name, url, type, size
- `Enrollment` - enrollment with course, progress, status
- `EnrollmentProgress` - detailed progress with completed lessons
- `LessonProgress` - individual lesson progress
- `Review` - course review with rating, comment, helpful

New API functions:
- `checkEnrollment(courseId)` - check if enrolled
- `enrollInCourse(courseId)` - enroll in course
- `getEnrollmentProgress(courseId)` - get progress details
- `updateLessonProgress(courseId, data)` - update lesson progress
- `getMyEnrolledCourses()` - get all enrolled courses
- `getCourseReviews(courseId)` - get reviews with distribution
- `createReview(courseId, data)` - create review
- `getMyReview(courseId)` - get user's review
- `markReviewHelpful(reviewId)` - toggle helpful

### Translation Updates
- `src/i18n/locales/en/course.ts` - Added `viewReviews`
- `src/i18n/locales/vi/course.ts` - Added `viewReviews`

### Other Updates
- `Layout.tsx` - Added "My Courses" link in user dropdown menu
- `App.tsx` - Added `/my-courses` route

## Technical Details

### YouTube IFrame Player API Integration
- Loads YouTube IFrame API script dynamically
- Creates YouTube player instance for embedded videos
- Implements `seekTo()` for skip controls
- Handles `onStateChange` for auto-complete on video end
- Proper cleanup on component unmount and lesson change

### TypeScript Declarations
Added global type declarations for YouTube Player API:
```typescript
interface Window {
    YT: {
        Player: new (elementId: string, config: {...}) => YTPlayer;
        PlayerState: { ENDED, PLAYING, PAUSED };
    };
    onYouTubeIframeAPIReady: () => void;
}

interface YTPlayer {
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    playVideo(): void;
    pauseVideo(): void;
    destroy(): void;
}
```

## Bug Fixes
- Fixed video seek bar not clickable (moved controls outside video element)
- Fixed review statistics showing 0 (proper ObjectId conversion in aggregation)
- Fixed skip buttons not working for YouTube (implemented IFrame API)

## Files Changed
1. `src/pages/CoursePage.tsx` - Major rewrite
2. `src/pages/MyCoursesPage.tsx` - New file
3. `src/components/admin/ModuleEditor.tsx` - Video/document upload
4. `src/services/courseService.ts` - New types and API functions
5. `src/i18n/locales/en/course.ts` - New translations
6. `src/i18n/locales/vi/course.ts` - New translations
7. `src/components/layout/Layout.tsx` - My Courses link
8. `src/App.tsx` - New route
