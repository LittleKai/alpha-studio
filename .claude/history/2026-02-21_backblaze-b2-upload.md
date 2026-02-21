# 2026-02-21 - Backblaze B2 Video & File Upload

## Summary
Replaced Cloudinary video/file upload with Backblaze B2 via presigned URLs in ModuleEditor and ResourceFormModal. Images (thumbnails, avatars, logos) continue to use Cloudinary unchanged.

## Upload Flow
```
1. Frontend → POST /api/upload/presign  { filename, contentType, folder }
2. Backend  → returns { presignedUrl, publicUrl, fileKey }
3. Frontend → XHR PUT file directly to presignedUrl (has progress)
4. Frontend → saves publicUrl to state
```

## Changed Files

### New Files
- `src/services/b2StorageService.ts`
  - `uploadToB2(file, folder, token, onProgress?)` → `{ url, key }`
  - Uses XHR for upload-progress tracking
  - Step 1: POST /api/upload/presign with auth token
  - Step 2: XHR PUT to presignedUrl

### Modified Files
- `src/components/admin/ModuleEditor.tsx`
  - Replaced `uploadToCloudinary` import with `uploadToB2` + `useAuth`
  - `handleVideoUpload`: now calls `uploadToB2(file, 'courses/videos', token, setVideoProgress)`
  - `handleDocumentUpload`: now calls `uploadToB2(file, 'courses/documents', token, setDocProgress)`
  - Added `videoProgress` state + progress bar UI below upload button

- `src/components/modals/ResourceFormModal.tsx`
  - Replaced `uploadFile` (Cloudinary) import with `uploadToB2` + `useAuth`
  - `handleFileUpload`: now calls `uploadToB2(file, 'resources', token, setUploadProgress)`
  - Image uploads (thumbnail, preview) still use `uploadImage` from cloudinaryService (unchanged)

## What Stays on Cloudinary
- Course thumbnails (CourseForm)
- Articles images (TinyMCE + ArticlesAdminTab)
- Partner logos (PartnerForm)
- User avatars, attachments, featured works (ProfilePage)
- Resource thumbnail & preview images (ResourceFormModal)
- All usage of ImageUploader, UploaderBox, MultiImageUploader

## Environment Variables Needed (Frontend)
No new frontend env vars needed — B2 presign goes through backend.
Backend env vars: `B2_ENDPOINT`, `B2_REGION`, `B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`, `B2_BUCKET_NAME`, `CDN_BASE_URL`

## Notes
- Video player in CoursePage already supports any HTTP URL — no changes needed
- B2 URL format: `https://f004.backblazeb2.com/file/{bucket}/{key}`
- Future: change `CDN_BASE_URL` in backend .env to Cloudflare → all new URLs use CDN automatically
