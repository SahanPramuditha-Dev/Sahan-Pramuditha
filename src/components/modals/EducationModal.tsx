import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalUX, staggerContainer, staggerItem } from './useModalUX';

export function EducationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
                <div className="w-14 h-14 bg-white border border-borderSubtle rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5">
                  <img src="/uoc-logo.png" alt="University of Colombo Logo" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
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
                  <div className="w-14 h-14 bg-white border border-borderSubtle rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5">
                    <img src="/christ-king-logo.png" alt="Christ King College Logo" className="w-full h-full object-contain drop-shadow-sm" />
                  </div>
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
                  <div className="w-14 h-14 bg-white border border-borderSubtle rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1.5">
                    <img src="/slt-nebula-logo.png" alt="SLT Nebula Logo" className="w-full h-full object-contain" />
                  </div>
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
