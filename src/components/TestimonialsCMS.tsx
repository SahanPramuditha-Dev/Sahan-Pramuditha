import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { type TestimonialItem, DEFAULT_TESTIMONIALS } from '../types/cms';

export default function TestimonialsCMS() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'testimonials'));
        if (snap.exists()) {
          const data = snap.data().items as TestimonialItem[];
          setItems(data.map((p, i) => ({ ...p, id: p.id || `test-${Date.now()}-${i}` })));
        } else {
          setItems(DEFAULT_TESTIMONIALS);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'portfolio', 'testimonials'), { items });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save!");
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => setItems([{ id: `test-${Date.now()}`, name: "New Person", role: "Role", text: "Testimonial text...", avatar: "fas fa-user" }, ...items]);
  const deleteItem = (id: string) => { if(confirm("Delete?")) setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id: string, key: keyof TestimonialItem, value: any) => setItems(items.map(i => i.id === id ? { ...i, [key]: value } : i));

  if (isLoading) return <div className="flex justify-center h-64"><i className="fas fa-circle-notch fa-spin text-3xl text-textMuted"></i></div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-fade-in pb-20">
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-borderSubtle shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span> CMS Module 06
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Testimonials Manager</h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl leading-relaxed">Manage recommendations and quotes.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 rounded-2xl bg-accent hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all active:scale-95 flex items-center gap-2">
          {isSaving ? <><i className="fas fa-circle-notch fa-spin"></i> Saving</> : saveSuccess ? <><i className="fas fa-check"></i> Published</> : <><i className="fas fa-cloud-arrow-up"></i> Publish</>}
        </button>
      </div>

      <div className="flex justify-between pb-2">
        <h3 className="text-sm font-bold text-textMuted tracking-wider uppercase">Entries</h3>
        <button onClick={addItem} className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 rounded-xl text-xs font-bold transition-all"><i className="fas fa-plus"></i> Add Testimonial</button>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={setItems} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {items.map((item) => (
            <Reorder.Item key={item.id} value={item} className="bg-card/80 backdrop-blur-xl border border-borderSubtle rounded-[2rem] p-6 shadow-sm flex flex-col group relative">
              <div className="absolute top-6 right-6 flex items-center gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="cursor-grab w-8 h-8 rounded-lg bg-bgMain text-textMuted flex items-center justify-center border border-borderSubtle"><i className="fas fa-grip-vertical text-xs"></i></div>
                <button onClick={() => deleteItem(item.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
              </div>

              <div className="space-y-4 pt-10">
                <div className="grid grid-cols-3 gap-3">
                   <div className="space-y-2 col-span-2">
                     <label className="text-[10px] uppercase font-bold text-textMuted">Name</label>
                     <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm font-bold text-textMain focus:border-accent outline-none" />
                   </div>
                   <div className="space-y-2 col-span-1">
                     <label className="text-[10px] uppercase font-bold text-textMuted">Icon</label>
                     <input type="text" value={item.avatar} onChange={e => updateItem(item.id, 'avatar', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none font-mono" />
                   </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-textMuted">Role</label>
                  <input type="text" value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-textMuted">Quote</label>
                  <textarea value={item.text} onChange={e => updateItem(item.id, 'text', e.target.value)} className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-xs text-textMain focus:border-accent outline-none min-h-[80px]" />
                </div>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
