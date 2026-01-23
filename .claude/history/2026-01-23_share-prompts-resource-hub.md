# Change Log: 2026-01-23

## Session Info
- **Duration:** ~90 minutes
- **Request:** "Share Prompts & Resource Hub feature implementation and bug fixes"
- **Files Modified:** 6
- **Files Created:** 12

---

## Changes Made

### Share Prompts System
**What changed:**
- Created complete prompt sharing system in WorkflowDashboard
- Users can create, share, and discover AI prompts
- Support for multiple prompt contents (Prompt 1, 2, 3...)

**Features:**
- Categories: image-generation, text-generation, code, workflow, other
- Platforms: Midjourney, Stable Diffusion, DALL-E, ComfyUI, ChatGPT, Claude
- Multiple prompt contents with labels
- Example images (input/output)
- Notes field for additional instructions
- Tags for discovery
- Like, bookmark, download tracking
- 1-5 star rating system
- Comments section
- Featured prompts
- Moderation (hide/unhide)

**Files Created:**
- `src/components/dashboard/views/PromptsView.tsx` - Prompt listing with filters
- `src/components/cards/PromptCard.tsx` - Prompt card component
- `src/components/modals/PromptFormModal.tsx` - Create/edit prompt modal
- `src/components/modals/PromptDetailModal.tsx` - Prompt detail modal
- `src/services/promptService.ts` - Prompt API service

### Resource Hub System
**What changed:**
- Created complete resource sharing system
- Users can upload and share files (templates, datasets, 3D models, fonts, etc.)

**Features:**
- Resource types: template, dataset, design-asset, project-file, 3d-model, font, other
- File upload with 50MB limit
- Thumbnail and preview images
- Compatible software tags
- Download tracking with file URL
- Same engagement system as prompts (like, bookmark, rate, comments)

**Files Created:**
- `src/components/dashboard/views/ResourcesView.tsx` - Resource listing with filters
- `src/components/cards/ResourceCard.tsx` - Resource card component
- `src/components/modals/ResourceFormModal.tsx` - Create/edit resource modal
- `src/components/modals/ResourceDetailModal.tsx` - Resource detail modal
- `src/services/resourceService.ts` - Resource API service

### Shared Components
**Files Created:**
- `src/components/shared/LikeButton.tsx` - Reusable like button
- `src/components/shared/BookmarkButton.tsx` - Reusable bookmark button
- `src/components/shared/RatingStars.tsx` - Interactive star rating
- `src/components/shared/CommentSection.tsx` - Comments with replies
- `src/components/shared/ImageLightbox.tsx` - Image gallery lightbox

---

## Bug Fixes

### 1. Newline Display Issue
**Problem:** Text with newlines in description/notes not displaying line breaks
**Solution:** Added `whitespace-pre-wrap` and `whitespace-pre-line` classes

**Files Modified:**
- `src/components/modals/PromptDetailModal.tsx` - Added whitespace-pre-wrap to description
- `src/components/modals/ResourceDetailModal.tsx` - Added whitespace-pre-wrap to description
- `src/components/cards/PromptCard.tsx` - Added whitespace-pre-line to description
- `src/components/cards/ResourceCard.tsx` - Added whitespace-pre-line to description

### 2. "Prompt content is required" Error
**Problem:** Creating prompts with multiple contents failed validation
**Root Cause:** Backend only checked `promptContent` (legacy), not `promptContents` (new array)

**Solution:** Updated backend routes to support both formats

**Files Modified (Backend):**
- `server/routes/prompts.js`:
  - POST `/api/prompts`: Added `promptContents` and `notes` to destructuring
  - Validation now checks for either `promptContent` OR `promptContents` with content
  - Model creation includes `promptContents` and `notes`
  - PUT `/api/prompts/:id`: Added `promptContents` and `notes` update support
  - GET search: Added `promptContents.content` to search regex
  - POST download: Returns `promptContents` in response

**Code Changes:**
```javascript
// Before (broken)
if (!promptContent) {
    return res.status(400).json({ message: 'Prompt content is required' });
}

// After (fixed)
const hasPromptContent = promptContent && promptContent.trim() !== '';
const hasPromptContents = promptContents && Array.isArray(promptContents) &&
    promptContents.some(p => p.content && p.content.trim() !== '');

if (!hasPromptContent && !hasPromptContents) {
    return res.status(400).json({ message: 'Prompt content is required' });
}
```

---

## Backend API Structure

### Prompt Model Schema
```javascript
{
  slug: String,
  title: { vi: String, en: String },
  description: { vi: String, en: String },
  promptContents: [{ label: String, content: String }],  // NEW
  promptContent: String,  // Legacy
  notes: String,  // NEW
  category: String,
  platform: String,
  exampleImages: [{ type, url, publicId, caption }],
  tags: [String],
  author: ObjectId,
  likes: [ObjectId],
  bookmarks: [ObjectId],
  ratings: [{ user, score, ratedAt }],
  rating: { average: Number, count: Number },
  status: String,
  isFeatured: Boolean
}
```

### Resource Model Schema
```javascript
{
  slug: String,
  title: { vi: String, en: String },
  description: { vi: String, en: String },
  resourceType: String,
  file: { url, publicId, filename, format, size, mimeType },
  thumbnail: { url, publicId },
  previewImages: [{ url, publicId, caption }],
  tags: [String],
  compatibleSoftware: [String],
  author: ObjectId,
  // Same engagement fields as Prompt
}
```

---

## Testing
- [x] Create prompt with single content - Works
- [x] Create prompt with multiple contents - Works (after fix)
- [x] Edit prompt - Works
- [x] Description newlines display - Works (after fix)
- [x] Like/bookmark/rate - Works
- [x] Search prompts - Works
- [x] Create resource with file - Works
- [x] Download resource - Works

---

## Updated Documentation
- [x] Frontend PROJECT_SUMMARY.md - Added Share Prompts & Resource Hub
- [x] Backend PROJECT_SUMMARY.md - Added APIs, models, routes
- [x] Created this history file

---

## Notes for Next Session
- Consider adding drag-and-drop for file uploads
- Consider adding bulk prompt import/export
- Consider adding prompt collections/folders
- Consider adding resource versioning
- Add i18n translations for new features (workflow.ts)

---

## Related Files
Frontend:
- `src/components/dashboard/views/PromptsView.tsx`
- `src/components/dashboard/views/ResourcesView.tsx`
- `src/components/cards/PromptCard.tsx`
- `src/components/cards/ResourceCard.tsx`
- `src/components/modals/PromptFormModal.tsx`
- `src/components/modals/PromptDetailModal.tsx`
- `src/components/modals/ResourceFormModal.tsx`
- `src/components/modals/ResourceDetailModal.tsx`
- `src/services/promptService.ts`
- `src/services/resourceService.ts`

Backend:
- `server/models/Prompt.js`
- `server/models/Resource.js`
- `server/models/Comment.js`
- `server/routes/prompts.js`
- `server/routes/resources.js`
- `server/routes/comments.js`
