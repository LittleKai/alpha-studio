# Cloud Desktop Frontend - 2026-02-18

## Changes

### New Files
- **cloudService.ts**: API service for cloud desktop (connectToCloud, disconnectFromCloud, getActiveSession, admin machine/session endpoints)
- **CloudAdminTab.tsx**: Admin tab with machines sub-tab (table, register/edit form, toggle) and sessions sub-tab (table, filters, pagination, force-end)

### Modified Files
- **AIServerConnect.tsx**: Complete rewrite - removed simulation code, now uses real API with 4 states (idle/connecting/connected/error), session auto-detection on mount
- **App.tsx**: Removed Layout wrapper from ServerPage (full-screen like WorkflowDashboard)
- **AdminPage.tsx**: Added 'cloud' to TopTabType, imported CloudAdminTab, added cloud tab to topTabs array and render
- **vi/entities.ts**: Replaced server.* keys with new hierarchical structure (idle, connecting, connected, error)
- **en/entities.ts**: Same structure, English values
- **vi/admin.ts**: Added admin.tabs.cloud + admin.cloud.* (machines, sessions, tabs sub-keys)
- **en/admin.ts**: Same structure, English values

## Cross-references
- Backend: alpha-studio-backend/.claude/history/2026-02-18_cloud-desktop-backend.md
- Host Agent: alpha-studio-host-agent/ (new standalone project)
