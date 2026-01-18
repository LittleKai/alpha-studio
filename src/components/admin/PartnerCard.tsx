import React, { useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { Partner } from '../../services/partnerService';

interface PartnerCardProps {
    partner: Partner;
    onEdit: (partner: Partner) => void;
    onDelete: (id: string) => void;
    onPublish: (id: string) => void;
    onUnpublish: (id: string) => void;
}

const PartnerCard: React.FC<PartnerCardProps> = ({
    partner,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish
}) => {
    const { t, language } = useTranslation();

    const description = language === 'vi' ? partner.description?.vi : partner.description?.en;

    const getTypeLabel = useCallback((type: string) => {
        const labels: Record<string, string> = {
            'technology': t('admin.partners.types.technology'),
            'education': t('admin.partners.types.education'),
            'enterprise': t('admin.partners.types.enterprise'),
            'startup': t('admin.partners.types.startup'),
            'government': t('admin.partners.types.government'),
            'other': t('admin.partners.types.other'),
        };
        return labels[type] || type;
    }, [t]);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'draft':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'archived':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    }, []);

    return (
        <div className="glass-card rounded-2xl overflow-hidden group hover:border-[var(--accent-primary)] transition-all duration-300">
            {/* Logo */}
            <div className="relative aspect-video bg-[var(--bg-secondary)]">
                {partner.logo ? (
                    <img
                        src={partner.logo}
                        alt={partner.companyName}
                        className="w-full h-full object-contain p-4"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(partner.status)}`}>
                        {t(`admin.partners.status.${partner.status}`)}
                    </span>
                </div>

                {/* Featured Badge */}
                {partner.featured && (
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-500 text-white">
                            {t('admin.partners.featured')}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Type */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                        {getTypeLabel(partner.partnerType)}
                    </span>
                </div>

                {/* Company Name */}
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    {partner.companyName}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">
                    {description || t('admin.partners.noDescription')}
                </p>

                {/* Contact Info */}
                <div className="flex flex-col gap-1 text-xs text-[var(--text-tertiary)] mb-4">
                    {partner.email && (
                        <span className="flex items-center gap-1 truncate">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            {partner.email}
                        </span>
                    )}
                    {partner.website && (
                        <span className="flex items-center gap-1 truncate">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                            </svg>
                            {partner.website}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-primary)]">
                    <button
                        onClick={() => onEdit(partner)}
                        className="flex-1 py-2 px-3 text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        {t('admin.partners.edit')}
                    </button>

                    {partner.status === 'draft' && (
                        <button
                            onClick={() => onPublish(partner._id)}
                            className="flex-1 py-2 px-3 text-sm font-medium bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {t('admin.partners.publish')}
                        </button>
                    )}

                    {partner.status === 'published' && (
                        <button
                            onClick={() => onUnpublish(partner._id)}
                            className="flex-1 py-2 px-3 text-sm font-medium bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                            {t('admin.partners.unpublish')}
                        </button>
                    )}

                    <button
                        onClick={() => onDelete(partner._id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnerCard;
