import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MetadataDetective = lazy(() => import('./MetadataDetective'));
const FileEncryptor = lazy(() => import('./FileEncryptor'));
const SecretMessageVault = lazy(() => import('./SecretMessageVault'));
const GhostTextVault = lazy(() => import('./GhostTextVault'));
const TimeBombVault = lazy(() => import('./TimeBombVault'));
const AudioPhantomVault = lazy(() => import('./AudioPhantomVault'));

export default function CyberLab() {
  const [activeTab, setActiveTab] = useState<'metadata' | 'encryptor' | 'stego' | 'ghost' | 'audio' | 'timebomb'>('metadata');

  return (
    <section id="cyber-lab" className="py-20 w-full">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm">
              <i className="fas fa-shield-alt text-xl"></i>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-textMain tracking-tight">
              Cyber Lab
            </h2>
          </div>
          <p className="text-textMuted text-sm sm:text-base max-w-xl mx-auto">
            Practical client-side privacy & steganography suite. Runs 100% in your browser without cloud telemetry.
          </p>
        </div>

        {/* Horizontal Floating Tool Ribbon */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1.5 p-1.5 bg-card/80 backdrop-blur-md rounded-2xl border border-borderSubtle shadow-sm overflow-x-auto max-w-full custom-scrollbar">
            <TabPill
              active={activeTab === 'metadata'}
              onClick={() => setActiveTab('metadata')}
              icon="fa-search"
              label="Metadata"
            />
            <TabPill
              active={activeTab === 'encryptor'}
              onClick={() => setActiveTab('encryptor')}
              icon="fa-lock"
              label="Encryptor"
            />
            <TabPill
              active={activeTab === 'stego'}
              onClick={() => setActiveTab('stego')}
              icon="fa-user-secret"
              label="Image Stego"
            />
            <TabPill
              active={activeTab === 'ghost'}
              onClick={() => setActiveTab('ghost')}
              icon="fa-ghost"
              label="Ghost Text"
            />
            <TabPill
              active={activeTab === 'audio'}
              onClick={() => setActiveTab('audio')}
              icon="fa-headphones-alt"
              label="Sonic Phantom"
            />
            <TabPill
              active={activeTab === 'timebomb'}
              onClick={() => setActiveTab('timebomb')}
              icon="fa-bomb"
              label="Time-Bomb"
            />
          </div>
        </div>

        {/* Focused Centered Main Stage */}
        <div className="bg-bgMain rounded-3xl p-6 sm:p-10 border border-borderSubtle shadow-xl relative overflow-hidden flex flex-col min-h-[420px]">
          {/* Subtle Cyber Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full h-full flex flex-col justify-center flex-1"
              >
                <Suspense fallback={
                  <div className="flex flex-col items-center justify-center p-12 text-textMuted">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
                    <span className="text-sm font-mono">Loading module...</span>
                  </div>
                }>
                  {activeTab === 'metadata' && <MetadataDetective />}
                  {activeTab === 'encryptor' && <FileEncryptor />}
                  {activeTab === 'stego' && <SecretMessageVault />}
                  {activeTab === 'ghost' && <GhostTextVault />}
                  {activeTab === 'audio' && <AudioPhantomVault />}
                  {activeTab === 'timebomb' && <TimeBombVault />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}

function TabPill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
        active
          ? 'bg-accent text-white shadow-sm shadow-accent/25'
          : 'text-textMuted hover:text-textMain hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      <i className={`fas ${icon} text-xs ${active ? 'text-white' : 'text-accent'}`}></i>
      <span>{label}</span>
    </button>
  );
}
