import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import ToolDropzone from './ToolDropzone';
import { saveFile } from '../../downloadFile';

export default function FileEncryptor() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [authMode, setAuthMode] = useState<'password' | 'keyfile'>('password');
  const [files, setFiles] = useState<File[]>([]);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setResultUrl(null);
      setErrorMsg(null);
      
      // Auto-detect decrypt mode if single encrypted file
      if (selectedFiles.length === 1 && selectedFiles[0].name.endsWith('.encrypted')) {
        setMode('decrypt');
      } else if (selectedFiles.length > 1) {
        setMode('encrypt'); // Can't decrypt multiple files at once natively here
      }
    }
  };

  const handleKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setKeyFile(e.target.files[0]);
    }
  };

  const deriveKeyFromPassword = async (pwd: string, salt: Uint8Array) => {
    const enc = new TextEncoder();
    const saltBuffer = new Uint8Array(salt.length);
    saltBuffer.set(salt);
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(pwd),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer.buffer,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  };

  const importRawKey = async (rawKeyBytes: Uint8Array) => {
    const keyBuffer = new Uint8Array(rawKeyBytes.length);
    keyBuffer.set(rawKeyBytes);
    return window.crypto.subtle.importKey(
      "raw",
      keyBuffer.buffer,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  };

  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let entropy = 0;
    if (/[a-z]/.test(pwd)) entropy += 26;
    if (/[A-Z]/.test(pwd)) entropy += 26;
    if (/[0-9]/.test(pwd)) entropy += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) entropy += 32;
    const score = Math.min(100, Math.floor((pwd.length * Math.log2(entropy || 1)) / 100 * 100));
    return score;
  };

  const generateAndDownloadKeyFile = async () => {
    const rawKey = window.crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
    const blob = new Blob([rawKey], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    await saveFile(url, 'secure-vault.key', 'application/octet-stream');
    URL.revokeObjectURL(url);
    
    // Simulate loading the key file instantly so they can proceed
    const keyFileMock = new File([blob], "secure-vault.key", { type: "application/octet-stream" });
    setKeyFile(keyFileMock);
  };

  const processFile = async () => {
    if (files.length === 0) return;
    if (authMode === 'password' && !password) return;
    if (authMode === 'keyfile' && !keyFile) {
      setErrorMsg("Please generate or select a key file.");
      return;
    }
    
    setIsProcessing(true);
    setErrorMsg(null);
    setResultUrl(null);

    const startTs = Date.now();

    try {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      
      let targetBuffer: ArrayBuffer;
      let outputOriginalName = "archive.zip";

      // --- 1. Prepare Target Buffer (Zip if multiple, otherwise raw) ---
      if (mode === 'encrypt') {
        if (files.length > 1) {
          const zip = new JSZip();
          files.forEach(f => zip.file(f.name, f));
          targetBuffer = await zip.generateAsync({ type: 'arraybuffer' });
          outputOriginalName = "secure_archive.zip";
        } else {
          targetBuffer = await files[0].arrayBuffer();
          outputOriginalName = files[0].name;
        }
      } else {
        targetBuffer = await files[0].arrayBuffer();
      }

      // --- 2. Key Resolution ---
      let cryptoKey: CryptoKey | null = null;
      let salt = new Uint8Array(16); // Only used for password auth, but kept for format consistency
      
      if (authMode === 'password') {
        if (mode === 'encrypt') {
          window.crypto.getRandomValues(salt);
        }
      } else {
        // Keyfile auth
        const keyFileBuffer = await keyFile!.arrayBuffer();
        if (keyFileBuffer.byteLength !== 32) throw new Error("Invalid key file. Must be exactly 256-bits.");
        cryptoKey = await importRawKey(new Uint8Array(keyFileBuffer));
        // Fill salt with zeros for header consistency so format doesn't break
        salt.fill(0); 
      }

      // --- 3. Execute Crypto ---
      if (mode === 'encrypt') {
        if (authMode === 'password') {
          cryptoKey = await deriveKeyFromPassword(password, salt);
        }
        
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv as any },
          cryptoKey!,
          targetBuffer
        );
        
        const nameBytes = enc.encode(outputOriginalName);
        const nameLength = new Uint16Array([nameBytes.length]);
        const nameLengthBytes = new Uint8Array(nameLength.buffer);

        // Header: [MAGIC(4)] + [AUTH_MODE(1)] + [SALT(16)] + [IV(12)] + [NAMELEN(2)] + [NAME(N)]
        const magic = enc.encode('AGCM');
        const authModeByte = new Uint8Array([authMode === 'password' ? 0 : 1]);
        const headerSize = magic.length + authModeByte.length + salt.length + iv.length + nameLengthBytes.length + nameBytes.length;
        
        const payload = new Uint8Array(headerSize + encrypted.byteLength);
        let offset = 0;
        
        payload.set(magic, offset); offset += magic.length;
        payload.set(authModeByte, offset); offset += authModeByte.length;
        payload.set(salt, offset); offset += salt.length;
        payload.set(iv, offset); offset += iv.length;
        payload.set(nameLengthBytes, offset); offset += nameLengthBytes.length;
        payload.set(nameBytes, offset); offset += nameBytes.length;
        payload.set(new Uint8Array(encrypted), offset);
        
        const blob = new Blob([payload], { type: 'application/octet-stream' });
        
        const elapsed = Date.now() - startTs;
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
        
        setResultUrl(URL.createObjectURL(blob));
        setResultName(`${outputOriginalName}.encrypted`);
        
      } else {
        // Decrypt
        if (targetBuffer.byteLength < 35) throw new Error("Invalid or corrupted encrypted file.");
        
        const data = new Uint8Array(targetBuffer);
        const magic = dec.decode(data.slice(0, 4));
        
        let iv, cipherText, originalName, fileAuthModeByte;

        if (magic === 'AGCM') {
          fileAuthModeByte = data[4];
          salt = data.slice(5, 21);
          iv = data.slice(21, 33);
          const nameLenBytes = data.slice(33, 35);
          const nameLen = new Uint16Array(nameLenBytes.buffer)[0];
          originalName = dec.decode(data.slice(35, 35 + nameLen));
          cipherText = data.slice(35 + nameLen);
        } else {
           throw new Error("Legacy format detected. Only new format supported for decryption in this version.");
        }
        
        if (fileAuthModeByte === 0 && authMode === 'keyfile') throw new Error("This file was encrypted with a Password, but you selected Key File mode.");
        if (fileAuthModeByte === 1 && authMode === 'password') throw new Error("This file was encrypted with a Key File, but you selected Password mode.");
        
        if (authMode === 'password') {
          cryptoKey = await deriveKeyFromPassword(password, salt);
        }
        
        try {
          const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv as any },
            cryptoKey!,
            cipherText
          );
          
          const blob = new Blob([decrypted]);
          
          const elapsed = Date.now() - startTs;
          if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
          
          setResultUrl(URL.createObjectURL(blob));
          setResultName(originalName);
        } catch (e: any) {
          console.error(e);
          // GCM Authentication Tag failure throws an OperationError in WebCrypto
          throw new Error("⚠️ INTEGRITY FAILURE: The decryption password/key is incorrect, OR the file has been tampered with and modified maliciously. AES-GCM Authentication Tag rejected the payload.", { cause: e });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCombinedSize = () => {
    return files.reduce((acc, f) => acc + f.size, 0);
  };

  const getDisplayFilename = () => {
    if (files.length === 1) return files[0].name;
    return `SecureArchive_of_${files.length}_items.zip`;
  };

  const handleDropFiles = (droppedFiles: File[]) => {
    setFiles(droppedFiles);
    setErrorMsg("");
    setResultUrl(null);

    if (droppedFiles.length === 1 && droppedFiles[0].name.endsWith('.encrypted')) {
      setMode('decrypt');
    } else if (droppedFiles.length > 1) {
      setMode('encrypt');
    }
  };

  return (
    <div className="w-full relative">
      {/* Initial Upload State */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-textMain mb-1">File Encryptor</h3>
        <p className="text-xs text-textMuted max-w-md mx-auto">Securely encrypt or decrypt files entirely in your browser using military-grade AES-256-GCM.</p>
      </div>

      <AnimatePresence mode="wait">
        {files.length === 0 && (
          <ToolDropzone
            icon="fa-shield-alt"
            title="Drop files to secure"
            subtitle="Select one or multiple files. Folders supported via multi-select."
            multiple={true}
            onDropFiles={handleDropFiles}
          />
        )}
      </AnimatePresence>

      {/* Fullscreen Popup Modal */}
      {createPortal(
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              key="action"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-bgMain/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
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
                        <i className={`fas ${mode === 'encrypt' ? 'fa-lock' : 'fa-unlock-alt'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent text-2xl`}></i>
                      </div>
                      <h3 className="text-2xl font-bold text-textMain font-mono mb-2 tracking-wide">
                        {mode === 'encrypt' ? 'Encrypting Payload...' : 'Decrypting Payload...'}
                      </h3>
                      <p className="text-sm text-textMuted font-mono">
                        Executing AES-256-GCM Cryptographic Operations
                      </p>
                      
                      {/* Fake Terminal Matrix lines */}
                      <div className="mt-10 w-full max-w-md bg-white/60 backdrop-blur-md rounded-xl p-6 text-left font-mono text-[11px] sm:text-xs text-accent overflow-hidden h-48 relative border border-accent/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <motion.div
                          animate={{ y: [0, -160] }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                          className="flex flex-col gap-2 whitespace-nowrap"
                        >
                          <p>0x0001: INITIALIZING PBKDF2...</p>
                          <p>0x0002: DERIVING 256-BIT KEY...</p>
                          <p>0x0003: GENERATING RANDOM SALT...</p>
                          <p>0x0004: INJECTING IV VECTOR...</p>
                          <p>0x0005: PERFORMING AES SUB-BYTES...</p>
                          <p>0x0006: SHIFT ROWS / MIX COLUMNS...</p>
                          <p>0x0007: WRITING CIPHERTEXT BLOCKS...</p>
                          <p>0x0008: CALCULATING GCM AUTH TAG...</p>
                          <p>0x0009: SECURE ALLOCATION CLEARED.</p>
                          <p>0x000A: VERIFYING INTEGRITY...</p>
                          <p>0x000B: FINALIZING PAYLOAD...</p>
                        </motion.div>
                        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div className="p-6 border-b border-borderSubtle flex items-center justify-between bg-black/5 shrink-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-textMain truncate">Secure Vault</h3>
                      <p className="text-xs text-textMuted truncate">Local AES-GCM Processing</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setFiles([]); setPassword(''); setKeyFile(null); setResultUrl(null); setErrorMsg(null); }}
                    className="w-10 h-10 rounded-full bg-white shadow-sm border border-borderSubtle hover:bg-black/5 flex items-center justify-center text-textMuted transition-colors shrink-0 text-lg ml-4"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

              {/* Scrollable Content */}
              <div className="p-5 md:p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                
                {/* Selected File Card */}
                <div className="flex items-center gap-4 bg-black/5 p-4 rounded-2xl border border-borderSubtle shrink-0">
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-2xl">
                    <i className={`fas ${mode === 'encrypt' ? 'fa-lock' : 'fa-unlock'}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-textMain truncate">{getDisplayFilename()}</div>
                    <div className="text-xs text-textMuted mt-1">{(getCombinedSize() / 1024 / 1024).toFixed(2)} MB {files.length > 1 && '(Will be Zipped)'}</div>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-black/5 p-1 rounded-2xl border border-borderSubtle w-full relative shrink-0">
                  <button 
                    onClick={() => { setMode('encrypt'); setResultUrl(null); }}
                    disabled={files.length > 1 && files[0].name.endsWith('.encrypted')}
                    className={`relative z-10 w-1/2 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-30 ${mode === 'encrypt' ? 'text-textMain' : 'text-textMuted hover:text-textMain'}`}
                  >
                    <i className="fas fa-lock mr-2"></i> Encrypt
                  </button>
                  <button 
                    onClick={() => { setMode('decrypt'); setResultUrl(null); }}
                    disabled={files.length > 1}
                    className={`relative z-10 w-1/2 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-30 ${mode === 'decrypt' ? 'text-textMain' : 'text-textMuted hover:text-textMain'}`}
                  >
                    <i className="fas fa-unlock mr-2"></i> Decrypt
                  </button>
                  <motion.div 
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-xl shadow-sm border border-borderSubtle z-0"
                    animate={{ x: mode === 'encrypt' ? 0 : '100%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                </div>

                {/* Authentication Type Switcher */}
                <div className="shrink-0">
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-textMain cursor-pointer">
                      <input type="radio" checked={authMode === 'password'} onChange={() => setAuthMode('password')} className="accent-accent" />
                      Password
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-textMain cursor-pointer">
                      <input type="radio" checked={authMode === 'keyfile'} onChange={() => setAuthMode('keyfile')} className="accent-accent" />
                      Key File (Zero-Knowledge)
                    </label>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Password Auth */}
                    {authMode === 'password' ? (
                      <motion.div 
                        key="password-auth"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.15 }}
                        className="bg-card border border-borderSubtle rounded-2xl p-4 shadow-sm"
                      >
                        <div className="relative group flex items-center">
                          <i className="fas fa-key absolute left-4 text-textMuted group-focus-within:text-accent transition-colors"></i>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === 'encrypt' ? 'Create strong password...' : 'Enter decryption password...'}
                            className="w-full bg-bgMain border border-borderSubtle rounded-xl py-3 pl-12 pr-12 text-textMain focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all font-mono"
                          />
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-textMuted hover:text-textMain transition-colors"
                          >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        
                        <AnimatePresence>
                          {mode === 'encrypt' && password.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3 space-y-2">
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                                  <span className="text-textMuted">Password Strength</span>
                                  <span className={calculateStrength(password) < 40 ? 'text-red-500' : calculateStrength(password) < 70 ? 'text-yellow-500' : 'text-green-500'}>
                                    {calculateStrength(password) < 40 ? 'Weak' : calculateStrength(password) < 70 ? 'Moderate' : 'Strong'}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden flex">
                                  <motion.div 
                                    className={`h-full ${calculateStrength(password) < 40 ? 'bg-red-500' : calculateStrength(password) < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${calculateStrength(password)}%` }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="keyfile-auth"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.15 }}
                        className="bg-card border border-borderSubtle rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                      >
                        <AnimatePresence mode="wait">
                          {mode === 'encrypt' ? (
                            <motion.div
                              key="keyfile-encrypt"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex flex-col gap-3 overflow-hidden"
                            >
                              <div className="text-xs text-textMuted">
                                <i className="fas fa-info-circle mr-1"></i> A mathematically unguessable 256-bit key will be generated. You MUST safely store this `.key` file.
                              </div>
                              {!keyFile ? (
                                <button 
                                  onClick={generateAndDownloadKeyFile}
                                  className="w-full py-4 rounded-xl border-2 border-dashed border-accent text-accent font-bold hover:bg-accent/5 transition-colors flex items-center justify-center gap-2"
                                >
                                  <i className="fas fa-magic"></i> Generate & Download Key
                                </button>
                              ) : (
                                <div className="w-full py-4 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2">
                                  <i className="fas fa-check-circle"></i> Key Generated Successfully
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="keyfile-decrypt"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex flex-col gap-3 overflow-hidden"
                            >
                              <div className="text-xs text-textMuted mb-2">
                                <i className="fas fa-info-circle mr-1"></i> Please provide the `.key` file that was generated when this file was originally encrypted.
                              </div>
                              <div 
                                onClick={() => keyFileInputRef.current?.click()}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-borderSubtle hover:border-accent text-textMain cursor-pointer font-bold hover:bg-accent/5 transition-colors flex items-center justify-center gap-2"
                              >
                                <i className={keyFile ? "fas fa-key text-accent" : "fas fa-upload text-textMuted"}></i> 
                                {keyFile ? keyFile.name : 'Upload .key file'}
                              </div>
                              <input type="file" ref={keyFileInputRef} onChange={handleKeyFileChange} className="hidden" accept=".key" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>



                  {/* Security Specs / Info Panel */}
                  <AnimatePresence>
                    {!resultUrl && !(mode === 'encrypt' && authMode === 'password') && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-3 shrink-0 overflow-hidden"
                      >
                        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-start gap-3 mt-3">
                          <div className="text-accent mt-0.5">
                            <i className="fas fa-shield-alt text-lg"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-textMain">Zero-Knowledge Architecture</h4>
                            <p className="text-xs text-textMuted mt-1">
                              All encryption and decryption happens strictly locally in your browser memory. We never transmit your files, passwords, or keys to any server.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-mono text-textMuted justify-center opacity-70 mb-2">
                          <div className="flex items-center gap-1.5"><i className="fas fa-microchip"></i> AES-256-GCM</div>
                          <div className="w-1 h-1 rounded-full bg-borderSubtle"></div>
                          <div className="flex items-center gap-1.5"><i className="fas fa-key"></i> PBKDF2 (100k)</div>
                          <div className="w-1 h-1 rounded-full bg-borderSubtle"></div>
                          <div className="flex items-center gap-1.5"><i className="fas fa-file-archive"></i> JSZip</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold flex items-start gap-2">
                        <i className="fas fa-exclamation-triangle mt-0.5"></i> <div>{errorMsg}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="p-5 md:p-6 border-t border-borderSubtle bg-card shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] shrink-0 mt-auto">
                {!resultUrl ? (
                  <button 
                    onClick={processFile}
                    disabled={isProcessing || (authMode === 'password' && !password) || (authMode === 'keyfile' && !keyFile)}
                    className={`w-full py-4 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${mode === 'encrypt' ? 'bg-accent hover:bg-accent/90 shadow-accent/20' : 'bg-textMain text-bgMain hover:opacity-90 shadow-textMain/20'} hover:shadow-md active:scale-[0.98]`}
                  >
                    {isProcessing ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className={`fas fa-${mode === 'encrypt' ? 'lock' : 'unlock'} text-lg`}></i>}
                    {mode === 'encrypt' ? 'Encrypt Securely' : 'Decrypt & Verify'}
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 font-bold flex items-center gap-3 justify-center text-sm">
                      <i className="fas fa-check-circle text-lg"></i> Successfully {mode === 'encrypt' ? 'encrypted' : 'decrypted and verified'}!
                    </div>
                    <button 
                      onClick={() => void saveFile(resultUrl, resultName!, 'application/octet-stream')}
                      className="w-full p-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-3 text-sm hover:shadow-md hover:shadow-green-500/20 active:scale-[0.98]"
                    >
                      <i className="fas fa-download text-lg shrink-0"></i>
                      <span className="truncate">Save {resultName}</span>
                    </button>
                  </motion.div>
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
