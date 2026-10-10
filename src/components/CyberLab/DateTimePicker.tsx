import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface DateTimePickerProps {
  value: string; // ISO string or empty
  onChange: (val: string) => void;
}

export default function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing date or default to now
  const initialDate = value ? new Date(value) : new Date();
  
  const [currentViewDate, setCurrentViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  
  // Selected state
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day, selectedDate.getHours(), selectedDate.getMinutes());
    setSelectedDate(newDate);
    
    // Format to YYYY-MM-DDThh:mm
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(newDate.getTime() - offset)).toISOString().slice(0, 16);
    onChange(localISOTime);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const newDate = new Date(selectedDate);
    if (type === 'hours') newDate.setHours(val);
    if (type === 'minutes') newDate.setMinutes(val);
    setSelectedDate(newDate);
    
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(newDate.getTime() - offset)).toISOString().slice(0, 16);
    onChange(localISOTime);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Format display text
  const displayFormat = value ? selectedDate.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  }) : "Select Date & Time...";

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between bg-bgMain border rounded-xl px-4 py-3 text-textMain focus:outline-none transition-colors ${isOpen ? 'border-accent ring-2 ring-accent/20' : 'border-borderSubtle hover:border-accent/50'}`}
      >
        <span>{displayFormat}</span>
        <i className="far fa-calendar-alt text-textMuted text-sm"></i>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-sm bg-card border border-borderSubtle rounded-3xl shadow-2xl overflow-hidden p-6"
              >
                {/* Header / Month Nav */}
                <div className="flex items-center justify-between mb-6">
                  <button type="button" onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-bgMain transition-colors text-textMuted hover:text-textMain">
                    <i className="fas fa-chevron-left text-sm"></i>
                  </button>
                  <div className="font-bold text-textMain text-lg">
                    {monthNames[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
                  </div>
                  <button type="button" onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-bgMain transition-colors text-textMuted hover:text-textMain">
                    <i className="fas fa-chevron-right text-sm"></i>
                  </button>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center mb-4">
                  {dayNames.map(d => (
                    <div key={d} className="text-xs font-bold text-textMuted uppercase mb-2">{d}</div>
                  ))}
                  
                  {/* Empty slots for first row */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {/* Actual days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDate.getDate() === day && 
                                       selectedDate.getMonth() === currentViewDate.getMonth() && 
                                       selectedDate.getFullYear() === currentViewDate.getFullYear();
                    
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`w-10 h-10 mx-auto rounded-full text-sm font-bold flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-accent text-white shadow-lg shadow-accent/40 scale-110' 
                            : 'text-textMain hover:bg-bgMain'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Time Picker */}
                <div className="border-t border-borderSubtle pt-6 mt-4 flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Hour</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="23" 
                      value={selectedDate.getHours()}
                      onChange={(e) => handleTimeChange('hours', parseInt(e.target.value) || 0)}
                      className="w-16 bg-bgMain border border-borderSubtle rounded-xl px-2 py-3 text-center text-lg font-bold text-textMain focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="text-textMuted font-bold text-xl mt-6">:</div>
                  <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Minute</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="59" 
                      value={selectedDate.getMinutes()}
                      onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value) || 0)}
                      className="w-16 bg-bgMain border border-borderSubtle rounded-xl px-2 py-3 text-center text-lg font-bold text-textMain focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-6 bg-bgMain hover:bg-bgMain/80 border border-borderSubtle text-textMain font-bold rounded-xl py-3 transition-colors"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
