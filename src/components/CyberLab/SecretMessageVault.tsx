import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ToolDropzone from './ToolDropzone';

export default function SecretMessageVault() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'hide' | 'extract'>('hide');
  const [useEncryption, setUseEncryption] = useState(true);
  const [secretText, setSecretText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [extractedMessage, setExtractedMessage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capacityBytes, setCapacityBytes] = useState<number>(0);
  
  const handleDropFiles = async (droppedFiles: File[]) => {
    const selected = droppedFiles[0];
    if (!selected) return;
    if (selected.type !== 'image/png') {
      setErrorMsg("Only PNG images are supported for steganography.");
      return;
    }

    setFile(selected);
    setShowPopup(true);
    setSecretText('');
    setPassword('');
    setExtractedMessage(null);
    setResultUrl(null);
    setErrorMsg(null);

    // Calculate capacity
    setMode('hide');
    const url = URL.createObjectURL(selected);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        setCapacityBytes(Math.floor((data.length / 4 * 3) / 8));

        const header = new Uint8Array(9);
        let byteIndex = 0;
        let bitIndex = 0;
        for (let i = 0; i < data.length && byteIndex < header.length; i += 4) {
          for (const channel of [0, 1, 2]) {
            header[byteIndex] = (header[byteIndex] << 1) | (data[i + channel] & 1);
            bitIndex++;
            if (bitIndex === 8) {
              bitIndex = 0;
              byteIndex++;
              if (byteIndex === header.length) break;
            }
          }
        }

        if (new TextDecoder().decode(header.slice(0, 4)) === 'STGO') {
          setMode('extract');
        }
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMsg("The selected PNG could not be read.");
    };
  };

  useEffect(() => {
    if (showPopup) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPopup]);

  const deriveKeyFromPassword = async (pwd: string, salt: Uint8Array) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", enc.encode(pwd), "PBKDF2", false, ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
  };

  const processImage = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setExtractedMessage(null);
    setResultUrl(null);

    const startTs = Date.now();

    try {
      const img = new Image();
      const loadImg = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      await loadImg;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context.");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // MAX CAPACITY: Each pixel gives 3 bits (R,G,B). Total bytes = (pixels.length / 4 * 3) / 8
      const maxCapacityBytes = Math.floor((pixels.length / 4 * 3) / 8);

      if (mode === 'hide') {
        const enc = new TextEncoder();
        let payloadBytes: Uint8Array;
        
        const rawTextBytes = enc.encode(secretText);

        if (useEncryption) {
          const salt = window.crypto.getRandomValues(new Uint8Array(16));
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          const key = await deriveKeyFromPassword(password, salt);
          
          const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv }, key, rawTextBytes
          );
          const cipherText = new Uint8Array(encryptedBuffer);
          
          // Encryption Payload = SALT(16) + IV(12) + CIPHERTEXT
          payloadBytes = new Uint8Array(16 + 12 + cipherText.length);
          payloadBytes.set(salt, 0);
          payloadBytes.set(iv, 16);
          payloadBytes.set(cipherText, 28);
        } else {
          payloadBytes = rawTextBytes;
        }

        // Header: 'STGO' (4) + length (4) + isEnc (1) = 9 bytes
        const header = new Uint8Array(9);
        header.set(enc.encode('STGO'), 0);
        new DataView(header.buffer).setUint32(4, payloadBytes.length, false);
        header[8] = useEncryption ? 1 : 0;

        const fullData = new Uint8Array(header.length + payloadBytes.length);
        fullData.set(header, 0);
        fullData.set(payloadBytes, header.length);

        if (fullData.length > maxCapacityBytes) {
          throw new Error(`Message too large! Max capacity is ${maxCapacityBytes} bytes, but you need ${fullData.length} bytes.`);
        }

        // Hide data in LSB of RGB
        let dataIdx = 0;
        let bitIdx = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          if (dataIdx >= fullData.length) break;
          // Red
          if (dataIdx < fullData.length) {
            pixels[i] = (pixels[i] & 0xFE) | ((fullData[dataIdx] >> (7 - bitIdx)) & 1);
            bitIdx++; if (bitIdx === 8) { bitIdx = 0; dataIdx++; }
          }
          // Green
          if (dataIdx < fullData.length) {
            pixels[i + 1] = (pixels[i + 1] & 0xFE) | ((fullData[dataIdx] >> (7 - bitIdx)) & 1);
            bitIdx++; if (bitIdx === 8) { bitIdx = 0; dataIdx++; }
          }
          // Blue
          if (dataIdx < fullData.length) {
            pixels[i + 2] = (pixels[i + 2] & 0xFE) | ((fullData[dataIdx] >> (7 - bitIdx)) & 1);
            bitIdx++; if (bitIdx === 8) { bitIdx = 0; dataIdx++; }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        
        const elapsed = Date.now() - startTs;
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));

        canvas.toBlob((blob) => {
          if (blob) setResultUrl(URL.createObjectURL(blob));
        }, 'image/png');

      } else {
        // EXTRACT MODE
        const extractBytes = (numBytes: number, pixelOffset: number = 0) => {
          const bytes = new Uint8Array(numBytes);
          let bIdx = 0, bitIdx = 0, i = pixelOffset;
          while (bIdx < numBytes && i < pixels.length) {
            if (bIdx < numBytes) { bytes[bIdx] = (bytes[bIdx] << 1) | (pixels[i] & 1); bitIdx++; if (bitIdx === 8) { bitIdx = 0; bIdx++; } }
            if (bIdx < numBytes) { bytes[bIdx] = (bytes[bIdx] << 1) | (pixels[i + 1] & 1); bitIdx++; if (bitIdx === 8) { bitIdx = 0; bIdx++; } }
            if (bIdx < numBytes) { bytes[bIdx] = (bytes[bIdx] << 1) | (pixels[i + 2] & 1); bitIdx++; if (bitIdx === 8) { bitIdx = 0; bIdx++; } }
            i += 4;
          }
          return { bytes, nextOffset: i };
        };

        const headerInfo = extractBytes(9, 0);
        const dec = new TextDecoder();
        const magic = dec.decode(headerInfo.bytes.slice(0, 4));

        if (magic !== 'STGO') throw new Error("No secret payload found in this image. (Magic missing)");

        const payloadLen = new DataView(headerInfo.bytes.buffer).getUint32(4, false);
        const isEnc = headerInfo.bytes[8] === 1;

        if (payloadLen > maxCapacityBytes) throw new Error("Corrupted payload detected.");

        if (isEnc && !useEncryption) {
           throw new Error("This image contains an ENCRYPTED payload, but you disabled encryption. Enable it to enter a password.");
        }
        if (!isEnc && useEncryption) {
           throw new Error("This image contains a PLAIN TEXT payload, but you have encryption enabled. Disable it to extract.");
        }

        const payloadInfo = extractBytes(payloadLen, headerInfo.nextOffset);
        
        if (isEnc) {
          if (!password) throw new Error("Password is required to decrypt this image.");
          try {
            const salt = payloadInfo.bytes.slice(0, 16);
            const iv = payloadInfo.bytes.slice(16, 28);
            const cipherText = payloadInfo.bytes.slice(28);
            const key = await deriveKeyFromPassword(password, salt);
            const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherText);
            
            const elapsed = Date.now() - startTs;
            if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
            
            setExtractedMessage(dec.decode(decrypted));
          } catch(e) {
            throw new Error("Decryption failed. Incorrect password or corrupted payload.");
          }
        } else {
          const elapsed = Date.now() - startTs;
          if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
          
          setExtractedMessage(dec.decode(payloadInfo.bytes));
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full relative">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-textMain mb-1">Secret Message Vault</h3>
        <p className="text-xs text-textMuted max-w-md mx-auto">Hide secret messages inside ordinary PNG images using LSB Steganography.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <ToolDropzone
            icon="fa-layer-group"
            title="Drop a PNG image"
            subtitle="Only PNG is supported to prevent data loss"
            accept="image/png"
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
              <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h4 className="font-bold text-xl text-textMain truncate w-full px-4">{file.name}</h4>
            <p className="text-sm text-textMuted mt-1 mb-6">
              {(file.size / 1024 / 1024).toFixed(2)} MB • PNG Image
            </p>
            <div className="flex gap-4 w-full max-w-sm">
              <button 
                onClick={() => setShowPopup(true)}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
              >
                <i className="fas fa-magic mr-2"></i> Open Vault UI
              </button>
              <button 
                onClick={() => setFile(null)}
                className="py-3 px-5 rounded-xl bg-black/5 hover:bg-black/10 text-textMain font-bold transition-colors"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                
                {/* Processing Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-bgMain/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="relative mb-6">
                        <i className="fas fa-circle-notch fa-spin text-accent text-6xl opacity-30"></i>
                        <i className={`fas ${mode === 'hide' ? 'fa-mask' : 'fa-search'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent text-2xl`}></i>
                      </div>
                      <h3 className="text-2xl font-bold text-textMain font-mono mb-2 tracking-wide">
                        {mode === 'hide' ? 'Embedding Payload into LSB...' : 'Extracting Payload from LSB...'}
                      </h3>
                      <p className="text-sm text-textMuted font-mono">
                        Executing Deep Pixel Manipulation
                      </p>
                      
                      {/* Fake Terminal Matrix lines */}
                      <div className="mt-10 w-full max-w-md bg-white/60 backdrop-blur-md rounded-xl p-6 text-left font-mono text-[11px] sm:text-xs text-accent overflow-hidden h-48 relative border border-accent/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <motion.div
                          animate={{ y: [0, -160] }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                          className="flex flex-col gap-2 whitespace-nowrap"
                        >
                          <p>0x0001: ALLOCATING CANVAS BUFFER...</p>
                          <p>0x0002: INGESTING BYTES MAX...</p>
                          <p>0x0003: PREPARING PAYLOAD BITS...</p>
                          <p>0x0004: SCANNING PIXEL MATRIX...</p>
                          <p>0x0005: FLIPPING LEAST SIGNIFICANT BITS...</p>
                          <p>0x0006: BYPASSING ALPHA CHANNEL...</p>
                          <p>0x0007: RECOMPILING IMAGE DATA...</p>
                          <p>0x0008: VERIFYING CHECKSUM...</p>
                          <p>0x0009: SECURE ALLOCATION CLEARED.</p>
                          <p>0x000A: TERMINATING WORKER THREADS...</p>
                          <p>0x000B: DONE.</p>
                        </motion.div>
                        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between p-5 md:p-6 border-b border-borderSubtle bg-card shrink-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 border border-borderSubtle shrink-0">
                      <img src={URL.createObjectURL(file)} alt="Thumb" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-textMain truncate">Vault Operation</h3>
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

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 flex flex-col gap-6">
                  
                  {!resultUrl && !extractedMessage && (
                    <div className="flex justify-center bg-black/5 p-1 rounded-xl self-center w-full max-w-sm mb-2 shrink-0 relative">
                      <button 
                        onClick={() => setMode('hide')}
                        className={`relative z-10 flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'hide' ? 'text-textMain' : 'text-textMuted hover:text-textMain'}`}
                      >
                        Hide Message
                      </button>
                      <button 
                        onClick={() => setMode('extract')}
                        className={`relative z-10 flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'extract' ? 'text-textMain' : 'text-textMuted hover:text-textMain'}`}
                      >
                        Extract Message
                      </button>
                      <motion.div 
                        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-card rounded-lg shadow-sm z-0"
                        animate={{ x: mode === 'hide' ? 0 : '100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {mode === 'hide' && !resultUrl && (
                      <motion.div 
                        key="hide-form"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="shrink-0 overflow-hidden"
                      >
                        <div className="space-y-4 pb-2">
                          <div className="flex justify-between items-end mb-2">
                            <label className="block text-xs font-bold text-textMuted uppercase">Secret Message</label>
                            {capacityBytes > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                secretText.length > capacityBytes * 0.9 
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                  : 'bg-accent/10 text-accent'
                              }`}>
                                {(capacityBytes - secretText.length).toLocaleString()} chars remaining
                              </span>
                            )}
                          </div>
                          <textarea
                            value={secretText}
                            maxLength={capacityBytes > 0 ? capacityBytes : undefined}
                            onChange={(e) => setSecretText(e.target.value)}
                            placeholder="Type the message you want to hide in this image..."
                            className="w-full bg-card border border-borderSubtle rounded-xl p-4 text-textMain text-sm focus:outline-none focus:border-accent min-h-[120px] resize-y"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!resultUrl && !extractedMessage && (
                    <div className="flex flex-col gap-4 shrink-0">
                      <div className="flex items-center gap-3 bg-black/5 p-4 rounded-xl border border-borderSubtle">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={useEncryption} onChange={() => setUseEncryption(!useEncryption)} />
                          <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                        <div>
                          <p className="text-sm font-bold text-textMain">Use AES-GCM Encryption</p>
                          <p className="text-xs text-textMuted">Highly recommended to protect the message contents.</p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {useEncryption && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <label className="block text-xs font-bold text-textMuted uppercase mb-2">Encryption Password</label>
                            <div className="relative group flex items-center">
                              <i className="fas fa-key absolute left-4 text-textMuted group-focus-within:text-accent transition-colors"></i>
                              <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Super secret password..."
                                className="w-full bg-card border border-borderSubtle rounded-xl py-3 pl-12 pr-12 text-textMain focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all font-mono"
                              />
                              <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 text-textMuted hover:text-textMain transition-colors"
                              >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Empty State Filler Panel */}
                  <AnimatePresence>
                    {!resultUrl && !extractedMessage && (mode === 'extract' || !useEncryption) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="flex flex-col overflow-hidden shrink-0"
                      >
                        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-start gap-3 mt-3">
                          <div className="text-accent mt-0.5">
                            <i className="fas fa-layer-group text-lg"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-textMain">LSB Steganography</h4>
                            <p className="text-xs text-textMuted mt-1">
                              Your message is converted to binary and embedded directly into the Least Significant Bits of the image's pixels. The visual appearance remains completely identical.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold flex items-start gap-2">
                        <i className="fas fa-exclamation-triangle mt-0.5"></i> <div>{errorMsg}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {extractedMessage && (
                    <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl shadow-inner">
                      <h4 className="text-sm font-bold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                        <i className="fas fa-unlock"></i> Message Extracted Successfully
                      </h4>
                      <div className="bg-bgMain p-4 rounded-xl border border-borderSubtle">
                        <p className="text-textMain font-mono text-sm break-all whitespace-pre-wrap">{extractedMessage}</p>
                      </div>
                    </div>
                  )}

                  {resultUrl && (
                    <div className="flex flex-col items-center justify-center p-8 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg shadow-green-500/20">
                        <i className="fas fa-check"></i>
                      </div>
                      <h3 className="font-bold text-green-600 dark:text-green-400 text-lg mb-2">Payload Hidden Successfully</h3>
                      <p className="text-sm text-textMain mb-6">The image now contains your secret message and looks completely normal.</p>
                      <a 
                        href={resultUrl}
                        download={`stego_${file.name}`}
                        className="py-3 px-8 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all shadow-md hover:shadow-green-500/20 active:scale-[0.98] flex items-center gap-2"
                      >
                        <i className="fas fa-download"></i> Download Stego Image
                      </a>
                    </div>
                  )}
                  
                </div>

                {(!resultUrl && !extractedMessage) && (
                  <div className="p-5 md:p-6 border-t border-borderSubtle bg-card shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] shrink-0">
                    <button 
                      onClick={processImage}
                      disabled={isProcessing || (useEncryption && !password) || (mode === 'hide' && !secretText)}
                      className="w-full py-4 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
                    >
                      {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-mask"></i>}
                      {isProcessing ? 'Processing...' : (mode === 'hide' ? (useEncryption ? 'Encrypt & Hide Message' : 'Hide Plain Text Message') : 'Extract Message')}
                    </button>
                  </div>
                )}

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
