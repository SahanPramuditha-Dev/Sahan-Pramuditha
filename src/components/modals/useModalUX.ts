import { useEffect } from 'react';

// Custom hook for Modal UX (Scroll lock & Escape key)
export function useModalUX(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}

export const staggerContainer = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const, damping: 25, stiffness: 300,
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  },
  exit: { scale: 0.95, opacity: 0, y: 20 }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 }
  }
};
