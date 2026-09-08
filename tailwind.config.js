/**
 * Thay cho cấu hình vốn nằm inline trong index.html khi còn dùng Play CDN:
 *
 *   tailwind.config = { darkMode: ['class', '[data-theme="dark"]'] }
 *
 * Giữ nguyên `darkMode` đó: biến `dark:` phải bám theo nút đổi theme của app
 * (`html[data-theme="dark"]`), KHÔNG theo `prefers-color-scheme` của OS.
 *
 * Cố ý KHÔNG bật plugin @tailwindcss/typography: Play CDN được nạp trần
 * (`https://cdn.tailwindcss.com`, không có `?plugins=typography`) nên các class
 * `prose` ở CourseViewer.tsx:92 và CoursePage.tsx:1168 hiện KHÔNG có tác dụng
 * gì. Bật plugin lên sẽ làm hai chỗ đó đổi giao diện — một thay đổi nằm ngoài
 * phạm vi việc bỏ CDN. Muốn `prose` chạy thật thì bật riêng và rà lại 2 trang đó.
 */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}'
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {}
    },
    plugins: []
};
