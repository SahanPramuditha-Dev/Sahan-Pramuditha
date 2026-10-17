import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function StatusCMS() {
  const [status, setStatus] = useState('');
  const [workingOnTitle, setWorkingOnTitle] = useState('');
  const [workingOnDesc, setWorkingOnDesc] = useState('');
  const [workingOnUrl, setWorkingOnUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from Firestore
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [statusSnap, workSnap] = await Promise.all([
          getDoc(doc(db, 'portfolio', 'status')),
          getDoc(doc(db, 'portfolio', 'working_on'))
        ]);
        
        if (statusSnap.exists()) {
          setStatus(statusSnap.data().text || "Seeking 2026 Internship");
        } else {
          setStatus("Seeking 2026 Internship");
        }

        if (workSnap.exists()) {
          const data = workSnap.data();
          setWorkingOnTitle(data.title || "Cloud Architecture & Cyber Lab");
          setWorkingOnDesc(data.desc || "Self-hosted microservices & client-side crypto utilities");
          setWorkingOnUrl(data.url || "");
        } else {
          setWorkingOnTitle("Cloud Architecture & Cyber Lab");
          setWorkingOnDesc("Self-hosted microservices & client-side crypto utilities");
        }
      } catch (err) {
        console.error("Failed to load status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        setDoc(doc(db, 'portfolio', 'status'), { text: status }),
        setDoc(doc(db, 'portfolio', 'working_on'), {
          title: workingOnTitle,
          desc: workingOnDesc,
          url: workingOnUrl,
          updatedAt: new Date().toISOString()
        })
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save status!");
    } finally {
      setIsSaving(false);
    }
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
              CMS Module 04
            </span>
            <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Firestore Live Database Sync
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Status & Live Activity</h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl leading-relaxed">
            Manage your career availability badge and the "Currently Working On" ticker displayed on your GitHub & Cloud activity card.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
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

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Availability Badge Form */}
        <div className="bg-card/80 backdrop-blur-xl border border-borderSubtle rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                <i className="fas fa-broadcast-tower text-accent text-[10px]"></i> Availability Badge Label
             </label>
             <input 
                type="text" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 font-semibold text-sm focus:border-accent outline-none shadow-inner text-textMain" 
                placeholder="e.g. Seeking 2026 Internship"
             />
          </div>

          <div className="pt-2 border-t border-borderSubtle/60">
             <p className="text-[10px] uppercase font-bold tracking-wider text-textMuted mb-3">Live Badge Preview</p>
             <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-bold text-xs shadow-sm">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
               </span>
               {status || "Open to Opportunities"}
             </div>
          </div>
        </div>

        {/* Currently Working On Form */}
        <div className="bg-card/80 backdrop-blur-xl border border-borderSubtle rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col space-y-4">
          <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                <i className="fas fa-hammer text-accent text-[10px]"></i> Currently Working On (Project / Focus)
             </label>
             <input 
                type="text" 
                value={workingOnTitle} 
                onChange={(e) => setWorkingOnTitle(e.target.value)} 
                className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 font-semibold text-sm focus:border-accent outline-none shadow-inner text-textMain" 
                placeholder="e.g. Cloud Architecture & Cyber Lab"
             />
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Description / Subtitle
             </label>
             <input 
                type="text" 
                value={workingOnDesc} 
                onChange={(e) => setWorkingOnDesc(e.target.value)} 
                className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 font-semibold text-xs focus:border-accent outline-none shadow-inner text-textMain" 
                placeholder="e.g. Self-hosted microservices & client-side crypto utilities"
             />
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Repository / Live Link (Optional)
             </label>
             <input 
                type="url" 
                value={workingOnUrl} 
                onChange={(e) => setWorkingOnUrl(e.target.value)} 
                className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 font-semibold text-xs focus:border-accent outline-none shadow-inner text-textMain" 
                placeholder="https://github.com/SahanPramuditha-Dev/..."
             />
          </div>

          <div className="pt-2 border-t border-borderSubtle/60">
             <p className="text-[10px] uppercase font-bold tracking-wider text-textMuted mb-2">Live Activity Preview</p>
             <div className="flex items-center justify-between bg-bgMain border border-borderSubtle rounded-xl px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0"></span>
                  <div className="truncate">
                    <span className="font-bold text-textMain mr-1.5">{workingOnTitle || 'No project title'}</span>
                    {workingOnDesc && <span className="text-textMuted text-[11px]">({workingOnDesc})</span>}
                  </div>
                </div>
                {workingOnUrl && (
                  <span className="text-[10px] text-accent font-bold shrink-0 ml-2">Repo <i className="fas fa-external-link-alt text-[9px]"></i></span>
                )}
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
