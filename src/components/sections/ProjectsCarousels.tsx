import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BentoCard } from '../ui/PortfolioUI';
import { ProjectModal } from '../modals/ProjectModal';

export function FeaturedProjectsCarousel({ isDark, id }: { isDark: boolean; id?: string }) {
  const [index, setIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([
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
        "Offline-first PWA support"
      ]
    },
    {
      title: "FamilyTree Directory",
      desc: "A scalable, responsive church directory and census management system built for over 500+ parishioners.",
      tags: ["React Router", "Tailwind", "REST API"],
      img: "familytree",
      link: "https://github.com/SahanPramuditha-Dev",
      features: [
        "Dynamic search and filtering across 500+ records",
        "Role-based access control for ward admins",
        "Automated PDF report generation",
        "Mobile-first responsive design"
      ]
    }
  ]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (docSnap.exists() && Array.isArray(docSnap.data().items) && docSnap.data().items.length > 0) {
          setProjects(docSnap.data().items);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;
    const timer = setInterval(() => {
      if (!selectedProject) {
        setIndex(prev => (prev + 1) % projects.length);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [selectedProject, projects]);

  if (projects.length === 0) return null;
  const currentProject = projects[index];

  return (
    <>
      <BentoCard id={id} className="md:col-span-2 h-[400px] p-0 overflow-hidden relative group bg-card">
        <AnimatePresence mode="wait">
          <motion.div 
            key={index}
            onClick={() => setSelectedProject(currentProject)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 block cursor-pointer"
          >
            {currentProject.img === "studyos" ? (
              <div className="absolute top-8 -right-4 w-[55%] h-[110%] rounded-tl-2xl overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.08)] border-t border-l border-borderSubtle group-hover:-translate-x-4 group-hover:-translate-y-2 transition-transform duration-500 z-10 bg-bgMain">
                <img src={isDark ? "/studyos-dark.png" : "/studyos-light.png"} alt="StudyOS Dashboard" className="w-full h-full object-cover object-left-top" />
              </div>
            ) : currentProject.img === "familytree" ? (
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
                {currentProject.tags?.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">{tag}</span>
                ))}
              </div>
              <h2 className="text-3xl font-bold text-textMain mb-3 group-hover:text-accent transition-colors">{currentProject.title}</h2>
              <p className="text-textMuted text-sm max-w-[320px] leading-relaxed mb-6">
                {currentProject.desc}
              </p>
              <div className="flex items-center gap-2 text-accent text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Details</span>
                <i className="fas fa-search-plus"></i>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 left-8 flex gap-2 z-30 pointer-events-none">
          {projects.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${index === i ? 'w-6 bg-accent' : 'w-2 bg-borderSubtle'}`}></div>
          ))}
        </div>
      </BentoCard>

      <ProjectModal project={selectedProject} isDark={isDark} onClose={() => setSelectedProject(null)} />
    </>
  );
}

export function LiveProjectsCarousel({ isDark: _isDark }: { isDark?: boolean }) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('https://api.github.com/users/SahanPramuditha-Dev/repos?sort=updated&per_page=20')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
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
    }, 12000);
    return () => clearInterval(timer);
  }, [repos.length]);

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

      <ProjectModal project={selectedProject} isDark={_isDark ?? false} onClose={() => setSelectedProject(null)} />
    </>
  );
}
