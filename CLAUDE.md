# Alpha Studio Frontend - Agent Router

React/Vite frontend deploy tren Vercel tai `giaiphapsangtao.com`.

## Doc theo viec

Luon doc `.claude/PROJECT_SUMMARY.md`.

| Task | Doc bat buoc |
|---|---|
| Component, service, state, i18n | `.claude/CONVENTIONS.md` |
| Upload, Cloudinary, B2, render anh | `.claude/ASSETS_AND_UPLOADS.md` |
| Contract data/API | `.claude/DATABASE.md` va summary backend lien quan |
| Truoc khi giao | `.claude/SMOKE_TEST_CHECKLIST.md` |

Khong doc toan bo `src/`, `dist/`, `node_modules/`, file da duoc summary tom tat, hay `.claude/archive/` chi de hieu project.

## Luat bat bien

- UI text phai co ca `vi` va `en`; noi dung user dang chi bat buoc tieng Viet.
- Dung CSS custom properties; khong hardcode mau. Khong dung `window.confirm()`.
- Moi `VITE_*` la public. Secret va Gemini call phai nam o backend.
- Upload/render anh phai theo `ASSETS_AND_UPLOADS.md`.
- Khong bao gio upload anh nguyen goc. Moi anh phai resize theo preset va chuyen WebP truoc khi len Cloudinary/B2 - ke ca khi upload bang script/seed, khong chi tu UI.
- Sua logic thuan trong `src/services/` hoac `src/utils/` phai co test.
- Chi cap nhat summary nhu trang thai hien tai, khong ghi lich su session.

## VERIFY - artifact `dist/`

1. Logic: `npm test`; type/build: `npm run build`.
2. Mo `npm run preview`, smoke dung route bi tac dong tren desktop va mobile; xem console/network.
3. Upload/image thay doi phai kiem URL CDN, kich thuoc va fallback that.
4. Task chi sua docs duoc mien build; van phai kiem path, placeholder, secret va diff.

## Sau moi task

Cap nhat `.claude/PROJECT_SUMMARY.md`; cap nhat ca frontend/backend khi contract thay doi.
