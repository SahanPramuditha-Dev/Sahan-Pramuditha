import { motion, AnimatePresence } from 'framer-motion';
import { useModalUX } from './useModalUX';

export function ProjectModal({ 
  project, 
  isDark, 
  onClose 
}: { 
  project: any; 
  isDark: boolean; 
  onClose: () => void;
}) {
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
