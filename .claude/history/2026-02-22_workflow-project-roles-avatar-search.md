# 2026-02-22 — Workflow: Project Roles, Avatar, Member Search, Task Permissions

## Summary
5 features added to WorkflowDashboard project management:
1. Real user search for Add Member (replaces hardcoded mock list)
2. Team member cards show real avatar images from DB
3. Task assignment only shows project team members
4. Project member roles (creator/manager vs regular)
5. Edit project (name, description, avatar image)

---

## Backend Changes

### `server/models/WorkflowProject.js`
- Added `projectRole: { type: String, default: '' }` to `teamMemberSchema`
- Added `avatar: { type: String, default: '' }` to main schema

### `server/routes/workflow.js`
- Added `import User from '../models/User.js'`
- Added `GET /api/workflow/users/search?q=xxx` endpoint:
  - Searches by name or email (case-insensitive regex)
  - Excludes self (`$ne: req.user._id`)
  - Returns `{ id, name, avatar, role, email, isExternal: false }`
  - Limited to 10 results
- Added `avatar` to PUT /projects allowed fields
- Updated `DELETE /documents/:id` to allow project creator/manager to delete:
  - Looks up project by `doc.projectId`
  - Checks if user is a team member with `projectRole === 'creator'` or `'manager'`

---

## Frontend Changes

### `src/types.ts`
- `TeamMember`: added `projectRole?: string`
- `Project`: added `avatar?: string`
- `WorkflowDocument`: added `createdBy?: string`

### `src/services/workflowService.ts`
- Added `WorkflowUserResult` interface
- Added `searchUsers(q: string)` → `GET /api/workflow/users/search?q=xxx`
- Added `avatar?` to `WorkflowProjectInput`

### `src/components/dashboard/WorkflowDashboard.tsx`

**Imports added:**
- `searchUsers` from workflowService
- `uploadToCloudinary` from cloudinaryService

**State added:**
- `userSearchQuery`, `userSearchResults`, `userSearchLoading` — real-time user search
- `showEditProjectModal`, `editProjectData`, `editProjectUploading` — edit project modal

**Removed:**
- Hardcoded `availableUsers` array (replaced by real DB search)

**New helpers:**
- `isProjectManagerOrCreator()` → checks if current user has `projectRole === 'creator'` or `'manager'` in selectedProject
- `canDeleteDoc(doc)` → admin/mod, project manager/creator, or own file (by `createdBy`)

**New handlers:**
- `handleUserSearch(q)` → calls `searchUsers`, updates `userSearchResults`
- `handleUpdateMemberRole(memberId, role)` → inline role edit; 'creator' input redirected to 'manager'
- `handleOpenEditProject()` → sets edit modal state
- `handleEditProjectAvatarUpload(e)` → uploads to Cloudinary, stores URL in editProjectData
- `handleSaveEditProject()` → calls `updateProjectAPI({ name, description, avatar })`

**Updated handlers:**
- `handleCreateProject`: creator gets `projectRole: 'creator'`, uses real user avatar
- `handleCreateTask`: finds assignee from `selectedProject.team` (not availableUsers)
- `updateProjectTeamAndFinance`: clears search state on member add

**UI changes:**
- **Team panel**: Add Member button only shows for creator/manager; member cards show avatar, role badge (👑 Creator / ⭐ Manager / custom), inline role edit input (hidden for creator); Remove button only for creator/manager
- **Team add panel**: Real search input (debounced by 2-char minimum); shows avatar + name + role from DB results
- **Files tab**: Delete button per file (conditional on `canDeleteDoc`); Assign Task button only for manager/creator
- **Project header**: Shows avatar if set; Edit button (pencil icon) for creator/manager; avatar shown as img or emoji fallback
- **Project cards**: Avatar image replaces emoji icon when set
- **Task modal**: Assignee dropdown lists `selectedProject.team` members (not mock users)
- **Edit project modal**: Name + description inputs + Cloudinary avatar upload

**i18n added** (`vi/workflow.ts` + `en/workflow.ts`):
- `workflow.dashboard.project.edit` — "Chỉnh sửa dự án" / "Edit Project"
- `workflow.dashboard.project.editAvatar` — "Ảnh đại diện dự án" / "Project Avatar"
