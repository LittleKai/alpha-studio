import { afterEach, describe, expect, it, vi } from 'vitest';
import { getToolDownloadStats } from './toolDownloadService';

describe('getToolDownloadStats', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('bypasses a stale browser cache when refreshing admin statistics', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ data: { summary: {}, tools: [], recentActivities: [] } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('localStorage', { getItem: () => null });

        await getToolDownloadStats();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/admin/tool-downloads'),
            expect.objectContaining({ cache: 'no-store' }),
        );
    });
});
