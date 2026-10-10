import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import CyberLab from './components/CyberLab/CyberLab';


export interface ExperienceData {
  id: string;
  role: string;
  company: string;
  year: string;
  description: string;
  achievements: string[];
  tools: string[];
  link?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

const experiences: Record<string, ExperienceData> = {
  star: {
    id: 'star',
    role: 'Engineering Assistant',
    company: 'Star Garments',
    year: '2023',
    description: 'Assisted in IT infrastructure maintenance, hardware troubleshooting, and network diagnostics across large-scale manufacturing facilities.',
    achievements: [
      'Diagnosed and resolved critical hardware malfunctions to minimize factory downtime.',
      'Assisted in the rollout of internal network upgrades across multiple factory floors.',
      'Provided direct technical support to staff and maintained IT infrastructure integrity.'
    ],
    tools: ['Hardware', 'Networking', 'IT Support', 'Windows Server'],
    icon: 'fa-cogs',
    iconColor: 'text-textMuted',
    iconBg: 'bg-bgMain'
  },
  wybe: {
    id: 'wybe',
    role: 'E-Commerce Admin',
    company: 'Wybe Fashion',
    year: 'Present',
    description: 'Managing digital storefront operations, inventory synchronization, and leveraging data analytics to optimize customer purchasing workflows.',
    achievements: [
      'Streamlined product catalog synchronization via RESTful E-Commerce APIs.',
      'Leveraged data analytics to track user drop-offs and increased checkout conversion rates.',
      'Orchestrated multi-channel marketing campaigns and managed digital assets.'
    ],
    tools: ['E-Commerce APIs', 'Data Analytics', 'Shopify/WooCommerce', 'SEO'],
    link: 'https://wybefashion.com',
    icon: 'fa-shopping-cart',
    iconColor: 'text-accent',
    iconBg: 'bg-bgMain'
  },
  future: {
    id: 'future',
    role: 'Software Engineer Intern',
    company: 'Your Company',
    year: '2026',
    description: 'Seeking a challenging internship role to apply backend engineering, cloud architecture, and modern web development skills in production environments.',
    achievements: [
      'Ready to architect and deploy scalable cloud backend services.',
      'Eager to collaborate in agile teams and contribute to production codebases.',
      'Passionate about solving real-world performance bottlenecks.'
    ],
    tools: ['React', 'Node.js', 'Python', 'Cloud Platforms'],
    icon: 'fa-question',
    iconColor: 'text-textMuted',
    iconBg: 'bg-card'
  }
};

export default function App() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [time, setTime] = useState(new Date());
  
  const words = ["scale", "inspire", "perform", "convert"];
  const [currentWord, setCurrentWord] = useState(0);

  // Dynamic Content State
  const [availabilityStatus, setAvailabilityStatus] = useState("Seeking 2026 Internship");

  // Admin CMS State
  const [clickCount, setClickCount] = useState(0);
  
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
  useEffect(() => {
    const wordTimer = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(wordTimer);
  }, [words.length]);

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
              onClick={() => {
                const newCount = clickCount + 1;
                setClickCount(newCount);
                if (newCount >= 5) {
                  navigate('/admin');
                  setClickCount(0);
                }
              }}
            >
              S.
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
                    {words[currentWord]}.
                  </motion.span>
                </AnimatePresence>
              </div>
            </h1>

            <p className="text-base sm:text-lg lg:text-lg xl:text-xl text-textMuted max-w-md leading-relaxed font-medium mb-8">
              Hi, I'm Sahan Pramuditha. A 3rd-year BICT undergraduate at the University of Colombo, specializing in robust backend systems, IT support, and software engineering.
            </p>

            <div className="flex items-center gap-4 text-sm font-semibold text-textMain">
              <a href="https://github.com/SahanPramuditha-Dev" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors"><i className="fab fa-github text-xl mr-1"></i> GitHub</a>
              <a href="https://linkedin.com/in/sahan-pramuditha" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors"><i className="fab fa-linkedin text-xl mr-1"></i> LinkedIn</a>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Scrolling Bento Grid */}
        <div className="w-full lg:w-7/12 p-4 lg:p-8 pb-32 no-scrollbar" id="work">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-[minmax(180px,auto)]">

            {/* Profile & Location (Moved to Top) */}
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
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider drop-shadow-md">Sri Lanka</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">Sahan Pramuditha</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-medium text-gray-300 font-mono tracking-tight drop-shadow-md">
                    {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} Local Time
                  </div>
                  <a href="/Sahan_Pramuditha_Resume.pdf" download onClick={(e) => e.stopPropagation()} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg group/btn">
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
                    {/* Pulsing ring for active role */}
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
              {/* Fade gradients on left and right for seamless looping */}
              <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none"></div>
              
              <h3 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 relative z-20">
                <i className="fas fa-code text-accent"></i> Core Technologies
              </h3>
              
              <div className="flex w-max overflow-hidden animate-marquee">
                {/* First Set */}
                <div className="flex gap-4 w-1/2 justify-around shrink-0 px-2">
                    <TechPill icon="fab fa-python text-blue-500" label="Python" glowColor="hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                    <TechPill icon="fab fa-react text-sky-400" label="React / TS" glowColor="hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                    <TechPill icon="fab fa-node-js text-green-600" label="Node.js" glowColor="hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                    <TechPill icon="fas fa-database text-gray-500" label="PostgreSQL" glowColor="hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                    <TechPill icon="fab fa-windows text-blue-600" label="IT Support" glowColor="hover:border-blue-600/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
                    <TechPill icon="fas fa-network-wired text-cyan-500" label="Networking" glowColor="hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                </div>
                {/* Duplicate Set for Loop */}
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
            <BentoCard className="flex flex-col justify-center bg-gradient-to-br from-bgMain to-accent/5 md:col-span-1 relative overflow-hidden group min-h-[220px] flex flex-col justify-center">
              {/* Shimmer Background */}
              <motion.div 
                animate={{ x: ['-200%', '300%'] }} 
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} 
                className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-accent/5 to-transparent -skew-x-12 z-0 pointer-events-none"
              />
              
              {/* Pulsing Brain */}
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

            {/* Live GitHub Projects Carousel (Secondary) */}

            <TestimonialsCard />
              <ServicesCards />
            
                {/* Featured Projects Carousel (Pinned) */}
                <FeaturedProjectsCarousel isDark={isDark} id="projects" />

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
              {/* Background effects */}
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
                  {/* Socials */}
                  <a href="https://github.com/SahanPramuditha-Dev" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shrink-0 shadow-sm hover:shadow-md">
                    <i className="fab fa-github text-lg"></i>
                  </a>
                  <a href="https://linkedin.com/in/sahan-pramuditha" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shrink-0 shadow-sm hover:shadow-md">
                    <i className="fab fa-linkedin-in text-lg"></i>
                  </a>
                  
                  {/* Email Button */}
                  <button onClick={() => setIsContactOpen(true)} className="flex-1 md:flex-none h-12 px-6 bg-white text-accent hover:bg-blue-50 font-bold rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-1">Send Email <i className="fas fa-paper-plane text-sm"></i></button>
                </div>
              </div>
            </BentoCard>

          </div>

          {/* Spacer to prevent bottom content from being covered by the floating dock */}
          <div className="h-20"></div>
        </div>
      </main>

      {/* iOS-Style Quick Resume Sheet */}
      <ResumeSheet isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />



      {/* Experience Details Modal */}
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
              {/* Header */}
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

              {/* Grid Content */}
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

      {/* Certificate/Event Modal */}
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
              {/* Header */}
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

              {/* Content */}
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

      {/* Education Modal */}
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

// Custom hook for Modal UX (Scroll lock & Escape key)
function useModalUX(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}

const staggerContainer = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const, damping: 25, stiffness: 300,
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  },
  exit: { scale: 0.95, opacity: 0, y: 20 }
};

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 }
  }
};

// Experience Details Modal
function ExperienceModal({ experience, onClose }: { experience: ExperienceData | null, onClose: () => void }) {
  useModalUX(!!experience, onClose);

  return (
    <AnimatePresence>
      {experience && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-card border border-borderSubtle rounded-[2rem] shadow-2xl p-6 md:p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto relative flex flex-col"
            >
              <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain rounded-full flex items-center justify-center transition-colors">
                <i className="fas fa-times"></i>
              </button>

              <motion.div variants={staggerItem} className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 ${experience.iconBg} border border-borderSubtle rounded-2xl flex items-center justify-center ${experience.iconColor} text-xl shadow-sm`}>
                  <i className={`fas ${experience.icon}`}></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-textMain leading-tight">{experience.role}</h2>
                  <p className={`font-bold ${experience.iconColor} uppercase tracking-wider text-sm flex items-center gap-2 mt-1`}>
                    {experience.company} <span className={`w-1 h-1 rounded-full ${experience.iconBg}`}></span> {experience.year}
                  </p>
                </div>
              </motion.div>

              <motion.p variants={staggerItem} className="text-textMuted leading-relaxed mb-8">{experience.description}</motion.p>

              <motion.div variants={staggerItem} className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-borderSubtle shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] mb-8">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-5 flex items-center gap-2">
                  <i className="fas fa-star text-yellow-500"></i> Key Achievements
                </h3>
                <ul className="space-y-4">
                  {experience.achievements.map((ach, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-textMain font-medium leading-relaxed items-start">
                      <i className="fas fa-check text-blue-500 mt-1 shrink-0 text-xs opacity-80"></i> 
                      <span className="opacity-90">{ach}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={staggerItem} className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-borderSubtle/40 pt-6">
                <div className="flex flex-wrap gap-2">
                  {experience.tools.map((tool, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full font-bold text-[11px] tracking-wide">
                      {tool}
                    </span>
                  ))}
                </div>
                {experience.link && (
                  <a href={experience.link} target="_blank" rel="noreferrer" className="shrink-0 px-6 py-2.5 rounded-full text-bgMain font-semibold text-sm bg-textMain hover:opacity-80 shadow-sm active:scale-95 transition-all flex items-center gap-2 group">
                    View Live <i className="fas fa-external-link-alt text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"></i>
                  </a>
                )}
                {experience.id === 'future' && (
                  <a href="mailto:hello@example.com" className="shrink-0 px-6 py-2.5 rounded-full text-bgMain font-semibold text-sm bg-textMain hover:opacity-80 shadow-sm active:scale-95 transition-all flex items-center gap-2 group">
                    <i className="fas fa-paper-plane text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"></i> Hire Me
                  </a>
                )}
              </motion.div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Education Modal

// Contact Form Modal
function ContactModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success'>('idle');

  useModalUX(isOpen, onClose);

  useEffect(() => {
    if (isOpen) setSubmitState('idle');
  }, [isOpen]);

  if (!isOpen) return null;

      const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitState('submitting');
      
      // Simulate network request
      setTimeout(() => {
        setSubmitState('success');
      }, 1500);
  
      // Close modal eventually
      setTimeout(() => {
        onClose();
      }, 4000);
    };

return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
      />
      
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-borderSubtle rounded-[2rem] shadow-2xl p-6 md:p-10 w-full max-w-lg pointer-events-auto relative overflow-hidden flex flex-col justify-center min-h-[450px]"
        >
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain rounded-full flex items-center justify-center transition-colors z-10">
            <i className="fas fa-times"></i>
          </button>
          
          <AnimatePresence mode="wait">
            {submitState === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center justify-center py-12 text-center absolute inset-0"
              >
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                  className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 text-4xl mb-6 shadow-sm"
                >
                  <i className="fas fa-check"></i>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-textMain mb-2"
                >
                  Message Sent!
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-textMuted"
                >
                  I'll get back to you shortly.
                </motion.p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}>
                <div className="mb-8">
                  <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 text-2xl mb-6 shadow-sm">
                    <i className="fas fa-paper-plane"></i>
                  </div>
                  <h2 className="text-3xl font-black text-textMain mb-2">Let's Talk</h2>
                  <p className="text-textMuted">Fill out the form below and I'll get back to you as soon as possible.</p>
                </div>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Name</label>
                    <input type="text" required placeholder="John Doe" className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Email</label>
                    <input type="email" required placeholder="john@example.com" className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Message</label>
                    <textarea required rows={4} placeholder="How can I help you?" className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"></textarea>
                  </div>
                  
                                      <button type="submit" disabled={submitState === 'submitting'} className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 ${submitState === 'submitting' ? 'bg-blue-400 cursor-not-allowed shadow-none scale-[0.98]' : 'bg-accent hover:bg-blue-600 shadow-accent/20 hover:-translate-y-0.5'}`}>
                      {submitState === 'submitting' ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Sending...</>
                      ) : (
                        <>Send Message <i className="fas fa-arrow-right text-sm"></i></>
                      )}
                    </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}function EducationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  useModalUX(isOpen, onClose);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 4>(1);

  const curriculum = {
    1: [
      "Programming I", "Database Management Systems I", "Object Oriented Programming",
      "Web Application Development", "Computer Systems and Operating Systems",
      "Application Laboratory I & II", "Basic Mathematics & Physics"
    ],
    2: [
      "Software Engineering", "Database Management Systems II", "Computer Networks",
      "Agile Software Development", "Mobile Application Development",
      "IT Project Management", "Discrete Mathematics"
    ],
    3: [
      "Enterprise Resource Planning", "Information Systems Security", 
      "Professional Practice in ICT", "Bioinformatics", "Introduction to GIS",
      "Development Economics", "Industrial Training / Internship"
    ],
    4: [
      "Data Analytics and Business Intelligence", "Programming III",
      "Digital Forensics", "Human Computer Interaction",
      "Systems and Network Administration", "Software Quality Management",
      "Individual/Group Project"
    ]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-card border border-borderSubtle rounded-[2rem] shadow-2xl p-6 md:p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto relative flex flex-col"
            >
              <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain rounded-full flex items-center justify-center transition-colors">
                <i className="fas fa-times"></i>
              </button>

              <motion.div variants={staggerItem} className="flex items-center gap-4 mb-6 pr-12">
                <div className="w-14 h-14 bg-white border border-borderSubtle rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5"><img src="/uoc-logo.png" alt="University of Colombo Logo" className="w-full h-full object-contain drop-shadow-sm" /></div>
                <div>
                  <h2 className="text-2xl font-black text-textMain leading-tight">BSc (Hons) BICT</h2>
                  <p className="font-bold text-blue-500 uppercase tracking-wider text-sm flex items-center gap-2 mt-1">
                    University of Colombo <span className="w-1 h-1 rounded-full bg-blue-500"></span> Expected 2028
                  </p>
                </div>
              </motion.div>

              <motion.p variants={staggerItem} className="text-textMuted leading-relaxed mb-8">
                Currently pursuing a Bachelor of Information and Communication Technology (Honours) at the Faculty of Technology, University of Colombo. My coursework heavily focuses on software engineering, cloud architecture, and systems administration.
              </motion.p>

              <motion.div variants={staggerItem} className="bg-bgMain rounded-2xl border border-borderSubtle overflow-hidden flex flex-col">
                <div className="flex overflow-x-auto no-scrollbar border-b border-borderSubtle bg-card/50">
                  {[1, 2, 3, 4].map((level) => (
                    <button
                      key={level}
                      onClick={() => setActiveLevel(level as 1|2|3|4)}
                      className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap px-4 border-b-2 ${
                        activeLevel === level 
                          ? 'border-accent text-accent bg-accent/5' 
                          : 'border-transparent text-textMuted hover:text-textMain hover:bg-bgMain'
                      }`}
                    >
                      Level {level === 1 ? 'I' : level === 2 ? 'II' : level === 3 ? 'III' : 'IV'}
                    </button>
                  ))}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-book-open"></i> Core Coursework
                  </h3>
                  
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeLevel}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {curriculum[activeLevel].map((course, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-card border border-borderSubtle p-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-accent/30 transition-all duration-300 group/course cursor-default">
                          <i className="fas fa-check-circle text-accent mt-0.5 shrink-0 group-hover/course:scale-110 transition-transform"></i>
                          <span className="text-sm font-semibold text-textMain">{course}</span>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

                              {/* Secondary Education */}
                <motion.div variants={staggerItem} className="mt-10 border-t border-borderSubtle pt-8">
                  <div className="flex items-center gap-4 mb-6 pr-12">
                    <div className="w-14 h-14 bg-white border border-borderSubtle rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5"><img src="/christ-king-logo.png" alt="Christ King College Logo" className="w-full h-full object-contain drop-shadow-sm" /></div>
                    <div>
                      <h2 className="text-xl font-black text-textMain leading-tight">G.C.E. Advanced Level</h2>
                      <p className="font-bold text-emerald-500 uppercase tracking-wider text-sm flex items-center gap-2 mt-1">
                        Christ King College Thudella <span className="w-1 h-1 rounded-full bg-emerald-500"></span> 2022
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-bgMain rounded-2xl border border-borderSubtle p-5 md:p-6 mb-8">
                    <div className="flex items-center gap-3 mb-2">
                       <i className="fas fa-microchip text-emerald-500"></i>
                       <h3 className="font-bold text-textMain">Technology Stream</h3>
                    </div>
                    <p className="text-sm text-textMuted leading-relaxed">
                      Completed secondary education with a specialized focus on the Technology stream, building a strong foundation in applied sciences, mathematics, and technical concepts.
                    </p>
                  </div>

                  {/* IT Course */}
                  <div className="flex items-center gap-4 mb-6 pr-12">
                    <div className="w-14 h-14 bg-white border border-borderSubtle rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5"><img src="/slt-nebula-logo.png" alt="SLT Nebula Logo" className="w-full h-full object-contain" /></div>
                    <div>
                      <h2 className="text-xl font-black text-textMain leading-tight">Information Technology</h2>
                      <p className="font-bold text-purple-500 uppercase tracking-wider text-sm flex items-center gap-2 mt-1">
                        SLT Nebula Welisara <span className="w-1 h-1 rounded-full bg-purple-500"></span> 2019
                      </p>
                    </div>
                  </div>

                  <div className="block bg-bgMain rounded-2xl border border-borderSubtle p-5 md:p-6">
                    <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-3">
                         <i className="fas fa-laptop-code text-purple-500"></i>
                         <h3 className="font-bold text-textMain">Information Technology Course</h3>
                       </div>
                       
                    </div>
                    <p className="text-sm text-textMuted leading-relaxed">
                      Early foundation in IT principles, networking, and computer systems, establishing a core understanding of software and hardware operations.
                    </p>
                  </div>
                </motion.div>


              

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Profile & Resume Modal (Centered Design)
function ResumeSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  useModalUX(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-card border border-borderSubtle rounded-[2rem] shadow-2xl p-6 md:p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto relative flex flex-col"
            >
              <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain rounded-full flex items-center justify-center transition-colors z-10">
                <i className="fas fa-times"></i>
              </button>
              
              <div className="flex flex-col md:flex-row gap-8 items-stretch relative z-0">
                {/* Left Side: Avatar & Resume */}
                <motion.div variants={staggerItem} className="flex flex-col w-full md:w-1/3 shrink-0">
                  <div className="w-full flex-1 relative min-h-[300px] rounded-3xl shadow-lg border border-borderSubtle overflow-hidden mb-3">
                    <img src="/profile.jpg" alt="Sahan" className="absolute inset-0 w-full h-full object-cover object-[center_20%]" />
                  </div>
                  
                  <a href="/Sahan_Pramuditha_Resume.pdf" download className="w-full shrink-0 py-3.5 rounded-full text-bgMain font-semibold text-sm bg-textMain hover:bg-accent hover:text-white shadow-lg shadow-black/10 hover:shadow-accent/30 active:scale-95 transition-all flex items-center justify-center gap-2 group mt-1">
                    <i className="fas fa-download group-hover:-translate-y-0.5 transition-transform duration-300"></i> Download Full Resume
                  </a>
                </motion.div>
                
                {/* Right Side: Bio & Details */}
                <div className="flex-1 mt-1">
                  <motion.div variants={staggerItem} className="mb-4">
                    <h2 className="text-3xl md:text-4xl font-black text-textMain mb-2">Sahan Pramuditha</h2>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <p className="text-accent font-bold text-lg tracking-wide">Undergraduate Software Engineer</p>
                      
                      {/* Socials Row */}
                      <div className="hidden md:flex gap-3 items-center">
                        <div className="w-1 h-1 bg-borderSubtle rounded-full hidden md:block mr-1"></div>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-9 h-9 bg-bgMain border border-borderSubtle text-textMain rounded-full flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm hover:-translate-y-0.5">
                          <i className="fab fa-linkedin text-lg"></i>
                        </a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="w-9 h-9 bg-bgMain border border-borderSubtle text-textMain rounded-full flex items-center justify-center hover:border-textMain transition-all shadow-sm hover:-translate-y-0.5">
                          <i className="fab fa-github text-lg"></i>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={staggerItem} className="space-y-4 mb-8 mt-6">
                    <p className="text-textMuted text-[15px] leading-loose">
                      Beyond writing clean code and designing scalable architectures, I'm deeply passionate about cloud infrastructure and building systems that solve real human problems.
                    </p>
                    <p className="text-textMuted text-[15px] leading-loose">
                      When I'm not studying or coding at the University of Colombo, you'll find me exploring new tech ecosystems, optimizing backend workflows, or diving into hardware and networking protocols.
                    </p>
                  </motion.div>
                  
                  <motion.div variants={staggerItem} className="grid grid-cols-2 gap-6 md:gap-8 p-6 md:px-8 bg-bgMain rounded-2xl border border-borderSubtle shadow-sm">
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-textMuted tracking-widest mb-2"><i className="fas fa-globe-asia mr-1"></i>Base & Languages</h4>
                      <p className="text-sm font-bold text-textMain mb-1">Colombo, Sri Lanka</p>
                      <p className="text-xs font-semibold text-textMuted">English, Sinhala</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-textMuted tracking-widest mb-2"><i className="fas fa-rocket mr-1"></i>Core Interests</h4>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-bold">Cloud</span>
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-xs font-bold">AI</span>
                        <span className="px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-xs font-bold">Systems</span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Mobile Socials */}
                  <motion.div variants={staggerItem} className="flex md:hidden gap-3 mt-6">
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex-1 py-3 bg-bgMain border border-borderSubtle text-textMain font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-borderSubtle transition-colors">
                      <i className="fab fa-linkedin text-blue-500"></i> LinkedIn
                    </a>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="flex-1 py-3 bg-bgMain border border-borderSubtle text-textMain font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-borderSubtle transition-colors">
                      <i className="fab fa-github"></i> GitHub
                    </a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Reusable Bento Card with Scroll Animation
function BentoCard({ children, className = "", id, onClick }: { children: React.ReactNode, className?: string, id?: string, onClick?: () => void }) {
  return (
    <motion.div 
      id={id}
      onClick={onClick}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, type: "spring" as const, bounce: 0.2 }}
      className={`bg-card rounded-[2rem] p-8 border border-borderSubtle shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Tech Stack Pill
function TechPill({ icon, label, glowColor }: { icon: string, label: string, glowColor?: string }) {
  return (
    <div className={`px-5 py-3 rounded-full bg-bgMain border border-borderSubtle text-sm font-semibold text-textMain flex items-center gap-2 transition-all duration-300 cursor-default hover:-translate-y-1 whitespace-nowrap shrink-0 ${glowColor || 'hover:bg-borderSubtle'}`}>
        <i className={`${icon} text-lg`}></i> {label}
    </div>
  );
}

// Featured Projects Carousel (Hero)
const heroProjects = [
  {
    title: "StudyOS Platform",
    desc: "An all-in-one student workspace integrating task management, SM-2 spaced repetition, and Orion—a context-aware Socratic AI tutor.",
    tags: ["React 19", "Firebase", "Gen AI"],
    img: "studyos",
    link: "https://github.com/SahanPramuditha-Dev",
    features: [
      "Context-aware AI tutoring using Google Gemini API",
      "SM-2 Spaced Repetition algorithm for flashcards",
      "Real-time task synchronization via Firebase Firestore",
      "Customizable study workflows and analytics dashboard"
    ],
    tech: ["React 19", "TypeScript", "Tailwind CSS", "Firebase Auth & Firestore", "Framer Motion", "Gemini API"]
  },
  {
    title: "FamilyTree",
    desc: "A private genealogy platform for exploring relatives, stories, migration, and family history.",
    tags: ["TypeScript", "React", "Node.js"],
    img: "familytree",
    link: "https://github.com/SahanPramuditha-Dev/FamilyTree",
    features: [
      "Interactive node-based visual tree rendering",
      "Secure private profiles with granular access control",
      "Timeline tracking for family migrations and milestones",
      "Media gallery and story archiving per family member"
    ],
    tech: ["React", "Node.js", "Express", "MongoDB", "D3.js for visual graph", "Tailwind CSS"]
  }
];

function FeaturedProjectsCarousel({ isDark, id }: { isDark: boolean, id?: string }) {
  const [index, setIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % heroProjects.length);
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <BentoCard id={id} className="md:col-span-2 h-[400px] p-0 overflow-hidden relative group bg-card">
        <AnimatePresence mode="wait">
          <motion.div 
            key={index}
            onClick={() => setSelectedProject(heroProjects[index])}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 block cursor-pointer"
          >
            {heroProjects[index].img === "studyos" ? (
              <div className="absolute top-8 -right-4 w-[55%] h-[110%] rounded-tl-2xl overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.08)] border-t border-l border-borderSubtle group-hover:-translate-x-4 group-hover:-translate-y-2 transition-transform duration-500 z-10 bg-bgMain">
                <img src={isDark ? "/studyos-dark.png" : "/studyos-light.png"} alt="StudyOS Dashboard" className="w-full h-full object-cover object-left-top" />
              </div>
            ) : heroProjects[index].img === "familytree" ? (
              <div className="absolute top-8 -right-4 w-[55%] h-[110%] rounded-tl-2xl overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.08)] border-t border-l border-borderSubtle group-hover:-translate-x-4 group-hover:-translate-y-2 transition-transform duration-500 z-10 bg-bgMain">
                <img src={isDark ? "/familytree-dark.png" : "/familytree-light.png"} alt="FamilyTree Dashboard" className="w-full h-full object-cover object-left-top" />
              </div>
            ) : (
              <div className="absolute top-8 -right-4 w-[55%] h-[110%] rounded-tl-2xl overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.08)] border-t border-l border-borderSubtle group-hover:-translate-x-4 group-hover:-translate-y-2 transition-transform duration-500 z-10 bg-gradient-to-br from-accent/20 to-bgMain flex items-center justify-center">
                <i className="fas fa-sitemap text-9xl text-accent/30"></i>
              </div>
            )}

            <div className="p-8 relative z-20 w-[45%] h-full flex flex-col justify-center">
              <div className="flex flex-wrap gap-2 mb-4">
                {heroProjects[index].tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">{tag}</span>
                ))}
              </div>
              <h2 className="text-3xl font-bold text-textMain mb-3 group-hover:text-accent transition-colors">{heroProjects[index].title}</h2>
              <p className="text-textMuted text-sm max-w-[320px] leading-relaxed mb-6">
                {heroProjects[index].desc}
              </p>
              <div className="flex items-center gap-2 text-accent text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Details</span>
                <i className="fas fa-search-plus"></i>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 left-8 flex gap-2 z-30 pointer-events-none">
          {heroProjects.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${index === i ? 'w-6 bg-accent' : 'w-2 bg-borderSubtle'}`}></div>
          ))}
        </div>
      </BentoCard>

      <ProjectModal project={selectedProject} isDark={isDark} onClose={() => setSelectedProject(null)} />
    </>
  );
}

// Live GitHub Projects Carousel (Secondary)
function LiveProjectsCarousel({ isDark }: { isDark?: boolean }) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('https://api.github.com/users/SahanPramuditha-Dev/repos?sort=updated&per_page=20')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        // Filter out the hero projects, forks, and provide fallbacks for missing descriptions
        const filtered = data
          .filter(r => !['StudyOS', 'FamilyTree'].includes(r.name) && !r.fork)
          .map(r => ({
            ...r,
            description: r.description || "A personal project repository by Sahan Pramuditha.",
            language: r.language || "Code"
          }));
        setRepos(filtered);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (repos.length === 0) return;
    const timer = setInterval(() => {
      setPage(prev => (prev + 1) % Math.ceil(repos.length / 2));
    }, 12000); // rotate secondary repos every 12 seconds
    return () => clearInterval(timer);
  }, [repos.length]);

  // Fallbacks if fetch fails
  const displayRepos = repos.length > 0 ? repos : [
    { name: 'GhostLink', description: 'Desktop network security & topology assessment tool.', language: 'Electron' },
    { name: 'iStore ERP', description: 'Retail POS and inventory platform with repair workflows.', language: 'FastAPI' }
  ];

  const currentPair = [
    displayRepos[(page * 2) % displayRepos.length],
    displayRepos[(page * 2 + 1) % displayRepos.length]
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={`left-${page}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="h-full"
        >
          <BentoCard className="!bg-textMain !border-transparent p-6 overflow-hidden relative group cursor-pointer flex flex-col justify-between h-[250px]">
            <div onClick={() => setSelectedProject(currentPair[0])} className="absolute inset-0 z-20"></div>
            <div className="relative z-10 pointer-events-none">
                {currentPair[0]?.language && <div className="inline-block px-3 py-1 bg-bgMain/20 text-bgMain rounded-full text-[10px] font-bold mb-3 uppercase tracking-wider">{currentPair[0].language}</div>}
                <h2 className="text-2xl font-bold text-bgMain mb-2">{currentPair[0]?.name.replace(/-/g, ' ')}</h2>
                <p className="text-bgMain/70 text-sm max-w-[200px] line-clamp-3">{currentPair[0]?.description}</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-bgMain/5 rounded-full blur-2xl group-hover:bg-bgMain/10 transition-colors z-0"></div>
            <i className="fas fa-arrow-right absolute bottom-6 right-6 text-xl text-bgMain opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all z-10"></i>
          </BentoCard>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`right-${page}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className="h-full"
        >
          <BentoCard className="!bg-bgMain p-6 overflow-hidden relative group cursor-pointer flex flex-col justify-between h-[250px]">
            <div onClick={() => setSelectedProject(currentPair[1])} className="absolute inset-0 z-20"></div>
            <div className="relative z-10 pointer-events-none">
                {currentPair[1]?.language && <div className="inline-block px-3 py-1 bg-card rounded-full text-[10px] font-bold text-textMain mb-3 uppercase tracking-wider border border-borderSubtle shadow-sm">{currentPair[1].language}</div>}
                <h2 className="text-2xl font-bold text-textMain mb-2">{currentPair[1]?.name.replace(/-/g, ' ')}</h2>
                <p className="text-textMuted text-sm max-w-[200px] line-clamp-3">{currentPair[1]?.description}</p>
            </div>
            <i className="fas fa-arrow-right absolute bottom-6 right-6 text-xl text-textMuted opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all z-10"></i>
          </BentoCard>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// GitHub Activity Card with Live Data
function GitHubActivityCard() {
  const [commits, setCommits] = useState<{ month: string, count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetch('/api/github/SahanPramuditha-Dev')
      .then(res => res.text())
      .then(htmlStr => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlStr, 'text/html');
        const days = doc.querySelectorAll('td[data-date]');

        const now = new Date();
        const monthCounts = new Array(12).fill(0);
        const monthNames = new Array(12).fill("");
        
        // Rolling 12-month window ending in the current month
        for(let i=0; i<12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
          monthNames[i] = d.toLocaleString('default', { month: 'short' });
        }

        let totalCount = 0;
        let recentActivity = false;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        days.forEach(dayEl => {
           const dateStr = dayEl.getAttribute('data-date');
           if (!dateStr) return;
           const d = new Date(dateStr);

           let count = 0;
           const id = dayEl.getAttribute('id');
           if (id) {
             const toolTip = doc.querySelector(`tool-tip[for="${id}"]`);
             if (toolTip && toolTip.textContent && !toolTip.textContent.includes('No contributions')) {
               const match = toolTip.textContent.match(/^([\d,]+)\s+contribution/);
               if (match) {
                 count = parseInt(match[1].replace(/,/g, ''), 10);
               }
             }
           }

           // Group into the rolling 12-month window
           const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
           if (diffMonths >= 0 && diffMonths < 12) {
              monthCounts[11 - diffMonths] += count;
              totalCount += count;
           }
           
           // Check if there was any activity in the last 30 days
           if (d >= thirtyDaysAgo && d <= now && count > 0) {
             recentActivity = true;
           }
        });
        
        const chartData = monthCounts.map((count, i) => ({
          month: monthNames[i],
          count
        }));
        
        setCommits(chartData);
        setTotal(totalCount);
        setIsActive(recentActivity);
      })
      .catch(err => {
        console.error("GitHub fetch failed:", err);
        setCommits([
          {month: 'Nov', count: 40}, {month: 'Dec', count: 70}, {month: 'Jan', count: 45},
          {month: 'Feb', count: 90}, {month: 'Mar', count: 65}, {month: 'Apr', count: 30},
          {month: 'May', count: 85}, {month: 'Jun', count: 100}, {month: 'Jul', count: 60},
          {month: 'Aug', count: 50}, {month: 'Sep', count: 75}, {month: 'Oct', count: 40}
        ]);
        setIsActive(true);
      });
  }, []);

  const displayData = commits.length > 0 ? commits : [
    {month: 'Nov', count: 40}, {month: 'Dec', count: 70}, {month: 'Jan', count: 45},
    {month: 'Feb', count: 90}, {month: 'Mar', count: 65}, {month: 'Apr', count: 30},
    {month: 'May', count: 85}, {month: 'Jun', count: 100}, {month: 'Jul', count: 60},
    {month: 'Aug', count: 50}, {month: 'Sep', count: 75}, {month: 'Oct', count: 40}
  ];
  const maxCount = Math.max(...displayData.map(d => d.count), 1);

  return (
    <BentoCard className="md:col-span-2 h-[200px] !p-0 relative overflow-hidden group">
      <a href="https://github.com/SahanPramuditha-Dev" target="_blank" rel="noreferrer" className="absolute inset-0 p-6 flex flex-col justify-between hover:bg-card/40 transition-colors z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-textMain flex items-center gap-2 group-hover:text-accent transition-colors">
            <i className="fab fa-github"></i> 
            GitHub
            <i className="fas fa-external-link-alt text-[10px] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"></i>
          </h3>
          <div className="flex items-center gap-2">
            {total > 0 && <span className="text-xs font-bold text-textMuted hidden sm:inline-block">{total}</span>}
            {isActive ? (
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-gray-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex items-end gap-1.5 h-16 relative">
            {displayData.map((d, i) => {
              // If count is 0, give it a tiny 2% sliver. If > 0, ensure it's visibly taller (min 15%) so a 1-commit month doesn't look identical to a 0-commit month.
              const h = d.count === 0 ? 2 : Math.max((d.count / maxCount) * 100, 15);
              return (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-accent/10 to-accent/30 rounded-t-sm hover:from-accent hover:to-accent transition-all cursor-pointer group/bar relative" 
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-md opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-20 shadow-lg translate-y-2 group-hover/bar:translate-y-0 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-zinc-900">
                    {d.month}: {d.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-textMuted font-bold uppercase tracking-widest mt-1 opacity-70">
            <span>Past Year</span>
            <span>Present</span>
          </div>
        </div>
      </a>
    </BentoCard>
  );
}

// Magnetic Dock Button (Links)
function DockIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring" as const, stiffness: 150, damping: 15, mass: 0.1 }}
      className="w-10 h-10 flex items-center justify-center rounded-full text-textMuted hover:text-textMain hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      {icon}
    </motion.a>
  );
}

// Magnetic Dock Button (Action)
function DockButton({ icon, onClick }: { icon: React.ReactNode, onClick: (e: React.MouseEvent) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      onClick={onClick}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring" as const, stiffness: 150, damping: 15, mass: 0.1 }}
      className="w-10 h-10 flex items-center justify-center rounded-full text-textMuted hover:text-textMain hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      {icon}
    </motion.button>
  );
}

// Certification Item
function CertItem({ icon, title, subtitle, date, onClick, hasProof }: { icon: string, title: string, subtitle: string, date?: string, onClick?: () => void, hasProof?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-2xl bg-card border border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ${hasProof ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none z-0"></div>
      <div className="w-10 h-10 rounded-full bg-bgMain flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-accent/10 relative z-10">
        <i className={`${icon} text-lg group-hover:scale-110 transition-transform duration-300`}></i>
      </div>
      <div className="flex-1 relative z-10">
        <h4 className="font-bold text-textMain text-sm flex items-center gap-2 mb-1">
          {title}
          <i className={`fas fa-certificate text-[10px] ${hasProof ? 'text-accent' : 'text-textMuted'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} title={hasProof ? "Verified Credential" : "Event"}></i>
        </h4>
        <p className="text-xs font-medium text-textMuted leading-relaxed">{subtitle}</p>
      </div>
      {date && <span className="absolute top-4 right-4 text-[10px] font-bold text-textMuted/40 tracking-wider z-10">{date}</span>}
    </div>
  );
}

// 3D Hover Text Component (splits word into characters)
function Hover3DText({ text, className = "" }: { text: string, className?: string }) {
  return (
    <span className="inline-flex whitespace-pre">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          whileHover={{ 
            y: -8, 
            scale: 1.05,
            rotateZ: Math.random() > 0.5 ? 2 : -2,
            textShadow: "0px 4px 0px var(--color-accent), 0px 8px 15px rgba(0,0,0,0.2)"
          }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 10 }}
          className={`inline-block transition-colors duration-200 ${className}`}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}



// Testimonials Component
// Services Component
function ServicesCard() {
    const services = [
    {
      id: 1,
      title: "Business Websites",
      desc: "Professional, responsive websites and landing pages for businesses, startups, and personal brands.",
      highlight: "Business Websites · Portfolios · Redesigns",
      icon: "fas fa-globe",
      tech: ["React", "TypeScript", "Tailwind CSS", "SEO"],
      color: "blue",
      bullets: ["Custom UI/UX Design", "Mobile-First Responsiveness", "SEO Optimization & Analytics"]
    },
    {
      id: 2,
      title: "POS & Business Software",
      desc: "Custom software that helps businesses seamlessly manage sales, inventory, billing, and everyday operations.",
      highlight: "POS Systems · Inventory · Sales Tracking",
      icon: "fas fa-cash-register",
      tech: ["React", "Python", "Node.js", "Databases"],
      color: "emerald",
      bullets: ["Real-time Inventory Sync", "Secure Payment Integration", "Automated Daily Reporting"]
    },
    {
      id: 3,
      title: "Full-Stack Web Apps",
      desc: "Functional web applications with frontend interfaces, backend REST APIs, databases, and authentication.",
      highlight: "React apps · Node.js APIs · Admin Dashboards",
      icon: "fas fa-laptop-code",
      tech: ["Next.js", "Express", "MongoDB", "PostgreSQL"],
      color: "purple",
      bullets: ["Scalable REST APIs", "Secure User Authentication", "Complex State Management"]
    },
    {
      id: 4,
      title: "Mobile-Friendly Apps",
      desc: "Simple, useful applications designed to make everyday tasks easier on phones and other mobile devices.",
      highlight: "Web apps · Student tools · Responsive apps",
      icon: "fas fa-mobile-alt",
      tech: ["React Native", "Responsive Design", "PWA"],
      color: "pink",
      bullets: ["Cross-Platform Compatibility", "Offline Support (PWAs)", "Touch-Optimized Interfaces"]
    },
    {
      id: 5,
      title: "Developer Tools",
      desc: "Lightweight tools that improve developer workflows, API testing, debugging, and productivity.",
      highlight: "VS Code extensions · API tools · Utilities",
      icon: "fas fa-tools",
      tech: ["TypeScript", "APIs", "Extension APIs"],
      color: "orange",
      bullets: ["Automated Workflow Scripts", "Custom VS Code Extensions", "Performance Profiling"]
    },
    {
      id: 6,
      title: "IT Support",
      desc: "Hands-on technical assistance for common computer hardware, software, and connectivity problems.",
      highlight: "PC Troubleshooting · Networking · OS Setup",
      icon: "fas fa-network-wired",
      tech: ["Windows OS", "Hardware", "Networking Config"],
      color: "cyan",
      bullets: ["Hardware Diagnostics", "Local Network Configuration", "OS & Software Installation"]
    }
  ];

  return (
    <BentoCard className="md:col-span-1 relative overflow-hidden group flex flex-col justify-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
      
      <h3 className="text-xl font-black text-textMain mb-6 flex items-center gap-3 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
           <i className="fas fa-layer-group text-accent text-sm"></i>
        </div>
        Core Offerings
      </h3>
      
      <div className="space-y-4 relative z-10">
        {services.map((svc, i) => (
          <div key={i} className="group/svc flex gap-4 p-4 rounded-2xl bg-bgMain/50 hover:bg-bgMain border border-borderSubtle hover:border-accent/30 transition-all duration-300">
            <div className={`w-12 h-12 shrink-0 rounded-xl ${svc.bg} flex items-center justify-center ${svc.color} group-hover/svc:scale-110 transition-transform duration-300 shadow-inner`}>
              <i className={`${svc.icon} text-lg`}></i>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-textMain mb-1 group-hover/svc:text-accent transition-colors">{svc.title}</h4>
              <p className="text-xs text-textMuted leading-relaxed mb-2 line-clamp-2">{svc.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {svc.tech.map((t, j) => (
                  <span key={j} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-textMain/5 text-textMain/70 border border-textMain/10">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
function TestimonialsCard() {
  const [active, setActive] = useState(0);
  const quotes = [
    { text: "Sahan has an incredible grasp on backend architecture and is a fantastic team player.", author: "Senior Engineer", role: "Internship Mentor" },
    { text: "Delivered our system faster than expected. The code was exceptionally clean.", author: "Client", role: "iStore ERP" },
    { text: "Highly proactive in solving complex IT support and networking issues.", author: "Lab Instructor", role: "UCSC" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActive(prev => (prev + 1) % quotes.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const quote = quotes[active];

  return (
    <BentoCard className="md:col-span-1 relative overflow-hidden flex flex-col min-h-[220px]">
       <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
        <h3 className="text-xl font-black text-textMain mb-6 flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
             <i className="fas fa-quote-left text-accent text-sm"></i>
          </div>
          Endorsements
        </h3>
        
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="group relative pl-6 py-4 border-l-4 border-accent"
            >
              <i className="fas fa-quote-left absolute -top-2 -left-3.5 text-bgMain bg-accent text-[12px] p-1.5 rounded-full"></i>
              <p className="text-sm text-textMain italic leading-relaxed mb-4">
                "{quote.text}"
              </p>
              <div className="flex flex-col gap-0.5 mt-auto">
                <p className="text-xs font-bold text-textMain">{quote.author}</p>
                <p className="text-[10px] text-accent font-semibold tracking-wide">{quote.role}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex justify-center gap-2 mt-4 relative z-10">
          {quotes.map((_, i) => (
             <button 
               key={i} 
               onClick={() => setActive(i)} 
               className={`h-2 rounded-full transition-all duration-300 ${active === i ? 'bg-accent w-6' : 'bg-borderSubtle hover:bg-textMuted w-2'}`}
               aria-label={`Go to endorsement ${i + 1}`}
             />
          ))}
        </div>
    </BentoCard>
  );
}

// Project Deep-Dive Modal
function ProjectModal({ project, isDark, onClose }: { project: any, isDark: boolean, onClose: () => void }) {
  useModalUX(!!project, onClose);
  if (!project) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
      />
      
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-borderSubtle rounded-[2rem] shadow-2xl p-6 md:p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto relative"
        >
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain rounded-full flex items-center justify-center transition-colors z-10">
            <i className="fas fa-times"></i>
          </button>
          
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {(project.tags || [project.language]).filter(Boolean).map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">{tag}</span>
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-textMain mb-4">{project.title || project.name?.replace(/-/g, ' ')}</h2>
            <p className="text-textMuted text-lg leading-relaxed">{project.desc || project.description}</p>
          </div>
          
          {/* Architecture/Screenshot Mockup Placeholder */}
          <div className="w-full h-[300px] md:h-[400px] bg-bgMain rounded-2xl border border-borderSubtle flex flex-col items-center justify-center overflow-hidden mb-8 relative group">
            {project.img ? (
               <img src={isDark ? "/" + project.img + "-dark.png" : "/" + project.img + "-light.png"} alt={project.title} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            ) : (
               <div className="text-center">
                 <i className="fas fa-project-diagram text-6xl text-borderSubtle mb-4"></i>
                 <p className="text-textMuted font-medium">Architecture Diagram & Screenshots coming soon</p>
               </div>
            )}
          </div>

                    {project.features && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fas fa-star text-accent"></i> Key Features
                </h3>
                <ul className="space-y-3">
                  {project.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-textMain text-sm font-medium">
                      <i className="fas fa-check-circle text-accent mt-0.5 shrink-0"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fas fa-microchip text-accent"></i> Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech?.map((t: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-card border border-borderSubtle text-textMain rounded-lg text-xs font-bold shadow-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <a href={project.link || project.html_url || "#"} target="_blank" rel="noreferrer" className="px-6 py-3 bg-textMain text-bgMain font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
              <i className="fab fa-github"></i> View Repository
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


// 

// Reload 

// Reload 2 


// Reload 3 



// Services Component (Dynamic Tabs)
function ServicesCards() {
  const [active, setActive] = useState(0);
  const services = [
    {
      id: 1,
      title: "Business Websites",
      desc: "Professional, responsive websites and landing pages for businesses, startups, and personal brands.",
      highlight: "Business Websites · Portfolios · Redesigns",
      icon: "fas fa-globe",
      tech: ["React", "TypeScript", "Tailwind CSS", "SEO"],
      color: "blue",
      bullets: ["Custom UI/UX Design", "Mobile-First Responsiveness", "SEO Optimization & Analytics"]
    },
    {
      id: 2,
      title: "POS & Business Software",
      desc: "Custom software that helps businesses seamlessly manage sales, inventory, billing, and everyday operations.",
      highlight: "POS Systems · Inventory · Sales Tracking",
      icon: "fas fa-cash-register",
      tech: ["React", "Python", "Node.js", "Databases"],
      color: "emerald",
      bullets: ["Real-time Inventory Sync", "Secure Payment Integration", "Automated Daily Reporting"]
    },
    {
      id: 3,
      title: "Full-Stack Web Apps",
      desc: "Functional web applications with frontend interfaces, backend REST APIs, databases, and authentication.",
      highlight: "React apps · Node.js APIs · Admin Dashboards",
      icon: "fas fa-laptop-code",
      tech: ["Next.js", "Express", "MongoDB", "PostgreSQL"],
      color: "purple",
      bullets: ["Scalable REST APIs", "Secure User Authentication", "Complex State Management"]
    },
    {
      id: 4,
      title: "Mobile-Friendly Apps",
      desc: "Simple, useful applications designed to make everyday tasks easier on phones and other mobile devices.",
      highlight: "Web apps · Student tools · Responsive apps",
      icon: "fas fa-mobile-alt",
      tech: ["React Native", "Responsive Design", "PWA"],
      color: "pink",
      bullets: ["Cross-Platform Compatibility", "Offline Support (PWAs)", "Touch-Optimized Interfaces"]
    },
    {
      id: 5,
      title: "Developer Tools",
      desc: "Lightweight tools that improve developer workflows, API testing, debugging, and productivity.",
      highlight: "VS Code extensions · API tools · Utilities",
      icon: "fas fa-tools",
      tech: ["TypeScript", "APIs", "Extension APIs"],
      color: "orange",
      bullets: ["Automated Workflow Scripts", "Custom VS Code Extensions", "Performance Profiling"]
    },
    {
      id: 6,
      title: "IT Support",
      desc: "Hands-on technical assistance for common computer hardware, software, and connectivity problems.",
      highlight: "PC Troubleshooting · Networking · OS Setup",
      icon: "fas fa-network-wired",
      tech: ["Windows OS", "Hardware", "Networking Config"],
      color: "cyan",
      bullets: ["Hardware Diagnostics", "Local Network Configuration", "OS & Software Installation"]
    }
  ];

  const activeService = services[active];

  const colorMap: Record<string, string> = {
    blue: "from-blue-500/10 to-transparent",
    emerald: "from-emerald-500/10 to-transparent",
    purple: "from-purple-500/10 to-transparent",
    pink: "from-pink-500/10 to-transparent",
    orange: "from-orange-500/10 to-transparent",
    cyan: "from-cyan-500/10 to-transparent",
  };

  const iconColorMap: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    pink: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  };

  const textColorMap: Record<string, string> = {
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    purple: "text-purple-500",
    pink: "text-pink-500",
    orange: "text-orange-500",
    cyan: "text-cyan-500",
  };

  return (
    <BentoCard id="services" className="md:col-span-2 p-0 overflow-hidden flex flex-col md:flex-row h-auto md:h-[480px]">
      {/* Left Menu */}
      <div className="w-full md:w-5/12 lg:w-2/5 bg-transparent p-6 flex flex-col z-20 relative">
        <h3 className="text-sm font-black text-textMain uppercase tracking-widest mb-6 flex items-center gap-2">
          <i className="fas fa-layer-group text-accent"></i> Core Offerings
        </h3>
        <div className="flex flex-col gap-1.5 flex-1 justify-center">
          {services.map((svc, idx) => (
            <button 
              key={svc.id} 
              onMouseEnter={() => setActive(idx)}
              onClick={() => setActive(idx)}
              className={`text-left px-4 py-3 rounded-xl transition-all duration-300 border font-bold text-sm flex items-center justify-between group overflow-hidden relative ${active === idx ? 'bg-bgMain border-borderSubtle shadow-sm text-accent' : 'border-transparent text-textMain hover:bg-bgMain/50'}`}
            >
              {active === idx && (
                <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
              )}
              <div className="flex items-center gap-3 relative z-10">
                <i className={`${svc.icon} ${active === idx ? 'text-accent' : 'text-textMuted group-hover:text-textMain'}`}></i>
                {svc.title}
              </div>
              <i className={`fas fa-chevron-right text-[10px] transition-transform relative z-10 ${active === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}></i>
            </button>
          ))}
        </div>
      </div>

      {/* Right Content View */}
      <div className="w-full md:w-7/12 lg:w-3/5 p-6 md:p-8 relative overflow-hidden bg-bgMain flex flex-col rounded-t-3xl md:rounded-none md:rounded-l-3xl">
        <AnimatePresence>
          <motion.div 
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br ${colorMap[activeService.color]} pointer-events-none`}
          />
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col relative z-10"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-md border backdrop-blur-md ${iconColorMap[activeService.color]}`}
            >
              <i className={activeService.icon}></i>
            </motion.div>
            
            <h2 className="text-2xl md:text-3xl font-black text-textMain mb-4 leading-tight">{activeService.title}</h2>
            <p className="text-textMuted text-sm md:text-base leading-relaxed mb-6 max-w-lg">{activeService.desc}</p>
            
            <ul className="space-y-3 mb-8">
              {activeService.bullets.map((bullet, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + (i * 0.1) }}
                  className="flex items-center gap-3 text-sm text-textMain font-medium"
                >
                  <i className={`fas fa-check-circle ${textColorMap[activeService.color]} shrink-0`}></i>
                  {bullet}
                </motion.li>
              ))}
            </ul>
            
            <div className="mt-auto pt-5 border-t border-borderSubtle">
              <div className="flex flex-wrap gap-2">
                {activeService.tech.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-card border border-borderSubtle text-textMain rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">{t}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </BentoCard>
  );
}


// Reload 4 

// Reload 5 

// Reload 6 

// Reload 7 

// Reload 8 

// Reload 9 

// Reload 10 

// Reload 11 

// Reload 12 

// Reload 13 

// Reload 14 

// Reload 15 

// Reload 16 

// Reload 17 

// Reload 18 

// Reload 19 

// Reload 20 

// Reload 21 

// Reload 22 

// Reload 23 

// Reload 24 

// Reload 25 

// Reload 26 

// Reload 28 

// Reload 29 

// Reload 30 

// Reload 31 
