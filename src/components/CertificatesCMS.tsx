import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { type CertificateItem, DEFAULT_CERTS } from '../types/cms';

const PRESET_ICONS = [
  "fas fa-certificate",
  "fas fa-shield-alt",
  "fas fa-network-wired",
  "fas fa-award",
  "fas fa-trophy",
  "fas fa-graduation-cap",
  "fas fa-code",
  "fas fa-cloud",
  "fas fa-database",
  "fas fa-server",
  "fab fa-aws",
  "fab fa-google",
  "fab fa-microsoft",
  "fab fa-cisco",
];

export default function CertificatesCMS() {
  const [certs, setCerts] = useState<CertificateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from Firestore
  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'certificates'));
        if (snap.exists()) {
          const data = snap.data().items as CertificateItem[];
          // Ensure IDs exist for reorder functionality
          const formattedData = data.map((p, i) => ({ ...p, id: p.id || `cert-${Date.now()}-${i}` }));
          setCerts(formattedData);
        } else {
          setCerts(DEFAULT_CERTS);
        }
      } catch (err) {
        console.error("Failed to load certificates:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCerts();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'portfolio', 'certificates'), { items: certs });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save certificates!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to default certificates? Unsaved changes will be lost.")) {
      setCerts(DEFAULT_CERTS);
    }
  };

  const addCert = () => {
    setCerts([
      {
        id: `cert-${Date.now()}`,
        icon: "fas fa-certificate",
        title: "New Certificate",
        subtitle: "Issuing Organization",
        date: new Date().getFullYear().toString(),
        url: ""
      },
      ...certs
    ]);
  };

  const deleteCert = (id: string) => {
    if (confirm("Are you sure you want to delete this certificate?")) {
      setCerts(certs.filter(c => c.id !== id));
    }
  };

  const updateCert = (id: string, key: keyof CertificateItem, value: any) => {
    setCerts(certs.map(c => c.id === id ? { ...c, [key]: value } : c));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-textMuted">
        <i className="fas fa-circle-notch fa-spin text-3xl"></i>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-fade-in pb-20">
      
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-borderSubtle shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              CMS Module 03
            </span>
            <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Firestore Live Database Sync
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Certificates Manager</h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl leading-relaxed">
            Manage your professional certifications, achievements, and educational badges. Drag and drop to reorder.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleReset}
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
              <><i className="fas fa-circle-notch fa-spin text-xs"></i> Saving...</>
            ) : saveSuccess ? (
              <><i className="fas fa-check text-xs"></i> Published Live!</>
            ) : (
              <><i className="fas fa-cloud-arrow-up text-xs"></i> Publish Changes</>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-bold text-textMuted tracking-wider uppercase">Certificate Entries</h3>
        <button 
          onClick={addCert}
          className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <i className="fas fa-plus text-xs"></i> Add Certificate
        </button>
      </div>

      {certs.length === 0 && (
        <div className="text-center py-20 text-textMuted border-2 border-dashed border-borderSubtle rounded-[2rem] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-bgMain rounded-2xl flex items-center justify-center text-2xl border border-borderSubtle shadow-inner">
            <i className="fas fa-award text-borderSubtle"></i>
          </div>
          <p className="font-medium text-sm">No certificates found.<br/>Click "Add Certificate" to start.</p>
        </div>
      )}

      {/* Editor Grid */}
      <Reorder.Group axis="y" values={certs} onReorder={setCerts} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {certs.map((cert, index) => (
            <Reorder.Item 
              key={cert.id} 
              value={cert}
              className="bg-card/80 backdrop-blur-xl border border-borderSubtle rounded-[2rem] p-6 shadow-sm flex flex-col relative group"
            >
              {/* Top Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="cursor-grab active:cursor-grabbing w-8 h-8 rounded-lg bg-bgMain text-textMuted flex items-center justify-center hover:text-textMain hover:bg-borderSubtle transition-colors shadow-inner border border-borderSubtle">
                  <i className="fas fa-grip-vertical text-xs"></i>
                </div>
                
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center text-xl shadow-inner border border-accent/20 relative group/icon cursor-pointer">
                  <i className={cert.icon}></i>
                  {/* Icon Picker Dropdown Hover */}
                  <div className="absolute top-14 right-0 bg-card border border-borderSubtle rounded-2xl p-3 shadow-xl w-64 grid-cols-4 gap-2 hidden group-hover/icon:grid z-50 animate-fade-in">
                    <div className="col-span-4 text-[10px] uppercase font-bold text-textMuted tracking-wider mb-1 px-1">Select Icon</div>
                    {PRESET_ICONS.map((ic, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateCert(cert.id, 'icon', ic)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${cert.icon === ic ? 'bg-accent text-white' : 'bg-bgMain text-textMuted hover:bg-borderSubtle hover:text-textMain'}`}
                      >
                        <i className={ic}></i>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => deleteCert(cert.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                  title="Delete Certificate"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                    <i className="fas fa-heading text-accent/50 text-[10px]"></i> Title
                  </label>
                  <input 
                    type="text" 
                    value={cert.title}
                    onChange={e => updateCert(cert.id, 'title', e.target.value)}
                    className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm font-semibold text-textMain focus:border-accent outline-none transition-all shadow-inner"
                    placeholder="e.g. AWS Solutions Architect"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                      <i className="fas fa-building text-accent/50 text-[10px]"></i> Issuer / Org
                    </label>
                    <input 
                      type="text" 
                      value={cert.subtitle}
                      onChange={e => updateCert(cert.id, 'subtitle', e.target.value)}
                      className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm text-textMain focus:border-accent outline-none transition-all shadow-inner"
                      placeholder="e.g. Amazon Web Services"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                      <i className="fas fa-calendar text-accent/50 text-[10px]"></i> Year
                    </label>
                    <input 
                      type="text" 
                      value={cert.date}
                      onChange={e => updateCert(cert.id, 'date', e.target.value)}
                      className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm text-textMain focus:border-accent outline-none transition-all shadow-inner text-center font-mono"
                      placeholder="2026"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-borderSubtle">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                    <i className="fas fa-link text-accent/50 text-[10px]"></i> Verification URL (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={cert.url || ''}
                    onChange={e => updateCert(cert.id, 'url', e.target.value)}
                    className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none transition-all shadow-inner font-mono"
                    placeholder="https://credly.com/..."
                  />
                </div>

              </div>

              {/* Mini Preview overlay hint */}
              <div className="mt-6 p-4 rounded-xl bg-bgMain border border-borderSubtle shadow-inner flex items-center justify-between gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                 <div className="flex items-center gap-3 truncate">
                   <div className="w-8 h-8 rounded-lg bg-card border border-borderSubtle flex items-center justify-center shrink-0">
                     <i className={`${cert.icon} text-textMuted`}></i>
                   </div>
                   <div className="truncate">
                     <p className="text-xs font-bold text-textMain truncate">{cert.title || 'Untitled'}</p>
                     <p className="text-[10px] text-textMuted truncate">{cert.subtitle || 'Unknown Issuer'}</p>
                   </div>
                 </div>
                 <div className="text-[10px] font-bold text-textMuted bg-card px-2 py-1 rounded-md border border-borderSubtle shrink-0">
                   {cert.date || 'Year'}
                 </div>
              </div>

            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

    </div>
  );
}
