import React, { useState } from 'react';
import { useTranslation } from './i18n/context';
import type { CourseData, FeaturedStudent, PartnerCompany } from './types';

// Components
import StudioTool from './components/studio/StudioTool';
import WorkflowDashboard from './components/dashboard/WorkflowDashboard';
import AIServerConnect from './components/dashboard/AIServerConnect';
import CourseViewer from './components/viewers/CourseViewer';
import StudentProfileViewer from './components/viewers/StudentProfileViewer';
import PartnerProfileViewer from './components/viewers/PartnerProfileViewer';
import ThemeSwitcher from './components/ui/ThemeSwitcher';
import LanguageSwitcher from './components/ui/LanguageSwitcher';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'home' | 'studio' | 'workflow' | 'server'>('home');
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<FeaturedStudent | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerCompany | null>(null);

  // Course data
  const courses: CourseData[] = [
    {
      id: "ai-creative-event",
      title: "AI Creative for Event Design",
      tag: "Trending",
      description: "End-to-end process from brainstorming ideas, building moodboards to creating professional Key Visuals with Midjourney & Stable Diffusion.",
      duration: "16",
      lessonsCount: 14,
      progress: 0,
      icon: "✨",
      color: "from-purple-600 to-pink-500",
      syllabus: [
        { title: "Prompting Mindset for Event Concept", duration: "25:00" },
        { title: "Building Moodboard & Styleframe", duration: "45:00" },
        { title: "Developing Multi-channel Key Visual", duration: "60:00" },
        { title: "Inpainting Techniques for Extending Context", duration: "40:00" },
      ]
    },
    {
      id: "ai-pro-design",
      title: "AI Design Expert 2024",
      tag: "Pro Course",
      description: "Master Midjourney, Stable Diffusion and advanced in-painting techniques to create event Key Visuals in 30 seconds.",
      duration: "18",
      lessonsCount: 12,
      progress: 0,
      icon: "💎",
      color: "from-blue-600 to-cyan-500",
      syllabus: [
        { title: "Creative Thinking in AI Era", duration: "20:00" },
        { title: "Mastering Midjourney: Basic to Advanced", duration: "45:00" },
        { title: "Stable Diffusion: Control Every Pixel", duration: "60:00" },
        { title: "Integrating AI into Print Design Workflow", duration: "40:00" },
      ]
    },
    {
      id: "ai-motion-vfx",
      title: "Event Video & VFX with AI",
      tag: "Motion",
      description: "Transform static images into 3D cinematic films. Apply Runway Gen-3, Luma Dream Machine for LED screen visuals.",
      duration: "14",
      lessonsCount: 10,
      progress: 0,
      icon: "🎬",
      color: "from-cyan-500 to-blue-400",
      syllabus: [
        { title: "Video AI Overview: The Motion Revolution", duration: "15:00" },
        { title: "Luma Dream Machine: Surreal Motion", duration: "40:00" },
        { title: "Runway Gen-3: Direct with Words", duration: "50:00" },
      ]
    },
    {
      id: "ai-stage-lighting",
      title: "Stage & Lighting with AI",
      tag: "3D Stage",
      description: "Design 3D stage layouts, simulate lighting and fireworks effects professionally with AI only.",
      duration: "10",
      lessonsCount: 8,
      progress: 0,
      icon: "🎆",
      color: "from-blue-700 to-indigo-600",
      syllabus: [
        { title: "Creating 3D Stage Structures", duration: "30:00" },
        { title: "Simulating Dynamic Lighting Effects", duration: "45:00" },
        { title: "High-quality Rendering for Proposals", duration: "40:00" },
      ]
    }
  ];

  // Featured students data
  const featuredStudents: FeaturedStudent[] = [
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
      socials: { behance: "#", linkedin: "#" }
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
      socials: { behance: "#" }
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
      socials: { behance: "#" }
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

  // Partners data
  const partners: PartnerCompany[] = [
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

  // Render different views based on state
  if (activeView === 'studio') return <StudioTool onBack={() => setActiveView('home')} />;
  if (activeView === 'server') return <AIServerConnect onBack={() => setActiveView('home')} />;
  if (activeView === 'workflow') return <WorkflowDashboard onBack={() => setActiveView('home')} />;
  if (selectedCourse) return <CourseViewer course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  if (selectedStudent) return <StudentProfileViewer student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  if (selectedPartner) return <PartnerProfileViewer partner={selectedPartner} onBack={() => setSelectedPartner(null)} />;

  // Home/Landing View
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-card border-b border-[var(--border-primary)]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveView('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <span className="text-[var(--text-on-accent)] text-2xl font-black">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none">ALPHA STUDIO</span>
              <span className="text-[10px] text-[var(--accent-primary)] font-bold tracking-widest uppercase">AI Academy</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] font-extrabold uppercase tracking-widest">
            <button onClick={() => setActiveView('home')} className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">{t('landing.nav.academy')}</button>
            <button onClick={() => setActiveView('workflow')} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">{t('landing.nav.connect')}</button>
            <button onClick={() => setActiveView('server')} className="text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 px-4 py-1.5 rounded-full hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all">{t('landing.nav.aiCloud')}</button>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <button
              onClick={() => setActiveView('studio')}
              className="hidden lg:block py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all"
            >
              {t('landing.nav.enterStudio')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-28 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-4xl space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">{t('landing.hero.badge')}</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-[var(--text-primary)] leading-[1.1] tracking-tight">
            {t('landing.hero.title1')} <br />
            <span className="text-gradient">{t('landing.hero.title2')}</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-5 pt-6">
            <button onClick={() => setActiveView('studio')} className="py-4 px-12 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-black rounded-2xl shadow-xl hover:bg-[var(--accent-secondary)] transition-all">
              {t('landing.hero.exploreStudio')}
            </button>
            <button onClick={() => setActiveView('server')} className="py-4 px-12 glass-card text-[var(--text-primary)] font-black rounded-2xl hover:border-[var(--accent-primary)] transition-all">
              {t('landing.hero.gpuServer')}
            </button>
          </div>
        </div>
      </section>

      {/* Training Programs Section */}
      <section className="py-24 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-primary)]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-[var(--text-primary)]">{t('landing.courses.title')}</h2>
              <p className="text-[var(--text-secondary)]">{t('landing.courses.subtitle')}</p>
            </div>
            <div className="hidden md:block">
              <span className="text-[11px] font-bold text-[var(--accent-primary)] border-b border-[var(--accent-primary)] pb-1 cursor-pointer">{t('landing.courses.viewAll')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {courses.map(course => (
              <div
                key={course.id}
                className="group glass-card rounded-[32px] p-8 hover:bg-[var(--bg-card)] transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col h-full"
                onClick={() => setSelectedCourse(course)}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                  {course.icon}
                </div>
                <div className="space-y-4 flex-grow">
                  <span className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">
                    {course.tag}
                  </span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(course);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    {t('landing.course.startLearning')}
                  </button>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-tertiary)]">
                  <div className="flex gap-4">
                    <span>⏱ {course.duration} {t('landing.course.hours')}</span>
                    <span>📚 {course.lessonsCount} {t('landing.course.lessons')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Showcase Section */}
      <section className="py-24 border-t border-[var(--border-primary)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">{t('landing.showcase.title')}</h2>
            <p className="text-[var(--text-secondary)]">{t('landing.showcase.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredStudents.map((student, idx) => (
              <div key={idx} onClick={() => setSelectedStudent(student)} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={student.work} alt="Work" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-90"></div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={student.image} alt={student.name} className="w-10 h-10 rounded-full border-2 border-[var(--accent-primary)] object-cover" />
                      <div className="text-left">
                        <h4 className="text-[var(--text-primary)] font-bold text-sm">{student.name}</h4>
                        <p className="text-[10px] text-[var(--accent-primary)] uppercase tracking-wide">{student.role}</p>
                      </div>
                    </div>
                    {student.hired && (
                      <span className="bg-green-500/20 text-green-400 text-[9px] font-black px-2 py-1 rounded-full border border-green-500/30 uppercase tracking-wider">
                        {t('landing.showcase.hired')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={() => setActiveView('workflow')} className="py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all text-sm font-bold text-[var(--accent-primary)]">
              {t('landing.showcase.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* Strategic Partners Section */}
      <section className="py-24 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-primary)]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            <div className="md:w-1/3 space-y-4">
              <h2 className="text-3xl font-black text-[var(--text-primary)]">{t('landing.partners.title')}</h2>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {t('landing.partners.subtitle')}
              </p>
              <button onClick={() => setActiveView('workflow')} className="text-[var(--accent-primary)] text-sm font-bold flex items-center gap-2 hover:underline">
                {t('landing.partners.join')} →
              </button>
            </div>
            <div className="md:w-2/3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {partners.map((partner, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPartner(partner)}
                    className="relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <img src={partner.coverImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop"} alt={partner.name} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]/50 backdrop-blur-md flex items-center justify-center text-2xl mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {partner.logo}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-2">{partner.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
              {t('landing.features.title')} <span className="text-gradient">{t('landing.features.highlight')}</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {t('landing.features.description')}
            </p>
            <ul className="space-y-4">
              {[
                t('landing.features.item1'),
                t('landing.features.item2'),
                t('landing.features.item3'),
                t('landing.features.item4')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[var(--text-primary)] font-bold">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => setActiveView('workflow')} className="py-4 px-10 glass-card rounded-2xl text-[var(--accent-primary)] font-black hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all">
              {t('landing.features.cta')}
            </button>
          </div>
          <div className="relative">
            <div className="aspect-square glass-card rounded-[40px] flex items-center justify-center p-12 overflow-hidden shadow-2xl">
              <div className="grid grid-cols-2 gap-4 w-full">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-40 rounded-3xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] flex items-center justify-center text-4xl animate-pulse`}>
                    {i === 1 ? '🎨' : i === 2 ? '📂' : i === 3 ? '⚙️' : '💻'}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--accent-primary)] rounded-full blur-[60px] opacity-30"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)]/50 flex items-center justify-center">
              <span className="text-[var(--text-primary)] font-bold">A</span>
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-widest">ALPHA STUDIO ACADEMY</span>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
            © 2024 {t('landing.footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
