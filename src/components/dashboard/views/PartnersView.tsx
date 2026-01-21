import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import { getPartners, createPartner, updatePartner, deletePartner, publishPartner, unpublishPartner } from '../../../services/partnerService';
import type { Partner, PartnerInput } from '../../../services/partnerService';
import PartnerRegistrationModal from '../../modals/PartnerRegistrationModal';
import PartnerEditModal from '../../modals/PartnerEditModal';

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
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('all');

    const fetchPartners = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            // Admin/mod can see all partners, regular users only see published
            if (!isAdmin) {
                params.status = 'published';
            }
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
    }, [partnerTypeFilter, searchQuery, isAdmin]);

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
        logo: string;
    }) => {
        try {
            // Map the form data to the API format
            const partnerData: PartnerInput = {
                companyName: formData.companyName,
                description: {
                    vi: formData.description,
                    en: formData.description,
                },
                logo: formData.logo,
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

    const handleUpdatePartner = async (data: PartnerInput) => {
        if (!editingPartner) return;
        try {
            await updatePartner(editingPartner._id, data);
            await fetchPartners();
            setEditingPartner(null);
            setShowEditModal(false);
        } catch (err) {
            console.error('Error updating partner:', err);
            throw err;
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

    const getLocalizedText = (obj: { vi?: string; en?: string } | undefined): string => {
        if (!obj) return '';
        if (language === 'vi') return obj.vi || obj.en || '';
        return obj.en || obj.vi || '';
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

    const getStatusBadge = (status: string): { color: string; label: string } => {
        const badges: Record<string, { color: string; label: string }> = {
            draft: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Draft' },
            published: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Published' },
            archived: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Archived' },
        };
        return badges[status] || badges.draft;
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
                        partners.map((partner) => {
                            const statusBadge = getStatusBadge(partner.status);
                            return (
                                <div
                                    key={partner._id}
                                    className="bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] rounded-2xl p-6 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] group relative overflow-hidden flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] flex items-center justify-center text-4xl shadow-inner border border-[var(--border-primary)] overflow-hidden">
                                            {partner.logo && partner.logo.startsWith('http') ? (
                                                <img src={partner.logo} alt={partner.companyName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{getPartnerLogo(partner)}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {partner.featured && (
                                                <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-500/20">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    {language === 'vi' ? 'Đã xác thực' : 'Verified'}
                                                </span>
                                            )}
                                            {isAdmin && (
                                                <span className={`${statusBadge.color} px-2 py-0.5 rounded text-[10px] font-bold border`}>
                                                    {statusBadge.label}
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

                                    {/* Skills Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {partner.skills && partner.skills.length > 0 ? (
                                            partner.skills.slice(0, 4).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-1 rounded border border-[var(--border-primary)]"
                                                >
                                                    #{skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className={`text-[10px] ${getPartnerTypeColor(partner.partnerType)} px-2 py-1 rounded border border-current/20`}>
                                                #{partner.partnerType}
                                            </span>
                                        )}
                                        {partner.skills && partner.skills.length > 4 && (
                                            <span className="text-[10px] text-[var(--text-tertiary)] px-2 py-1">
                                                +{partner.skills.length - 4}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contact Actions */}
                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        {partner.email ? (
                                            <a
                                                href={`mailto:${partner.email}`}
                                                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--border-primary)] transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                                {language === 'vi' ? 'Liên hệ' : 'Contact'}
                                            </a>
                                        ) : (
                                            <div></div>
                                        )}
                                        {partner.website ? (
                                            <a
                                                href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--bg-secondary)] transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                </svg>
                                                Website
                                            </a>
                                        ) : (
                                            <div></div>
                                        )}
                                    </div>

                                    {/* Admin Actions */}
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]">
                                            <button
                                                onClick={() => {
                                                    setEditingPartner(partner);
                                                    setShowEditModal(true);
                                                }}
                                                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] flex items-center justify-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                                {language === 'vi' ? 'Sửa' : 'Edit'}
                                            </button>
                                            {partner.status !== 'published' ? (
                                                <button
                                                    onClick={() => handlePublishPartner(partner._id)}
                                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-emerald-500 text-white hover:bg-emerald-600"
                                                >
                                                    {language === 'vi' ? 'Đăng' : 'Publish'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnpublishPartner(partner._id)}
                                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                                                >
                                                    {language === 'vi' ? 'Ẩn' : 'Unpublish'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeletePartner(partner._id)}
                                                className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                                                title={language === 'vi' ? 'Xóa' : 'Delete'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Partner Registration Modal */}
            <PartnerRegistrationModal
                isOpen={showPartnerModal}
                onClose={() => setShowPartnerModal(false)}
                onSubmit={handleAddPartner}
            />

            {/* Partner Edit Modal */}
            {editingPartner && (
                <PartnerEditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingPartner(null);
                    }}
                    onSubmit={handleUpdatePartner}
                    partner={editingPartner}
                />
            )}
        </div>
    );
};

export default PartnersView;
