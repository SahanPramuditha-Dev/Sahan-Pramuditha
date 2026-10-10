import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export default function Dropdown({ value, options, onChange, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!portalRef.current || !portalRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (containerRef.current && !isOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between bg-bgMain border rounded-xl px-4 py-3 text-textMain focus:outline-none transition-colors ${isOpen ? 'border-accent ring-2 ring-accent/20' : 'border-borderSubtle hover:border-accent/50'}`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <motion.i 
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="fas fa-chevron-down text-textMuted text-xs ml-2"
        ></motion.i>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={portalRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ top: coords.top, left: coords.left, width: coords.width }}
              className="fixed z-[9999] bg-card border border-borderSubtle rounded-xl shadow-xl overflow-hidden py-1"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    value === option.value 
                      ? 'bg-accent/10 text-accent font-bold' 
                      : 'text-textMain hover:bg-bgMain'
                  }`}
                >
                  {option.label}
                  {value === option.value && <i className="fas fa-check text-xs"></i>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
