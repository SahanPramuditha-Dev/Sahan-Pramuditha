import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import HeroSectionCMS from './components/HeroSectionCMS';
import { DEFAULT_HERO_CONFIG } from './types/cms';
import ProjectsCMS from './components/ProjectsCMS';
import CertificatesCMS from './components/CertificatesCMS';
import StatusCMS from './components/StatusCMS';
import ServicesCMS from './components/ServicesCMS';
import TestimonialsCMS from './components/TestimonialsCMS';
import ArticlesCMS from './components/ArticlesCMS';
import AdminLogin from './components/AdminLogin';



export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccessOverlay, setIsSuccessOverlay] = useState(false);

  const [activeTab, setActiveTab] = useState<'hero'|'status'|'certs'|'articles'|'projects'|'services'|'testimonials'>('hero');

  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  };

  // Auto-Logout Inactivity Timer (15 minutes)
  useEffect(() => {
    if (!user) return;
    let timeoutId: any;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Session expired due to inactivity.");
        signOut(auth);
      }, 15 * 60 * 1000);
    };
    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const loginEmail = email.includes('@') ? email : `${email.toLowerCase()}@admin.com`;
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, loginEmail, password);
      setIsSuccessOverlay(true);
      setTimeout(() => setIsSuccessOverlay(false), 2500);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const loginEmail = email.includes('@') ? email : `${email.toLowerCase()}@admin.com`;
          await import('firebase/auth').then(({ createUserWithEmailAndPassword }) => {
            return createUserWithEmailAndPassword(auth, loginEmail, password);
          });
          setIsSuccessOverlay(true);
          setTimeout(() => setIsSuccessOverlay(false), 2500);
        } catch (createErr: any) {
          setError(createErr.message.replace('Firebase:', ''));
        }
      } else {
        setError(err.message.replace('Firebase:', ''));
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };



  const seedDatabase = async () => {
    setIsSaving(true);
    try {
      const defaultData = {
        hero: DEFAULT_HERO_CONFIG,
        status: { text: "Seeking 2026 Internship" },
        certificates: { items: [
          { id: 1, icon: "fas fa-shield-alt", title: "Cybersecurity Essentials", subtitle: "Cisco Networking Academy", date: "2024" },
          { id: 2, icon: "fas fa-network-wired", title: "CCNA: Enterprise Networking", subtitle: "Cisco Networking Academy", date: "2024" }
        ]},
        articles: { items: [
          { title: "Building a Modern Portfolio", platform: "Medium", date: "Oct 2026", readTime: "5 min", url: "#", icon: "fab fa-medium" }
        ]},
        projects: { items: [
          { title: "StudyOS Platform", desc: "An all-in-one student workspace integrating task management, SM-2 spaced repetition, and Orion.", tags: ["React 19", "Firebase", "Gen AI"], img: "studyos", link: "#", features: ["AI tutoring", "Spaced Repetition"] },
          { title: "FamilyTree Directory", desc: "A scalable, responsive church directory and census management system built for over 500+ parishioners.", tags: ["React", "Tailwind"], img: "familytree", link: "#", features: ["Dynamic search", "Role-based access"] }
        ]},
        services: { items: [
          { id: 1, title: "Frontend Engineering", desc: "Building scalable, pixel-perfect UIs.", icon: "fas fa-code", color: "blue", tech: ["React", "Next.js"] },
          { id: 2, title: "Backend Architecture", desc: "Designing robust APIs and databases.", icon: "fas fa-server", color: "green", tech: ["Node.js", "Express"] }
        ]},
        testimonials: { items: [
          { id: 1, name: "Dr. Smith", role: "Professor", text: "Exceptional student with great technical aptitude.", avatar: "fas fa-user-tie" }
        ]}
      };

      for (const [collection, data] of Object.entries(defaultData)) {
        await setDoc(doc(db, 'portfolio', collection), data);
      }
      alert("Database seeded successfully! Reload the page.");
    } catch (err: any) {
      alert("Failed to seed: " + err.message);
    }
    setIsSaving(false);
  };

  if (!user) {
    return <AdminLogin />;
  }

  const tabs = [
    { id: 'hero', label: 'Hero Section', icon: 'fa-wand-magic-sparkles' },
    { id: 'status', label: 'Availability', icon: 'fa-broadcast-tower' },
    { id: 'certs', label: 'Certificates', icon: 'fa-certificate' },
    { id: 'articles', label: 'Articles', icon: 'fa-pen-nib' },
    { id: 'projects', label: 'Projects', icon: 'fa-code' },
    { id: 'services', label: 'Services', icon: 'fa-layer-group' },
    { id: 'testimonials', label: 'Testimonials', icon: 'fa-quote-left' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-bgMain text-textMain relative selection:bg-accent selection:text-white`}>
      
      {/* Ambient Glow Orbs mirroring the Homepage Aesthetic */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Responsive Navigation Sidebar / Header - Locked Sticky on Desktop */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4 lg:sticky lg:top-8 z-30">
          
          {/* Brand & Identity Card */}
          <div className="bg-card/80 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-borderSubtle shadow-xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-accent/15 text-accent rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-accent/20">
                <i className="fas fa-hammer"></i>
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-base leading-tight tracking-tight text-textMain">Portfolio CMS</h1>
                <p className="text-[10px] text-textMuted uppercase tracking-widest truncate font-semibold mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Dark Mode & Live Site Link */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={toggleTheme} 
                className="w-9 h-9 rounded-xl bg-bgMain border border-borderSubtle text-textMain hover:text-accent flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Toggle Theme"
              >
                <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
              </button>
              <a 
                href="/" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="View Live Portfolio"
              >
                <i className="fas fa-arrow-up-right-from-square text-xs"></i>
              </a>
            </div>
          </div>

          {/* Navigation Pill List (Horizontal Scroll on Mobile, Vertical Stack on Desktop) */}
          <div className="bg-card/80 backdrop-blur-xl p-3 sm:p-4 rounded-[2rem] border border-borderSubtle shadow-xl flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar py-3 lg:py-4 lg:flex-1">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap active:scale-98 shrink-0 lg:shrink ${activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'text-textMuted hover:bg-bgMain hover:text-textMain'}`}
              >
                <i className={`fas ${tab.icon} w-4 text-center text-sm`}></i>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="hidden lg:inline ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
                )}
              </button>
            ))}

            <div className="hidden lg:block my-2 border-t border-borderSubtle shrink-0"></div>

            {/* Quick Action Controls */}
            <div className="hidden lg:flex flex-col gap-2 pt-1 shrink-0 mt-auto">
              <button 
                onClick={seedDatabase} 
                disabled={isSaving} 
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all border border-purple-500/20 active:scale-95 disabled:opacity-50"
              >
                <i className="fas fa-database text-xs"></i> Seed Defaults
              </button>
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20 active:scale-95"
              >
                <i className="fas fa-sign-out-alt text-xs"></i> Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Footer Sign Out / Seed */}
          <div className="flex lg:hidden items-center gap-2">
            <button 
              onClick={seedDatabase} 
              disabled={isSaving} 
              className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20"
            >
              <i className="fas fa-database mr-1"></i> Seed
            </button>
            <button 
              onClick={handleLogout} 
              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20"
            >
              <i className="fas fa-sign-out-alt mr-1"></i> Sign Out
            </button>
          </div>

        </aside>

        {/* Main Content Responsive Canvas */}
        <main className="w-full flex-1 min-w-0">
          
          {activeTab === 'hero' && <HeroSectionCMS />}
          {activeTab === 'status' && <StatusCMS />}
          {activeTab === 'certs' && <CertificatesCMS />}
          {activeTab === 'articles' && <ArticlesCMS />}
          {activeTab === 'projects' && <ProjectsCMS />}
          {activeTab === 'services' && <ServicesCMS />}
          {activeTab === 'testimonials' && <TestimonialsCMS />}

        </main>
      </div>
    </div>
  );
}

// Reload 54 
