# Change Log: 2026-01-19

## Session Info
- **Duration:** ~30 minutes
- **Request:** "UI improvements: restore admin link, fix theme colors, add translations, enhance account dropdown"
- **Files Modified:** 5
- **Files Created:** 1

---

## Changes Made

### 1. LandingPage.tsx - Admin Link Restoration & Account Dropdown Enhancement
**What changed:**
- Restored `/admin/courses` link for admin/mod users in the dropdown menu
- Enhanced account info section in dropdown with:
  - "Account Info" header with translated label
  - User avatar, name, email display
  - Role badge with accent styling
  - "View Profile" link to workflow page
  - Better organized sections with dividers
- Increased dropdown width from `w-48` to `w-56`

**Why:**
- Admin link was accidentally removed in previous session
- User requested better account information display in dropdown

**Code snippet (Account Info Section):**
```tsx
{/* Account Info Section */}
<div className="px-4 py-3 border-b border-[var(--border-primary)]">
    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{t('account.info')}</p>
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
        </div>
    </div>
    <div className="mt-2 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold uppercase">
            {user?.role}
        </span>
    </div>
</div>
```

### 2. WorkflowDashboard.tsx - Search Input Theme Fix
**What changed:**
- Fixed hardcoded dark colors in search input
- Changed from `bg-[#0f172a]` to `bg-[var(--bg-secondary)]`
- Changed from `text-white` to `text-[var(--text-primary)]`
- Changed from `placeholder-gray-500` to `placeholder-[var(--text-tertiary)]`

**Why:**
- Hardcoded colors didn't work with light theme
- Now properly adapts to both light and dark themes

### 3. i18n/en.ts - Added Translations
**What changed:**
- Added `account.*` section for account dropdown labels
- Added `workflow.jobs.noJobs` and `workflow.jobs.add`
- Added `workflow.partners.noPartners`

**Translations added:**
```typescript
account: {
    info: "Account Info",
    viewProfile: "View Profile",
    settings: "Settings",
    email: "Email",
    role: "Role",
    memberSince: "Member since"
},
workflow: {
    jobs: {
        // ... existing
        noJobs: "No jobs available at the moment",
        add: "Post New Job"
    },
    partners: {
        // ... existing
        noPartners: "No partners available at the moment",
    }
}
```

### 4. i18n/vi.ts - Added Vietnamese Translations
**What changed:**
- Added corresponding Vietnamese translations for all new keys

**Translations added:**
```typescript
account: {
    info: "Thong tin tai khoan",
    viewProfile: "Xem ho so",
    settings: "Cai dat",
    email: "Email",
    role: "Vai tro",
    memberSince: "Thanh vien tu"
},
workflow: {
    jobs: {
        noJobs: "Chua co viec lam nao",
        add: "Dang viec moi"
    },
    partners: {
        noPartners: "Chua co doi tac nao",
    }
}
```

### 5. jobService.ts & partnerService.ts - Token Key Fix (Previous Session)
**What changed:**
- Fixed token key from `localStorage.getItem('token')` to `localStorage.getItem('alpha_studio_token')`

**Why:**
- Token key mismatch was causing 401 Unauthorized errors
- Auth context stores token as `alpha_studio_token`

---

## Testing
- [ ] Build verified
- [ ] Account dropdown displays correctly with new layout
- [ ] Theme switching works correctly with search input
- [ ] Translations display in both EN and VI
- [ ] Admin link visible for admin/mod users

---

## Updated in PROJECT_SUMMARY.md
- [x] Section 4 (Features): Added React Router routing update
- [x] Section 5 (TODOs): Updated routing pattern status
- [x] Section 7 (Recent Changes): Added this session entry

---

## Notes for Next Session
- Studio sticky header structure reviewed - nested pattern is intentional (header for positioning, inner div for layout)
- WorkflowDashboard still large (~29k tokens) - splitting remains a medium priority TODO
- Consider adding zh.ts (Chinese) translations for new account.* keys

---

## Related Files
Files touched in this session:
- `src/pages/LandingPage.tsx`
- `src/components/dashboard/WorkflowDashboard.tsx`
- `src/i18n/en.ts`
- `src/i18n/vi.ts`
- `src/services/jobService.ts`
- `src/services/partnerService.ts`
