import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentProfileViewer from '../components/viewers/StudentProfileViewer';
import type { FeaturedStudent } from '../types';

// Static student data (same as in App.tsx)
const staticStudents: FeaturedStudent[] = [
    {
        id: "s1",
        name: "Minh Thu",
        role: "Event Director",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1519671482502-9759101d4561?w=800&h=600&fit=crop",
        hired: true,
        bio: "Minh Thu has 5 years of experience in the event industry. After the AI course, she applied Midjourney to reduce concept development time by 70%. Her style leans towards elegance, sophistication and natural lighting. Currently working at a Global Agency.",
        skills: ["Midjourney", "Event Planning", "Concept Art", "Luxury Design"],
        gallery: [
            "https://images.unsplash.com/photo-1519671482502-9759101d4561?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=600&fit=crop"
        ],
        socials: { facebook: "#", linkedin: "#" }
    },
    {
        id: "s2",
        name: "Quang Huy",
        role: "3D Artist",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop",
        hired: true,
        bio: "Huy is a talented 3D Artist. He combines Blender and Stable Diffusion to create surreal virtual stages. His works are highly appreciated for feasibility and Futurist aesthetics. He specializes in EDM music stages and Tech Shows.",
        skills: ["Blender", "Stable Diffusion", "Unreal Engine", "Cyberpunk Style"],
        gallery: [
            "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop"
        ],
        socials: { facebook: "#" }
    },
    {
        id: "s3",
        name: "Lan Anh",
        role: "Concept Artist",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=600&fit=crop",
        hired: false,
        bio: "Lan Anh is a final-year Graphic Design student. She joined Alpha Studio to enhance AI skills and is looking for internship opportunities at Creative Agencies. Her style is creative, artistic and colorful.",
        skills: ["Photoshop", "AI Generative Fill", "Illustration", "Digital Painting"],
        gallery: [
            "https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop"
        ],
        socials: { linkedin: "#" }
    },
    {
        id: "s4",
        name: "Hoang Nam",
        role: "VFX Supervisor",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1614726365723-49cfae92782f?w=800&h=600&fit=crop",
        hired: true,
        bio: "Nam specializes in cinematic VFX and video mapping. With extensive knowledge of Runway and Luma, he creates stunning background videos for events.",
        skills: ["Runway Gen-2", "After Effects", "VFX", "Projection Mapping"],
        gallery: [
            "https://images.unsplash.com/photo-1614726365723-49cfae92782f?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop"
        ],
        socials: { linkedin: "#" }
    },
    {
        id: "s5",
        name: "Thao My",
        role: "AI Fashion Design",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1537832816519-0439d612e4e6?w=800&h=600&fit=crop",
        hired: false,
        bio: "My combines AI to design performance costumes and PG outfits for events. Her designs are always unique and aligned with event concepts.",
        skills: ["Stable Diffusion", "Fashion Design", "Pattern Making"],
        gallery: [
            "https://images.unsplash.com/photo-1537832816519-0439d612e4e6?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1490481651871-32d2e76f897d?w=800&h=600&fit=crop"
        ],
        socials: { facebook: "#" }
    },
    {
        id: "s6",
        name: "Duc Anh",
        role: "Game Environment",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
        hired: true,
        bio: "Duc Anh transitioned from Game to Virtual Events. He uses Unreal Engine and AI to create Metaverse spaces for online events.",
        skills: ["Unreal Engine", "Environment Design", "Metaverse"],
        gallery: [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&h=600&fit=crop"
        ],
        socials: { linkedin: "#" }
    }
];

const StudentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<FeaturedStudent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Find student from static data
        const foundStudent = staticStudents.find(s => s.id === id);

        if (foundStudent) {
            setStudent(foundStudent);
            setError(null);
        } else {
            setError('Student not found');
        }
        setLoading(false);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <p className="text-[var(--text-secondary)]">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Student Not Found</h2>
                    <p className="text-[var(--text-secondary)]">{error || 'The student profile you are looking for does not exist.'}</p>
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

    return <StudentProfileViewer student={student} onBack={() => navigate('/')} />;
};

export default StudentPage;
