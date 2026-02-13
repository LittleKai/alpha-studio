# 2026-02-13: Admin Reset Password + Simplified Change Password

## Changes Made

### Admin Reset Password (AdminPage.tsx + adminService.ts)
- Added `resetUserPassword()` function to `adminService.ts`
- Added Reset Password button in `UsersTab` of `AdminPage.tsx`
- Button triggers confirm dialog, then calls API, shows new password in alert

### Simplified ChangePasswordModal (ChangePasswordModal.tsx)
- Removed 2-step email verification flow entirely
- Now single form: current password + new password + confirm → submit directly
- Removed all verification code state, UI, and API calls
- Calls `PUT /api/auth/password` with just `currentPassword` and `newPassword`

### i18n Updates
- **common.ts (vi+en):** Updated `password.description`, removed unused verification keys (codeSent, codeLabel, codePlaceholder, resendCode, resendIn, seconds, codeRequired, codeFailed, codeInvalid, codeExpired, step1, step2, next, sendCode, sendingCode)
- **admin.ts (vi+en):** Added `resetPassword.*` keys (title, description, button, confirmPrefix/Suffix, successPrefix/Suffix, error)

## Files Modified
1. `src/pages/AdminPage.tsx` - Added reset password button + handler
2. `src/services/adminService.ts` - Added `resetUserPassword()`
3. `src/components/modals/ChangePasswordModal.tsx` - Simplified to single-step
4. `src/i18n/locales/vi/common.ts` - Updated password keys
5. `src/i18n/locales/en/common.ts` - Updated password keys
6. `src/i18n/locales/vi/admin.ts` - Added resetPassword keys
7. `src/i18n/locales/en/admin.ts` - Added resetPassword keys
