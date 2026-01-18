import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PartnerProfileViewer from '../components/viewers/PartnerProfileViewer';
import type { PartnerCompany } from '../types';

// Static partner data (same as in App.tsx)
const staticPartners: PartnerCompany[] = [
    {
        id: "p1",
        name: "Visionary Events",
        logo: "✨",
        type: 'agency',
        location: 'Hanoi',
        description: 'Visionary Events is a pioneer in premium event organization in Vietnam. We specialize in fashion shows, product launches and large-scale corporate events.',
        contact: { email: 'contact@visionary.vn', phone: '0901234567', website: 'visionary.vn' },
        specialties: ['Luxury Event', 'Fashion Show', 'Brand Launch'],
        isVerified: true,
        coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&h=900&fit=crop",
        projects: [
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop"
        ]
    },
    {
        id: "p2",
        name: "TechStage Pro",
        logo: "🔊",
        type: 'supplier',
        location: 'Ho Chi Minh City',
        description: 'TechStage Pro provides comprehensive solutions for audio, lighting and LED screens. We own the most modern equipment system.',
        contact: { email: 'sales@techstage.com', phone: '0912345678', website: 'techstage.com' },
        specialties: ['Audio System', 'Lighting', 'LED Matrix', '3D Mapping'],
        isVerified: true,
        coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=900&fit=crop",
        projects: [
            "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1506157786151-b8491531f43e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1459749411177-287ce3794512?w=800&h=600&fit=crop"
        ]
    },
    {
        id: "p3",
        name: "Alpha Creative",
        logo: "🧬",
        type: 'agency',
        location: 'Da Nang',
        description: 'Creative Hub focused on Art & Tech. We create interactive experiences, Immersive Art for events and exhibitions.',
        contact: { email: 'hello@alpha.vn', phone: '0987654321', website: 'alphacreative.vn' },
        specialties: ['Interactive Art', 'Exhibition', 'AR/VR'],
        isVerified: true,
        coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&h=900&fit=crop",
        projects: [
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop"
        ]
    },
    {
        id: "p4",
        name: "Viet Cons",
        logo: "🔨",
        type: 'supplier',
        location: 'Hanoi',
        description: 'Booth & Stage production workshop. Skilled craftsmen, modern CNC machinery.',
        contact: { email: 'info@vietcons.vn', phone: '0998877665', website: 'vietcons.vn' },
        specialties: ['Construction', 'Booth', 'Stage'],
        isVerified: false,
        coverImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&h=900&fit=crop",
        projects: [
            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=600&fit=crop"
        ]
    },
    {
        id: "p5",
        name: "Showbiz 360",
        logo: "🎭",
        type: 'agency',
        location: 'Ho Chi Minh City',
        description: 'Agency specializing in Talent Booking & Performance. Providing professional singers, dance groups, MCs.',
        contact: { email: 'booking@showbiz360.vn', phone: '0966554433', website: 'showbiz360.vn' },
        specialties: ['Talent Booking', 'Performance'],
        isVerified: true,
        coverImage: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1600&h=900&fit=crop",
        projects: [
            "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=800&h=600&fit=crop"
        ]
    },
];

const PartnerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [partner, setPartner] = useState<PartnerCompany | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Find partner from static data
        const foundPartner = staticPartners.find(p => p.id === id);

        if (foundPartner) {
            setPartner(foundPartner);
            setError(null);
        } else {
            setError('Partner not found');
        }
        setLoading(false);
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
