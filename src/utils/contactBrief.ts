export type ContactTopic = 'stage-design' | 'custom-asset' | 'choreography' | 'general';

export const CONTACT_EMAIL = 'giaiphapkhonggiansangtao@gmail.com';

export interface ContactPerson {
    id: 'thanh' | 'duc';
    nameKey: string;
    roleKey: string;
    phone: string;
    whatsappNumber: string;
    zaloUrl: string;
    facebookUrl: string;
}

export const CONTACT_PEOPLE: readonly ContactPerson[] = [
    {
        id: 'thanh',
        nameKey: 'landing.footer.contactNamePrimary',
        roleKey: 'landing.footer.contactRolePrimary',
        phone: '0901555697',
        whatsappNumber: '84901555697',
        zaloUrl: 'https://zalo.me/0901555697',
        facebookUrl: 'https://www.facebook.com/thanh.tan.92560',
    },
    {
        id: 'duc',
        nameKey: 'landing.footer.contactName',
        roleKey: 'landing.footer.contactRoleSecondary',
        phone: '0933805525',
        whatsappNumber: '84933805525',
        zaloUrl: 'https://zalo.me/0933805525',
        facebookUrl: 'https://www.facebook.com/anhduc.nguyen.311/',
    },
] as const;

export const CONTACT_TOPIC_KEYS: readonly ContactTopic[] = [
    'stage-design',
    'custom-asset',
    'choreography',
    'general',
] as const;

const TOPIC_LABELS: Record<'vi' | 'en', Record<ContactTopic, string>> = {
    vi: {
        'stage-design': 'Thiết kế sân khấu 3D / LED / DMX',
        'custom-asset': 'Dựng Asset / Đạo cụ / Nhân vật 3D riêng',
        choreography: 'Biên đạo 3D / StagePack / Vũ đạo theo nhạc',
        general: 'Tư vấn & Hợp tác khác',
    },
    en: {
        'stage-design': '3D Stage / LED / DMX Design',
        'custom-asset': 'Custom 3D Assets / Props / Performers',
        choreography: '3D Choreography / StagePack / Music Sync',
        general: 'General Inquiry & Collaboration',
    },
};

export function parseContactTopic(raw?: string | null, source?: string | null): ContactTopic {
    const norm = String(raw || '').trim().toLowerCase();
    if (norm === 'stage-design' || norm === 'stage') return 'stage-design';
    if (norm === 'custom-asset' || norm === 'asset' || norm === 'assets') return 'custom-asset';
    if (norm === 'choreography' || norm === 'choreo' || norm === 'dance') return 'choreography';
    if (norm === 'general') return 'general';
    if (String(source || '').trim().toLowerCase() === 'led-studio') return 'stage-design';
    return 'general';
}

export interface ContactBriefInput {
    topic: ContactTopic;
    source?: string | null;
    name?: string;
    contact?: string;
    deadline?: string;
    details?: string;
}

export function buildContactBriefText(input: ContactBriefInput, locale: 'vi' | 'en'): string {
    const lang: 'vi' | 'en' = locale === 'en' ? 'en' : 'vi';
    const topicLabel = TOPIC_LABELS[lang][input.topic] || TOPIC_LABELS[lang].general;
    const isVi = lang === 'vi';
    const lines: string[] = [
        isVi ? `[Alpha Studio · Yêu cầu thiết kế / báo giá]` : `[Alpha Studio · Design & Quote Brief]`,
        `${isVi ? 'Hạng mục' : 'Topic'}: ${topicLabel}`,
    ];
    if (String(input.source || '').trim()) {
        lines.push(`${isVi ? 'Nguồn' : 'Source'}: ${String(input.source).trim()}`);
    }
    if (input.name?.trim()) {
        lines.push(`${isVi ? 'Người liên hệ / Studio' : 'Name / Studio'}: ${input.name.trim()}`);
    }
    if (input.contact?.trim()) {
        lines.push(`${isVi ? 'SĐT / Zalo / Email' : 'Phone / Zalo / Email'}: ${input.contact.trim()}`);
    }
    if (input.deadline?.trim()) {
        lines.push(`${isVi ? 'Thời hạn dự kiến' : 'Target deadline'}: ${input.deadline.trim()}`);
    }
    if (input.details?.trim()) {
        lines.push(`${isVi ? 'Chi tiết yêu cầu' : 'Brief details'}:\n${input.details.trim()}`);
    }
    return lines.join('\n');
}

export function buildWhatsAppUrl(whatsappNumber: string, text?: string): string {
    const digits = String(whatsappNumber || '').replace(/[^\d]/g, '');
    const base = `https://wa.me/${digits}`;
    const trimmed = String(text || '').trim();
    return trimmed ? `${base}?text=${encodeURIComponent(trimmed)}` : base;
}

export function buildMailtoUrl(email: string, subject: string, body: string): string {
    const cleanEmail = String(email || '').trim();
    const parts: string[] = [];
    if (subject.trim()) parts.push(`subject=${encodeURIComponent(subject.trim())}`);
    if (body.trim()) parts.push(`body=${encodeURIComponent(body.trim())}`);
    return parts.length ? `mailto:${cleanEmail}?${parts.join('&')}` : `mailto:${cleanEmail}`;
}
