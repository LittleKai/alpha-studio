# 2026-02-12: TinyMCE Integration + Detail Page HTML Rendering

## Changes Made

### Modified Files
- `src/components/admin/ArticlesAdminTab.tsx` - Rewrote content editing to use TinyMCE
  - Replaced textarea inputs with TinyMCE `<Editor>` components (vi/en)
  - Added language tab switcher (Vietnamese / English) for content editing
  - Integrated Cloudinary image upload via `images_upload_handler`
  - Uses self-hosted TinyMCE from `/tinymce/tinymce.min.js` (GPL license)
  - Editor refs for syncing content on save
  - Plugins: advlist, autolink, lists, link, image, charmap, anchor, searchreplace, visualblocks, code, fullscreen, insertdatetime, media, table, help, wordcount

- `src/pages/AboutDetailPage.tsx` - Updated content rendering
  - Replaced `whitespace-pre-wrap` plain text with `dangerouslySetInnerHTML`
  - Added Tailwind prose-like styling for HTML elements (images, links, headings, blockquotes, tables)
  - All styles use CSS custom properties for theme compatibility

- `src/pages/ServicesDetailPage.tsx` - Same changes as AboutDetailPage

- `src/pages/LandingPage.tsx` - Added missing nav items
  - Added "Giới Thiệu" link before Academy
  - Added "Dịch Vụ Sản Phẩm" link after AI Cloud Server

- `.gitignore` - Added `/public/tinymce` (generated from node_modules)
- `package.json` - Added postinstall script to auto-copy TinyMCE to public/

### New Dependencies
- `@tinymce/tinymce-react` ^6.3.0 - React wrapper for TinyMCE
- `tinymce` ^8.3.2 - Self-hosted TinyMCE editor (GPL)

### Static Assets
- `public/tinymce/` - Self-hosted TinyMCE files copied from node_modules
  - Includes: skins, plugins, themes, icons, models
  - Gitignored (auto-copied via postinstall script)

## Technical Notes
- TinyMCE is self-hosted (not CDN) to avoid API key requirement
- License: GPL (`licenseKey="gpl"`)
- Image upload in editor uses existing Cloudinary unsigned upload (`uploadToCloudinary`)
- Both vi/en editors are mounted simultaneously (hidden via display:none) to preserve state
- Detail pages use Tailwind arbitrary selectors (`[&_img]`, `[&_a]`, etc.) for HTML content styling
- Postinstall script: `node -e "..."` copies tinymce from node_modules to public/tinymce if not exists
