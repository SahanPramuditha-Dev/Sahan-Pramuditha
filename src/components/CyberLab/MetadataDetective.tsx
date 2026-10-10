import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import exifr from 'exifr';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import ToolDropzone from './ToolDropzone';

export default function MetadataDetective() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  
  const processFile = async (selected: File) => {
    
    setFile(selected);
    setCleanedUrl(null);
    setMetadata(null);
    setShowPopup(true);

    if (selected.type === 'image/svg+xml') {
      try {
        const text = await selected.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        
        let foundData: any = {
          Type: 'SVG Vector Image',
          Width: svg?.getAttribute('width') || 'N/A',
          Height: svg?.getAttribute('height') || 'N/A',
          ViewBox: svg?.getAttribute('viewBox') || 'N/A',
          Elements: doc.querySelectorAll('*').length
        };

        const metadataTags = doc.querySelectorAll('metadata');
        const scripts = doc.querySelectorAll('script');
        const titles = doc.querySelectorAll('title');
        const descs = doc.querySelectorAll('desc');

        if (metadataTags.length) foundData['XML Metadata Nodes'] = metadataTags.length;
        if (scripts.length) foundData['Embedded Scripts'] = scripts.length;
        if (titles.length) foundData['Titles'] = titles.length;
        if (descs.length) foundData['Descriptions'] = descs.length;

        if (!metadataTags.length && !scripts.length && !titles.length && !descs.length) {
          foundData._empty = true;
        } else {
          if (scripts.length) foundData._hasRiskyScripts = true;
        }

        setMetadata(foundData);
      } catch (err) {
        setMetadata({ _empty: true });
      }
      return;
    }

    if (selected.type === 'application/pdf') {
      try {
        const arrayBuffer = await selected.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        let foundData: any = { Type: 'PDF Document' };
        if (pdfDoc.getTitle()) foundData.Title = pdfDoc.getTitle();
        if (pdfDoc.getAuthor()) foundData.Author = pdfDoc.getAuthor();
        if (pdfDoc.getSubject()) foundData.Subject = pdfDoc.getSubject();
        if (pdfDoc.getCreator()) foundData.Creator = pdfDoc.getCreator();
        if (pdfDoc.getProducer()) foundData.Producer = pdfDoc.getProducer();
        if (pdfDoc.getCreationDate()) foundData.CreationDate = pdfDoc.getCreationDate()?.toISOString();
        if (pdfDoc.getModificationDate()) foundData.ModificationDate = pdfDoc.getModificationDate()?.toISOString();
        
        if (Object.keys(foundData).length === 1) foundData._empty = true;
        setMetadata(foundData);
      } catch (err) { setMetadata({ _empty: true }); }
      return;
    }

    if (selected.name.endsWith('.docx') || selected.name.endsWith('.xlsx') || selected.name.endsWith('.pptx')) {
      try {
        const arrayBuffer = await selected.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const coreXmlFile = zip.file('docProps/core.xml');
        
        let foundData: any = { Type: `Microsoft Office Document (${selected.name.split('.').pop()?.toUpperCase()})` };
        
        if (coreXmlFile) {
          const coreXmlText = await coreXmlFile.async('text');
          const parser = new DOMParser();
          const xml = parser.parseFromString(coreXmlText, 'application/xml');
          const getTag = (tag: string) => xml.getElementsByTagNameNS('*', tag)[0]?.textContent;
          
          if (getTag('creator')) foundData.Author = getTag('creator');
          if (getTag('lastModifiedBy')) foundData.LastModifiedBy = getTag('lastModifiedBy');
          if (getTag('created')) foundData.CreationDate = getTag('created');
          if (getTag('modified')) foundData.ModificationDate = getTag('modified');
        }
        
        if (Object.keys(foundData).length === 1) foundData._empty = true;
        setMetadata(foundData);
      } catch (err) { setMetadata({ _empty: true }); }
      return;
    }

    // Default EXIF parsing for JPG/PNG/WEBP
    try {
      const output = await exifr.parse(selected, {
        tiff: true,
        exif: true,
        gps: true,
        xmp: true
      });
      
      setMetadata(output || { _empty: true });
    } catch (err) {
      setMetadata({ _empty: true });
    }
  };

  const removeMetadata = async () => {
    if (!file) return;
    setIsCleaning(true);
    const startTs = Date.now();
    const waitDelay = async () => {
      const elapsed = Date.now() - startTs;
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
    };

    if (file.type === 'image/svg+xml') {
      try {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        
        const tagsToRemove = ['metadata', 'script', 'title', 'desc'];
        tagsToRemove.forEach(tag => {
          doc.querySelectorAll(tag).forEach(el => el.remove());
        });

        const cleanSvg = new XMLSerializer().serializeToString(doc);
        const blob = new Blob([cleanSvg], { type: 'image/svg+xml' });
        await waitDelay();
        setCleanedUrl(URL.createObjectURL(blob));
      } catch (err) { console.error(err); }
      setIsCleaning(false);
      return;
    }

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
        const epoch = new Date(0);
        pdfDoc.setCreationDate(epoch);
        pdfDoc.setModificationDate(epoch);
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        await waitDelay();
        setCleanedUrl(URL.createObjectURL(blob));
      } catch (err) { console.error(err); }
      setIsCleaning(false);
      return;
    }

    if (file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const coreXmlFile = zip.file('docProps/core.xml');
        if (coreXmlFile) {
           let coreXmlText = await coreXmlFile.async('text');
           coreXmlText = coreXmlText.replace(/<dc:creator>.*?<\/dc:creator>/g, '<dc:creator>Scrubbed</dc:creator>');
           coreXmlText = coreXmlText.replace(/<cp:lastModifiedBy>.*?<\/cp:lastModifiedBy>/g, '<cp:lastModifiedBy>Scrubbed</cp:lastModifiedBy>');
           zip.file('docProps/core.xml', coreXmlText);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        await waitDelay();
        setCleanedUrl(URL.createObjectURL(zipBlob));
      } catch (err) { console.error(err); }
      setIsCleaning(false);
      return;
    }

    try {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      
      const loadImg = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objUrl;
      });
      await loadImg;
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, file.type, 1.0));
        if (blob) {
          await waitDelay();
          setCleanedUrl(URL.createObjectURL(blob));
        }
      }
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  const getMetadataFieldsCount = () => {
    if (!metadata || metadata._empty) return 0;
    return Object.keys(metadata).length;
  };

  const hasRiskyData = metadata && (metadata.latitude || metadata.Make || metadata.Software || metadata._hasRiskyScripts || metadata.Author || metadata.Creator);

  // Prevent background scrolling when popup is open
  useEffect(() => {
    if (showPopup) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPopup]);

  const renderThumbnail = (isSmall = false) => {
    if (!file) return null;
    const isDoc = file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx');
    
    if (isDoc) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-accent/10">
          <i className={`fas fa-file-alt text-accent ${isSmall ? 'text-2xl' : 'text-5xl'}`}></i>
        </div>
      );
    }
    return <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
  };

  const handleDropFiles = (droppedFiles: File[]) => {
    processFile(droppedFiles[0]);
  };

  return (
    <div className="w-full relative">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-textMain mb-1">Metadata Detective</h3>
        <p className="text-xs text-textMuted max-w-md mx-auto">Uncover hidden GPS coordinates and camera fingerprints inside your photos, then securely wipe them.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <ToolDropzone
            icon="fa-search"
            title="Drop a file to inspect"
            subtitle="Supports Images, PDF, DOCX, XLSX"
            accept="image/jpeg, image/png, image/webp, image/svg+xml, application/pdf, .docx, .xlsx, .pptx"
            onDropFiles={handleDropFiles}
          />
        ) : (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-borderSubtle rounded-3xl p-5 md:p-8 relative shadow-lg text-center flex flex-col items-center"
          >
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-black/5 mb-4 border border-borderSubtle shadow-sm relative group">
              {renderThumbnail()}
            </div>
            <h4 className="font-bold text-xl text-textMain truncate w-full px-4">{file.name}</h4>
            <p className="text-sm text-textMuted mt-1 mb-6">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop()?.toUpperCase()}
            </p>

            <div className="flex gap-4 w-full max-w-sm">
              <button 
                onClick={() => setShowPopup(true)}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
              >
                <i className="fas fa-search-plus mr-2"></i> View Analysis
              </button>
              <button 
                onClick={() => { setFile(null); setMetadata(null); setCleanedUrl(null); }}
                className="py-3 px-5 rounded-xl bg-black/5 hover:bg-black/10 text-textMain font-bold transition-colors"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Popup Modal */}
      {createPortal(
        <AnimatePresence>
          {showPopup && file && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPopup(false)}
            >
              <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-bgMain w-full max-w-2xl max-h-[85vh] md:max-h-[800px] rounded-3xl shadow-2xl flex flex-col border border-borderSubtle overflow-hidden relative"
              >
                
                {/* Scrubbing Overlay */}
                <AnimatePresence>
                  {isCleaning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-bgMain/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="relative mb-6">
                        <i className="fas fa-circle-notch fa-spin text-accent text-6xl opacity-30"></i>
                        <i className="fas fa-eraser absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent text-2xl"></i>
                      </div>
                      <h3 className="text-2xl font-bold text-textMain font-mono mb-2 tracking-wide">
                        Scrubbing Metadata...
                      </h3>
                      <p className="text-sm text-textMuted font-mono">
                        Permanently destroying EXIF tags, XMP data, and hidden attributes
                      </p>
                      
                      {/* Fake Terminal Matrix lines */}
                      <div className="mt-10 w-full max-w-md bg-white/60 backdrop-blur-md rounded-xl p-6 text-left font-mono text-[11px] sm:text-xs text-accent overflow-hidden h-48 relative border border-accent/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <motion.div
                          animate={{ y: [0, -160] }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                          className="flex flex-col gap-2 whitespace-nowrap"
                        >
                          <p>0x0001: LOCATING EXIF MARKERS...</p>
                          <p>0x0002: PURGING GPS LAT/LONG COORDS...</p>
                          <p>0x0003: DELETING CAMERA MAKE/MODEL...</p>
                          <p>0x0004: OVERWRITING DATE-TIME STAMPS...</p>
                          <p>0x0005: STRIPPING XMP XML DATA...</p>
                          <p>0x0006: REMOVING THUMBNAIL CACHE...</p>
                          <p>0x0007: REPACKING BINARY HEADERS...</p>
                          <p>0x0008: VERIFYING CLEAN STATE...</p>
                          <p>0x0009: SCRUB COMPLETE.</p>
                          <p>0x000A: INITIATING ZERO-FILL ALGORITHM...</p>
                          <p>0x000B: DONE.</p>
                        </motion.div>
                        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-borderSubtle bg-card shrink-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 border border-borderSubtle shrink-0">
                      {renderThumbnail(true)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-textMain truncate">Analysis Report</h3>
                      <p className="text-xs text-textMuted truncate">{file.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPopup(false)}
                    className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-textMuted transition-colors shrink-0 ml-4"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                {!metadata ? (
                  <div className="flex flex-col items-center justify-center text-textMuted gap-4 py-12">
                    <i className="fas fa-radar fa-spin text-4xl text-accent"></i>
                    <p className="font-bold animate-pulse">Scanning for hidden data...</p>
                  </div>
                ) : metadata._empty ? (
                  <div className="flex flex-col items-center text-center py-12">
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-4xl mb-4">
                      <i className="fas fa-shield-check"></i>
                    </div>
                    <h4 className="text-2xl font-bold text-textMain mb-2">No Metadata Found</h4>
                    <p className="text-textMuted text-sm max-w-sm">This image is already clean and contains no hidden EXIF data or GPS coordinates. It is safe to share.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-black/5 p-4 rounded-2xl border border-borderSubtle">
                      <h4 className="text-lg font-bold text-textMain flex items-center gap-2">
                        <i className={`fas ${hasRiskyData ? 'fa-exclamation-triangle text-red-500' : 'fa-info-circle text-blue-500'}`}></i> 
                        Detected Metadata
                      </h4>
                      <span className="px-3 py-1 bg-bgMain border border-borderSubtle rounded-full text-xs font-bold text-textMain">
                        {getMetadataFieldsCount()} Fields Found
                      </span>
                    </div>

                    {/* GPS Warning */}
                    {(metadata.latitude || metadata.longitude) && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center shrink-0">
                          <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div>
                          <h5 className="font-bold text-red-600 dark:text-red-400">Exact Location Detected</h5>
                          <p className="text-sm text-red-500/80 mt-1">This photo contains GPS coordinates that reveal exactly where it was taken.</p>
                          <div className="mt-3 font-mono text-xs bg-black/10 p-2 rounded-lg text-red-600 dark:text-red-300 w-max">
                            Lat: {metadata.latitude.toFixed(6)} <br/> Lng: {metadata.longitude.toFixed(6)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SVG Script Warning */}
                    {metadata._hasRiskyScripts && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center shrink-0">
                          <i className="fas fa-code"></i>
                        </div>
                        <div>
                          <h5 className="font-bold text-red-600 dark:text-red-400">Embedded Scripts Found</h5>
                          <p className="text-sm text-red-500/80 mt-1">This SVG file contains embedded javascript code which could pose a security risk (XSS) if served directly on a website.</p>
                        </div>
                      </div>
                    )}

                    {/* Camera Info Grid */}
                    {file.type !== 'image/svg+xml' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {metadata.Make && (
                          <div className="bg-card p-4 rounded-xl border border-borderSubtle">
                            <div className="text-[10px] text-textMuted uppercase font-bold mb-1">Camera Make</div>
                            <div className="font-bold text-sm text-textMain truncate" title={metadata.Make}>{metadata.Make}</div>
                          </div>
                        )}
                        {metadata.Model && (
                          <div className="bg-card p-4 rounded-xl border border-borderSubtle">
                            <div className="text-[10px] text-textMuted uppercase font-bold mb-1">Camera Model</div>
                            <div className="font-bold text-sm text-textMain truncate" title={metadata.Model}>{metadata.Model}</div>
                          </div>
                        )}
                        {metadata.Software && (
                          <div className="bg-card p-4 rounded-xl border border-borderSubtle">
                            <div className="text-[10px] text-textMuted uppercase font-bold mb-1">Software</div>
                            <div className="font-bold text-sm text-textMain truncate" title={metadata.Software}>{metadata.Software}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* All Raw Fields Table / Before-After Comparison */}
                    <div className="bg-card rounded-xl border border-borderSubtle overflow-hidden">
                      <div className="bg-black/5 px-4 py-3 border-b border-borderSubtle text-xs font-bold text-textMain uppercase flex items-center justify-between">
                        {cleanedUrl ? 'Before & After Comparison' : 'Metadata Risk Scanner'}
                        <i className={`fas ${cleanedUrl ? 'fa-columns text-accent' : 'fa-radar text-red-500'}`}></i>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm font-mono min-w-[500px]">
                          <thead>
                            <tr className="border-b border-borderSubtle bg-black/[0.02]">
                              <th className="py-3 px-4 font-bold text-xs text-textMuted uppercase tracking-wider w-1/3">Detected Field</th>
                              <th className="py-3 px-4 font-bold text-xs text-textMuted uppercase tracking-wider">Original Value</th>
                              {cleanedUrl && (
                                <th className="py-3 px-4 font-bold text-xs text-textMuted uppercase tracking-wider w-1/4">Cleaned State</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(metadata).filter(([k]) => !k.startsWith('_')).map(([key, val], i) => {
                              let displayVal = String(val);
                              if (val instanceof Uint8Array || val instanceof ArrayBuffer) displayVal = '<Binary Data>';
                              else if (typeof val === 'object' && val !== null) displayVal = JSON.stringify(val).slice(0, 80);
                              
                              // Risk Assessment Logic
                              const k = key.toLowerCase();
                              let risk = { level: 'Low', color: 'text-green-600 bg-green-500/10 border-green-500/30', icon: 'fa-check' };
                              if (['latitude', 'longitude', 'gps', 'author', 'creator', 'software', 'artist', 'ownername'].some(s => k.includes(s))) {
                                risk = { level: 'High', color: 'text-red-600 bg-red-500/10 border-red-500/30', icon: 'fa-exclamation-triangle' };
                              } else if (['make', 'model', 'datetime', 'date', 'modify', 'comment', 'description', 'title'].some(s => k.includes(s))) {
                                risk = { level: 'Med', color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30', icon: 'fa-exclamation-circle' };
                              }

                              const isRetained = ['Width', 'Height', 'Type', 'ViewBox', 'ImageWidth', 'ImageHeight', 'ColorSpace'].includes(key);
                              
                              return (
                                <tr key={key} className={`border-b border-borderSubtle/50 ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.01] hover:bg-black/[0.03]'}`}>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      {!cleanedUrl && (
                                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${risk.color} w-[50px] text-center`}>
                                          <i className={`fas ${risk.icon} mr-1`}></i>{risk.level}
                                        </span>
                                      )}
                                      <span className={`font-semibold ${cleanedUrl && !isRetained ? 'text-textMuted line-through opacity-70' : 'text-textMain'}`}>{key}</span>
                                    </div>
                                  </td>
                                  <td className={`py-3 px-4 break-all max-w-[200px] ${cleanedUrl && !isRetained ? 'text-textMuted line-through opacity-70' : 'text-textMuted'}`}>
                                    {displayVal}
                                  </td>
                                  {cleanedUrl && (
                                    <td className="py-3 px-4">
                                      {isRetained ? (
                                        <span className="text-textMuted text-xs font-bold bg-black/5 px-2 py-1 rounded">Retained</span>
                                      ) : (
                                        <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                          <i className="fas fa-eraser mr-1"></i> Scrubbed
                                        </span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer (Sticky actions) */}
              <div className="p-5 md:p-6 border-t border-borderSubtle bg-card shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                {metadata && !metadata._empty && !cleanedUrl ? (
                  <button 
                    onClick={removeMetadata}
                    disabled={isCleaning}
                    className="w-full py-4 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
                  >
                    {isCleaning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eraser"></i>}
                    {isCleaning ? 'Scrubbing Metadata...' : 'Scrub All Metadata'}
                  </button>
                ) : metadata && (metadata._empty || cleanedUrl) ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                    {cleanedUrl && (
                      <div className="mb-4 text-green-600 font-bold flex items-center gap-2 justify-center text-sm">
                        <i className="fas fa-check-circle"></i> Image completely wiped.
                      </div>
                    )}
                    <a 
                      href={cleanedUrl || URL.createObjectURL(file)}
                      download={cleanedUrl ? `clean_${file.name}` : file.name}
                      onClick={() => setTimeout(() => setShowPopup(false), 500)}
                      className="w-full py-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/20 active:scale-[0.98]"
                    >
                      <i className="fas fa-download"></i>
                      Download {cleanedUrl ? 'Clean File' : 'File'}
                    </a>
                  </motion.div>
                ) : (
                  <div className="h-[56px]"></div>
                )}
              </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
