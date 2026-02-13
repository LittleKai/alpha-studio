import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PartnerProfileViewer from '../components/viewers/PartnerProfileViewer';
import { getPartnerBySlug } from '../services/partnerService';
import type { Partner } from '../services/partnerService';

const PartnerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('Partner not found');
            setLoading(false);
            return;
        }

        const fetchPartner = async () => {
            try {
                const response = await getPartnerBySlug(id);
                if (response.success && response.data) {
                    setPartner(response.data);
                    setError(null);
                } else {
                    setError('Partner not found');
                }
            } catch {
                setError('Partner not found');
            } finally {
                setLoading(false);
            }
        };

        fetchPartner();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <p className="text-[var(--text-secondary)]">Loading partner...</p>
                </div>
            </div>
        );
    }

    if (error || !partner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Partner Not Found</h2>
                    <p className="text-[var(--text-secondary)]">{error || 'The partner you are looking for does not exist.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return <PartnerProfileViewer partner={partner} onBack={() => navigate('/')} />;
};

export default PartnerPage;
