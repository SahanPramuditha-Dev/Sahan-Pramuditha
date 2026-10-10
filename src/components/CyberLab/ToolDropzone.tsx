import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ToolDropzoneProps {
  icon: string;
  title: string;
  subtitle: string;
  accept?: string;
  multiple?: boolean;
  onDropFiles: (files: File[]) => void;
}

const ToolDropzone: React.FC<ToolDropzoneProps> = ({ 
  icon, 
  title, 
  subtitle, 
  accept, 
  multiple = false, 
  onDropFiles 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    if (droppedFiles.length > 0) {
      // If multiple is not allowed, just pass the first file
      if (!multiple) {
        onDropFiles([droppedFiles[0]]);
      } else {
        onDropFiles(droppedFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!multiple) {
        onDropFiles([e.target.files[0]]);
      } else {
        onDropFiles(Array.from(e.target.files));
      }
    }
  };

  return (
    <motion.div 
      key="upload"
      initial={{ opacity: 0, y: 20 }}
      animate={isDragging ? { scale: 1.02 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
        isDragging 
          ? 'border-accent bg-accent/10' 
          : 'border-borderSubtle hover:border-accent bg-transparent hover:bg-accent/5'
      }`}
    >
      {/* Animated pulsing background when dragging */}
      {isDragging && (
        <motion.div 
          className="absolute inset-0 bg-accent/5"
          style={{ pointerEvents: 'none' }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
      )}

      <motion.div 
        animate={isDragging ? { y: [-5, 5, -5], scale: 1.1 } : { y: 0, scale: 1 }}
        transition={{ y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }, scale: { duration: 0.2 } }}
        className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 relative z-10"
      >
        <i className={`fas ${isDragging ? 'fa-file-import' : icon} text-2xl text-accent`}></i>
      </motion.div>
      
      <p className="font-bold text-lg text-textMain relative z-10">
        {isDragging ? 'Release to drop files...' : title}
      </p>
      <p className="text-xs text-textMuted mt-1 relative z-10 text-center">
        {isDragging ? 'Initiating secure processing...' : subtitle}
      </p>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept={accept}
        multiple={multiple}
      />
    </motion.div>
  );
};

export default ToolDropzone;
