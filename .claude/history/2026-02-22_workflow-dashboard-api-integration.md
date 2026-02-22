# 2026-02-22 — WorkflowDashboard → MongoDB Backend Integration

## Summary
Connected WorkflowDashboard to MongoDB backend. Projects and documents now persist across refreshes. Sidebar simplified (3 dept-filter items removed).

## Files Created

### `src/services/workflowService.ts`
Pattern follows `jobService.ts`. Functions:
- `getProjects()` → `GET /api/workflow/projects`
- `createProject(data)` → `POST /api/workflow/projects`
- `updateProject(id, data)` → `PUT /api/workflow/projects/:id`
- `deleteProject(id)` → `DELETE /api/workflow/projects/:id`
- `getDocuments(projectId?)` → `GET /api/workflow/documents[?projectId=xxx]`
- `createDocument(data)` → `POST /api/workflow/documents`
- `updateDocument(id, data)` → `PUT /api/workflow/documents/:id`
- `deleteDocument(id)` → `DELETE /api/workflow/documents/:id`

Auth: `localStorage.getItem('alpha_studio_token')` → `Authorization: Bearer <token>`

## Files Modified

### `src/types.ts`
- `Project.expenseLog?` added: `{ id: string; name: string; amount: number; date: string }[]`
- `WorkflowDocument.department` changed from required to optional (`department?: DepartmentType`)

### `src/components/dashboard/WorkflowDashboard.tsx`
**State changes:**
- Removed: `internalDocuments`, `internalProjects`, `expenseLog` (separate), `selectedDept`
- Added: `projects`, `documents` (API-backed), `loading`

**Sidebar (FILE MANAGEMENT) simplified:**
- REMOVED: Creative Team (`setSelectedDept('creative')`)
- REMOVED: Event Planner (`setSelectedDept('event_planner')`)
- REMOVED: Production (`setSelectedDept('operation')`)
- KEPT: All Documents, Account (Project Hub)

**Data loading:**
- `useEffect` → `Promise.all([getProjects(), getDocuments()])` on mount

**Optimistic update strategy for all handlers:**
| Handler | API Call |
|---------|----------|
| handleCreateProject | createProjectAPI → replaces tempId with MongoDB _id |
| handleFileUpload | createDocumentAPI → replaces tempId |
| handleChangeDocStatus | updateDocumentAPI({ status }) |
| handleDeleteDoc | deleteDocumentAPI |
| handleAddDocComment | updateDocumentAPI({ comments }) |
| updateProjectTeamAndFinance | updateProjectAPI({ team, expenses, chatHistory }) |
| handleSendProjectMessage | updateProjectAPI({ chatHistory }) |
| handlePackageProject | updateProjectAPI({ status: 'completed' }) |
| handleCreateTask | updateProjectAPI({ tasks, chatHistory }) |
| handleAddExpense | updateProjectAPI({ expenses, expenseLog }) |
| cycleTaskStatus | updateProjectAPI({ tasks }) |
| handleRemoveMember | updateProjectAPI({ team }) |
| handleDeleteTask | updateProjectAPI({ tasks }) |
| handleProgressPointerUp | updateProjectAPI({ progress }) — onPointerUp only |

**expenseLog migration:**
- Moved from separate `Record<projectId, entries[]>` state → `selectedProject.expenseLog`

**Other changes:**
- `filteredDocs`: removed selectedDept filter → searchQuery only
- Removed Studio AI button from document toolbar
- Added `LoadingSpinner` guard for initial load
- Props cleanup: removed `documents`, `onAddDocument`, `onOpenStudio`, `projects`, `setProjects` props
