import { motion, AnimatePresence } from 'framer-motion';
import { useModalUX, staggerContainer, staggerItem } from './useModalUX';
import type { ExperienceData } from '../../types/experience';

export function ExperienceModal({ 
  experience, 
  onClose 
}: { 
  experience: ExperienceData | null; 
  onClose: () => void;
}) {
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
                  <a href="mailto:sahan.dev.tech@gmail.com" className="shrink-0 px-6 py-2.5 rounded-full text-bgMain font-semibold text-sm bg-textMain hover:opacity-80 shadow-sm active:scale-95 transition-all flex items-center gap-2 group">
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
