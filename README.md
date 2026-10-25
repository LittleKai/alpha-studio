# Alpha Studio Frontend

React 19 + TypeScript + Vite. Read [AGENTS.md](AGENTS.md) and [.claude/PROJECT_SUMMARY.md](.claude/PROJECT_SUMMARY.md) before making changes.

- `npm run dev`: start the Vite development server.
- `npm test`: run Vitest once.
- `npm run build`: check TypeScript and create the production artifact in `dist/`.
- `npm run build:seo`: build and prerender every public sitemap URL; rebuild after publishing content.
- `node scripts/seo-smoke.mjs`: verify metadata, canonicals and JSON-LD across the complete artifact.
- `npm run preview`: serve `dist/` locally for smoke testing.
- `node scripts/image-lightbox.test.mjs`: check image fit, zoom, scrolling and navigation on desktop/mobile against the production preview (default `http://localhost:4173`; optional base URL argument).

Deployment: Vercel at https://giaiphapsangtao.com. See [.claude/SMOKE_TEST_CHECKLIST.md](.claude/SMOKE_TEST_CHECKLIST.md) for artifact verification.
