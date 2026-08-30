import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import SEOHead from '../components/ui/SEOHead';
import Login from '../components/ui/Login';
import { getFeaturedCourses, Course } from '../services/courseService';
import { getPartners } from '../services/partnerService';
import type { Partner } from '../services/partnerService';
import { getFeaturedStudents } from '../services/featuredStudentsService';
import type { FeaturedStudent } from '../types';

import ShowcaseHeader from '../components/showcase/ShowcaseHeader';
import AuroraBackground from '../components/showcase/AuroraBackground';
import HeroSection from '../components/showcase/HeroSection';
import CoursesSection from '../components/showcase/CoursesSection';
import ToolsSection from '../components/showcase/ToolsSection';
import StudentsSection from '../components/showcase/StudentsSection';
import PartnersSection from '../components/showcase/PartnersSection';
import ConnectSection from '../components/showcase/ConnectSection';
import ThemeCustomizer from '../components/showcase/ThemeCustomizer';
import '../components/showcase/showcase.css';
import { localizedText } from '../utils/localized';

const ShowcasePage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const scopeRef = useRef<HTMLDivElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [students, setStudents] = useState<FeaturedStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [showLogin, setShowLogin] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  useEffect(() => {
    getFeaturedCourses(6)
      .then((r) => setCourses(r.data))
      .catch((e) => console.error('Failed to fetch courses:', e))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    getPartners({ featured: true, status: 'published', limit: 10, sort: 'order' })
      .then((r) => setPartners(r.data))
      .catch((e) => console.error('Failed to fetch partners:', e))
      .finally(() => setPartnersLoading(false));
  }, []);

  useEffect(() => {
    getFeaturedStudents()
      .then(setStudents)
      .catch((e) => console.error('Failed to fetch students:', e))
      .finally(() => setStudentsLoading(false));
  }, []);

  const getLocalizedText = (text: { vi: string; en: string }) => localizedText(text, language);
  const formatPrice = (price: number) => (price === 0 ? t('landing.courses.free') : `${price.toLocaleString()} Credits`);

  const goNavigate = (path: string) => {
    // Public routes go straight through; protected ones open the login dialog.
    const isProtected = ['/workflow', '/studio/generate', '/studio/edit'].some((p) => path.startsWith(p));
    if (!isProtected || isAuthenticated) { navigate(path); return; }
    setPendingNav(path);
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    if (pendingNav) { navigate(pendingNav); setPendingNav(null); }
  };

  return (
    <div className="sc-root" ref={scopeRef}>
      <SEOHead
        title={t('landing.hero.title1') + ' ' + t('landing.hero.title2') + ' — Alpha Studio'}
        description={t('landing.hero.subtitle')}
        path="/showcase"
      />
      <AuroraBackground />
      <ShowcaseHeader onLaunch={() => goNavigate('/studio')} />

      <main className="sc-main">
        <HeroSection onNavigate={goNavigate} studentCount={students.length} courseCount={courses.length} />
        <CoursesSection courses={courses} loading={coursesLoading} getLocalizedText={getLocalizedText} formatPrice={formatPrice} />
        <ToolsSection onNavigate={goNavigate} />
        <StudentsSection students={students} loading={studentsLoading} onNavigate={goNavigate} />
        <PartnersSection partners={partners} loading={partnersLoading} onNavigate={goNavigate} />
        <ConnectSection onNavigate={goNavigate} />
      </main>

      <ThemeCustomizer scopeRef={scopeRef} />

      {showLogin && <Login onLoginSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default ShowcasePage;
