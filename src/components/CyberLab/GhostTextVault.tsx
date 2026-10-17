import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ToolDropzone from './ToolDropzone';

// Zero-width Unicode characters for covert encoding
const ZW_ZERO = '\u200B'; // Zero-Width Space (Bit 0)
const ZW_ONE = '\u200C';  // Zero-Width Non-Joiner (Bit 1)
const ZW_START = '\uFEFF'; // Zero-Width No-Break Space (Header / Flag)

export default function GhostTextVault() {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'cloak' | 'scan'>('cloak');
  const [hasInput, setHasInput] = useState(false);

  // Cloak Mode State
  const [coverText, setCoverText] = useState(
    "Hey everyone! Check out the system architecture updates and roadmap for next week. Looking forward to your thoughts!"
  );
  const [secretMessage, setSecretMessage] = useState('');
  const [encodedResult, setEncodedResult] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Scan Mode State
  const [inspectText, setInspectText] = useState('');
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [hasHiddenMessage, setHasHiddenMessage] = useState<boolean | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showPopup) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPopup]);

  // Quick launch helper from main card
  const handleLaunchMode = (mode: 'cloak' | 'scan') => {
    setActiveTab(mode);
    setHasInput(true);
    setShowPopup(true);
  };

  // Handle file drop (txt / md files containing cover or suspect text)
  const handleDropFiles = async (droppedFiles: File[]) => {
    const file = droppedFiles[0];
    if (!file) return;
    try {
      const text = await file.text();
      // Auto-detect if it already contains zero-width markers!
      if (text.includes(ZW_START)) {
        setActiveTab('scan');
        handleDecode(text);
      } else {
        setActiveTab('cloak');
        setCoverText(text);
      }
      setHasInput(true);
      setShowPopup(true);
    } catch (e) {
      console.warn("Could not read text file", e);
    }
  };

  // Encode secret message into invisible Zero-Width characters
  const handleEncode = () => {
    if (!coverText.trim() || !secretMessage.trim()) return;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(secretMessage);
    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += bytes[i].toString(2).padStart(8, '0');
    }

    let zwStr = ZW_START;
    for (let i = 0; i < binaryStr.length; i++) {
      zwStr += binaryStr[i] === '1' ? ZW_ONE : ZW_ZERO;
    }
    zwStr += ZW_START;

    const words = coverText.split(' ');
    if (words.length > 1) {
      words[0] = words[0] + zwStr;
      setEncodedResult(words.join(' '));
    } else {
      setEncodedResult(coverText + zwStr);
    }
  };

  // Decode secret message from invisible Zero-Width characters
  const handleDecode = (textToScan: string) => {
    setInspectText(textToScan);
    setDecodedMessage(null);

    const startIdx = textToScan.indexOf(ZW_START);
    const endIdx = textToScan.lastIndexOf(ZW_START);

    if (startIdx === -1 || endIdx === -1 || startIdx === endIdx) {
      setHasHiddenMessage(false);
      return;
    }

    const zwPayload = textToScan.substring(startIdx + 1, endIdx);
    let binaryStr = '';

    for (let i = 0; i < zwPayload.length; i++) {
      const char = zwPayload[i];
      if (char === ZW_ONE) binaryStr += '1';
      else if (char === ZW_ZERO) binaryStr += '0';
    }

    if (binaryStr.length % 8 !== 0 || binaryStr.length === 0) {
      setHasHiddenMessage(false);
      return;
    }

    try {
      const bytes = new Uint8Array(binaryStr.length / 8);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(binaryStr.substr(i * 8, 8), 2);
      }
      const decoded = new TextDecoder().decode(bytes);
      setDecodedMessage(decoded);
      setHasHiddenMessage(true);
    } catch {
      setHasHiddenMessage(false);
    }
  };

  const handleCopy = () => {
    if (!encodedResult) return;
    navigator.clipboard.writeText(encodedResult);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="w-full relative">
      {/* Title & Description Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-textMain mb-1">Ghost Text Vault</h3>
        <p className="text-xs text-textMuted max-w-md mx-auto">
          Invisibly weave encrypted text into normal tweets, emails, and posts using Unicode zero-width steganography.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <AnimatePresence mode="wait">
        {!hasInput ? (
          <div className="flex flex-col gap-4">
            <ToolDropzone
              icon="fa-ghost"
              title="Drop a Text file or Start Cloaking"
              subtitle="Supports .txt, .md, or click below to launch the text studio"
              accept=".txt,.md,text/plain"
              onDropFiles={handleDropFiles}
            />

            {/* Quick Action Presets */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleLaunchMode('cloak')}
                className="px-5 py-2.5 rounded-2xl bg-card border border-borderSubtle hover:border-accent text-xs font-bold text-textMain hover:text-accent shadow-sm transition-all flex items-center gap-2 group"
              >
                <i className="fas fa-magic text-accent group-hover:scale-110 transition-transform"></i>
                Cloak a New Message
                <i className="fas fa-arrow-right text-[10px] opacity-70 group-hover:translate-x-1 transition-transform"></i>
              </button>
              <button
                type="button"
                onClick={() => handleLaunchMode('scan')}
                className="px-5 py-2.5 rounded-2xl bg-card border border-borderSubtle hover:border-accent text-xs font-bold text-textMain hover:text-accent shadow-sm transition-all flex items-center gap-2 group"
              >
                <i className="fas fa-search text-accent group-hover:scale-110 transition-transform"></i>
                Scan & Reveal Suspect Text
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-borderSubtle rounded-3xl p-5 md:p-8 relative shadow-lg text-center flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-accent/10 border border-borderSubtle flex items-center justify-center text-accent text-3xl mb-4 shadow-sm group">
              <i className="fas fa-ghost group-hover:scale-110 transition-transform"></i>
            </div>
            <h4 className="font-bold text-xl text-textMain truncate w-full px-4">Ghost Text Studio Ready</h4>
            <p className="text-sm text-textMuted mt-1 mb-6">
              {activeTab === 'cloak' ? 'Cloaking & Embedding Mode' : 'Scanner & Steganography Detection Mode'}
            </p>
            <div className="flex gap-4 w-full max-w-sm">
              <button
                onClick={() => setShowPopup(true)}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
              >
                <i className="fas fa-magic mr-2"></i> Open Ghost Studio
              </button>
              <button
                onClick={() => {
                  setHasInput(false);
                  setEncodedResult('');
                  setDecodedMessage(null);
                }}
                className="w-12 h-12 rounded-xl bg-card border border-borderSubtle text-textMuted hover:text-red-500 hover:border-red-500/30 transition-colors flex items-center justify-center shrink-0"
                title="Reset"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Popup Modal Matching CyberLab Design System */}
      {createPortal(
        <AnimatePresence>
          {showPopup && (
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
                onClick={(e) => e.stopPropagation()}
                className="bg-bgMain w-full max-w-2xl max-h-[85vh] md:max-h-[800px] rounded-3xl shadow-2xl flex flex-col border border-borderSubtle overflow-hidden relative"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-borderSubtle bg-card shrink-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-borderSubtle flex items-center justify-center text-accent text-xl shrink-0">
                      <i className="fas fa-ghost"></i>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-textMain truncate">Ghost Text Vault</h3>
                      <p className="text-xs text-textMuted truncate">Zero-Width Unicode Covert Transmitter</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-textMuted transition-colors shrink-0 ml-4"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 flex flex-col gap-6">
                  {/* Mode Selector Pill */}
                  <div className="flex justify-center bg-black/5 dark:bg-white/5 p-1 rounded-xl self-center w-full max-w-xs shrink-0">
                    <button
                      onClick={() => setActiveTab('cloak')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'cloak' ? 'bg-card text-textMain shadow-sm' : 'text-textMuted hover:text-textMain'
                      }`}
                    >
                      <i className="fas fa-ghost mr-1.5"></i> Cloak Message
                    </button>
                    <button
                      onClick={() => setActiveTab('scan')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'scan' ? 'bg-card text-textMain shadow-sm' : 'text-textMuted hover:text-textMain'
                      }`}
                    >
                      <i className="fas fa-search mr-1.5"></i> Scan & Reveal
                    </button>
                  </div>

                  {/* TAB 1: CLOAK */}
                  {activeTab === 'cloak' && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-textMuted">
                          1. Innocent Cover Story (Plain Text)
                        </span>
                        <textarea
                          value={coverText}
                          onChange={(e) => setCoverText(e.target.value)}
                          rows={3}
                          placeholder="Type any normal email, tweet, or message that everyone will see..."
                          className="w-full bg-bgMain border border-borderSubtle rounded-xl p-3 text-sm text-textMain focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-textMuted">
                            2. Secret Ghost Payload (Hidden)
                          </span>
                          <span className="text-[10px] text-accent font-mono font-bold bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                            100% Invisible to Human Eye
                          </span>
                        </div>
                        <textarea
                          value={secretMessage}
                          onChange={(e) => setSecretMessage(e.target.value)}
                          rows={3}
                          placeholder="Confidential password, crypto seed, or private message to hide..."
                          className="w-full bg-bgMain border border-borderSubtle rounded-xl p-3 text-sm text-textMain focus:outline-none focus:border-accent"
                        />
                      </div>

                      <button
                        onClick={handleEncode}
                        disabled={!secretMessage.trim() || !coverText.trim()}
                        className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-magic"></i> Generate Ghost Text
                      </button>

                      {/* Generated Result */}
                      {encodedResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border border-accent/40 rounded-2xl p-5 flex flex-col gap-3 shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Ghost Text Armed & Ready
                            </span>
                            <span className="text-[10px] font-mono text-textMuted">
                              {encodedResult.length} Total Chars ({encodedResult.length - coverText.length} Invisible Zero-Width Bits)
                            </span>
                          </div>

                          <div className="p-3 bg-bgMain rounded-xl border border-borderSubtle text-xs text-textMain font-mono break-words select-all">
                            {encodedResult}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleCopy}
                              className="flex-1 py-2.5 bg-accent text-white font-bold text-xs rounded-xl hover:bg-accent/90 transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                              <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
                              {copySuccess ? 'Copied to Clipboard!' : 'Copy Cloaked Text'}
                            </button>
                            <button
                              onClick={() => {
                                handleDecode(encodedResult);
                                setActiveTab('scan');
                              }}
                              className="px-4 py-2.5 bg-bgMain border border-borderSubtle text-textMain font-bold text-xs rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              Test In Scanner
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SCAN */}
                  {activeTab === 'scan' && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-textMuted">
                          Paste Suspect Text Below
                        </span>
                        <textarea
                          value={inspectText}
                          onChange={(e) => handleDecode(e.target.value)}
                          rows={4}
                          placeholder="Paste any tweet, email, or message to scan for hidden zero-width Unicode signals..."
                          className="w-full bg-bgMain border border-borderSubtle rounded-xl p-3 text-sm text-textMain focus:outline-none focus:border-accent"
                        />
                      </div>

                      {/* Reveal Result */}
                      {hasHiddenMessage === true && decodedMessage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-5 bg-card border border-emerald-500/40 rounded-2xl flex flex-col gap-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Covert Ghost Transmission Intercepted!
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold">
                              Zero-Width Decoded
                            </span>
                          </div>

                          <div className="p-4 bg-bgMain rounded-xl border border-borderSubtle text-sm font-mono text-textMain break-words select-text">
                            {decodedMessage}
                          </div>
                        </motion.div>
                      )}

                      {hasHiddenMessage === false && inspectText.trim() && (
                        <div className="p-4 bg-card border border-borderSubtle rounded-2xl text-center text-xs text-textMuted flex items-center justify-center gap-2">
                          <i className="fas fa-shield-alt text-accent"></i>
                          No zero-width Unicode steganographic signals found in this text.
                        </div>
                      )}
                    </div>
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
