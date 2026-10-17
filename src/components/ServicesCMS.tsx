import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { type ServiceItem, DEFAULT_SERVICES } from '../types/cms';

export default function ServicesCMS() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'services'));
        if (snap.exists()) {
          const data = snap.data().items as ServiceItem[];
          const formattedData = data.map((p, i) => ({ ...p, id: p.id || `srv-${Date.now()}-${i}` }));
          setServices(formattedData);
        } else {
          setServices(DEFAULT_SERVICES);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'portfolio', 'services'), { items: services });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save services!");
    } finally {
      setIsSaving(false);
    }
  };

  const addService = () => {
    setServices([
      { id: `srv-${Date.now()}`, title: "New Service", desc: "Service description here.", icon: "fas fa-star", color: "purple", tech: ["Tool"] },
      ...services
    ]);
  };

  const deleteService = (id: string) => {
    if (confirm("Delete this service?")) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const updateService = (id: string, key: keyof ServiceItem, value: any) => {
    setServices(services.map(s => s.id === id ? { ...s, [key]: value } : s));
  };

  const handleTechInput = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      setServices(services.map(s => {
        if (s.id === id && !s.tech.includes(val)) {
          return { ...s, tech: [...s.tech, val] };
        }
        return s;
      }));
      e.currentTarget.value = '';
    }
  };

  const removeTechItem = (serviceId: string, index: number) => {
    setServices(services.map(s => {
      if (s.id === serviceId) {
        const newArr = [...s.tech];
        newArr.splice(index, 1);
        return { ...s, tech: newArr };
      }
      return s;
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center h-64"><i className="fas fa-circle-notch fa-spin text-3xl text-textMuted"></i></div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-fade-in pb-20">
      
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-borderSubtle shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              CMS Module 05
            </span>
            <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Sync
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Services Manager</h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl leading-relaxed">
            Manage your service offerings and tech stack focus areas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-accent hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <><i className="fas fa-circle-notch fa-spin text-xs"></i> Saving...</> : saveSuccess ? <><i className="fas fa-check text-xs"></i> Published Live!</> : <><i className="fas fa-cloud-arrow-up text-xs"></i> Publish Changes</>}
          </button>
        </div>
      </div>

      <div className="flex justify-between pb-2">
        <h3 className="text-sm font-bold text-textMuted tracking-wider uppercase">Service Entries</h3>
        <button onClick={addService} className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2">
          <i className="fas fa-plus text-xs"></i> Add Service
        </button>
      </div>

      <Reorder.Group axis="y" values={services} onReorder={setServices} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {services.map((service) => (
            <Reorder.Item key={service.id} value={service} className="bg-card/80 backdrop-blur-xl border border-borderSubtle rounded-[2rem] p-6 shadow-sm flex flex-col group relative">
              <div className="absolute top-6 right-6 flex items-center gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="cursor-grab w-8 h-8 rounded-lg bg-bgMain text-textMuted flex items-center justify-center hover:text-textMain border border-borderSubtle"><i className="fas fa-grip-vertical text-xs"></i></div>
                <button onClick={() => deleteService(service.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
              </div>

              <div className="space-y-4 pt-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-textMuted">Icon Class</label>
                    <input type="text" value={service.icon} onChange={e => updateService(service.id, 'icon', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-textMuted">Color Theme</label>
                    <select value={service.color} onChange={e => updateService(service.id, 'color', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none appearance-none">
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="rose">Rose</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-textMuted">Service Title</label>
                  <input type="text" value={service.title} onChange={e => updateService(service.id, 'title', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm font-bold text-textMain focus:border-accent outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-textMuted">Description</label>
                  <textarea value={service.desc} onChange={e => updateService(service.id, 'desc', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none min-h-[60px]" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-textMuted">Tech Stack (Press Enter)</label>
                  <div className="p-2 bg-bgMain border border-borderSubtle rounded-xl min-h-[50px] space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <AnimatePresence>
                        {service.tech.map((t, i) => (
                          <motion.span key={i} className="px-2 py-0.5 bg-card text-textMain text-[10px] font-bold rounded-md border border-borderSubtle flex items-center gap-1.5">
                            {t}
                            <button onClick={() => removeTechItem(service.id, i)} className="text-textMuted hover:text-red-400"><i className="fas fa-times"></i></button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <input type="text" onKeyDown={(e) => handleTechInput(service.id, e)} className="w-full bg-transparent text-xs text-textMain outline-none px-1 font-semibold" placeholder="Add tech..." />
                  </div>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
