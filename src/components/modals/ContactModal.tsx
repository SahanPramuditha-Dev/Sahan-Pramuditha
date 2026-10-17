import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalUX } from './useModalUX';

export function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleClose = () => {
    setSubmitState('idle');
    onClose();
  };

  useModalUX(isOpen, handleClose);

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
}
