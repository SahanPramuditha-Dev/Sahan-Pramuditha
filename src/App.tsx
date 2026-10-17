import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import CyberLab from './components/CyberLab/CyberLab';
import AdminLogin from './components/AdminLogin';
import { DEFAULT_HERO_CONFIG, type HeroConfig } from './types/cms';
import { experiences, type ExperienceData } from './types/experience';
import { BentoCard, TechPill, DockIcon, DockButton, CertItem, Hover3DText } from './components/ui/PortfolioUI';
import { ResumeSheet } from './components/modals/ResumeSheet';
import { ExperienceModal } from './components/modals/ExperienceModal';
import { EducationModal } from './components/modals/EducationModal';
import { ContactModal } from './components/modals/ContactModal';
import { FeaturedProjectsCarousel, LiveProjectsCarousel } from './components/sections/ProjectsCarousels';
import { GitHubActivityCard } from './components/sections/GitHubActivityCard';
import { ServicesCards } from './components/sections/ServicesCards';
import { TestimonialsCard } from './components/sections/TestimonialsCard';
import { ArticlesCard } from './components/sections/ArticlesCard';

export type { ExperienceData };

export default function App() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [time, setTime] = useState(new Date());
  
  const words = ["scale", "inspire", "perform", "convert"];
  const [currentWord, setCurrentWord] = useState(0);

  // Dynamic Hero Section CMS State
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);

  // Dynamic Content State
  const [availabilityStatus, setAvailabilityStatus] = useState("Seeking 2026 Internship");

  // Admin CMS State
  const [clickCount, setClickCount] = useState(0);
  const [transitionState, setTransitionState] = useState({ active: false, x: 0, y: 0 });
  
  // Modals State
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);
  const [isEducationOpen, setIsEducationOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [isAllCertsOpen, setIsAllCertsOpen] = useState(false);
  
  const defaultCerts = [
    { id: '1', icon: "fab fa-microsoft text-blue-500", title: "Microsoft FoundryX", subtitle: "Generative AI Event Attendance", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '2', icon: "fas fa-network-wired text-cyan-500", title: "Cisco", subtitle: "Introduction to Modern AI", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '3', icon: "fas fa-leaf text-green-500", title: "MongoDB", subtitle: "Python Developer Path", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '4', icon: "fab fa-github text-gray-800 dark:text-white", title: "GitHub Actions", subtitle: "Beginner Badge", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '5', icon: "fas fa-laptop-code text-teal-500", title: "DataCamp", subtitle: "Introduction to GitHub Concepts", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '6', icon: "fas fa-laptop-code text-teal-500", title: "DataCamp", subtitle: "Intermediate Git", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '7', icon: "fas fa-network-wired text-cyan-500", title: "Cisco", subtitle: "Networking Basics", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '8', icon: "fas fa-shield-alt text-cyan-500", title: "Cisco", subtitle: "Introduction to Cybersecurity", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '9', icon: "fab fa-free-code-camp text-indigo-500", title: "freeCodeCamp", subtitle: "Scientific Computing with Python", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '10', icon: "fab fa-aws text-orange-500", title: "AWS Academy", subtitle: "AWS Cloud Foundations", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '11', icon: "fas fa-chart-bar text-yellow-500", title: "Microsoft Learn", subtitle: "Introduction to Power BI", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '12', icon: "fas fa-shield-alt text-red-500", title: "OPSWAT Academy", subtitle: "Critical Infrastructure Protection", date: "2026", proofUrl: "", verifyUrl: "" },
    { id: '13', icon: "fas fa-leaf text-green-500", title: "MongoDB", subtitle: "Core Concepts and Architecture", date: "2026", proofUrl: "", verifyUrl: "" }
  ];
  const [certificates, setCertificates] = useState<any[]>(defaultCerts);

  // Fetch dynamic content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const heroSnap = await getDoc(doc(db, 'portfolio', 'hero'));
        if (heroSnap.exists()) {
          const heroData = heroSnap.data() as Partial<HeroConfig>;
          setHeroConfig({
            ...DEFAULT_HERO_CONFIG,
            ...heroData,
            taglineWords: heroData.taglineWords?.length ? heroData.taglineWords : DEFAULT_HERO_CONFIG.taglineWords
          });
        }

        const statusSnap = await getDoc(doc(db, 'portfolio', 'status'));
        if (statusSnap.exists()) setAvailabilityStatus(statusSnap.data().text);
        
        const certsSnap = await getDoc(doc(db, 'portfolio', 'certificates'));
        if (certsSnap.exists() && certsSnap.data().items) setCertificates(certsSnap.data().items);
      } catch (err) {
        console.error("Error fetching from Firebase:", err);
      }
    };
    fetchContent();
  }, []);

  // Dynamic Typewriter loop
  const activeWords = heroConfig.taglineWords?.length ? heroConfig.taglineWords : words;
  useEffect(() => {
    if (!activeWords.length) return;
    const wordTimer = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % activeWords.length);
    }, 2500);
    return () => clearInterval(wordTimer);
  }, [activeWords.length]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme Toggle with View Transitions
  const toggleTheme = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const newIsDark = !isDark;
    
    // Fallback for browsers that don't support View Transitions
    if (!document.startViewTransition) {
      setIsDark(newIsDark);
      document.documentElement.classList.toggle('dark', newIsDark);
      return;
    }

    const transition = document.startViewTransition(() => {
      setIsDark(newIsDark);
      document.documentElement.classList.toggle('dark', newIsDark);
    });

    transition.ready.then(() => {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} selection:bg-accent selection:text-white`}>
      {/* Floating Bottom Dock */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-2 bg-card/80 backdrop-blur-xl border border-borderSubtle shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full">
          <DockIcon href="#home" icon={<i className="fas fa-home text-base"></i>} />
          <DockIcon href="#experience" icon={<i className="fas fa-briefcase text-base"></i>} />
          <DockIcon href="#education" icon={<i className="fas fa-graduation-cap text-base"></i>} />
          <DockIcon href="#services" icon={<i className="fas fa-layer-group text-base"></i>} />
          <DockIcon href="#projects" icon={<i className="fas fa-code text-base"></i>} />
          <DockIcon href="#certifications" icon={<i className="fas fa-award text-base"></i>} />
          
          <div className="w-[1px] h-6 bg-borderSubtle mx-1"></div>
          
          <DockButton onClick={toggleTheme} icon={<i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-base`}></i>} />
          
          <a href="mailto:sahan.dev.tech@gmail.com" className="px-4 md:px-5 h-10 flex items-center justify-center rounded-full bg-textMain text-bgMain font-bold hover:scale-105 transition-transform shadow-md ml-1 md:ml-2 whitespace-nowrap text-sm">
            Let's Talk
          </a>
        </div>
      </nav>

      {/* Main Split Layout */}
      <main className="max-w-[1400px] mx-auto flex flex-col lg:flex-row" id="home">
        
        {/* Left Side: Sticky Pure Typography */}
        <div className="w-full lg:w-5/12 lg:h-screen lg:sticky top-0 p-6 lg:p-8 xl:p-16 flex flex-col overflow-y-auto no-scrollbar lg:overflow-y-hidden pb-32 lg:pb-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="my-auto"
          >
            <div 
              className="w-12 h-12 bg-textMain text-bgMain rounded-xl flex items-center justify-center font-black text-2xl mb-4 lg:mb-6 shadow-sm cursor-pointer select-none transition-transform active:scale-95 shrink-0"
              onClick={(e) => {
                const newCount = clickCount + 1;
                setClickCount(newCount);
                if (newCount >= 5) {
                  setTransitionState({ active: true, x: e.clientX, y: e.clientY });
                  setClickCount(0);
                }
              }}
            >
              {heroConfig.logoText || "S."}
            </div>

            <h1 className="text-[3.5rem] sm:text-6xl lg:text-5xl xl:text-[5.5rem] font-black tracking-tighter leading-[1.05] text-textMain mb-4 lg:mb-6 cursor-default">
              <Hover3DText text="I build" />
              <br/>
              <Hover3DText 
                text="digital" 
                className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient" 
              />
              <br/>
              <Hover3DText 
                text="products" 
                className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient" 
              />
              <br/>
              <Hover3DText text="that" />
              <br/>
              <div 
                className="text-accent inline-block overflow-hidden relative h-[1.2em] w-[6em]"
                style={{ 
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
                }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={currentWord}
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
                    className="absolute left-0"
                  >
                    {activeWords[currentWord % activeWords.length]}.
                  </motion.span>
                </AnimatePresence>
              </div>
            </h1>

            <p className="text-base sm:text-lg lg:text-lg xl:text-xl text-textMuted max-w-md leading-relaxed font-medium mb-8">
              {heroConfig.bio || "Hi, I'm Sahan Pramuditha. A 3rd-year BICT undergraduate at the University of Colombo, specializing in robust backend systems, IT support, and software engineering."}
            </p>

            <div className="flex items-center gap-4 text-sm font-semibold text-textMain">
              <a href={heroConfig.githubUrl || "https://github.com/SahanPramuditha-Dev"} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors"><i className="fab fa-github text-xl mr-1"></i> GitHub</a>
              <a href={heroConfig.linkedinUrl || "https://linkedin.com/in/sahan-pramuditha"} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors"><i className="fab fa-linkedin text-xl mr-1"></i> LinkedIn</a>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Scrolling Bento Grid */}
        <div className="w-full lg:w-7/12 p-4 lg:p-8 pb-32 no-scrollbar" id="work">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-[minmax(180px,auto)]">

            {/* Profile & Location */}
            <BentoCard 
              className="relative overflow-hidden p-0 md:col-span-1 h-[250px] group cursor-pointer" 
              id="about"
              onClick={() => setIsResumeOpen(true)}
            >
              <img src="/profile.jpg" alt="Sahan Pramuditha" className="absolute inset-0 w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-80"></div>
              
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <i className="fas fa-expand-alt text-sm"></i>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping-slow relative">
                    <span className="absolute inset-0 rounded-full bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider drop-shadow-md">{heroConfig.location || "Sri Lanka"}</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">Sahan Pramuditha</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-medium text-gray-300 font-mono tracking-tight drop-shadow-md">
                    {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} Local Time
                  </div>
                  <a href={heroConfig.resumeDownloadUrl || "/Sahan_Pramuditha_Resume.pdf"} download onClick={(e) => e.stopPropagation()} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg group/btn">
                    <i className="fas fa-download group-hover/btn:-translate-y-0.5 transition-transform"></i> CV
                  </a>
                </div>
              </div>
            </BentoCard>

            {/* Education */}
            <BentoCard 
              className="md:col-span-1 h-[250px] relative cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden group"
              onClick={() => setIsEducationOpen(true)}
            >
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none transition-transform group-hover:scale-110 duration-500">
                <i className="fas fa-university text-[10rem]"></i>
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 w-fit border border-blue-500/20">Expected 2028</span>
                <h3 className="text-2xl font-bold text-textMain leading-tight mb-1">University of Colombo</h3>
                <p className="text-sm font-medium text-textMuted mb-6">Faculty of Technology</p>
                
                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-end border-b border-borderSubtle pb-2">
                    <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest">Degree</span>
                    <span className="text-sm font-bold text-textMain">BSc (Hons) BICT</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest">Status</span>
                    <span className="text-sm font-black text-accent flex items-center gap-2 text-right">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0"></span>
                      {availabilityStatus}
                    </span>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Experience Timeline */}
            <BentoCard id="experience" className="flex flex-col justify-between md:col-span-2 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 opacity-[0.02] group-hover:opacity-5 transition-opacity duration-500 pointer-events-none">
                <i className="fas fa-briefcase text-[15rem]"></i>
              </div>
              <h3 className="text-lg font-bold text-textMain mb-8 flex items-center gap-2 relative z-10">
                <i className="fas fa-briefcase text-accent"></i> Professional Experience
              </h3>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-6 w-full">
                
                {/* Connecting Lines */}
                <div className="hidden md:block absolute top-[24px] left-[24px] w-[calc(66.666%+0.5rem)] border-t-2 border-dashed border-borderSubtle z-0"></div>
                <div className="md:hidden absolute top-[24px] bottom-[24px] left-[23px] border-l-2 border-dashed border-borderSubtle z-0"></div>
                
                {/* Role 1 (Past) */}
                <div 
                  className="flex-1 relative flex flex-row md:flex-col gap-6 md:gap-0 opacity-70 hover:opacity-100 transition-opacity group/item cursor-pointer"
                  onClick={() => setSelectedExperience(experiences.star)}
                >
                  <div className="relative w-12 h-12 bg-bgMain border-4 border-card rounded-full flex items-center justify-center z-10 text-textMuted shadow-sm shrink-0">
                    <i className="fas fa-cogs text-sm"></i>
                  </div>
                  <div className="md:mt-6 pt-1 md:pt-0">
                    <h4 className="text-[17px] font-bold text-textMain leading-tight mb-1 group-hover/item:text-textMain transition-colors">Engineering Assistant</h4>
                    <p className="text-[11px] font-bold text-textMuted mb-3 tracking-wider uppercase flex items-center gap-2">
                      Star Garments <span className="w-1 h-1 rounded-full bg-textMuted"></span> 2023
                    </p>
                    <p className="text-sm text-textMuted leading-relaxed pr-4 mb-4">
                      Assisted in IT infrastructure maintenance, hardware troubleshooting, and network diagnostics across large-scale manufacturing facilities.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                       <span className="text-[10px] px-2 py-1 bg-borderSubtle/30 rounded-md font-bold text-textMain">Hardware</span>
                       <span className="text-[10px] px-2 py-1 bg-borderSubtle/30 rounded-md font-bold text-textMain">Networking</span>
                    </div>
                  </div>
                </div>

                {/* Role 2 (Present) */}
                <div 
                  className="flex-1 relative flex flex-row md:flex-col gap-6 md:gap-0 group/item cursor-pointer"
                  onClick={() => setSelectedExperience(experiences.wybe)}
                >
                  <div className="relative w-12 h-12 bg-bgMain border-4 border-card rounded-full flex items-center justify-center z-10 text-accent shadow-sm shrink-0">
                    <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20"></span>
                    <i className="fas fa-shopping-cart text-sm"></i>
                  </div>
                  <div className="md:mt-6 pt-1 md:pt-0">
                    <h4 className="text-[17px] font-black text-textMain leading-tight mb-1 group-hover/item:text-accent transition-colors">E-Commerce Admin</h4>
                    <p className="text-[11px] font-bold text-accent mb-3 tracking-wider uppercase flex items-center gap-2">
                      Wybe Fashion <span className="w-1 h-1 rounded-full bg-accent"></span> Present
                    </p>
                    <p className="text-sm text-textMuted leading-relaxed pr-4 mb-4">
                      Managing digital storefront operations, inventory synchronization, and leveraging data analytics to optimize customer purchasing workflows.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                       <span className="text-[10px] px-2 py-1 bg-borderSubtle/30 rounded-md font-bold text-textMain">E-Commerce APIs</span>
                       <span className="text-[10px] px-2 py-1 bg-borderSubtle/30 rounded-md font-bold text-textMain">Data Analytics</span>
                    </div>
                  </div>
                </div>
                
                {/* Role 3 (Future / CTA) */}
                <div 
                  className="flex-1 relative flex flex-row md:flex-col gap-6 md:gap-0 opacity-40 hover:opacity-100 transition-opacity group/item cursor-pointer"
                  onClick={() => setSelectedExperience(experiences.future)}
                >
                  <div className="w-12 h-12 bg-card border-4 border-dashed border-borderSubtle rounded-full flex items-center justify-center z-10 text-textMuted shadow-sm shrink-0">
                    <i className="fas fa-question text-sm"></i>
                  </div>
                  <div className="md:mt-6 pt-1 md:pt-0">
                    <h4 className="text-[17px] font-bold text-textMain leading-tight mb-1 group-hover/item:text-accent transition-colors">Software Engineer Intern</h4>
                    <p className="text-[11px] font-bold text-textMuted mb-3 tracking-wider uppercase flex items-center gap-2">
                      Your Company <span className="w-1 h-1 rounded-full bg-textMuted"></span> 2026
                    </p>
                    <p className="text-sm text-textMuted leading-relaxed pr-4 mb-4 italic">
                      Seeking a challenging internship role to apply backend engineering, cloud architecture, and modern web development skills in production.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                       <span className="text-[10px] px-2 py-1 bg-accent/20 rounded-md font-bold text-accent"><i className="fas fa-paper-plane mr-1"></i> Contact Me</span>
                    </div>
                  </div>
                </div>

              </div>
            </BentoCard>

            {/* Tech Stack */}
            <BentoCard className="md:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none"></div>
              
              <h3 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 relative z-20">
                <i className="fas fa-code text-accent"></i> Core Technologies
              </h3>
              
              <div className="flex w-max overflow-hidden animate-marquee">
                <div className="flex gap-4 w-1/2 justify-around shrink-0 px-2">
                    <TechPill icon="fab fa-python text-blue-500" label="Python" glowColor="hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                    <TechPill icon="fab fa-react text-sky-400" label="React / TS" glowColor="hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                    <TechPill icon="fab fa-node-js text-green-600" label="Node.js" glowColor="hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                    <TechPill icon="fas fa-database text-gray-500" label="PostgreSQL" glowColor="hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                    <TechPill icon="fab fa-windows text-blue-600" label="IT Support" glowColor="hover:border-blue-600/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
                    <TechPill icon="fas fa-network-wired text-cyan-500" label="Networking" glowColor="hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                </div>
                <div className="flex gap-4 w-1/2 justify-around shrink-0 px-2">
                    <TechPill icon="fab fa-python text-blue-500" label="Python" glowColor="hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                    <TechPill icon="fab fa-react text-sky-400" label="React / TS" glowColor="hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                    <TechPill icon="fab fa-node-js text-green-600" label="Node.js" glowColor="hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                    <TechPill icon="fas fa-database text-gray-500" label="PostgreSQL" glowColor="hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                    <TechPill icon="fab fa-windows text-blue-600" label="IT Support" glowColor="hover:border-blue-600/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
                    <TechPill icon="fas fa-network-wired text-cyan-500" label="Networking" glowColor="hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                </div>
              </div>
            </BentoCard>

            {/* GitHub Activity */}
            <GitHubActivityCard />

            {/* Currently Learning */}
            <BentoCard className="flex flex-col justify-center bg-gradient-to-br from-bgMain to-accent/5 md:col-span-1 relative overflow-hidden group min-h-[220px]">
              <motion.div 
                animate={{ x: ['-200%', '300%'] }} 
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} 
                className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-accent/5 to-transparent -skew-x-12 z-0 pointer-events-none"
              />
              
              <motion.i 
                animate={{ y: [0, -8, 0], scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="fas fa-brain absolute -bottom-4 -right-4 text-8xl text-accent/5 group-hover:text-accent/10 transition-colors duration-500 z-0"
              ></motion.i>

              <h3 className="text-lg font-bold text-textMain mb-3 relative z-10">
                <i className="fas fa-bolt mr-2 text-accent"></i>Currently Learning
              </h3>
              <p className="text-sm text-textMuted leading-relaxed relative z-10">
                Diving deeper into <strong className="text-textMain">Cloud Architecture</strong>, mastering <strong className="text-textMain">Docker & CI/CD pipelines</strong>, and exploring advanced software design patterns.
              </p>
            </BentoCard>

            <TestimonialsCard />
            <ArticlesCard />
            <ServicesCards />
            
            {/* Featured Projects Carousel (Pinned) */}
            <FeaturedProjectsCarousel isDark={isDark} id="projects" />

            {/* Live GitHub Projects Carousel (Secondary) */}
            <LiveProjectsCarousel isDark={isDark} />

            {/* Cyber Lab */}
            <div className="md:col-span-2">
              <CyberLab />
            </div>

            {/* Certifications & Events */}
            <BentoCard id="certifications" className="md:col-span-2 bg-gradient-to-br from-bgMain to-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              <h3 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2">
                <i className="fas fa-award text-accent"></i> Certifications & Events
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.slice(0, 6).map((cert) => (
                  <CertItem 
                    key={cert.id}
                    icon={cert.icon} 
                    title={cert.title} 
                    subtitle={cert.subtitle} 
                    date={cert.date}
                    onClick={() => setSelectedCert(cert)}
                    hasProof={!!cert.proofUrl || !!cert.verifyUrl}
                  />
                ))}
              </div>
              
              {certificates.length > 6 && (
                <button 
                  onClick={() => setIsAllCertsOpen(true)}
                  className="mt-6 w-full py-4 rounded-xl border border-borderSubtle bg-bgMain hover:bg-black/5 dark:hover:bg-white/5 text-textMain font-bold transition-colors flex items-center justify-center gap-2 group"
                >
                  View all {certificates.length} certifications 
                  <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>
              )}
            </BentoCard>

            {/* Let's Connect */}
            <BentoCard className="md:col-span-2 relative overflow-hidden group flex flex-col justify-center !p-0 h-auto md:h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-accent to-blue-700"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000 delay-100"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 px-8 py-6 md:py-0 w-full">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Let's Connect</h3>
                  <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"></span>
                    Available for internships & freelance
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <a href="https://github.com/SahanPramuditha-Dev" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shrink-0 shadow-sm hover:shadow-md">
                    <i className="fab fa-github text-lg"></i>
                  </a>
                  <a href="https://linkedin.com/in/sahan-pramuditha" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shrink-0 shadow-sm hover:shadow-md">
                    <i className="fab fa-linkedin-in text-lg"></i>
                  </a>
                  
                  <button onClick={() => setIsContactOpen(true)} className="flex-1 md:flex-none h-12 px-6 bg-white text-accent hover:bg-blue-50 font-bold rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-1">Send Email <i className="fas fa-paper-plane text-sm"></i></button>
                </div>
              </div>
            </BentoCard>

          </div>

          {/* Spacer for bottom dock */}
          <div className="h-20"></div>
        </div>
      </main>
  
      <AnimatePresence>
        {transitionState.active && (
          <motion.div
            initial={{ clipPath: `circle(0px at ${transitionState.x}px ${transitionState.y}px)` }}
            animate={{ clipPath: `circle(160% at ${transitionState.x}px ${transitionState.y}px)` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] overflow-y-auto bg-bgMain"
          >
            <button
              onClick={() => setTransitionState({ active: false, x: 0, y: 0 })}
              className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-borderSubtle/50 hover:bg-borderSubtle text-textMuted hover:text-textMain transition-all backdrop-blur-md"
              title="Return to Website"
            >
              <i className="fa-solid fa-xmark text-lg w-5 h-5 flex items-center justify-center"></i>
            </button>
            <AdminLogin onSuccess={() => navigate('/admin')} />
          </motion.div>
        )}
      </AnimatePresence>
  
      {/* Modals */}
      <ResumeSheet isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />

      <ExperienceModal 
        experience={selectedExperience} 
        onClose={() => setSelectedExperience(null)} 
      />

      {/* All Certifications Modal */}
      <AnimatePresence>
        {isAllCertsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAllCertsOpen(false)}></div>
            
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col z-10 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-borderSubtle shrink-0">
                <h2 className="text-2xl font-bold text-textMain flex items-center gap-3">
                  <i className="fas fa-award text-accent"></i> All Certifications & Events
                </h2>
                <button 
                  onClick={() => setIsAllCertsOpen(false)}
                  className="w-10 h-10 rounded-full bg-bgMain hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-textMuted hover:text-textMain transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-gradient-to-b from-bgMain/30 to-bgMain">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <CertItem 
                      key={cert.id}
                      icon={cert.icon} 
                      title={cert.title} 
                      subtitle={cert.subtitle} 
                      date={cert.date}
                      onClick={() => setSelectedCert(cert)}
                      hasProof={!!cert.proofUrl || !!cert.verifyUrl}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Certificate/Event Modal */}
      <AnimatePresence>
        {selectedCert && (selectedCert.proofUrl || selectedCert.verifyUrl) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedCert(null)}></div>
            
            <motion.div
              layoutId={`cert-${selectedCert.id}`}
              className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col z-10 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-borderSubtle bg-bgMain/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <i className={`${selectedCert.icon} text-2xl`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
                      {selectedCert.title}
                      <i className="fas fa-certificate text-accent text-sm" title="Verified"></i>
                    </h2>
                    <p className="text-sm text-textMuted">{selectedCert.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="w-10 h-10 rounded-full bg-bgMain hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-textMuted hover:text-textMain transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-gradient-to-b from-bgMain/30 to-bgMain flex flex-col items-center">
                {selectedCert.proofUrl ? (
                  <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-borderSubtle bg-black/5">
                    <img src={selectedCert.proofUrl} alt={selectedCert.title} className="w-full h-auto object-contain" />
                  </div>
                ) : (
                  <div className="w-full py-20 flex flex-col items-center justify-center text-textMuted">
                    <i className="fas fa-image text-6xl mb-4 opacity-20"></i>
                    <p>No image available for this record.</p>
                  </div>
                )}
                
                {selectedCert.verifyUrl && (
                  <a 
                    href={selectedCert.verifyUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-8 px-8 py-3 bg-accent text-white font-bold rounded-full hover:bg-accent/90 transition-colors shadow-lg flex items-center gap-2"
                  >
                    Verify Credential <i className="fas fa-external-link-alt"></i>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EducationModal 
        isOpen={isEducationOpen} 
        onClose={() => setIsEducationOpen(false)} 
      />
      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
      />
    </div>
  );
}
