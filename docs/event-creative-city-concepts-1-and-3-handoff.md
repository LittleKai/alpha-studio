# Handoff — Phương án 1 & 3 cho `/event-creative-city`

## Phạm vi

- 14 ảnh mới, tỷ lệ 3:2, dành cho hai câu chuyện độc lập.
- Không thay đổi landing page hiện tại.
- Không thay thế hoặc chỉnh sửa 21 ảnh đã hoàn tất của phương án 2.
- Bộ chọn **phương án/câu chuyện** và bộ chọn **visual theme** là hai cấp khác nhau:
  - Cấp 1: `brief-to-showtime` / `event-creative-city` / `living-storyboard`.
  - Cấp 2: chỉ `event-creative-city` có ba visual theme hiện hữu.

## Prompt ngắn cho Claude Code

```text
Cập nhật riêng route /event-creative-city để có bộ chọn cấp 1 gồm 3 phương án: “Từ Brief đến Showtime”, “Event Creative City” và “Storyboard sống”. Giữ nguyên toàn bộ 21 ảnh cùng bộ chọn 3 visual theme đã hoàn tất của Event Creative City; không tái tạo hoặc sửa các asset đó. Nối 7 ảnh trong /public/event-creative-city/concepts/brief-to-showtime và 7 ảnh trong /public/event-creative-city/concepts/living-storyboard vào hai phương án mới theo đúng thứ tự/tên cảnh trong docs/event-creative-city-concepts-1-and-3-handoff.md. Khi chuyển phương án, giữ scene index tương ứng, cập nhật copy/palette phù hợp, preload ảnh kế cận và giữ reduced-motion/mobile hiện có. Không sửa landing page hay route khác.
```

## Phương án 1 — Từ Brief đến Showtime

ID đề xuất: `brief-to-showtime`

Định hướng: một hành trình điện ảnh tiến thẳng qua cùng một venue, từ tờ brief trắng đến khoảnh khắc live show. Camera và các đường dẫn luôn hướng về tâm ảnh; palette midnight navy, cyan, violet và amber.

| # | Ảnh | Eyebrow | Tiêu đề | Nội dung ngắn |
|---|---|---|---|---|
| 1 | `/event-creative-city/concepts/brief-to-showtime/01-blank-brief.png` | Điểm bắt đầu | Một trang trắng. Một khả năng lớn. | Mỗi sự kiện bắt đầu bằng một câu hỏi đủ tốt và một khoảng trống chờ được lấp đầy. |
| 2 | `/event-creative-city/concepts/brief-to-showtime/02-concept-lab.png` | Concept | Ý tưởng tìm thấy hình hài. | Mood, chất liệu và không gian gặp nhau để tạo nên hướng đi đầu tiên. |
| 3 | `/event-creative-city/concepts/brief-to-showtime/03-storyboard-corridor.png` | Storyboard | Kể trước khoảnh khắc sẽ xảy ra. | Từng frame sắp xếp cảm xúc, nhịp điệu và những điểm chạm của khách mời. |
| 4 | `/event-creative-city/concepts/brief-to-showtime/04-production-blueprint.png` | Production | Biến ý tưởng thành cấu trúc. | Bản vẽ, sân khấu, LED và hệ kỹ thuật cùng chuyển từ kế hoạch sang hiện thực. |
| 5 | `/event-creative-city/concepts/brief-to-showtime/05-technical-rehearsal.png` | Rehearsal | Chạy thử từng nhịp. | Ánh sáng, hình ảnh và vận hành được cân chỉnh trước khi khán phòng sáng đèn. |
| 6 | `/event-creative-city/concepts/brief-to-showtime/06-doors-open.png` | Guest arrival | Khi cánh cửa mở. | Ý tưởng bắt đầu thuộc về khách mời ngay từ bước chân đầu tiên vào không gian. |
| 7 | `/event-creative-city/concepts/brief-to-showtime/07-showtime.png` | Live moment | Và rồi: Showtime. | Mọi quyết định hội tụ thành một khoảnh khắc sống động, đồng bộ và đáng nhớ. |

Accent đề xuất: `#61E8FF`; nền `#07111F`; highlight `#FFB454`.

## Phương án 3 — Storyboard sống

ID đề xuất: `living-storyboard`

Định hướng: một bàn sáng tạo sáng màu, nơi giấy, moodboard và storyboard lần lượt dựng thành không gian sự kiện. Chất liệu papercraft cao cấp, ivory, acetate trong, graphite cùng các accent coral/cyan/violet/amber/sage.

| # | Ảnh | Eyebrow | Tiêu đề | Nội dung ngắn |
|---|---|---|---|---|
| 1 | `/event-creative-city/concepts/living-storyboard/01-creative-desk.png` | Blank canvas | Bàn sáng tạo thức giấc. | Một tờ brief trắng mở ra đường dẫn đầu tiên cho câu chuyện sự kiện. |
| 2 | `/event-creative-city/concepts/living-storyboard/02-moodboard-awakens.png` | Moodboard | Cảm hứng bật khỏi mặt phẳng. | Màu sắc, chất liệu và hình khối bắt đầu đối thoại trong cùng một thế giới. |
| 3 | `/event-creative-city/concepts/living-storyboard/03-storyboard-rises.png` | Story beats | Câu chuyện dựng thành không gian. | Các khung hình đứng dậy, nối tiếp nhau và hé lộ hành trình của người tham dự. |
| 4 | `/event-creative-city/concepts/living-storyboard/04-stage-from-paper.png` | Spatial design | Sân khấu nảy mầm từ giấy. | Bản vẽ gấp mở thành kiến trúc, ánh sáng và một điểm nhìn trung tâm. |
| 5 | `/event-creative-city/concepts/living-storyboard/05-production-layers.png` | Build system | Mọi lớp đều được nhìn thấy. | Kết cấu, LED, ánh sáng và vận hành tách lớp để cùng tạo nên một tổng thể khả thi. |
| 6 | `/event-creative-city/concepts/living-storyboard/06-step-into-scene.png` | Experience | Bước vào chính ý tưởng. | Mô hình mở rộng thành trải nghiệm thật và mời khách đi xuyên qua câu chuyện. |
| 7 | `/event-creative-city/concepts/living-storyboard/07-story-becomes-show.png` | Finale | Câu chuyện trở thành sự kiện. | Brief, storyboard và không gian hội tụ trong một khoảnh khắc sống động trước khán giả. |

Accent đề xuất: `#58C7D9`; nền `#F7F1E8`; ink `#2C3440`; coral `#F47C6C`.

## Quy ước tương tác đề xuất

- Bộ chọn phương án nằm độc lập với bộ chọn visual theme của phương án 2.
- Ba phương án đều có 7 scene nên khi switch có thể giữ nguyên `sceneIndex` hiện tại, tránh nhảy scroll.
- Với phương án 1 và 3, không hiển thị bộ chọn visual theme của phương án 2.
- Crossfade ảnh khi đổi phương án; preload scene hiện tại và hai scene lân cận.
- Giữ ảnh làm poster/fallback cho `prefers-reduced-motion`.

## Prompt hình ảnh đã dùng

### Phương án 1

Base prompt: grounded photorealistic cinematic architectural visualization of one connected premium event venue; centered forward pathway; human-eye-height 24mm camera; midnight navy/cyan/violet/amber palette; realistic event-production detail; no text, logo, watermark or collage. Bảy scene lần lượt: blank brief, concept lab, storyboard corridor, production blueprint, technical rehearsal, doors open và showtime.

### Phương án 3

Base prompt: premium tactile editorial papercraft on a warm ivory creative desk; consistent high three-quarter isometric camera; matte cardstock, die-cut edges, graphite construction lines and translucent acetate; coral/cyan/violet/amber/sage palette; bright daylight; no text, logo, watermark or dark background. Bảy scene lần lượt: creative desk, moodboard awakening, storyboard rising, paper stage, exploded production layers, step into the scene và story becomes show.

Ảnh được tạo bằng built-in `imagegen` và đã được lưu trực tiếp trong `public/event-creative-city/concepts/`.
