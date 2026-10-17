import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { type ProjectItem, DEFAULT_PROJECTS } from '../types/cms';

export default function ProjectsCMS() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'projects'));
        if (snap.exists()) {
          const data = snap.data().items as ProjectItem[];
          // Ensure IDs exist for reorder functionality
          const formattedData = data.map((p, i) => ({ ...p, id: p.id || `proj-${Date.now()}-${i}` }));
          setProjects(formattedData);
        } else {
          setProjects(DEFAULT_PROJECTS);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'portfolio', 'projects'), { items: projects });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save projects!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to default projects? Unsaved changes will be lost.")) {
      setProjects(DEFAULT_PROJECTS);
    }
  };

  const addProject = () => {
    setProjects([
      {
        id: `proj-${Date.now()}`,
        title: "New Project",
        desc: "A brief description of this project.",
        tags: ["React"],
        img: "studyos",
        link: "#",
        features: ["Feature 1"]
      },
      ...projects
    ]);
  };

  const deleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const updateProject = (id: string, key: keyof ProjectItem, value: any) => {
    setProjects(projects.map(p => p.id === id ? { ...p, [key]: value } : p));
  };

  const handleArrayInput = (id: string, key: 'tags' | 'features', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      setProjects(projects.map(p => {
        if (p.id === id && !p[key].includes(val)) {
          return { ...p, [key]: [...p[key], val] };
        }
        return p;
      }));
      e.currentTarget.value = '';
    }
  };

  const removeArrayItem = (projectId: string, key: 'tags' | 'features', index: number) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newArr = [...p[key]];
        newArr.splice(index, 1);
        return { ...p, [key]: newArr };
      }
      return p;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-textMuted">
        <i className="fas fa-circle-notch fa-spin text-3xl"></i>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 lg:space-y-8 animate-fade-in pb-20">
      
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-borderSubtle shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              CMS Module 02
            </span>
            <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Firestore Live Database Sync
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Projects Manager</h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl leading-relaxed">
            Manage your main portfolio projects, tags, features, and visuals. Drag and drop to reorder.
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
        <h3 className="text-sm font-bold text-textMuted tracking-wider uppercase">Project Entries</h3>
        <button 
          onClick={addProject}
          className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <i className="fas fa-plus text-xs"></i> Add Project
        </button>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 text-textMuted border-2 border-dashed border-borderSubtle rounded-[2rem] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-bgMain rounded-2xl flex items-center justify-center text-2xl border border-borderSubtle shadow-inner">
            <i className="fas fa-folder-open text-borderSubtle"></i>
          </div>
          <p className="font-medium text-sm">No projects found.<br/>Click "Add Project" to start.</p>
        </div>
      )}

      {/* Editor Grid */}
      <Reorder.Group axis="y" values={projects} onReorder={setProjects} className="space-y-6">
        <AnimatePresence>
          {projects.map((project, index) => (
            <Reorder.Item 
              key={project.id} 
              value={project}
              className="bg-card/80 backdrop-blur-xl border border-borderSubtle rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col xl:flex-row gap-8 relative group"
            >
              {/* Drag Handle & Delete */}
              <div className="absolute top-6 right-6 flex items-center gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                <div className="cursor-grab active:cursor-grabbing w-8 h-8 rounded-lg bg-bgMain text-textMuted flex items-center justify-center hover:text-textMain hover:bg-borderSubtle transition-colors shadow-inner border border-borderSubtle">
                  <i className="fas fa-grip-vertical text-xs"></i>
                </div>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                  title="Delete Project"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>

              {/* Form Section */}
              <div className="flex-1 space-y-6">
                
                {/* Title & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                      <i className="fas fa-heading text-accent/50 text-[10px]"></i> Project Title
                    </label>
                    <input 
                      type="text" 
                      value={project.title}
                      onChange={e => updateProject(project.id, 'title', e.target.value)}
                      className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-sm font-semibold text-textMain focus:border-accent outline-none transition-all shadow-inner"
                      placeholder="e.g. StudyOS"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                      <i className="fas fa-link text-accent/50 text-[10px]"></i> External Link
                    </label>
                    <input 
                      type="text" 
                      value={project.link}
                      onChange={e => updateProject(project.id, 'link', e.target.value)}
                      className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-sm text-textMain focus:border-accent outline-none transition-all shadow-inner font-mono text-xs"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                    <i className="fas fa-align-left text-accent/50 text-[10px]"></i> Description
                  </label>
                  <textarea 
                    value={project.desc}
                    onChange={e => updateProject(project.id, 'desc', e.target.value)}
                    className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-sm text-textMain focus:border-accent outline-none transition-all shadow-inner resize-none min-h-[100px]"
                    placeholder="Describe the project..."
                  />
                </div>

                {/* Tags & Features (Arrays) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tags */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                        <i className="fas fa-tags text-accent/50 text-[10px]"></i> Tags
                      </label>
                      <span className="text-[10px] text-textMuted bg-bgMain px-2 py-0.5 rounded-md border border-borderSubtle">{project.tags.length} items</span>
                    </div>
                    <div className="p-3 bg-bgMain border border-borderSubtle rounded-xl min-h-[80px] space-y-3 shadow-inner">
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {project.tags.map((tag, i) => (
                            <motion.span 
                              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                              key={`${i}-${tag}`} 
                              className="px-2.5 py-1 bg-card text-textMain text-xs font-semibold rounded-lg border border-borderSubtle flex items-center gap-2 group/tag"
                            >
                              {tag}
                              <button onClick={() => removeArrayItem(project.id, 'tags', i)} className="text-textMuted hover:text-red-400 focus:outline-none">
                                <i className="fas fa-xmark text-[10px]"></i>
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="text" 
                        onKeyDown={(e) => handleArrayInput(project.id, 'tags', e)}
                        placeholder="Type tag & press Enter..."
                        className="w-full bg-transparent text-xs text-textMain outline-none placeholder:text-textMuted/50 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                        <i className="fas fa-list-check text-accent/50 text-[10px]"></i> Key Features
                      </label>
                      <span className="text-[10px] text-textMuted bg-bgMain px-2 py-0.5 rounded-md border border-borderSubtle">{project.features.length} items</span>
                    </div>
                    <div className="p-3 bg-bgMain border border-borderSubtle rounded-xl min-h-[80px] space-y-3 shadow-inner">
                      <div className="flex flex-col gap-2">
                        <AnimatePresence>
                          {project.features.map((feature, i) => (
                            <motion.div 
                              initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }}
                              key={`${i}-${feature}`} 
                              className="text-xs text-textMain flex items-start gap-2 group/feat"
                            >
                              <i className="fas fa-check text-[10px] text-emerald-500 mt-0.5 shrink-0"></i>
                              <span className="flex-1 leading-tight">{feature}</span>
                              <button onClick={() => removeArrayItem(project.id, 'features', i)} className="text-textMuted hover:text-red-400 opacity-0 group-hover/feat:opacity-100 transition-opacity focus:outline-none">
                                <i className="fas fa-xmark text-[10px]"></i>
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="text" 
                        onKeyDown={(e) => handleArrayInput(project.id, 'features', e)}
                        placeholder="Type feature & press Enter..."
                        className="w-full bg-transparent text-xs text-textMain outline-none placeholder:text-textMuted/50 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Preview Panel */}
              <div className="w-full xl:w-72 shrink-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted flex items-center gap-1.5">
                    <i className="fas fa-image text-accent/50 text-[10px]"></i> Cover Image / Mockup ID
                  </label>
                  <select 
                    value={project.img}
                    onChange={e => updateProject(project.id, 'img', e.target.value)}
                    className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-sm font-semibold text-textMain focus:border-accent outline-none appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="studyos">StudyOS Screenshot</option>
                    <option value="familytree">FamilyTree Screenshot</option>
                    <option value="placeholder">Placeholder Graphic</option>
                  </select>
                </div>

                {/* Mini Preview Card */}
                <div className="w-full aspect-[4/3] rounded-[1.5rem] bg-bgMain border border-borderSubtle relative overflow-hidden group/preview shadow-inner">
                  {/* Background Mockup Image */}
                  {project.img === 'studyos' ? (
                     <div className="absolute top-6 -right-2 w-[70%] h-[110%] rounded-tl-xl overflow-hidden shadow-[-10px_0_20px_rgba(0,0,0,0.1)] border-t border-l border-borderSubtle bg-card">
                       <img src="/studyos-light.png" alt="" className="w-full h-full object-cover object-left-top dark:hidden" />
                       <img src="/studyos-dark.png" alt="" className="w-full h-full object-cover object-left-top hidden dark:block" />
                     </div>
                  ) : project.img === 'familytree' ? (
                     <div className="absolute top-6 -right-2 w-[70%] h-[110%] rounded-tl-xl overflow-hidden shadow-[-10px_0_20px_rgba(0,0,0,0.1)] border-t border-l border-borderSubtle bg-card">
                       <img src="/familytree-light.png" alt="" className="w-full h-full object-cover object-left-top dark:hidden" />
                       <img src="/familytree-dark.png" alt="" className="w-full h-full object-cover object-left-top hidden dark:block" />
                     </div>
                  ) : (
                    <div className="absolute top-6 -right-2 w-[70%] h-[110%] rounded-tl-xl overflow-hidden shadow-[-10px_0_20px_rgba(0,0,0,0.1)] border-t border-l border-borderSubtle bg-gradient-to-br from-accent/20 to-bgMain flex items-center justify-center">
                      <i className="fas fa-image text-4xl text-accent/30"></i>
                    </div>
                  )}
                  
                  {/* Overlay Text Details */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-bgMain/90 via-bgMain/20 to-transparent">
                    <h4 className="font-bold text-textMain text-sm truncate mb-1">{project.title || 'Untitled Project'}</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[8px] uppercase tracking-wider font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded-md">{t}</span>
                      ))}
                      {project.tags.length > 2 && <span className="text-[8px] uppercase tracking-wider font-bold bg-card text-textMuted px-1.5 py-0.5 rounded-md border border-borderSubtle">+{project.tags.length - 2}</span>}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-textMuted text-center">Live Preview (Light/Dark adaptive)</p>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

    </div>
  );
}
