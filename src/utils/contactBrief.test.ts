import { describe, expect, it } from 'vitest';
import {
    CONTACT_EMAIL,
    CONTACT_PEOPLE,
    buildContactBriefText,
    buildMailtoUrl,
    buildWhatsAppUrl,
    parseContactTopic,
} from './contactBrief';

describe('contactBrief', () => {
    it('keeps verified Zalo, WhatsApp, Facebook and email contact channels', () => {
        expect(CONTACT_EMAIL).toBe('giaiphapkhonggiansangtao@gmail.com');
        expect(CONTACT_PEOPLE).toHaveLength(2);
        expect(CONTACT_PEOPLE[0]).toMatchObject({
            id: 'thanh',
            phone: '0901555697',
            whatsappNumber: '84901555697',
            zaloUrl: 'https://zalo.me/0901555697',
            facebookUrl: 'https://www.facebook.com/thanh.tan.92560',
        });
        expect(CONTACT_PEOPLE[1]).toMatchObject({
            id: 'duc',
            phone: '0933805525',
            whatsappNumber: '84933805525',
            zaloUrl: 'https://zalo.me/0933805525',
            facebookUrl: 'https://www.facebook.com/anhduc.nguyen.311/',
        });
    });

    it('parses contact topic aliases and led-studio source default', () => {
        expect(parseContactTopic('stage')).toBe('stage-design');
        expect(parseContactTopic('stage-design')).toBe('stage-design');
        expect(parseContactTopic('asset')).toBe('custom-asset');
        expect(parseContactTopic('assets')).toBe('custom-asset');
        expect(parseContactTopic('custom-asset')).toBe('custom-asset');
        expect(parseContactTopic('choreo')).toBe('choreography');
        expect(parseContactTopic('dance')).toBe('choreography');
        expect(parseContactTopic('choreography')).toBe('choreography');
        expect(parseContactTopic('general', 'led-studio')).toBe('general');
        expect(parseContactTopic('', 'led-studio')).toBe('stage-design');
        expect(parseContactTopic('unknown', null)).toBe('general');
    });

    it('formats VI and EN brief texts cleanly', () => {
        const viText = buildContactBriefText(
            {
                topic: 'custom-asset',
                source: 'led-studio',
                name: 'Minh Event',
                contact: '0909123456',
                deadline: '15/12/2026',
                details: 'Cần dựng 1 cổng chào 3D + 2 vũ công trang phục LED',
            },
            'vi'
        );
        expect(viText).toContain('Hạng mục: Dựng Asset / Đạo cụ / Nhân vật 3D riêng');
        expect(viText).toContain('Nguồn: led-studio');
        expect(viText).toContain('Người liên hệ / Studio: Minh Event');
        expect(viText).toContain('SĐT / Zalo / Email: 0909123456');
        expect(viText).toContain('Thời hạn dự kiến: 15/12/2026');
        expect(viText).toContain('Cần dựng 1 cổng chào 3D + 2 vũ công trang phục LED');

        const enText = buildContactBriefText({ topic: 'choreography' }, 'en');
        expect(enText).toContain('Topic: 3D Choreography / StagePack / Music Sync');
        expect(enText).not.toContain('Brief details');
    });

    it('builds safe WhatsApp and mailto links', () => {
        expect(buildWhatsAppUrl('84901555697')).toBe('https://wa.me/84901555697');
        expect(buildWhatsAppUrl('+84 933 805 525', 'Hello Alpha Studio')).toBe(
            'https://wa.me/84933805525?text=Hello%20Alpha%20Studio'
        );
        const mailto = buildMailtoUrl(CONTACT_EMAIL, 'Stage Brief', 'Need 20x10m LED stage');
        expect(mailto.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
        expect(mailto).toContain('subject=Stage%20Brief');
        expect(mailto).toContain('body=Need%2020x10m%20LED%20stage');
        expect(mailto).not.toContain('+');
    });
});
