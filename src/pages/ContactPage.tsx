import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { useTranslation } from '../i18n/context';
import SEOHead, { SITE_URL } from '../components/ui/SEOHead';
import { buildBreadcrumbJsonLd } from '../utils/seoMeta';
import {
    CONTACT_EMAIL,
    CONTACT_PEOPLE,
    CONTACT_TOPIC_KEYS,
    type ContactTopic,
    buildContactBriefText,
    buildMailtoUrl,
    buildWhatsAppUrl,
    parseContactTopic,
} from '../utils/contactBrief';

const IconPhone = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconCopy = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const IconCheck = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 13 4 4L19 7" />
    </svg>
);

const IconMail = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const IconZalo = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <path d="M9 9h6l-6 6h6" />
    </svg>
);

const IconWhatsApp = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 20.5l1.5-5.3A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M9.5 8.8c.2-.4.5-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.2.1.4-.1.6l-.5.6a6.4 6.4 0 0 0 2.6 2.6l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.3.1.4.3.4.5v.5c0 .3-.2.6-.5.8-.5.3-1.5.5-2.9-.1-1.6-.7-3.4-2.5-4.1-4.1-.6-1.4-.4-2.4-.1-2.9Z" />
    </svg>
);

const IconFacebook = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.6V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H7.7v3h2.6v8h3.2z" />
    </svg>
);

const IconExternal = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
    </svg>
);

export default function ContactPage() {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const sourceParam = searchParams.get('source');
    const urlTopic = parseContactTopic(searchParams.get('topic'), sourceParam);

    const [topic, setTopic] = useState<ContactTopic>(urlTopic);
    const [name, setName] = useState<string>('');
    const [contactInfo, setContactInfo] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [recipientId, setRecipientId] = useState<'thanh' | 'duc'>('thanh');
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
    const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

    useEffect(() => {
        setTopic(urlTopic);
    }, [urlTopic]);

    useEffect(() => {
        if (!user) return;
        setName((prev) => (prev ? prev : user.name || ''));
        setContactInfo((prev) => (prev ? prev : user.email || ''));
    }, [user]);

    const handleSelectTopic = (nextTopic: ContactTopic) => {
        setTopic(nextTopic);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('topic', nextTopic);
        setSearchParams(nextParams, { replace: true });
    };

    const selectedPerson = useMemo(
        () => CONTACT_PEOPLE.find((p) => p.id === recipientId) || CONTACT_PEOPLE[0],
        [recipientId]
    );

    const locale: 'vi' | 'en' = language === 'en' ? 'en' : 'vi';

    const briefText = useMemo(
        () =>
            buildContactBriefText(
                {
                    topic,
                    source: sourceParam,
                    name,
                    contact: contactInfo,
                    deadline,
                    details,
                },
                locale
            ),
        [topic, sourceParam, name, contactInfo, deadline, details, locale]
    );

    const emailSubject = useMemo(() => {
        const topicLabel = t(`landing.contact.topics.${topic}.label`);
        return `[Alpha Studio] ${topicLabel}`;
    }, [t, topic]);

    const whatsappHref = useMemo(
        () => buildWhatsAppUrl(selectedPerson.whatsappNumber, briefText),
        [selectedPerson.whatsappNumber, briefText]
    );

    const mailtoHref = useMemo(
        () => buildMailtoUrl(CONTACT_EMAIL, emailSubject, briefText),
        [emailSubject, briefText]
    );

    const handleCopyPhone = async (phone: string) => {
        try {
            await navigator.clipboard.writeText(phone);
            setCopiedPhone(phone);
            window.setTimeout(() => {
                setCopiedPhone((curr) => (curr === phone ? null : curr));
            }, 2200);
        } catch {
            // Clipboard fallback ignored if blocked
        }
    };

    const handleCopyBrief = async () => {
        try {
            await navigator.clipboard.writeText(briefText);
            setCopiedBrief(true);
            window.setTimeout(() => setCopiedBrief(false), 2400);
        } catch {
            // Clipboard fallback ignored if blocked
        }
    };

    const seoTitle =
        locale === 'en' ? 'Contact & Custom 3D Design Brief' : 'Liên hệ & Đặt thiết kế 3D theo yêu cầu';
    const seoDesc = t('landing.contact.subtitle');

    const contactJsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: seoTitle,
            description: seoDesc,
            url: `${SITE_URL}/contact`,
            mainEntity: {
                '@type': 'Organization',
                name: 'Alpha Studio',
                url: SITE_URL,
                email: CONTACT_EMAIL,
                sameAs: CONTACT_PEOPLE.map((p) => p.facebookUrl),
            },
        },
        buildBreadcrumbJsonLd([
            { name: t('common.home', locale === 'en' ? 'Home' : 'Trang chủ'), path: '/' },
            { name: t('landing.nav.contact'), path: '/contact' },
        ]),
    ];

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDesc}
                path="/contact"
                jsonLd={contactJsonLd}
            />

            <section className="relative overflow-hidden border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                    {sourceParam === 'led-studio' && (
                        <div className="mb-4">
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[var(--accent-primary)]/40 bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                                <span>{t('landing.contact.fromLedStudioBadge')}</span>
                            </span>
                        </div>
                    )}

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.025em] leading-[1.12] text-balance text-[var(--text-primary)]">
                        {t('landing.contact.title')}
                    </h1>
                    <p className="mt-4 max-w-[65ch] text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed text-pretty">
                        {t('landing.contact.subtitle')}
                    </p>

                    <div className="mt-9">
                        <p className="text-sm font-bold text-[var(--text-primary)] mb-3.5">
                            {t('landing.contact.topicHeading')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" role="radiogroup" aria-label={t('landing.contact.topicHeading')}>
                            {CONTACT_TOPIC_KEYS.map((key) => {
                                const active = topic === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        data-contact-topic={key}
                                        onClick={() => handleSelectTopic(key)}
                                        className={`relative text-left p-5 rounded-2xl border transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${
                                            active
                                                ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/35 bg-[var(--bg-secondary)] shadow-lg'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/60 hover:-translate-y-0.5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)] leading-snug">
                                                {t(`landing.contact.topics.${key}.label`)}
                                            </span>
                                            {active && (
                                                <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-sky-600 text-white" aria-hidden="true">
                                                    <IconCheck className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </div>
                                        <span className="mt-1.5 block text-xs font-bold text-[var(--accent-primary)]">
                                            {t(`landing.contact.topics.${key}.short`)}
                                        </span>
                                        <span className="mt-2 block text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t(`landing.contact.topics.${key}.desc`)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Quick Brief Builder */}
                    <div className="lg:col-span-7 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
                                {t('landing.contact.formTitle')}
                            </h2>
                            <p className="mt-1.5 text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
                                {t('landing.contact.formSubtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="block space-y-2">
                                <span className="block text-sm font-bold text-[var(--text-primary)]">
                                    {t('landing.contact.nameLabel')}
                                </span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('landing.contact.namePlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-sm sm:text-[15px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-colors"
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="block text-sm font-bold text-[var(--text-primary)]">
                                    {t('landing.contact.contactInfoLabel')}
                                </span>
                                <input
                                    type="text"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                    placeholder={t('landing.contact.contactInfoPlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-sm sm:text-[15px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-colors"
                                />
                            </label>
                        </div>

                        <label className="block space-y-2">
                            <span className="block text-sm font-bold text-[var(--text-primary)]">
                                {t('landing.contact.deadlineLabel')}
                            </span>
                            <input
                                type="text"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                placeholder={t('landing.contact.deadlinePlaceholder')}
                                className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-sm sm:text-[15px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-colors"
                            />
                        </label>

                        <div className="space-y-2">
                            <span className="block text-sm font-bold text-[var(--text-primary)]">
                                {t('landing.contact.recipientLabel')}
                            </span>
                            <div
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)]"
                                role="group"
                                aria-label={t('landing.contact.recipientLabel')}
                            >
                                {CONTACT_PEOPLE.map((person) => {
                                    const active = person.id === selectedPerson.id;
                                    return (
                                        <button
                                            key={person.id}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setRecipientId(person.id)}
                                            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold text-center whitespace-nowrap cursor-pointer transition-all ${
                                                active
                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                            }`}
                                        >
                                            {t(person.nameKey)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <label className="block space-y-2">
                            <span className="block text-sm font-bold text-[var(--text-primary)]">
                                {t('landing.contact.detailsLabel')}
                            </span>
                            <textarea
                                rows={4}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder={t(`landing.contact.topics.${topic}.placeholder`)}
                                className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-sm sm:text-[15px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-colors"
                            />
                        </label>

                        <div className="space-y-2">
                            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                                {t('landing.contact.previewLabel')}
                            </span>
                            <pre className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
                                {briefText}
                            </pre>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                                <IconWhatsApp className="h-4 w-4 shrink-0" />
                                <span>{t('landing.contact.btnWhatsApp')}</span>
                            </a>

                            <button
                                type="button"
                                onClick={handleCopyBrief}
                                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                            >
                                {copiedBrief ? <IconCheck className="h-4 w-4 shrink-0" /> : <IconCopy className="h-4 w-4 shrink-0" />}
                                <span role="status" aria-live="polite">
                                    {copiedBrief ? t('landing.contact.copiedBrief') : t('landing.contact.btnCopyBrief')}
                                </span>
                            </button>

                            <a
                                href={mailtoHref}
                                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                                <IconMail className="h-4 w-4 shrink-0" />
                                <span>{t('landing.contact.btnEmail')}</span>
                            </a>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--text-tertiary)] leading-relaxed">
                            {t('landing.contact.briefNote')}
                        </p>
                    </div>

                    {/* Direct Channels */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 sm:p-7 space-y-5">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
                                    {t('landing.contact.directTitle')}
                                </h2>
                                <p className="mt-1.5 text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
                                    {t('landing.contact.directSubtitle')}
                                </p>
                            </div>

                            <ol className="divide-y divide-[var(--border-primary)] border-y border-[var(--border-primary)]">
                                {CONTACT_PEOPLE.map((person, index) => {
                                    const isCopied = copiedPhone === person.phone;
                                    const personName = t(person.nameKey);
                                    const personWhatsApp = buildWhatsAppUrl(person.whatsappNumber, briefText);
                                    return (
                                        <li key={person.id} className="py-5 space-y-3.5">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-baseline gap-2.5">
                                                        <span className="text-xs font-extrabold tabular-nums text-[var(--accent-primary)]">
                                                            {String(index + 1).padStart(2, '0')}
                                                        </span>
                                                        <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
                                                            {personName}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 pl-6 text-xs sm:text-sm text-[var(--text-secondary)]">
                                                        {t(person.roleKey)}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyPhone(person.phone)}
                                                    title={t('landing.footer.contactCopyHint')}
                                                    aria-label={`${t('landing.footer.contactCopyHint')}: ${person.phone} (${personName})`}
                                                    className={`min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-extrabold tabular-nums tracking-wide cursor-pointer transition-all ${
                                                        isCopied
                                                            ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                                                            : 'border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5'
                                                    }`}
                                                >
                                                    <IconPhone className="h-4 w-4 shrink-0" />
                                                    <span>{person.phone}</span>
                                                    {isCopied ? (
                                                        <span className="inline-flex items-center gap-1 text-xs" role="status" aria-live="polite">
                                                            <IconCheck className="h-3.5 w-3.5" />
                                                            <span>{t('landing.footer.contactCopied')}</span>
                                                        </span>
                                                    ) : (
                                                        <IconCopy className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                <a
                                                    href={person.zaloUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all"
                                                >
                                                    <IconZalo className="h-4 w-4 shrink-0" />
                                                    <span>{t('landing.footer.contactZalo')}</span>
                                                    <IconExternal className="h-3.5 w-3.5 opacity-80" />
                                                </a>
                                                <a
                                                    href={personWhatsApp}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all"
                                                >
                                                    <IconWhatsApp className="h-4 w-4 shrink-0" />
                                                    <span>{t('landing.footer.contactWhatsApp')}</span>
                                                    <IconExternal className="h-3.5 w-3.5 opacity-80" />
                                                </a>
                                                <a
                                                    href={person.facebookUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`${t('landing.footer.contactFacebook')} - ${personName}`}
                                                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all"
                                                >
                                                    <IconFacebook className="h-4 w-4 shrink-0" />
                                                    <span>{t('landing.footer.contactFacebook')}</span>
                                                    <IconExternal className="h-3.5 w-3.5 opacity-80" />
                                                </a>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>

                            <div className="space-y-2 pt-1">
                                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                                    {t('landing.contact.emailTitle')}
                                </span>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <a
                                        href={mailtoHref}
                                        className="text-sm sm:text-[15px] font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] break-all transition-colors"
                                    >
                                        {CONTACT_EMAIL}
                                    </a>
                                    <a
                                        href={mailtoHref}
                                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--accent-primary)] hover:underline"
                                    >
                                        <span>{t('landing.contact.emailAction')}</span>
                                        <IconExternal className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 sm:p-6 text-sm text-[var(--text-secondary)] space-y-3 leading-relaxed">
                            <p>{t('landing.contact.backToStudioHint')}</p>
                            <div className="flex flex-wrap gap-3 pt-1">
                                <Link
                                    to="/services"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                                >
                                    <span>{t('landing.services.heroTitle')}</span>
                                    <IconExternal className="h-3.5 w-3.5" />
                                </Link>
                                <Link
                                    to="/studio/led-studio"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-xs font-bold text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors"
                                >
                                    <span>Alpha LED Studio</span>
                                    <IconExternal className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
