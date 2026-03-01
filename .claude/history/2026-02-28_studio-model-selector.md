# 2026-02-28 — Studio Model Selector

## Summary
Thêm lựa chọn model AI cho mỗi tool trong /studio:
- **Nano Banana** — `gemini-2.5-flash-image` (mặc định, nhanh)
- **Nano Banana Pro** — `gemini-3.0-pro-image` (chất lượng cao hơn)

## Files Changed

### `src/services/geminiService.ts`
- Thêm `StudioModel` type + `STUDIO_MODELS` constant array (id, nameKey, descKey, badge)
- `editImage()` thêm param thứ 4 `model: StudioModel = 'gemini-2.5-flash-image'` (optional, backward-compatible)
- Model string được truyền trực tiếp vào `ai.models.generateContent({ model })`

### `src/components/studio/StudioTool.tsx`
- Import `STUDIO_MODELS`, `StudioModel` từ geminiService
- Thêm `selectedModel` state (default: `gemini-2.5-flash-image`)
- Model selector UI: 2 card dạng button, badge color-coded (vàng = Flash, tím = Pro)
- Hiển thị giữa Custom Prompt và Generate button
- `handleGenerate`: truyền `selectedModel` vào tất cả calls `editImage()` (step1, step2, single-step)
- Cập nhật `useCallback` deps

### `src/i18n/locales/vi/app.ts` + `en/app.ts`
- Thêm `studio.model.label`, `studio.model.flashName`, `studio.model.flashDesc`
- Thêm `studio.model.proName`, `studio.model.proDesc`
