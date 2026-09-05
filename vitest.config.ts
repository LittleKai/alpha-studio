import { defineConfig } from 'vitest/config';

// Chỉ chạy logic thuần trong `src/services` và `src/utils` — không component, không DOM.
// Tách khỏi `vite.config.ts` để cấu hình build của app không bị ảnh hưởng.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
