import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ToolDropzone from './ToolDropzone';
import Dropdown from './Dropdown';
import DateTimePicker from './DateTimePicker';

export default function TimeBombVault() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiryMode, setExpiryMode] = useState<'duration' | 'date'>('duration');
  const [expiryValue, setExpiryValue] = useState<number>(1);
  const [expiryUnit, setExpiryUnit] = useState<'minutes' | 'hours' | 'days'>('days');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showInfo, setShowInfo] = useState(false);

  const handleDropFiles = (droppedFiles: File[]) => {
    setFile(droppedFiles[0]);
    setErrorMsg(null);
    setResultUrl(null);
  };

  const handleCreateTimeBomb = async () => {
    if (!file) {
      setErrorMsg("Please select a file first.");
      return;
    }
    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }
    let expiresAt = 0;
    if (expiryMode === 'duration') {
      if (expiryValue < 1) {
        setErrorMsg("Duration must be at least 1.");
        return;
      }
      const multiplier = expiryUnit === 'minutes' ? 60 * 1000 : 
                         expiryUnit === 'hours' ? 60 * 60 * 1000 : 
                         24 * 60 * 60 * 1000;
      expiresAt = Date.now() + expiryValue * multiplier;
    } else {
      if (!expiryDate) {
        setErrorMsg("Please select an expiration date and time.");
        return;
      }
      expiresAt = new Date(expiryDate).getTime();
      if (expiresAt <= Date.now()) {
        setErrorMsg("Expiration time must be in the future.");
        return;
      }
    }

    if (expiresAt > Date.now() + 365 * 24 * 60 * 60 * 1000) {
      setErrorMsg("Expiration cannot be more than 1 year in the future.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Generate Vault ID and Cloud Fragment
      const { v4: uuidv4 } = await import('uuid');
      const vaultId = uuidv4();
      const cloudFragment = uuidv4() + uuidv4(); // long random string

      // 2. Save to Firestore
      const { db } = await import('../../firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      await setDoc(doc(db, 'timebombs', vaultId), {
        cloudFragment,
        expiresAt,
        attempts: 0
      });

      // 3. Encrypt the file locally
      const fileBuffer = await file.arrayBuffer();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password + cloudFragment),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt"]
      );

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        fileBuffer
      );

      // Convert to Base64
      const bufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      const encryptedDataB64 = bufferToBase64(encryptedBuffer);
      const ivB64 = bufferToBase64(iv);
      const saltB64 = bufferToBase64(salt);

      // 4. Generate the self-contained HTML file
      const { generateTimeBombHtml } = await import('./TimeBombTemplate');
      const htmlContent = generateTimeBombHtml(
        encryptedDataB64,
        ivB64,
        saltB64,
        vaultId,
        file.name,
        file.type,
        expiresAt,
        file.size
      );
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
      setResultName(`timebomb_${file.name}.html`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during encryption.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setResultUrl(null);
    setErrorMsg(null);
  };

  return (
    <div className="w-full relative">
      <div className="text-center mb-6 relative">
        <h3 className="text-2xl font-black text-textMain flex items-center justify-center gap-2 mb-1">
          <i className="fas fa-bomb text-accent"></i> Time-Bomb Vault
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${showInfo ? 'bg-accent text-white' : 'text-textMuted hover:bg-black/5 hover:text-accent'}`}
          >
            <i className="fas fa-info-circle text-sm"></i>
          </button>
        </h3>
        <p className="text-xs text-textMuted max-w-md mx-auto">Wrap any file in a self-destructing HTML trap. Enforces strict time limits and brute-force protection via zero-knowledge key splitting.</p>
        
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="overflow-hidden mt-4"
            >
              <div className="bg-card border border-borderSubtle shadow-inner rounded-xl p-4 text-left max-w-md mx-auto relative">
                <p className="text-xs font-bold text-textMain mb-1"><i className="fas fa-globe text-accent mr-1"></i> Hybrid Cloud Time-Lock</p>
                <p className="text-[11px] text-textMuted leading-relaxed">
                  Your file and password are encrypted locally and <strong>never leave your browser</strong>. Only a microscopic, anonymous key-fragment is sent to our cloud to act as an impartial countdown referee.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ToolDropzone
        icon="fa-bomb"
        title="Drop a file to booby-trap"
        subtitle="Any file type is supported."
        onDropFiles={handleDropFiles}
      />

      {createPortal(
        <AnimatePresence>
          {file && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={reset}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              
              <motion.div 
                key="config"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-borderSubtle rounded-[2rem] p-6 md:p-8 w-full max-w-md relative shadow-2xl flex flex-col z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-borderSubtle">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <i className="fas fa-file-alt text-xl text-accent"></i>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-bold text-textMain truncate">{file.name}</h4>
                    <p className="text-xs text-textMuted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={reset} className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 shrink-0">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {!resultUrl ? (
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Vault Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter a strong password..." 
                          className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent transition-colors"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors w-8 h-8 flex items-center justify-center"
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Time to Live (Self-Destruct)</label>
                      
                      <div className="flex bg-black/5 p-1 rounded-xl border border-borderSubtle w-full relative shrink-0 mb-4">
                        <button 
                          onClick={() => setExpiryMode('duration')}
                          className={`relative z-10 w-1/2 py-2 rounded-lg font-bold text-sm transition-colors ${expiryMode === 'duration' ? 'text-textMain bg-card shadow-sm border border-borderSubtle' : 'text-textMuted hover:text-textMain'}`}
                        >
                          Duration
                        </button>
                        <button 
                          onClick={() => setExpiryMode('date')}
                          className={`relative z-10 w-1/2 py-2 rounded-lg font-bold text-sm transition-colors ${expiryMode === 'date' ? 'text-textMain bg-card shadow-sm border border-borderSubtle' : 'text-textMuted hover:text-textMain'}`}
                        >
                          Specific Date/Time
                        </button>
                      </div>

                      {expiryMode === 'duration' ? (
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            min="1" 
                            value={expiryValue}
                            onChange={(e) => setExpiryValue(parseInt(e.target.value) || 1)}
                            className="w-24 bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent transition-colors"
                          />
                          <Dropdown
                            value={expiryUnit}
                            onChange={(val) => setExpiryUnit(val as any)}
                            options={[
                              { label: 'Minutes', value: 'minutes' },
                              { label: 'Hours', value: 'hours' },
                              { label: 'Days', value: 'days' }
                            ]}
                            className="flex-1"
                          />
                        </div>
                      ) : (
                        <div>
                          <DateTimePicker
                            value={expiryDate}
                            onChange={(val) => setExpiryDate(val)}
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-textMuted mt-2 italic">Maximum 1 year from now. After this time, the cloud referee will wipe the decryption fragment permanently.</p>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-sm">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>{errorMsg}</p>
                      </div>
                    )}

                    <button 
                      onClick={handleCreateTimeBomb}
                      disabled={isProcessing}
                      className="w-full bg-accent text-white font-bold rounded-xl py-4 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {isProcessing ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Arming Time-Bomb...</>
                      ) : (
                        <><i className="fas fa-lock"></i> Generate Self-Destructing HTML</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-check text-2xl text-green-500"></i>
                    </div>
                    <h4 className="font-bold text-xl text-textMain mb-2">Payload Armed & Ready</h4>
                    <p className="text-sm text-textMuted mb-6">Your file is now locked inside an HTML Time-Bomb. It is configured to self-destruct exactly as specified or after 3 failed attempts.</p>
                    
                    <a 
                      href={resultUrl} 
                      download={resultName!}
                      className="flex w-full bg-accent text-white font-bold rounded-xl py-4 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 items-center justify-center gap-2"
                    >
                      <i className="fas fa-download"></i> Download HTML Bomb
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
