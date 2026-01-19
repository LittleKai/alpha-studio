import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import { getPartners, createPartner, deletePartner, publishPartner, unpublishPartner } from '../../../services/partnerService';
import type { Partner, PartnerInput } from '../../../services/partnerService';
import PartnerRegistrationModal from '../../modals/PartnerRegistrationModal';

interface PartnersViewProps {
    searchQuery: string;
}

const PartnersView: React.FC<PartnersViewProps> = ({ searchQuery }) => {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'mod';

    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('all');

    const fetchPartners = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { status: 'published' };
            if (partnerTypeFilter !== 'all') params.partnerType = partnerTypeFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await getPartners(params);
            setPartners(response.data);
        } catch (err) {
            console.error('Error fetching partners:', err);
            setError(err instanceof Error ? err.message : 'Failed to load partners');
        } finally {
            setIsLoading(false);
        }
    }, [partnerTypeFilter, searchQuery]);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    const handleAddPartner = async (formData: {
        companyName: string;
        type: 'agency' | 'supplier';
        email: string;
        phone: string;
        website: string;
        location: string;
        description: string;
        specialties: string[];
    }) => {
        try {
            // Map the form data to the API format
            const partnerData: PartnerInput = {
                companyName: formData.companyName,
                description: {
                    vi: formData.description,
                    en: formData.description,
                },
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                address: formData.location,
                partnerType: formData.type === 'agency' ? 'enterprise' : 'other',
                status: 'draft',
            };

            await createPartner(partnerData);
            await fetchPartners();
            setShowPartnerModal(false);
        } catch (err) {
            console.error('Error creating partner:', err);
            alert(err instanceof Error ? err.message : 'Failed to create partner');
        }
    };

    const handleDeletePartner = async (partnerId: string) => {
        if (!confirm(t('partner.confirmDelete') || 'Are you sure you want to delete this partner?')) return;
        try {
            await deletePartner(partnerId);
            await fetchPartners();
        } catch (err) {
            console.error('Error deleting partner:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete partner');
        }
    };

    const handlePublishPartner = async (partnerId: string) => {
        try {
            await publishPartner(partnerId);
            await fetchPartners();
        } catch (err) {
            console.error('Error publishing partner:', err);
            alert(err instanceof Error ? err.message : 'Failed to publish partner');
        }
    };

    const handleUnpublishPartner = async (partnerId: string) => {
        try {
            await unpublishPartner(partnerId);
            await fetchPartners();
        } catch (err) {
            console.error('Error unpublishing partner:', err);
            alert(err instanceof Error ? err.message : 'Failed to unpublish partner');
        }
    };

    const getLocalizedText = (obj: { vi: string; en: string } | undefined): string => {
        if (!obj) return '';
        return language === 'vi' ? obj.vi || obj.en : obj.en || obj.vi;
    };

    const getPartnerTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            technology: 'bg-blue-500/20 text-blue-400',
            education: 'bg-green-500/20 text-green-400',
            enterprise: 'bg-purple-500/20 text-purple-400',
            startup: 'bg-orange-500/20 text-orange-400',
            government: 'bg-red-500/20 text-red-400',
            other: 'bg-gray-500/20 text-gray-400',
        };
        return colors[type] || colors.other;
    };

    const getPartnerLogo = (partner: Partner): string => {
        if (partner.logo && partner.logo.startsWith('http')) {
            return partner.logo;
        }
        // Return emoji or default based on type
        const emojis: Record<string, string> = {
            technology: '💻',
            education: '📚',
            enterprise: '🏢',
            startup: '🚀',
            government: '🏛️',
            other: '🤝',
        };
        return emojis[partner.partnerType] || '🤝';
    };

    return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                        {t('workflow.partners.title') || 'Đối tác liên kết'}
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {t('workflow.partners.subtitle') || 'Kết nối với các đối tác uy tín trong ngành'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowPartnerModal(true)}
                        className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <span>+</span> {t('workflow.partners.register') || 'Thêm đối tác'}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
                <button
                    onClick={() => setPartnerTypeFilter('all')}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                        partnerTypeFilter === 'all'
                            ? 'bg-[var(--accent-primary)] text-black shadow-lg'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    {t('partner.all') || 'Tất cả'}
                </button>
                <button
                    onClick={() => setPartnerTypeFilter('technology')}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                        partnerTypeFilter === 'technology'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    {t('partner.technology') || 'Công nghệ'}
                </button>
                <button
                    onClick={() => setPartnerTypeFilter('education')}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                        partnerTypeFilter === 'education'
                            ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    {t('partner.education') || 'Giáo dục'}
                </button>
                <button
                    onClick={() => setPartnerTypeFilter('enterprise')}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                        partnerTypeFilter === 'enterprise'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                    {t('partner.enterprise') || 'Doanh nghiệp'}
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                    {error}
                    <button onClick={fetchPartners} className="ml-4 underline hover:no-underline">
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            )}

            {/* Partners Grid */}
            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {partners.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">
                            {t('workflow.partners.noPartners') || 'Chưa có đối tác nào'}
                        </div>
                    ) : (
                        partners.map((partner) => (
                            <div
                                key={partner._id}
                                className="bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] rounded-2xl p-6 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] group relative overflow-hidden flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] flex items-center justify-center shadow-inner border border-[var(--border-primary)] overflow-hidden">
                                        {partner.logo && partner.logo.startsWith('http') ? (
                                            <img src={partner.logo} alt={partner.companyName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl">{getPartnerLogo(partner)}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPartnerTypeColor(partner.partnerType)}`}>
                                            {partner.partnerType}
                                        </span>
                                        {partner.featured && (
                                            <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full border border-yellow-500/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Company Name */}
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                    {partner.companyName}
                                </h3>

                                {/* Address */}
                                <p className="text-xs text-[var(--text-tertiary)] mb-4 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    {partner.address || 'Vietnam'}
                                </p>

                                {/* Description */}
                                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3 flex-grow">
                                    {getLocalizedText(partner.description)}
                                </p>

                                {/* Contact Actions */}
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    {partner.email && (
                                        <a
                                            href={`mailto:${partner.email}`}
                                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--border-primary)] transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                            </svg>
                                            {t('workflow.partners.contact') || 'Liên hệ'}
                                        </a>
                                    )}
                                    {partner.website && (
                                        <a
                                            href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                            </svg>
                                            {t('workflow.partners.website') || 'Website'}
                                        </a>
                                    )}
                                </div>

                                {/* Admin Actions */}
                                {isAdmin && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]">
                                        {partner.status === 'published' ? (
                                            <button
                                                onClick={() => handleUnpublishPartner(partner._id)}
                                                className="flex-1 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-500/30 transition-colors"
                                            >
                                                Unpublish
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePublishPartner(partner._id)}
                                                className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                                            >
                                                Publish
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeletePartner(partner._id)}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Partner Registration Modal */}
            <PartnerRegistrationModal
                isOpen={showPartnerModal}
                onClose={() => setShowPartnerModal(false)}
                onSubmit={handleAddPartner}
            />
        </div>
    );
};

export default PartnersView;
