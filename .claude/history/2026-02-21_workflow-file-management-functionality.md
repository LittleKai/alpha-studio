# 2026-02-21 - WorkflowDashboard FILE MANAGEMENT Full Functionality

## Summary
Implemented full functionality for FILE MANAGEMENT sections (All Documents, Team Creative, Event Planner, Production) in WorkflowDashboard. Added file status change (approve/reject/reset), file delete with confirm, and a slide-in comment panel for each document.

## Files Modified

### `src/i18n/locales/vi/workflow.ts`
Added `workflow.dashboard.docPanel` object:
- `comments`: "Bình luận"
- `noComments`: "Chưa có bình luận nào."
- `placeholder`: "Thêm bình luận..."
- `send`: "Gửi"
- `approve`: "Duyệt"
- `reject`: "Từ chối"
- `resetPending`: "Đặt lại"
- `delete`: "Xóa File"
- `confirmDelete`: "Xóa file này vĩnh viễn?"

### `src/i18n/locales/en/workflow.ts`
Same structure, English values:
- `approve`: "Approve", `reject`: "Reject", `resetPending`: "Reset", etc.

### `src/components/dashboard/WorkflowDashboard.tsx`

**State changes:**
- Replaced dead `_activeDocForChat`/`_chatMessage`/`_setChatMessage` with:
  - `activeDocForComment: WorkflowDocument | null` — currently open file for comment panel
  - `docComment: string` — comment input text

**New handlers:**
- `handleChangeDocStatus(docId, newStatus)`: updates doc status in `internalDocuments` + syncs `activeDocForComment`
- `handleDeleteDoc(docId)`: confirm → filter from `internalDocuments`, close panel if same doc
- `handleAddDocComment(e)`: appends `Comment` to `internalDocuments[doc].comments` + `activeDocForComment`
- `handleOpenChat(doc)` → now sets `activeDocForComment` (previously set dead `_activeDocForChat`)

**Document table action column (default view):**
Replaced useless 3-dots button with functional buttons:
- 💬 Chat icon → opens comment panel (all docs)
- ✓ Approve button (green) → shown when `doc.status === 'pending'` and `!doc.isProject`
- ✗ Reject button (red) → shown when `doc.status === 'pending'` and `!doc.isProject`
- ↺ Reset button (yellow) → shown when `doc.status !== 'pending'` and `!doc.isProject`
- 🗑 Delete button → shown for all non-project docs

**File Comment Panel (slide-in right side):**
Fixed-position `w-80` panel on the right when `activeDocForComment` is set:
- Header: file name + status badge + size + close button
- Status action bar: Approve/Reject (if pending) or Reset (if approved/rejected)
- Comments list: scrollable, shows author + timestamp + text per comment
- Comment input form: text input + Post button

## Features Added
- ✅ Approve file (pending → approved)
- ✅ Reject file (pending → rejected)
- ✅ Reset file status (approved/rejected → pending)
- ✅ Delete file with confirmation (non-project files only)
- ✅ View & add comments per file in slide-in panel
- ✅ Status change reflected immediately in both table row badge and panel header
