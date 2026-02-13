# Change Password Modal + Email Verification
**Date:** 2026-02-13

## Changes Made

### New Files
- `src/components/modals/ChangePasswordModal.tsx` - Multi-step change password dialog with email verification

### Modified Files
- `src/pages/ProfilePage.tsx` - Replaced collapsible password section with button that opens ChangePasswordModal
- `src/i18n/locales/vi/common.ts` - Added verification code flow translations (profile.password.*)
- `src/i18n/locales/en/common.ts` - Added verification code flow translations (profile.password.*)

## Feature Details

### ChangePasswordModal
- Step 1: Enter current password, new password, confirm password (client-side validation)
- Step 2: Verification code sent to user's email, enter 6-digit code
- 60-second cooldown for resend code
- Auto-close on success after 2 seconds

### ProfilePage Changes
- Removed collapsible password section (old: toggle expand/collapse)
- Added styled button card with lock icon, title, description, and chevron arrow
- Button opens ChangePasswordModal overlay
- Removed 7 state variables (passwordData, passwordError, etc.)
- Removed handleChangePassword function

### i18n Keys Added (profile.password.*)
- description, sendCode, sendingCode, codeSent, codeLabel, codePlaceholder
- resendCode, resendIn, seconds, codeRequired, codeFailed, codeInvalid, codeExpired
- step1, step2, next, passwordMinLength, passwordMismatch
