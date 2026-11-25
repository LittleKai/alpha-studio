# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Khách đặt dịch vụ thiết kế 3D & sản xuất sự kiện (chuyển đổi chính)**: agency sự kiện, doanh nghiệp, chủ đầu tư tìm hiểu năng lực thực tế qua dự án mẫu (sân khấu 3D/LED, render SketchUp, nội thất, kiến trúc CAD) và gửi brief để trao đổi phạm vi, báo giá, tiến độ.
- **Kỹ thuật viên, designer & freelancer sự kiện (nuôi dưỡng hệ sinh thái)**: sử dụng các công cụ trong Alpha Studio Hub (Alpha LED Studio 3D, Alpha CRM, Event Library, VocabFlip, VietYaku, Alpha Connect).
- **Học viên đào tạo AI ứng dụng (nuôi dưỡng hệ sinh thái)**: tìm hiểu lộ trình khóa học, tham gia học và làm bài trên nền tảng AI cho ngành sự kiện & sáng tạo.

## Product Purpose

Cổng thông tin và nền tảng vận hành chính thức của Alpha Studio (`giaiphapsangtao.com`), kết nối ba trụ cột: dịch vụ thiết kế & dựng hình 3D theo yêu cầu, bộ công cụ sản xuất sáng tạo sự kiện, và đào tạo AI ứng dụng. Thành công là khi khách tiềm năng xem được quy trình đầu vào → đầu ra thực tế và gửi brief liên hệ ngay không vướng rào cản đăng nhập, đồng thời cộng đồng nghề quay lại sử dụng công cụ và khóa học trong hệ sinh thái.

## Positioning

Alpha Studio kết hợp dịch vụ thiết kế 3D trình bày minh bạch từ đầu vào (ảnh tham chiếu, SketchUp, hồ sơ CAD/PDF) tới sản phẩm bàn giao với bộ công cụ sản xuất sự kiện chuyên biệt do đội ngũ tự phát triển (nổi bật là WebGL2 Alpha LED Studio và Alpha CRM) cùng học viện đào tạo AI thực chiến song ngữ Việt–Anh.

## Operating Context

- **Luồng công khai & SEO (không yêu cầu đăng nhập)**: trang chủ `/`, dịch vụ `/services` & `/services/:slug`, trang liên hệ đặt brief `/contact` (`/lien-he` redirect về `/contact`), khóa học `/courses`, giới thiệu `/about`, tin tức `/news`, cổng công cụ `/studio` và trang giới thiệu `/studio/led-studio`.
- **Luồng chuyển đổi liên hệ trực tiếp**: dựng nhanh nội dung brief theo hạng mục (`stage-design`, `custom-asset`, `choreography`, `general`, nhận deep-link `?source=led-studio` từ LED Stage Studio) rồi gửi qua Zalo, WhatsApp, Facebook Messenger hoặc Email tới phụ trách trực tiếp mà không bắt đăng ký tài khoản.
- **Luồng xác thực & phiên bảo vệ**: mở bộ dựng sân khấu LED Studio 3D (`/led-studio/*` qua Edge HMAC session ticket hoặc `?share=` có mật khẩu), Alpha Connect (`/workflow`), AI Cloud Server (`/server`), Ví Credits (`/wallet`) và quản trị (`/admin`).

## Capabilities and Constraints

- **Nền tảng kỹ thuật**: React 19 + TypeScript + Vite SPA triển khai trên Vercel (`dist/`), hỗ trợ prerender sitemap công khai (`npm run build:seo`), middleware bảo vệ route tồn tại và chặn truy cập trực tiếp `/led-studio/*` (`middleware.js`).
- **Song ngữ (VI / EN)**: Toàn bộ giao diện điều hướng, landing, dịch vụ và `/contact` hỗ trợ đầy đủ cả tiếng Việt và tiếng Anh; bài viết dịch vụ/tin tức/giới thiệu bắt buộc có tiếng Việt gốc và hỗ trợ trình bày song ngữ từng mục.
- **Ranh giới báo giá & nội dung**: Dịch vụ thiết kế 3D & sân khấu luôn trao đổi phạm vi, báo giá và tiến độ theo brief từng dự án — không áp bảng giá cố định công khai; bài viết dịch vụ thể hiện rõ ảnh đầu vào, quy trình và đầu ra thật.
- **Mục chủ động để mở (Undecided)**: Chưa thiết lập bảng giá gói cố định cho dịch vụ thiết kế 3D/sân khấu (giữ cơ chế báo giá theo brief).

## Brand Commitments

- **Tên thương hiệu & tên miền**: `Alpha Studio` — `giaiphapsangtao.com`.
- **Đầu mối liên hệ trực tiếp đã xác thực**:
  - **Kiều Tấn Thành** (`0901555697`) — Tư vấn giải pháp & báo giá dự án: Zalo (`https://zalo.me/0901555697`), WhatsApp (`84901555697`), Facebook (`https://www.facebook.com/thanh.tan.92560`).
  - **Nguyễn Anh Đức** (`0933805525`) — Đào tạo AI & hỗ trợ kỹ thuật: Zalo (`https://zalo.me/0933805525`), WhatsApp (`84933805525`), Facebook (`https://www.facebook.com/anhduc.nguyen.311/`).
  - **Email nhận brief & hợp tác**: `giaiphapkhonggiansangtao@gmail.com`.
- **Giọng văn**: Rõ ràng, thực tế, lấy sản phẩm và quy trình làm bằng chứng; tránh cường điệu tiếp thị.

## Evidence on Hand

- **Dự án & case study dịch vụ thực tế trên `/services`**: Dựng 3D sự kiện từ ảnh tham chiếu, chuyển 14 góc SketchUp căn hộ thành ảnh thực tế, thiết kế nội thất từ AI & bản vẽ kỹ thuật, dựng nhà phố Tân Cổ Điển từ hồ sơ CAD (tổng hợp tại `../docs/SERVICES_BRIEF_AND_COPY.md`).
- **Bộ công cụ vận hành thực tế**: Alpha LED Studio (`/studio/led-studio`, nguồn tại `../tools/led-stage-studio/`), Alpha CRM (`/studio/crm`), Thư viện sự kiện (`/studio/event-library`), VocabFlip (`/studio/vocab`), VietYaku (`/studio/vietyaku`).
- **Thông tin chưa có (cấm tự bịa)**: Không có bảng giá dịch vụ thiết kế 3D cố định, không có trích dẫn chứng thực khách hàng, đánh giá báo chí hay cam kết chỉ số ROI cụ thể chưa được xác minh.

## Product Principles

1. **Bằng chứng thực tế đi trước lời hứa**: Mọi trang dịch vụ và giới thiệu năng lực lấy đầu vào thật, quy trình thật và sản phẩm bàn giao làm trọng tâm.
2. **Liên hệ đặt brief không rào cản**: Khách xem dịch vụ, trường hợp mẫu và mở `/contact` gửi yêu cầu qua Zalo, WhatsApp, Facebook hoặc Email mà không bị buộc đăng nhập.
3. **Báo giá trung thực theo brief**: Trao đổi phạm vi, chi phí và tiến độ dựa trên bản vẽ/mặt bằng/yêu cầu cụ thể thay vì niêm yết giá ảo.
4. **Ranh giới rõ giữa SEO công khai và công cụ có phiên**: Giữ trang thông tin, dịch vụ, khóa học mở cho tìm kiếm; bảo vệ tài nguyên công cụ nặng và không gian làm việc bằng xác thực và session ticket.
5. **Nhất quán song ngữ Việt–Anh**: Đảm bảo mọi luồng giao diện người dùng (navigation, `/services`, `/contact`, CTA từ LED Studio) đồng bộ cả `vi` và `en`.

## Accessibility & Inclusion

- Hỗ trợ đầy đủ trên trình duyệt máy tính và di động (desktop + mobile web).
- Bảo đảm độ tương phản chữ/nền đạt chuẩn WCAG AA trên cả giao diện Tối (`dark`) và Sáng (`light`).
- Tôn trọng tùy chọn giảm chuyển động (`prefers-reduced-motion`) và hỗ trợ điều hướng bàn phím với vòng focus rõ ràng cho các nút, ô nhập liệu và liên kết.
