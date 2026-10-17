import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function BentoCard({ 
  children, 
  className = "", 
  id, 
  onClick 
}: { 
  children: React.ReactNode; 
  className?: string; 
  id?: string; 
  onClick?: () => void;
}) {
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

export function TechPill({ icon, label, glowColor }: { icon: string; label: string; glowColor?: string }) {
  return (
    <div className={`px-5 py-3 rounded-full bg-bgMain border border-borderSubtle text-sm font-semibold text-textMain flex items-center gap-2 transition-all duration-300 cursor-default hover:-translate-y-1 whitespace-nowrap shrink-0 ${glowColor || 'hover:bg-borderSubtle'}`}>
      <i className={`${icon} text-lg`}></i> {label}
    </div>
  );
}

export function DockIcon({ icon, href }: { icon: React.ReactNode; href: string }) {
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

export function DockButton({ icon, onClick }: { icon: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
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

export function CertItem({ 
  icon, 
  title, 
  subtitle, 
  date, 
  onClick, 
  hasProof 
}: { 
  icon: string; 
  title: string; 
  subtitle: string; 
  date?: string; 
  onClick?: () => void; 
  hasProof?: boolean;
}) {
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

export function Hover3DText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className="inline-flex whitespace-pre">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          whileHover={{ 
            y: -8, 
            scale: 1.05,
            rotateZ: i % 2 === 0 ? 2 : -2,
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
