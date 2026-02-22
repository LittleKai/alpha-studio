# 2026-02-22 — Workflow: Project Visibility, Dept Filter, TinyMCE, File Note, Package Permission

## Summary
7 features added to WorkflowDashboard project system.

---

## Backend Changes

### `server/models/WorkflowDocument.js`
- Added `note: { type: String, default: '' }` field — file note by uploader

### `server/routes/workflow.js`
- **GET /projects**: Changed visibility logic:
  - Admin → sees all projects
  - Others → all non-completed projects + own/member completed projects
- **DELETE /projects**: Now admin-only + requires `status === 'completed'` (cannot delete planning)
- **GET /documents**: When `?projectId` provided:
  - Checks if user is member/admin, then returns ALL docs for that project (was filtering by createdBy before)
  - No projectId → own docs only (unchanged)
- **PUT /documents**: Added `note` to allowed update fields; updated auth to also allow project creator/manager

---

## Frontend Changes

### `src/types.ts`
- `Project`: added `createdBy?: string` (for isProjectCreator fallback)
- `WorkflowDocument`: added `note?: string`

### `src/services/workflowService.ts`
- `WorkflowDocumentInput`: added `note?: string`

### `src/components/dashboard/WorkflowDashboard.tsx`

**Imports added:**
- `deleteProject as deleteProjectAPI` from workflowService
- `Editor` from `@tinymce/tinymce-react`

**State added:**
- `projectDeptFilter: DepartmentType` — filter for project list
- `editProjectData.department` — now includes dept (was only name/desc/avatar)

**isProjectCreator() fix:**
- Added check: `selectedProject.createdBy === user._id` as fallback (fixes for old projects without projectRole in team)

**New helpers/handlers:**
- `handleDeleteProject(projectId)` — admin only, deletes completed project, confirm dialog
- `handleUpdateDocNote(docId, note)` — updates note on a file (uploader only)
- `DEPT_OPTIONS` constant (array) — for filter buttons
- `filteredProjects` — projects filtered by dept

**New useEffect:**
- When `selectedProject?.id` changes, calls `getDocuments(projectId)` and merges all project docs into state (so all members see each other's files)

**Updated handlers:**
- `handleOpenEditProject()`: now includes `department`
- `handleSaveEditProject()`: now includes `department` in update payload

**Package button**: Now only shown when `isProjectCreator() && status !== 'completed'` (was: just `status !== 'completed'`)

**Project list UI:**
- Department filter bar above project grid (All / Event Planner / Creative / Operation)
- Each project card shows department badge (icon + label)
- Admin sees delete button (trashcan) on completed project cards on hover

**Files tab UI:**
- File cards now show note field: editable textarea (border-bottom style) for uploader, read-only text for others
- Layout changed to flex-col to accommodate note

**Overview tab:**
- Description now rendered as HTML (`dangerouslySetInnerHTML`) to support TinyMCE output

**Edit Project Modal:**
- Wider (max-w-2xl)
- Added department selector
- Replaced textarea description with TinyMCE Editor (skin: oxide-dark, content_css: dark)
- `tinymceScriptSrc="/tinymce/tinymce.min.js"` (self-hosted, from public/tinymce)

### `src/i18n/locales/vi/workflow.ts`
- Added `project.confirmDelete`, `project.deptFilter`
- Updated `project.filesPanel`: removed `assignTask`, `open`; added `notePlaceholder`

### `src/i18n/locales/en/workflow.ts`
- Same keys, English translations
