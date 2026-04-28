# SEO Guide — giaiphapsangtao.com

## Trạng thái hiện tại

| Phase | Nội dung | Trạng thái |
|-------|----------|-----------|
| Phase 1 | Meta tags, robots.txt, hreflang vi/en | ✅ Done |
| Phase 2 | Sitemap.xml (backend), JSON-LD structured data | ✅ Done |
| Phase 3 | Prerender tất cả public routes với Puppeteer | ✅ Done |

---

## Bước tiếp theo (ngoài code)

### 1. Google Search Console — BẮT BUỘC

> Không làm bước này thì Google không biết site tồn tại.

1. Vào https://search.google.com/search-console
2. Click **"Add property"** → chọn **"Domain"**
3. Nhập `giaiphapsangtao.com`
4. Copy **DNS TXT record** Google cấp
5. Vào https://www.pavietnam.vn/ → đăng nhập → vào **Quản lý tên miền** → chọn `giaiphapsangtao.com` → **Quản lý DNS**
6. Thêm record mới: **Loại = TXT**, **Host = @**, **Giá trị = dán TXT record Google cấp**
7. Lưu lại (thường mất 5–30 phút để DNS propagate)
6. Quay lại Search Console → click **"Verify"**
7. Sau khi verify: vào **Sitemaps** → nhập `https://giaiphapsangtao.com/sitemap.xml` → **Submit**
8. Vào **URL Inspection** → nhập `https://giaiphapsangtao.com` → **Request Indexing**

---

### 2. Bing Webmaster Tools (optional nhưng nên làm)

1. Vào https://www.bing.com/webmasters
2. Import từ Google Search Console (1 click)
3. Submit sitemap tương tự

---

### 3. Kiểm tra sau khi deploy

Chạy các công cụ sau sau mỗi lần deploy lớn:

| Công cụ | Kiểm tra gì | Link |
|---------|-------------|------|
| Rich Results Test | JSON-LD Course/Article schema hợp lệ | https://search.google.com/test/rich-results |
| PageSpeed Insights | Core Web Vitals (LCP < 2.5s, CLS < 0.1) | https://pagespeed.web.dev |
| Mobile-Friendly Test | Hiển thị trên mobile | https://search.google.com/test/mobile-friendly |
| Open Graph Debugger | Preview khi share Facebook | https://developers.facebook.com/tools/debug |
| Twitter Card Validator | Preview khi share Twitter/X | https://cards-dev.twitter.com/validator |

**URL quan trọng cần test:**
```
https://giaiphapsangtao.com/
https://giaiphapsangtao.com/courses
https://giaiphapsangtao.com/courses/[slug-khoa-hoc]
https://giaiphapsangtao.com/about/[slug-bai-viet]
https://giaiphapsangtao.com/services/[slug-dich-vu]
```

---

## Content SEO — Yếu tố quyết định ranking

Code chỉ là nền tảng. Google rank theo **nội dung** và **authority**.

### Mỗi khóa học cần:
- **Title** có keyword rõ ràng: "Khóa học AI sáng tạo với Midjourney", "Học Prompt Engineering từ cơ bản"
- **Description** ≥ 150 từ tiếng Việt, có chứa keyword tự nhiên
- **Thumbnail** có `alt` text mô tả: `alt="Khóa học AI sáng tạo - Alpha Studio"`

### Mỗi bài viết (About/Services) cần:
- **Excerpt** chứa keyword chính (2–3 câu, ≤ 160 ký tự)
- **H1** khớp với title — chỉ 1 `<h1>` mỗi trang
- **Thumbnail** có `alt` text

### Keyword gợi ý để nhắm tới:
```
học AI Việt Nam
khóa học AI sáng tạo
học Prompt Engineering
công cụ AI cho designer
AI Studio online
học Midjourney tiếng Việt
```

---

## Backlinks cơ bản

Google đánh giá site qua số lượng và chất lượng link từ ngoài trỏ vào:

- [ ] Đăng bài giới thiệu site lên **LinkedIn** (link về trang chủ + một khóa học)
- [ ] Đăng lên **Facebook Page/Group** AI Việt Nam
- [ ] Tạo **Google Business Profile** nếu có địa chỉ thực
- [ ] Submit vào các danh bạ giáo dục: Edunet, TopDev Learning, ...
- [ ] Mỗi article nên được share manual để có social signal ban đầu

---

## Theo dõi định kỳ

| Tần suất | Việc cần làm |
|----------|-------------|
| Hàng tuần | Vào Search Console xem Coverage, Index status, impressions |
| Hàng tháng | Check PageSpeed Insights — đảm bảo LCP < 2.5s |
| Khi thêm course/article mới | Deploy lại (`npm run build:seo`) để prerender trang mới |
| Khi site chậm | Check Core Web Vitals report trong Search Console |

---

## Prerender — Hướng dẫn deploy

Mỗi khi thêm **khóa học mới** hoặc **bài viết mới**, cần deploy lại để prerender:

```bash
# Vercel tự chạy npm run build:seo khi push lên main
git push origin main

# Hoặc trigger manual deploy trên Vercel dashboard
```

Script `scripts/prerender.mjs` tự động:
1. Fetch danh sách tất cả slugs từ backend
2. Prerender từng trang thành HTML tĩnh
3. Lưu vào `dist/[route]/index.html`

**Nếu prerender fail trên Vercel:** kiểm tra biến môi trường `VITE_API_URL` đã được set trong Vercel dashboard chưa.

---

## Cấu trúc SEO đã implement

```
src/components/ui/SEOHead.tsx   ← Component dùng chung (title, meta, OG, hreflang, JSON-LD)
public/robots.txt               ← Cho phép/chặn crawler
scripts/prerender.mjs           ← Puppeteer prerender script
vercel.json                     ← buildCommand + sitemap.xml rewrite
alpha-studio-backend/
  server/routes/sitemap.js      ← GET /sitemap.xml (courses + articles)
```

**Trang đã có SEO đầy đủ:**
| Trang | Meta | JSON-LD | Prerendered |
|-------|------|---------|-------------|
| `/` | ✅ | Organization + WebSite | ✅ |
| `/courses` | ✅ | — | ✅ |
| `/courses/:slug` | ✅ động | Course + AggregateRating | ✅ |
| `/about` | ✅ | — | ✅ |
| `/about/:slug` | ✅ động | Article | ✅ |
| `/services` | ✅ | — | ✅ |
| `/services/:slug` | ✅ động | Article | ✅ |
