# Alpha Studio Frontend - Agent Router (Codex, Antigravity & Claude Code)

React/Vite frontend deploy trên Vercel tại `giaiphapsangtao.com`.

Text files are UTF-8 without BOM. In PowerShell read them with
`Get-Content -Encoding UTF8`; plain `Get-Content` under `-NoProfile` garbles
Vietnamese, and writing that text back corrupts the file.

## 📖 ĐỌC GÌ — theo việc đang làm

Luôn đọc `.claude/PROJECT_SUMMARY.md` trước (trạng thái dự án — đọc nó, đừng đọc lại toàn bộ code).

| Task | Đọc bắt buộc |
|---|---|
| Component, service, state, i18n | `.claude/CONVENTIONS.md` |
| Upload, Cloudinary, B2, render ảnh | `.claude/ASSETS_AND_UPLOADS.md` |
| Contract data/API | `.claude/DATABASE.md` và summary backend liên quan (`../alpha-studio-backend/`) |
| Trước khi giao | `.claude/SMOKE_TEST_CHECKLIST.md` |

**KHÔNG đọc:** toàn bộ `src/`, `dist/`, `node_modules/`, file đã được summary tóm tắt, hay `.claude/archive/` chỉ để "hiểu project". Archive chỉ dùng để biết vì sao, không làm theo.

## 🔒 BẢO MẬT

- Không ghi API key, token, mật khẩu thật vào source, test, comment hay markdown; chỉ dùng placeholder (`<YOUR_API_KEY>`).
- Mọi biến `VITE_*` là công khai trong bundle client; secret và mọi lệnh gọi Gemini API phải nằm ở backend (`alpha-studio-backend/`).
- Không upload ảnh nguyên gốc: mọi ảnh phải resize theo preset và chuyển WebP trước khi lên Cloudinary/B2 (kể cả khi chạy script/seed).

## 🧭 Luật bất biến

- UI text phải có cả `vi` và `en`; nội dung user đăng chỉ bắt buộc tiếng Việt.
- Dùng CSS custom properties; không hardcode màu. Không dùng `window.confirm()`.
- Sửa logic thuần trong `src/services/` hoặc `src/utils/` phải có unit test.
- Chỉ cập nhật summary như trạng thái hiện tại, không ghi lịch sử session.

## 🧪 VERIFY — artifact `dist/`

1. Logic: `npm test`; type/build: `npm run build`.
2. Mở `npm run preview`, smoke đúng route bị tác động trên desktop và mobile; xem console/network.
3. Upload/image thay đổi phải kiểm URL CDN, kích thước và fallback thật.
4. Task chỉ sửa docs được miễn build; vẫn phải kiểm path, placeholder, secret và Git diff.

## ✍️ SAU MỖI TASK

Cập nhật `.claude/PROJECT_SUMMARY.md` theo luật ở đầu file đó; cập nhật cả summary frontend và backend (`../alpha-studio-backend/.claude/PROJECT_SUMMARY.md`) khi contract API/data thay đổi.
