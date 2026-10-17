import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from '../ui/PortfolioUI';

export function ServicesCards() {
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
