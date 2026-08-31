import type { EventLibraryItem, LibrarySection } from '../../services/eventLibraryService';

/**
 * Mục MẪU của tab "Đăng lên thư viện" — một skill có thật về nghề, soạn sao cho
 * mỗi khối thân bài xuất hiện đúng một lần và tự nói nó dùng để làm gì.
 *
 * Mục này **chỉ tồn tại ở frontend**: không có bản ghi trong MongoDB, không gửi
 * lên API bao giờ. Nhờ vậy nó không thể công khai, không thể sửa và không thể
 * xoá — người dùng chỉ mở form ở chế độ chỉ đọc để xem bên trong từng khối.
 */
export const EXAMPLE_ITEM_ID = '__example__';

/** Ảnh minh hoạ dùng cho khối `gallery` và ảnh bìa của mục mẫu. */
const IMG = {
    cover: 'https://res.cloudinary.com/dzchj4ysj/image/upload/v1788162863/library-example/c7xm3frx6kj0gxbtnkjq.jpg',
    booth: 'https://res.cloudinary.com/dzchj4ysj/image/upload/v1788162866/library-example/bsmcahovofnkungqgjhq.jpg',
    stage: 'https://res.cloudinary.com/dzchj4ysj/image/upload/v1788162870/library-example/q72kj0xlaysityuvpdfk.jpg',
    checkin: 'https://res.cloudinary.com/dzchj4ysj/image/upload/v1788162874/library-example/swtypljg3ayvqknpaln4.jpg'
};

function buildSections(pick: (vi: string, en: string) => string): LibrarySection[] {
    return [
        {
            kind: 'richText',
            title: pick(
                'Khối "Đoạn văn" — mở đầu, giải thích, kể bối cảnh',
                'The "Rich text" block — intros, explanations, context'
            ),
            html: pick(
                '<p><strong>Run of Show</strong> là bản timeline chi tiết đến từng phút của một chương trình: ai làm gì, vào lúc nào, tín hiệu ra vào là gì. Nó là tài liệu duy nhất mà MC, đạo diễn sân khấu, kỹ thuật và lễ tân cùng nhìn vào trong ngày chạy.</p><p>Dùng khối này khi bạn cần <em>viết văn xuôi</em>: mở bài, phân tích, kết luận. Thanh công cụ có in đậm, gạch đầu dòng, chèn ảnh, bảng và liên kết:</p><ul><li>Một chương trình 3 giờ thường có 60–90 dòng cue.</li><li>Sai số chấp nhận được của một khối nội dung là ±2 phút.</li><li>Mỗi lần trượt tiến độ quá 5 phút, MC phải có sẵn kịch bản "kéo giờ".</li></ul>',
                '<p>A <strong>Run of Show</strong> is a minute-by-minute timeline of an event: who does what, when, and on which cue. It is the single document the host, stage manager, technical crew and front-of-house all read from on show day.</p><p>Use this block whenever you need <em>prose</em>: intros, analysis, conclusions. The toolbar gives you bold, bullet lists, images, tables and links:</p><ul><li>A three-hour show usually holds 60–90 cue lines.</li><li>Acceptable drift for one content block is ±2 minutes.</li><li>Any time you slip more than 5 minutes, the host needs a stalling script ready.</li></ul>'
            )
        },
        {
            kind: 'richText',
            title: pick(
                'Ô prompt — nút "Prompt" trên thanh công cụ',
                'The prompt box — the "Prompt" toolbar button'
            ),
            html: pick(
                '<p>Bôi đen đoạn prompt rồi bấm nút <strong>Prompt</strong> trên thanh công cụ: đoạn đó vào khung riêng, ngoài trang đọc có <strong>nút Sao chép</strong>. Bấm lại khi đang đứng trong khung thì gỡ ra.</p><p><strong>Chỉ phần người đọc chép đi dùng mới vào khung.</strong> Câu dẫn như câu này để ở ngoài — nút Sao chép chép <em>toàn bộ</em> chữ trong khung, dính câu dẫn vào là người ta chép nhầm:</p><pre><code>Viết kịch bản chạy chương trình cho:\n\nSự kiện: [LOẠI SỰ KIỆN]\nThời lượng: [SỐ] phút\nSố khách: [SỐ]\nĐịa điểm: [ĐỊA ĐIỂM]\n\nChia thành 5–7 khối lớn. Mỗi khối ghi rõ:\n- giờ bắt đầu và thời lượng\n- người phụ trách\n- tín hiệu âm thanh / ánh sáng\n\nKèm 2 phương án rút gọn: -10 phút và -20 phút.</code></pre>',
                '<p>Select the prompt text and hit the <strong>Prompt</strong> button in the toolbar: it moves into its own frame, and readers get a <strong>Copy button</strong> on the page. Hit it again from inside the frame to unwrap it.</p><p><strong>Only what the reader will copy belongs in the box.</strong> A lead-in line like this one stays outside — the Copy button copies <em>everything</em> inside the frame, so a lead-in glued in there gets copied by mistake:</p><pre><code>Write a run of show for:\n\nEvent: [EVENT TYPE]\nRuntime: [NUMBER] minutes\nGuests: [NUMBER]\nVenue: [VENUE]\n\nSplit it into 5–7 macro blocks. For each block state:\n- start time and duration\n- the owner\n- the audio / lighting cue\n\nAdd two shortened plans: minus 10 and minus 20 minutes.</code></pre>'
            )
        },
        {
            kind: 'keyValue',
            title: pick(
                'Khối "Bảng 2 cột" — thông số tóm tắt, đọc lướt là hiểu',
                'The "Two-column table" block — specs you can skim'
            ),
            rows: [
                { label: pick('Áp dụng cho', 'Applies to'), value: pick('Hội nghị, lễ ra mắt, gala, roadshow nhiều điểm', 'Conferences, launches, galas, multi-stop roadshows') },
                { label: pick('Quy mô phù hợp', 'Suitable scale'), value: pick('150 – 3.000 khách', '150 – 3,000 guests') },
                { label: pick('Thời gian chuẩn bị', 'Prep time'), value: pick('Bản nháp trước 10 ngày, bản khoá trước 48 giờ', 'Draft 10 days out, locked 48 hours out') },
                { label: pick('Nhân sự tối thiểu', 'Minimum crew'), value: pick('1 đạo diễn sân khấu + 1 điều phối hậu trường', '1 stage manager + 1 backstage runner') },
                { label: pick('Công cụ hay dùng', 'Common tools'), value: pick('Google Sheets, bộ đàm 4 kênh, đồng hồ đếm ngược sân khấu', 'Google Sheets, 4-channel radios, stage countdown clock') }
            ]
        },
        {
            kind: 'metrics',
            title: pick(
                'Khối "Dải số liệu" — 2–4 con số chứng minh hiệu quả',
                'The "Metrics" block — 2–4 numbers that prove the point'
            ),
            metrics: [
                { value: '±90s', label: pick('Sai lệch trung bình so với kịch bản', 'Average drift against script'), note: pick('Đo trên 12 sự kiện gần nhất', 'Measured across the last 12 events') },
                { value: '-40%', label: pick('Thời gian chết giữa các tiết mục', 'Dead air between segments'), note: pick('So với chạy chương trình không có cue sheet', 'Versus running without a cue sheet') },
                { value: '3', label: pick('Số lần tổng duyệt cần thiết', 'Rehearsal passes needed'), note: pick('Đọc cue → chạy khô → tổng duyệt đủ kỹ thuật', 'Read-through → dry run → full technical') }
            ]
        },
        {
            kind: 'bulletGroups',
            title: pick(
                'Khối "Nhóm gạch đầu dòng" — checklist chia theo cụm',
                'The "Bullet groups" block — checklists split by theme'
            ),
            groups: [
                {
                    title: pick('Trước ngày chạy', 'Before show day'),
                    items: [
                        pick('Khoá kịch bản, gửi bản PDF cho toàn bộ đầu mối', 'Lock the script and send the PDF to every lead'),
                        pick('Đối chiếu timeline với hợp đồng khách mời và nghệ sĩ', 'Cross-check the timeline against guest and artist contracts'),
                        pick('Chuẩn bị 2 phương án rút gọn: -10 phút và -20 phút', 'Prepare two shortened plans: minus 10 and minus 20 minutes')
                    ]
                },
                {
                    title: pick('Trong ngày chạy', 'On show day'),
                    items: [
                        pick('Đọc cue lớn trước mỗi mốc 5 phút trên bộ đàm', 'Call every cue five minutes ahead on the radio'),
                        pick('Ghi lại giờ thực tế của từng khối để đối chiếu sau', 'Log the actual clock time of each block for the debrief'),
                        pick('Giữ một người duy nhất được quyền quyết định đổi timeline', 'Keep exactly one person authorised to change the timeline')
                    ]
                }
            ]
        },
        {
            kind: 'steps',
            title: pick(
                'Khối "Các bước" — quy trình có thứ tự, đánh số tự động',
                'The "Steps" block — an ordered process, auto-numbered'
            ),
            steps: [
                { title: pick('Dựng khung giờ lớn', 'Block out the macro timeline'), desc: pick('Chia chương trình thành 5–7 khối lớn: đón khách, khai mạc, nội dung chính, giao lưu, bế mạc.', 'Split the show into 5–7 macro blocks: arrival, opening, main content, interaction, closing.') },
                { title: pick('Bơm chi tiết vào từng khối', 'Fill in each block'), desc: pick('Mỗi khối tách thành dòng cue: giờ, nội dung, người phụ trách, tín hiệu âm thanh/ánh sáng.', 'Break each block into cue lines: clock, content, owner, audio/lighting trigger.') },
                { title: pick('Đối chiếu chéo với các bộ phận', 'Cross-check with every department'), desc: pick('Gửi bản nháp cho kỹ thuật, MC, hậu cần — mỗi bên xác nhận phần của mình bằng văn bản.', 'Send the draft to tech, host and logistics — each confirms their part in writing.') },
                { title: pick('Chạy khô và bấm giờ thật', 'Dry-run with a real clock'), desc: pick('Chạy không khách, bấm giờ từng khối, ghi lại chênh lệch để hiệu chỉnh.', 'Run it without guests, time every block, note the gaps and adjust.') },
                { title: pick('Khoá bản cuối và in ra giấy', 'Lock the final version and print it'), desc: pick('Bản khoá phát cho từng đầu mối; mọi thay đổi sau đó phải đi qua đạo diễn sân khấu.', 'Hand the locked version to each lead; later changes go through the stage manager only.') }
            ]
        },
        {
            kind: 'quote',
            title: pick(
                'Khối "Trích dẫn" — làm nổi một câu chốt',
                'The "Quote" block — highlight one key line'
            ),
            quote: pick(
                'Timeline không phải để chạy đúng từng giây. Nó để khi lệch giờ, cả ê-kíp biết chính xác phải cắt cái gì.',
                'A run of show is not about hitting every second. It is so that when you slip, the whole crew knows exactly what to cut.'
            ),
            quoteBy: pick('Đạo diễn sân khấu — chuỗi hội nghị công nghệ 2.000 khách', 'Stage manager — 2,000-guest tech conference series')
        },
        {
            kind: 'gallery',
            title: pick(
                'Khối "Bộ ảnh" — ảnh hiện thành lưới, bấm vào phóng to',
                'The "Gallery" block — a grid of images, click to zoom'
            ),
            images: [IMG.booth, IMG.stage, IMG.checkin]
        },
        {
            kind: 'linkedItems',
            title: pick(
                'Khối "Liên kết nội dung" — trỏ sang mục khác trong thư viện',
                'The "Linked items" block — point to other library entries'
            ),
            links: [
                { slug: 'vi-du-dan-slug-that-vao-day', label: pick('Dán slug thật của một mục trong thư viện vào ô bên trái', 'Paste a real library slug into the field on the left') },
                { slug: 'vi-du-checklist-tong-duyet', label: pick('Nhãn hiển thị là chữ người đọc nhìn thấy', 'The label is what readers actually see') }
            ]
        }
    ];
}

/**
 * Mục mẫu theo ngôn ngữ đang xem. Chữ trong khối thân bài chỉ có một ngôn ngữ
 * (đúng như mục thật), nên ngôn ngữ được chọn ngay lúc dựng object.
 */
export function buildExampleItem(language: 'vi' | 'en'): EventLibraryItem {
    const pick = (vi: string, en: string) => (language === 'vi' ? vi : en);

    return {
        _id: EXAMPLE_ITEM_ID,
        slug: EXAMPLE_ITEM_ID,
        itemType: 'skill',
        ownership: 'platform',
        visibility: 'private',
        title: {
            vi: 'Điều phối timeline chạy chương trình (Run of Show)',
            en: 'Running a show timeline (Run of Show)'
        },
        summary: {
            vi: 'Cách dựng, đối chiếu và khoá bản timeline chi tiết cho một sự kiện — kèm ví dụ đầy đủ 8 khối thân bài.',
            en: 'How to build, cross-check and lock a minute-by-minute event timeline — with all eight body blocks demonstrated.'
        },
        content: {
            vi: '<p>Đây là ô <strong>Nội dung tự do</strong> — phần duy nhất trong thân bài có song ngữ. Dùng nó khi nội dung không hợp với khối nào ở trên, hoặc khi bạn muốn dán nguyên một đoạn đã soạn sẵn.</p>',
            en: '<p>This is the <strong>Free content</strong> field — the only bilingual part of the body. Use it when your content does not fit any block above, or when you want to paste in something already written.</p>'
        },
        coverImage: IMG.cover,
        category: 'stage_production',
        industries: ['technology', 'fmcg'],
        objectives: ['product_launch', 'brand_awareness'],
        kpis: ['attendance_reach', 'engagement'],
        budgetTier: '500m_2b',
        verification: 'verified',
        depth: 'deep',
        accessLevel: 'public',
        tags: [pick('run of show', 'run of show'), pick('timeline', 'timeline'), pick('đạo diễn sân khấu', 'stage management')],
        metrics: [
            { value: '±90s', label: pick('Sai lệch timeline', 'Timeline drift') },
            { value: '5', label: pick('Bước triển khai', 'Steps to run') },
            { value: '8', label: pick('Loại khối thân bài', 'Body block types') }
        ],
        attachments: [
            {
                name: pick('checklist-tong-duyet.pdf (tệp mẫu)', 'rehearsal-checklist.pdf (sample file)'),
                url: '',
                fileKey: '',
                size: '0.4 MB',
                mime: 'application/pdf'
            }
        ],
        gallery: [],
        sections: buildSections(pick),
        sourceUrl: '',
        sourceName: '',
        authorName: 'Alpha Studio',
        stats: { views: 0, uses: 0 },
        likesCount: 0,
        rating: { average: 0, count: 0 },
        createdAt: '',
        updatedAt: ''
    };
}
