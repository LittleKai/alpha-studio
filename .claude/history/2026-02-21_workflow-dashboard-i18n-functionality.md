# 2026-02-21 - WorkflowDashboard i18n + Full Functionality

## Summary
Added complete i18n support for all hardcoded English strings in WorkflowDashboard.tsx (Event Planner, Account/Project Hub, Affiliate views), and implemented full functionality for Account section features.

## Files Modified

### `src/i18n/locales/vi/workflow.ts`
Added new keys:
- `workflow.dashboard.documentsFound`: "tài liệu"
- `workflow.dashboard.project.backToProjects`: "← Về danh sách"
- `workflow.dashboard.project.overview`: `{ quickStats, files, members }`
- `workflow.dashboard.project.teamPanel`: `{ title, selectToAdd, external }`
- `workflow.dashboard.project.filesPanel`: `{ title, upload, assignTask, open, noFiles }`
- `workflow.dashboard.project.finance.add`: "Thêm"
- `workflow.dashboard.project.modal`: `{ client, budget }`
- `workflow.dashboard.project.tasks.dueLabel`: "Hạn"
- `workflow.dashboard.project.tasks.modal.selectAssignee`: "Chọn người thực hiện"
- `workflow.dashboard.project.tasks.modal.attached`: "Đính kèm:"
- `workflow.dashboard.project.tasks.modal.fillRequired`: "Vui lòng điền đủ thông tin nhiệm vụ."
- `workflow.affiliate.coins`: "Coin"

### `src/i18n/locales/en/workflow.ts`
Same keys with English values.

### `src/components/dashboard/WorkflowDashboard.tsx`
**i18n Replacements:**
- `← Back to Projects` → `t('workflow.dashboard.project.backToProjects')`
- `Description` → `t('workflow.description')`
- `Progress` (2x) → `t('workflow.progress')`
- `Quick Stats` → `t('workflow.dashboard.project.overview.quickStats')`
- `Files` (stat) → `t('workflow.dashboard.project.overview.files')`
- `Members` (stat) → `t('workflow.dashboard.project.overview.members')`
- `Budget` (stat) → `t('workflow.budget')`
- `Coins` (affiliate, 2x) → `t('workflow.affiliate.coins')`
- `Project Members` → `t('workflow.dashboard.project.teamPanel.title')`
- `+ Add Member` → `+ ${t('workflow.addMember')}`
- `External (50c)` → `t('workflow.dashboard.project.teamPanel.external')`
- `Select to Add` → `t('workflow.dashboard.project.teamPanel.selectToAdd')`
- `Cancel` (team panel) → `t('common.cancel')`
- `Project Files` → `t('workflow.dashboard.project.filesPanel.title')`
- `Upload File` → `t('workflow.dashboard.project.filesPanel.upload')`
- `Assign Task` → `t('workflow.dashboard.project.filesPanel.assignTask')`
- `Open` → `t('workflow.dashboard.project.filesPanel.open')`
- `No files in this project yet.` → `t('workflow.dashboard.project.filesPanel.noFiles')`
- `Add Expense` (h3) → `t('workflow.dashboard.project.finance.addExpense')`
- `Expense Name` placeholder → `t('workflow.dashboard.project.finance.expenseName')`
- `Amount (Coins)` placeholder → `t('workflow.dashboard.project.finance.amount')`
- `Add` (button) → `t('workflow.dashboard.project.finance.add')`
- `Due:` → `t('workflow.dashboard.project.tasks.dueLabel')`
- `documents found` → `t('workflow.dashboard.documentsFound')`
- `Client` placeholder → `t('workflow.dashboard.project.modal.client')`
- `Budget (Coins)` placeholder → `t('workflow.dashboard.project.modal.budget')`
- Dept options (Event Planner/Creative/Operation) → `t('workflow.depts.*')`
- `Cancel` (modals) → `t('common.cancel')`
- `Select Assignee` → `t('workflow.dashboard.project.tasks.modal.selectAssignee')`
- `Attached:` → `t('workflow.dashboard.project.tasks.modal.attached')`
- `"Vui lòng điền..."` alert → `t('workflow.dashboard.project.tasks.modal.fillRequired')`

**New State:**
- `newExpense: { name: string, amount: string }` — for Add Expense form

**New Functions:**
- `handleAddExpense()`: validates form, updates `selectedProject.expenses` + syncs to `projects` state, resets form
- `cycleTaskStatus(taskId)`: todo → in_progress → done → todo, syncs to both `selectedProject` and `projects`
- `handleOpenFile(doc)`: opens doc URL in new tab if available, else shows file info alert

**UX Improvements:**
- Task cards: added `cursor-pointer`, colored status badges (gray/blue/green)
- `Open` button: now has `hover:bg-[var(--accent-primary)]/20` feedback + functional onClick
- Expense form: inputs connected to state; Add button calls `handleAddExpense`
