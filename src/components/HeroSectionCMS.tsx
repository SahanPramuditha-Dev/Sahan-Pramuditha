import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { type HeroConfig, DEFAULT_HERO_CONFIG } from '../types/cms';

function Hover3DTextPreview({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className="inline-flex whitespace-pre">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          whileHover={{ 
            y: -6, 
            scale: 1.05,
            rotateZ: i % 2 === 0 ? 2 : -2,
            textShadow: "0px 4px 0px var(--color-accent), 0px 8px 15px rgba(0,0,0,0.2)"
          }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 10 }}
          className={`inline-block transition-colors duration-200 cursor-default ${className}`}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function HeroSectionCMS() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newTaglineWord, setNewTaglineWord] = useState('');
  const [currentWord, setCurrentWord] = useState(0);
  const [time, setTime] = useState(new Date());

  // Live Clock for accurate mirror of Profile Bento Card
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load hero data from Firestore
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'hero'));
        if (snap.exists()) {
          const data = snap.data() as Partial<HeroConfig>;
          setConfig({
            ...DEFAULT_HERO_CONFIG,
            ...data,
            taglineWords: data.taglineWords?.length ? data.taglineWords : DEFAULT_HERO_CONFIG.taglineWords,
          });
        }
      } catch (err) {
        console.error("Failed to load hero CMS settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeroData();
  }, []);

  // Tagline cycle exactly matching App.tsx (2500ms)
  useEffect(() => {
    if (!config.taglineWords.length) return;
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % config.taglineWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [config.taglineWords.length]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'portfolio', 'hero'), config, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Error saving hero section: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset hero section to default portfolio configuration? (Click Publish afterwards to save)")) {
      setConfig(DEFAULT_HERO_CONFIG);
    }
  };

  const addTaglineWord = () => {
    const trimmed = newTaglineWord.trim();
    if (!trimmed) return;
    if (config.taglineWords.includes(trimmed)) return;
    setConfig({
      ...config,
      taglineWords: [...config.taglineWords, trimmed]
    });
    setNewTaglineWord('');
  };

  const removeTaglineWord = (index: number) => {
    if (config.taglineWords.length <= 1) {
      alert("Keep at least one animated tagline word.");
      return;
    }
    setConfig({
      ...config,
      taglineWords: config.taglineWords.filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card/70 backdrop-blur-xl p-16 rounded-[2.5rem] border border-borderSubtle flex flex-col items-center justify-center gap-4 shadow-xl">
        <div className="w-10 h-10 rounded-full border-3 border-accent border-t-transparent animate-spin"></div>
        <span className="text-xs font-bold text-textMuted tracking-widest uppercase">Loading Hero Settings...</span>
      </div>
    );
  }

  const activeWords = config.taglineWords.length ? config.taglineWords : ["scale"];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-borderSubtle shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              CMS Module 01
            </span>
            <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Firestore Live Database Sync
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Hero Section Manager</h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl leading-relaxed">
            Manage the primary typography, animated typewriter punchlines, bio text, social profiles, and location label.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-3 rounded-2xl border border-borderSubtle bg-card hover:bg-bgMain text-textMuted hover:text-textMain text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-undo-alt text-xs"></i> Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-accent hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <i className="fas fa-circle-notch fa-spin text-xs"></i> Saving...
              </>
            ) : saveSuccess ? (
              <>
                <i className="fas fa-check text-xs"></i> Published Live!
              </>
            ) : (
              <>
                <i className="fas fa-cloud-arrow-up text-xs"></i> Publish Changes
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-500 text-sm font-semibold shadow-md"
          >
            <i className="fas fa-check-circle text-lg"></i>
            Hero configuration successfully updated and live on your homepage!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Form (Left) & Real Hero Mirror (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Form Controls */}
        <div className="xl:col-span-6 space-y-6">
          
          {/* Brand Mark & Bio */}
          <div className="bg-card/80 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] border border-borderSubtle shadow-lg space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-borderSubtle">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <i className="fas fa-signature text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-textMain">Brand Logo & Bio</h3>
                <p className="text-[11px] text-textMuted">The primary icon and introductory paragraph on the homepage</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-textMuted mb-2 block">
                Brand Logo Mark (Square Avatar)
              </label>
              <input
                type="text"
                maxLength={5}
                value={config.logoText}
                onChange={(e) => setConfig({ ...config, logoText: e.target.value })}
                placeholder="S."
                className="w-full sm:w-32 bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-base font-black text-textMain focus:border-accent outline-none shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-textMuted mb-2 block">
                Hero Bio Description
              </label>
              <textarea
                rows={4}
                value={config.bio}
                onChange={(e) => setConfig({ ...config, bio: e.target.value })}
                placeholder="Hi, I'm Sahan Pramuditha..."
                className="w-full bg-bgMain border border-borderSubtle rounded-2xl p-4 text-sm leading-relaxed text-textMain focus:border-accent outline-none transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Rotating Tagline Words */}
          <div className="bg-card/80 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] border border-borderSubtle shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-borderSubtle gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <i className="fas fa-magic text-sm"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-textMain">Animated Punchline Words</h3>
                  <p className="text-[11px] text-textMuted">Cycles inside: "I build digital products that [word]."</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20 self-start sm:self-auto">
                {config.taglineWords.length} Words
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {config.taglineWords.map((word, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-bgMain border border-borderSubtle text-xs font-bold text-textMain group shadow-sm hover:border-accent/40 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  {word}
                  <button
                    type="button"
                    onClick={() => removeTaglineWord(idx)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-textMuted hover:text-red-500 hover:bg-red-500/10 transition-colors ml-1"
                    title="Remove word"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <input
                type="text"
                value={newTaglineWord}
                onChange={(e) => setNewTaglineWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTaglineWord();
                  }
                }}
                placeholder="Type new keyword and press enter (e.g. inspire)..."
                className="flex-1 bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-xs text-textMain focus:border-accent outline-none shadow-inner"
              />
              <button
                type="button"
                onClick={addTaglineWord}
                className="px-5 py-3 rounded-2xl bg-accent text-white hover:bg-blue-600 font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-accent/20 active:scale-95 shrink-0"
              >
                <i className="fas fa-plus text-xs"></i> Add
              </button>
            </div>
          </div>

          {/* Action Links & Profile Bento Card Metadata */}
          <div className="bg-card/80 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] border border-borderSubtle shadow-lg space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-borderSubtle">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <i className="fas fa-link text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-textMain">Action Links & Location</h3>
                <p className="text-[11px] text-textMuted">External links and location badge rendered on the hero and profile cards</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-textMuted mb-2 block">
                  <i className="fab fa-github mr-1 text-textMain"></i> GitHub URL
                </label>
                <input
                  type="url"
                  value={config.githubUrl}
                  onChange={(e) => setConfig({ ...config, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none font-mono shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-textMuted mb-2 block">
                  <i className="fab fa-linkedin mr-1 text-blue-500"></i> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={config.linkedinUrl}
                  onChange={(e) => setConfig({ ...config, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none font-mono shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-textMuted mb-2 block">
                  <i className="fas fa-file-pdf mr-1 text-red-500"></i> CV / Resume Download URL
                </label>
                <input
                  type="text"
                  value={config.resumeDownloadUrl}
                  onChange={(e) => setConfig({ ...config, resumeDownloadUrl: e.target.value })}
                  placeholder="/Sahan_Pramuditha_Resume.pdf"
                  className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none font-mono shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-textMuted mb-2 block">
                  <i className="fas fa-map-marker-alt mr-1 text-emerald-500"></i> Location Badge Label
                </label>
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                  placeholder="Sri Lanka"
                  className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none shadow-inner"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: 100% Exact 1:1 Live Homepage Hero Mirror */}
        <div className="xl:col-span-6">
          <div className="xl:sticky top-8 space-y-4">
            
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black uppercase tracking-wider text-textMuted flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                1:1 Real Portfolio Mirror
              </span>
              <span className="text-[10px] font-bold text-textMuted bg-card/80 border border-borderSubtle px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <i className="fas fa-desktop text-accent text-[9px]"></i> Exact Homepage Render
              </span>
            </div>

            {/* Simulated Homepage Viewport */}
            <div className="bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-borderSubtle p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
              
              {/* Left Column Section: Pure Typography & Floating S. */}
              <div className="relative z-10 space-y-6">
                
                {/* Brand Mark S. */}
                <div className="w-12 h-12 bg-textMain text-bgMain rounded-xl flex items-center justify-center font-black text-2xl shadow-sm cursor-pointer select-none shrink-0">
                  {config.logoText || "S."}
                </div>

                {/* Main Massive Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black tracking-tighter leading-[1.05] text-textMain cursor-default">
                  <Hover3DTextPreview text="I build" />
                  <br/>
                  <Hover3DTextPreview 
                    text="digital" 
                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient" 
                  />
                  <br/>
                  <Hover3DTextPreview 
                    text="products" 
                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient" 
                  />
                  <br/>
                  <Hover3DTextPreview text="that" />
                  <br/>
                  <div 
                    className="text-accent inline-block overflow-hidden relative h-[1.2em] w-[6em]"
                    style={{ 
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                      maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={currentWord}
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -80, opacity: 0 }}
                        transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
                        className="absolute left-0"
                      >
                        {activeWords[currentWord % activeWords.length]}.
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </h1>

                {/* Hero Bio Paragraph */}
                <p className="text-sm sm:text-base text-textMuted max-w-md leading-relaxed font-medium">
                  {config.bio}
                </p>

                {/* Action Links */}
                <div className="flex items-center gap-5 text-sm font-semibold text-textMain pt-1">
                  <a href={config.githubUrl} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors flex items-center">
                    <i className="fab fa-github text-xl mr-2"></i> GitHub
                  </a>
                  <a href={config.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors flex items-center">
                    <i className="fab fa-linkedin text-xl mr-2 text-blue-500"></i> LinkedIn
                  </a>
                </div>
              </div>

              {/* Matching Profile Bento Card Preview */}
              <div className="pt-6 border-t border-borderSubtle relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block mb-3">
                  Profile Bento Card (Top-Right on Homepage)
                </span>

                <div className="relative overflow-hidden rounded-3xl h-[220px] group border border-borderSubtle shadow-md">
                  <img 
                    src="/profile.jpg" 
                    alt="Sahan Pramuditha" 
                    className="absolute inset-0 w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col justify-end text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping-slow relative">
                        <span className="absolute inset-0 rounded-full bg-green-500"></span>
                      </span>
                      <span className="text-xs font-bold text-green-400 uppercase tracking-wider drop-shadow-md">
                        {config.location || "Sri Lanka"}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white mb-1 drop-shadow-lg">Sahan Pramuditha</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs font-medium text-gray-300 font-mono tracking-tight drop-shadow-md">
                        {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} Local Time
                      </div>
                      <a 
                        href={config.resumeDownloadUrl || "/Sahan_Pramuditha_Resume.pdf"} 
                        download 
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 border border-white/10 shadow-lg"
                      >
                        <i className="fas fa-download text-[10px]"></i> CV
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
