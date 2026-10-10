import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetadataDetective from './MetadataDetective';
import FileEncryptor from './FileEncryptor';
import SecretMessageVault from './SecretMessageVault';
import TimeBombVault from './TimeBombVault';

export default function CyberLab() {
  const [activeTab, setActiveTab] = useState<'metadata' | 'encryptor' | 'stego' | 'timebomb'>('metadata');

  return (
    <section id="cyber-lab" className="py-20 w-full">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm shrink-0">
              <i className="fas fa-shield-alt text-2xl"></i>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-textMain tracking-tight">
                Cyber Lab
              </h2>
            </div>
          </div>
          <p className="text-textMuted mt-3 text-lg">Practical security tools for everyday digital privacy. Runs entirely in your browser.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Menu */}
          <div className="lg:w-1/3 flex flex-col gap-2">
            <TabButton 
              active={activeTab === 'metadata'} 
              onClick={() => setActiveTab('metadata')}
              icon="fa-search" 
              title="Metadata Detective"
              desc="Inspect and remove hidden EXIF data"
            />
            <TabButton 
              active={activeTab === 'encryptor'} 
              onClick={() => setActiveTab('encryptor')}
              icon="fa-lock" 
              title="File Encryptor"
              desc="AES-GCM client-side encryption"
            />
            <TabButton 
              active={activeTab === 'stego'} 
              onClick={() => setActiveTab('stego')}
              icon="fa-user-secret" 
              title="Secret Message Vault"
              desc="Hide encrypted messages inside images"
            />
            <TabButton 
              active={activeTab === 'timebomb'} 
              onClick={() => setActiveTab('timebomb')}
              icon="fa-bomb" 
              title="Time-Bomb Vault"
              desc="Self-destructing file lockers"
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:w-2/3 bg-bgMain rounded-3xl p-6 md:p-10 border border-borderSubtle shadow-xl relative overflow-hidden flex flex-col">
            {/* Hacker Background Shimmer */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="w-full h-full flex flex-col justify-center flex-1"
                >
                  {activeTab === 'metadata' && <MetadataDetective />}
                  {activeTab === 'encryptor' && <FileEncryptor />}
                  {activeTab === 'stego' && <SecretMessageVault />}
                  {activeTab === 'timebomb' && <TimeBombVault />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function TabButton({ active, onClick, icon, title, desc, disabled = false }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-4 rounded-2xl border transition-all ${
        active 
          ? 'bg-card border-accent/30 shadow-md' 
          : 'bg-transparent border-transparent hover:bg-black/5 hover:border-borderSubtle'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-accent/10 text-accent' : 'bg-borderSubtle/30 text-textMuted'}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div>
          <h4 className={`font-bold ${active ? 'text-textMain' : 'text-textMuted'}`}>{title}</h4>
          <p className="text-xs text-textMuted mt-1">{desc}</p>
        </div>
      </div>
    </button>
  );
}
