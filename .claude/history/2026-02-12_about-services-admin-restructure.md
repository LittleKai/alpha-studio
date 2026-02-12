# 2026-02-12: About & Services Pages + Admin Restructure

## Changes Made

### New Files Created
- `src/pages/AboutPage.tsx` - Public page listing "about" category articles
- `src/pages/AboutDetailPage.tsx` - Single article detail for about section
- `src/pages/ServicesPage.tsx` - Public page listing "services" category articles
- `src/pages/ServicesDetailPage.tsx` - Single article detail for services section
- `src/services/articleService.ts` - API service for article CRUD (public + admin)
- `src/components/admin/ArticlesAdminTab.tsx` - Reusable admin tab for managing articles by category

### Modified Files
- `src/App.tsx` - Added 4 new routes: /about, /about/:slug, /services, /services/:slug
- `src/components/layout/Layout.tsx` - Added "Giới Thiệu" and "Dịch Vụ Sản Phẩm" nav items
- `src/pages/AdminPage.tsx` - Restructured from 3 flat tabs to 3 top-level tabs with sub-tabs:
  - Tab 1: "Quản Lý Giới Thiệu" (About articles management)
  - Tab 2: "Quản Lý Dịch Vụ" (Services articles management)
  - Tab 3: "Quản Lý Giao Dịch" with sub-tabs: Users, Transactions, Webhooks
  - Access control expanded: admin OR mod can access
- `src/i18n/locales/vi/landing.ts` - Added nav.services, about.*, services.* translations
- `src/i18n/locales/en/landing.ts` - Added nav.services, about.*, services.* translations
- `src/i18n/locales/vi/admin.ts` - Added management.*, tabs.*, articles.* translations
- `src/i18n/locales/en/admin.ts` - Added management.*, tabs.*, articles.* translations

### Navigation Order (Header)
1. Giới Thiệu → /about
2. Học Viện → / (Academy)
3. Alpha Connect → /workflow
4. AI Cloud Server → /server (bordered button)
5. Dịch Vụ Sản Phẩm → /services

## Technical Notes
- Articles use bilingual content (vi/en) following existing pattern
- ArticlesAdminTab is reusable - receives `category` prop ('about' | 'services')
- Admin page now uses i18n for all tab labels
- All new pages wrapped with Layout component in App.tsx
