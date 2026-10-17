import { motion, AnimatePresence } from 'framer-motion';
import { useModalUX, staggerContainer, staggerItem } from './useModalUX';

export function ResumeSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
