import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from '../ui/PortfolioUI';

export function TestimonialsCard() {
  const [active, setActive] = useState(0);
  const quotes = [
    { text: "Sahan has an incredible grasp on backend architecture and is a fantastic team player.", author: "Senior Engineer", role: "Internship Mentor" },
    { text: "Delivered our system faster than expected. The code was exceptionally clean.", author: "Client", role: "iStore ERP" },
    { text: "Highly proactive in solving complex IT support and networking issues.", author: "Lab Instructor", role: "UCSC" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActive(prev => (prev + 1) % quotes.length), 6000);
    return () => clearInterval(timer);
  }, [quotes.length]);

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
