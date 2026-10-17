import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';

export default function AdminLogin({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccessOverlay, setIsSuccessOverlay] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const loginEmail = email.includes('@') ? email : `${email.toLowerCase()}@admin.com`;
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, loginEmail, password);
      setIsSuccessOverlay(true);
      setTimeout(() => {
        setIsSuccessOverlay(false);
        if (onSuccess) onSuccess();
      }, 2500);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const loginEmail = email.includes('@') ? email : `${email.toLowerCase()}@admin.com`;
          await import('firebase/auth').then(({ createUserWithEmailAndPassword }) => {
            return createUserWithEmailAndPassword(auth, loginEmail, password);
          });
          setIsSuccessOverlay(true);
          setTimeout(() => {
            setIsSuccessOverlay(false);
            if (onSuccess) onSuccess();
          }, 2500);
        } catch (createErr: any) {
          setError(createErr.message.replace('Firebase:', ''));
        }
      } else {
        setError(err.message.replace('Firebase:', ''));
      }
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-bgMain text-textMain flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {isSuccessOverlay ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-full max-w-md flex flex-col items-center justify-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.1 }}
              className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mb-8 border-2 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.4)] relative"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity }} 
                className="absolute inset-0 rounded-full border border-green-500/30" 
              />
              <i className="fas fa-check text-6xl text-green-500"></i>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black tracking-tight text-white mb-2"
            >
              Access Granted
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-green-400 font-medium tracking-widest uppercase text-sm"
            >
              Decrypting CMS Dashboard...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md bg-card/60 backdrop-blur-xl p-8 rounded-[2rem] border border-borderSubtle shadow-2xl relative z-10"
          >
            <div className="flex justify-center mb-8 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center text-accent shadow-lg shadow-accent/10 border border-accent/20">
                <i className="fas fa-fingerprint text-4xl"></i>
              </div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black tracking-tight">System Access</h1>
              <p className="text-textMuted text-sm mt-2">Verify your identity to manage CMS</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-sm flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <div className="relative group">
                  <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-accent transition-colors"></i>
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl pl-12 pr-4 py-3.5 focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm font-medium" placeholder="Username (e.g., Sahan)" required />
                </div>
              </div>
              
              <div>
                <div className="relative group">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-accent transition-colors"></i>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl pl-12 pr-4 py-3.5 focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm font-medium" placeholder="••••••••" required />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-accent text-white font-bold rounded-xl py-3.5 mt-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2">
                Authenticate <i className="fas fa-arrow-right text-xs"></i>
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
