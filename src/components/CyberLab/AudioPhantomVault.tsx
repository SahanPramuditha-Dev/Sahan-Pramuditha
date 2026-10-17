import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ToolDropzone from './ToolDropzone';
import { saveFile } from '../../downloadFile';
import {
  audioBufferToWav,
  embedPayloadInAudio,
  extractPayloadFromFile,
  extractPayloadFromAudio,
  generateSyntheticCyberTrack,
  encryptPayload,
  decryptPayload,
  bufferToBase64,
  base64ToBuffer,
  type EmbeddedPayload
} from './audioStegoEngine';
import { AcousticTransmitter, AcousticReceiver } from './acousticModem';
import AudioSpectrumPlayer from './AudioSpectrumPlayer';

export default function AudioPhantomVault() {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'embed' | 'extract' | 'liveMic'>('embed');

  // Carrier Audio File
  const [file, setFile] = useState<File | null>(null);
  const [carrierType, setCarrierType] = useState<'custom' | 'alone'>('alone');

  // Embed Options
  const [payloadType, setPayloadType] = useState<'text' | 'image'>('text');
  const [secretText, setSecretText] = useState('');
  const [secretImagePreview, setSecretImagePreview] = useState<string | null>(null);
  const [secretImageName, setSecretImageName] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useEncryption, setUseEncryption] = useState(false);

  // Status & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusLog, setStatusLog] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [carrierAudioPreviewUrl, setCarrierAudioPreviewUrl] = useState<string | null>(null);
  const [detectedStego, setDetectedStego] = useState<boolean>(false);
  const [carrierDurationSec, setCarrierDurationSec] = useState<number>(12); // default synth is 12s
  const [carrierCapacityBytes, setCarrierCapacityBytes] = useState<number>(12 * 44100 / 8);

  // Extract Result
  const [extractedData, setExtractedData] = useState<{
    type: 'text' | 'image';
    content: string;
    isEncrypted: boolean;
  } | null>(null);

  // Live Mic Stream
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [liveStreamText, setLiveStreamText] = useState('');
  const [liveMicStatus, setLiveMicStatus] = useState('Standby. Click "Listen to Air" to intercept acoustic pulses.');
  const [isTransmittingOverAir, setIsTransmittingOverAir] = useState(false);
  const [airTransmitProgress, setAirTransmitProgress] = useState(0);

  const receiverRef = useRef<AcousticReceiver | null>(null);
  const transmitterRef = useRef<AcousticTransmitter>(new AcousticTransmitter());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Reset confidential state on modal close
  const handleCloseModal = () => {
    setShowPopup(false);
    setErrorMsg(null);
    setStatusLog(null);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showPopup) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPopup]);

  // Clean up
  useEffect(() => {
    return () => {
      receiverRef.current?.stopListening();
      if (resultAudioUrl) URL.revokeObjectURL(resultAudioUrl);
      if (carrierAudioPreviewUrl) URL.revokeObjectURL(carrierAudioPreviewUrl);
    };
  }, [resultAudioUrl, carrierAudioPreviewUrl]);

  // Inspect and process a newly selected carrier / audio file
  const inspectAudioFile = async (selected: File) => {
    setFile(selected);
    setCarrierType('custom');
    setErrorMsg(null);
    setResultAudioUrl(null);
    setExtractedData(null);

    // 1. Check if file already contains a hidden spy payload
    try {
      const payload = await extractPayloadFromFile(selected);
      if (payload) {
        setDetectedStego(true);
        setActiveTab('extract'); // Auto-switch to Decompile mode!
      } else {
        setDetectedStego(false);
        setActiveTab('embed');
      }
    } catch {
      setDetectedStego(false);
      setActiveTab('embed');
    }

    // 2. Decode duration & calculate payload capacity
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuf = await selected.slice(0, 1024 * 1024 * 10).arrayBuffer(); // first 10MB
      const buffer = await audioCtx.decodeAudioData(arrayBuf);
      const dur = buffer.duration || 10;
      setCarrierDurationSec(dur);
      // Capacity = (sampleRate * duration * channels) / 8
      const cap = Math.floor((buffer.sampleRate * dur * buffer.numberOfChannels) / 8);
      setCarrierCapacityBytes(cap);
    } catch {
      // Fallback estimate based on file size
      setCarrierCapacityBytes(Math.max(1024, Math.floor(selected.size / 4)));
    }

    try {
      const previewUrl = URL.createObjectURL(selected);
      setCarrierAudioPreviewUrl(previewUrl);
    } catch {
      // noop
    }

    setShowPopup(true);
  };

  // Handle Carrier Audio Drop on main card
  const handleDropFiles = (droppedFiles: File[]) => {
    const selected = droppedFiles[0];
    if (!selected) return;
    inspectAudioFile(selected);
  };

  // Open with pre-loaded Alone Synth track
  const handleOpenPresetAlone = () => {
    setFile(new File(["synth_carrier"], "Alone_AlanWalker_Covert.wav", { type: "audio/wav" }));
    setCarrierType('alone');
    setDetectedStego(false);
    setActiveTab('embed');
    setCarrierDurationSec(12);
    setCarrierCapacityBytes(Math.floor((44100 * 12 * 2) / 8)); // ~132 KB

    // Synthesize Alone audio preview so user can play it with the spectrum visualizer
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const synthBuf = generateSyntheticCyberTrack(audioCtx, 12);
      const synthWav = audioBufferToWav(synthBuf);
      const url = URL.createObjectURL(synthWav);
      setCarrierAudioPreviewUrl(url);
    } catch (e) {
      console.warn("Could not preview Alone synth track", e);
    }

    setShowPopup(true);
    setErrorMsg(null);
    setResultAudioUrl(null);
    setExtractedData(null);
  };

  // Handle Secret Image Drop
  const handleSecretImageDrop = (dropped: File[]) => {
    const imgFile = dropped[0];
    if (imgFile && imgFile.type.startsWith('image/')) {
      setSecretImageName(imgFile.name);
      const reader = new FileReader();
      reader.onload = (e) => setSecretImagePreview(e.target?.result as string);
      reader.readAsDataURL(imgFile);
    }
  };

  // Process Embed Operation
  const handleProcessEmbed = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResultAudioUrl(null);
    setStatusLog('INITIALIZING WEBAUDIO CONTEXT...');

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let carrierBuffer: AudioBuffer;

      if (carrierType === 'custom' && file && file.size > 100) {
        setStatusLog('INGESTING CARRIER AUDIO SAMPLES...');
        const arrayBuf = await file.arrayBuffer();
        carrierBuffer = await audioCtx.decodeAudioData(arrayBuf);
      } else {
        setStatusLog('SYNTHESIZING ALAN WALKER EDM CARRIER (Fm/Db/Ab/Eb)...');
        carrierBuffer = generateSyntheticCyberTrack(audioCtx, 12);
      }

      setStatusLog('PREPARING PAYLOAD MATRIX...');
      let rawData: Uint8Array;
      if (payloadType === 'text') {
        if (!secretText.trim()) throw new Error('Please enter a secret message to embed.');
        rawData = new TextEncoder().encode(secretText);
      } else {
        if (!secretImagePreview) throw new Error('Please drop a secret image to embed.');
        rawData = new TextEncoder().encode(secretImagePreview);
      }

      let ciphertext: Uint8Array = rawData;
      let salt: Uint8Array = new Uint8Array(0);
      let iv: Uint8Array = new Uint8Array(0);

      if (useEncryption) {
        if (!password) throw new Error('Please enter a password to encrypt with AES-256-GCM.');
        setStatusLog('APPLYING MILITARY-GRADE AES-256-GCM ENCRYPTION...');
        const encrypted = await encryptPayload(rawData, password);
        ciphertext = new Uint8Array(encrypted.ciphertext);
        salt = new Uint8Array(encrypted.salt);
        iv = new Uint8Array(encrypted.iv);
      }

      const payload: EmbeddedPayload = {
        type: payloadType,
        data: bufferToBase64(ciphertext),
        isEncrypted: useEncryption,
        saltB64: salt.length ? bufferToBase64(salt) : undefined,
        ivB64: iv.length ? bufferToBase64(iv) : undefined
      };

      setStatusLog('WEAVING BITS INTO LEAST SIGNIFICANT AUDIO AMPLITUDE...');
      const stegoBuffer = embedPayloadInAudio(carrierBuffer, payload);

      setStatusLog('EXPORTING LOSSLESS MASTER 16-BIT PCM WAV...');
      const wavBlob = audioBufferToWav(stegoBuffer, payload);
      const url = URL.createObjectURL(wavBlob);
      setResultAudioUrl(url);
      setStatusLog(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to embed payload into audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Extract Operation
  const handleProcessExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setExtractedData(null);
    setStatusLog('SCANNING AUDIO PCM BITSTREAM FOR SPY SIGNATURE...');

    try {
      // 1. Try bit-perfect extraction directly from file raw bytes (fastest, lossless)
      let payload = await extractPayloadFromFile(file);

      // 2. Fallback to Web Audio decoded buffer if needed
      if (!payload) {
        setStatusLog('DECODING AUDIO SAMPLES FOR LSB ANALYSIS...');
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuf = await file.arrayBuffer();
        const carrierBuffer = await audioCtx.decodeAudioData(arrayBuf);
        payload = extractPayloadFromAudio(carrierBuffer);
      }

      if (!payload) {
        throw new Error('No hidden spy transmission found in this audio file.');
      }

      const cipherBuffer = base64ToBuffer(payload.data);
      const salt = payload.saltB64 ? base64ToBuffer(payload.saltB64) : new Uint8Array(0);
      const iv = payload.ivB64 ? base64ToBuffer(payload.ivB64) : new Uint8Array(0);

      if (payload.isEncrypted && !password) {
        throw new Error('This audio payload is password-protected. Please enter the decryption passphrase.');
      }

      setStatusLog('DECOMPILING & DECRYPTING PAYLOAD...');
      const decrypted = await decryptPayload(cipherBuffer, salt, iv, password || undefined);
      const textStr = new TextDecoder().decode(decrypted);

      setExtractedData({
        type: payload.type,
        content: textStr,
        isEncrypted: payload.isEncrypted
      });
      setStatusLog(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract payload from audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Over-The-Air Playback
  const handleBroadcastOverAir = async () => {
    if (!secretText) return;
    setIsTransmittingOverAir(true);
    setAirTransmitProgress(0);
    try {
      await transmitterRef.current.transmit(secretText, (pct) => setAirTransmitProgress(pct));
    } catch (err) {
      console.error(err);
    } finally {
      setIsTransmittingOverAir(false);
    }
  };

  // Toggle Live Microphone Listening
  const toggleLiveMic = async () => {
    if (isListeningMic) {
      receiverRef.current?.stopListening();
      setIsListeningMic(false);
      setLiveMicStatus('Stopped listening.');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      setLiveStreamText('');
      setLiveMicStatus('Calibrating audio spectrum...');
      try {
        receiverRef.current = new AcousticReceiver();
        await receiverRef.current.startListening(
          (char) => setLiveStreamText((prev) => prev + char),
          (status) => setLiveMicStatus(status)
        );
        setIsListeningMic(true);
      } catch (err: any) {
        setLiveMicStatus(`Mic access error: ${err.message}`);
      }
    }
  };

  // Visualizer Canvas for Live Listening
  useEffect(() => {
    if (!isListeningMic || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const render = () => {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2563EB';
      ctx.beginPath();

      const sliceWidth = canvas.width / 50;
      let x = 0;

      for (let i = 0; i < 50; i++) {
        const v = Math.sin((i * 0.25) + offset) * (isListeningMic ? 14 : 2);
        const y = canvas.height / 2 + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      offset += 0.1;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListeningMic]);

  return (
    <div className="w-full relative">
      {/* Title & Description Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-textMain mb-1">Sonic Phantom</h3>
        <p className="text-xs text-textMuted max-w-md mx-auto">
          Hide secret messages and images inside audio tracks using frequency steganography and acoustic air intercept.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <AnimatePresence mode="wait">
        {!file ? (
          <div className="flex flex-col gap-4">
            <ToolDropzone
              icon="fa-headphones-alt"
              title="Drop a Song or Audio File"
              subtitle="Supports MP3, WAV, AAC, and FLAC files"
              accept="audio/*"
              onDropFiles={handleDropFiles}
            />

            {/* Quick Preset Carrier */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleOpenPresetAlone}
                className="px-5 py-2.5 rounded-2xl bg-card border border-borderSubtle hover:border-accent text-xs font-bold text-textMain hover:text-accent shadow-sm transition-all flex items-center gap-2 group"
              >
                <i className="fas fa-music text-accent group-hover:scale-110 transition-transform"></i>
                Or use preloaded Alone (Alan Walker Synth Track)
                <i className="fas fa-arrow-right text-[10px] opacity-70 group-hover:translate-x-1 transition-transform"></i>
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
            <div className="w-24 h-24 rounded-2xl bg-accent/10 border border-borderSubtle flex items-center justify-center text-accent text-3xl mb-4 shadow-sm relative group">
              <i className="fas fa-music group-hover:scale-110 transition-transform"></i>
            </div>
            <h4 className="font-bold text-xl text-textMain truncate w-full px-4">{file.name}</h4>
            <p className="text-sm text-textMuted mt-1 mb-6">
              {carrierType === 'alone' ? 'Pre-loaded 12s Alan Walker Synth Track' : `${(file.size / 1024 / 1024).toFixed(2)} MB • Audio Carrier`}
            </p>
            <div className="flex gap-4 w-full max-w-sm">
              <button
                onClick={() => setShowPopup(true)}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
              >
                <i className="fas fa-magic mr-2"></i> Open Sonic Vault
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setResultAudioUrl(null);
                  setExtractedData(null);
                }}
                className="w-12 h-12 rounded-xl bg-card border border-borderSubtle text-textMuted hover:text-red-500 hover:border-red-500/30 transition-colors flex items-center justify-center shrink-0"
                title="Remove Audio"
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
                {/* Processing Overlay with Matrix Terminal */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-bgMain/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="relative mb-6">
                        <i className="fas fa-circle-notch fa-spin text-accent text-6xl opacity-30"></i>
                        <i className="fas fa-wave-square absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent text-2xl"></i>
                      </div>
                      <h3 className="text-2xl font-bold text-textMain font-mono mb-2 tracking-wide">
                        {activeTab === 'embed' ? 'Embedding Sonic Stego Payload...' : 'Decompiling Audio Stream...'}
                      </h3>
                      <p className="text-sm text-textMuted font-mono">
                        Executing Acoustic Discrete Fast Fourier Wave Transform
                      </p>

                      <div className="mt-8 w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl p-6 text-left font-mono text-xs text-accent overflow-hidden h-40 relative border border-accent/20 shadow-lg">
                        <motion.div
                          animate={{ y: [0, -120] }}
                          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                          className="flex flex-col gap-2 whitespace-nowrap"
                        >
                          <p>0x001: ALLOCATING PCM BUFFER ARRAY...</p>
                          <p>0x002: {statusLog || 'SAMPLING AUDIO FREQUENCY SPECTRUM...'}</p>
                          <p>0x003: CONVERTING PAYLOAD TO BINARY MATRIX...</p>
                          <p>0x004: MODULATING LEAST SIGNIFICANT AMPLITUDES...</p>
                          <p>0x005: NORMALIZING STEREO WAVEFORMS...</p>
                          <p>0x006: VERIFYING CHECKSUM HASHES...</p>
                          <p>0x007: DONE.</p>
                        </motion.div>
                        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none"></div>
                        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pointer-events-none"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-borderSubtle bg-card shrink-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-borderSubtle flex items-center justify-center text-accent text-xl shrink-0">
                      <i className="fas fa-headphones-alt"></i>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-textMain truncate">Sonic Phantom</h3>
                      <p className="text-xs text-textMuted truncate">
                        {carrierType === 'alone' ? 'Alone (Alan Walker Synth Track)' : (file?.name || 'Carrier Audio')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-textMuted transition-colors shrink-0 ml-4"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 flex flex-col gap-6">
                  {/* Mode Selector Pill */}
                  <div className="flex justify-center bg-black/5 dark:bg-white/5 p-1 rounded-xl self-center w-full max-w-md shrink-0 relative">
                    <button
                      onClick={() => { setActiveTab('embed'); setErrorMsg(null); }}
                      className={`relative z-10 flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'embed' ? 'bg-card text-textMain shadow-sm' : 'text-textMuted hover:text-textMain'
                      }`}
                    >
                      <i className="fas fa-file-audio mr-1.5"></i> Embed Payload
                    </button>
                    <button
                      onClick={() => { setActiveTab('extract'); setErrorMsg(null); }}
                      className={`relative z-10 flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'extract' ? 'bg-card text-textMain shadow-sm' : 'text-textMuted hover:text-textMain'
                      }`}
                    >
                      <i className="fas fa-unlock mr-1.5"></i> Decompile Audio
                    </button>
                    <button
                      onClick={() => { setActiveTab('liveMic'); setErrorMsg(null); }}
                      className={`relative z-10 flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'liveMic' ? 'bg-card text-accent shadow-sm' : 'text-textMuted hover:text-textMain'
                      }`}
                    >
                      <i className="fas fa-satellite-dish mr-1.5"></i> Live Mic Intercept
                    </button>
                  </div>

                  {/* DETECTED COVERT TRANSMISSION BANNER */}
                  {detectedStego && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-bold">Covert spy transmission detected inside this audio file!</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                        Ready to Decompile
                      </span>
                    </div>
                  )}

                  {/* ERROR ALERT */}
                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle shrink-0"></i>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* TAB 1: EMBED */}
                  {activeTab === 'embed' && (
                    <div className="flex flex-col gap-5">
                      {!resultAudioUrl ? (
                        <>
                          {/* Carrier Selector */}
                          <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Carrier Song Mode</span>
                              <span className="text-[10px] font-mono text-textMuted">
                                Duration: {carrierDurationSec.toFixed(1)}s • Capacity: {(carrierCapacityBytes / 1024).toFixed(0)} KB
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenPresetAlone()}
                                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                  carrierType === 'alone' ? 'border-accent bg-accent/10 text-accent' : 'border-borderSubtle text-textMuted hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                              >
                                <i className="fas fa-music"></i> Alone (Alan Walker Synth)
                              </button>
                              <button
                                type="button"
                                onClick={() => setCarrierType('custom')}
                                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                  carrierType === 'custom' ? 'border-accent bg-accent/10 text-accent' : 'border-borderSubtle text-textMuted hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                              >
                                <i className="fas fa-upload"></i> Custom Track ({file?.name || 'None'})
                              </button>
                            </div>

                            {/* Real-time Spectrum Visualizer for Carrier Track */}
                            {carrierAudioPreviewUrl && (
                              <div className="mt-2">
                                <AudioSpectrumPlayer
                                  src={carrierAudioPreviewUrl}
                                  title={carrierType === 'alone' ? 'Alone (Synth Audio Preview)' : (file?.name || 'Selected Carrier Track')}
                                  badge="Carrier Stream"
                                />
                              </div>
                            )}
                          </div>

                          {/* Payload Type Selector */}
                          <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Secret Payload Type</span>
                              {payloadType === 'text' && (
                                <span className="text-[10px] font-mono text-textMuted">
                                  {new TextEncoder().encode(secretText).length} / {carrierCapacityBytes} bytes
                                </span>
                              )}
                            </div>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-xs font-bold text-textMain cursor-pointer">
                                <input
                                  type="radio"
                                  name="payloadType"
                                  checked={payloadType === 'text'}
                                  onChange={() => setPayloadType('text')}
                                  className="accent-accent"
                                />
                                <i className="fas fa-comment-alt text-accent"></i> Secret Message
                              </label>
                              <label className="flex items-center gap-2 text-xs font-bold text-textMain cursor-pointer">
                                <input
                                  type="radio"
                                  name="payloadType"
                                  checked={payloadType === 'image'}
                                  onChange={() => setPayloadType('image')}
                                  className="accent-accent"
                                />
                                <i className="fas fa-image text-accent"></i> Secret Image / Blueprint
                              </label>
                            </div>

                            {/* Storage Capacity Gauge */}
                            <div className="w-full bg-borderSubtle/40 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-accent h-full transition-all duration-300 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(2, (
                                    payloadType === 'text'
                                      ? (new TextEncoder().encode(secretText).length / Math.max(1, carrierCapacityBytes)) * 100
                                      : secretImagePreview ? 35 : 0
                                  )))}%`
                                }}
                              ></div>
                            </div>

                            {payloadType === 'text' ? (
                              <textarea
                                value={secretText}
                                onChange={(e) => setSecretText(e.target.value)}
                                placeholder="Type the confidential message, access tokens, or coordinates to hide in the audio wave..."
                                rows={4}
                                className="w-full bg-bgMain border border-borderSubtle rounded-xl p-3 text-sm text-textMain focus:outline-none focus:border-accent transition-colors"
                              />
                            ) : (
                              <div>
                                <ToolDropzone
                                  icon="fa-image"
                                  title="Drop Secret Image to Hide"
                                  subtitle="Supports PNG, JPG, or WebP"
                                  accept="image/*"
                                  onDropFiles={handleSecretImageDrop}
                                />
                                {secretImagePreview && (
                                  <div className="mt-3 flex items-center gap-3 p-3 bg-bgMain rounded-xl border border-borderSubtle">
                                    <img src={secretImagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-textMain truncate">{secretImageName}</p>
                                      <p className="text-[10px] text-textMuted">Payload image ready for embedding</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => { setSecretImagePreview(null); setSecretImageName(''); }}
                                      className="text-textMuted hover:text-red-500 text-xs p-1"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Encryption Option */}
                          <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-xs font-bold text-textMain cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useEncryption}
                                  onChange={(e) => setUseEncryption(e.target.checked)}
                                  className="accent-accent"
                                />
                                <span>Encrypt Payload (AES-256-GCM)</span>
                              </label>
                              {useEncryption && (
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                                  PBKDF2 100k
                                </span>
                              )}
                            </div>

                            {useEncryption && (
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Passphrase for AES encryption..."
                                  className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-accent transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain text-xs"
                                >
                                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={handleProcessEmbed}
                            className="w-full py-4 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-shield-alt"></i> Synthesize & Embed Secret
                          </button>
                        </>
                      ) : (
                        /* SUCCESS EMBED RESULT */
                        <div className="p-6 bg-card border border-green-500/30 rounded-2xl flex flex-col gap-4 text-center items-center">
                          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-2xl mb-1">
                            <i className="fas fa-check"></i>
                          </div>
                          <h4 className="text-xl font-bold text-textMain">Covert Audio Track Generated!</h4>
                          {resultAudioUrl && (
                            <AudioSpectrumPlayer
                              src={resultAudioUrl}
                              title={`Covert_${carrierType === 'alone' ? 'Alone_Synth' : (file?.name.replace(/\.[^/.]+$/, "") || 'Audio')}.wav`}
                              badge="Stego Master WAV"
                            />
                          )}

                          <div className="flex gap-3 w-full">
                            <button
                              onClick={() => {
                                if (resultAudioUrl) {
                                  saveFile(resultAudioUrl, `Covert_${carrierType === 'alone' ? 'Alone_Synth' : (file?.name.replace(/\.[^/.]+$/, "") || 'Audio')}.wav`, 'audio/wav');
                                }
                              }}
                              className="flex-1 py-3 bg-accent text-white font-bold text-xs rounded-xl hover:bg-accent/90 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-download"></i> Download Stego-Track (.WAV)
                            </button>
                            <button
                              onClick={() => setResultAudioUrl(null)}
                              className="px-4 py-3 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain font-bold text-xs rounded-xl"
                            >
                              Embed Another
                            </button>
                          </div>

                          {/* Quick test in decompile tab button */}
                          <button
                            onClick={async () => {
                              if (resultAudioUrl) {
                                const resp = await fetch(resultAudioUrl);
                                const blob = await resp.blob();
                                const newFile = new File([blob], "Covert_Generated_Track.wav", { type: "audio/wav" });
                                inspectAudioFile(newFile);
                              }
                            }}
                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5 mt-1"
                          >
                            <i className="fas fa-arrow-right"></i> Open in Decompile Tab to Verify
                          </button>

                          {/* Acoustic Over-the-air option */}
                          {payloadType === 'text' && secretText && (
                            <div className="w-full mt-3 pt-4 border-t border-borderSubtle flex items-center justify-between text-left">
                              <div>
                                <p className="text-xs font-bold text-textMain">Transmit Over-The-Air</p>
                                <p className="text-[10px] text-textMuted">Broadcast ultrasonic pulses to a nearby phone or mic</p>
                              </div>
                              <button
                                onClick={handleBroadcastOverAir}
                                disabled={isTransmittingOverAir}
                                className="px-4 py-2 bg-textMain text-bgMain font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                              >
                                {isTransmittingOverAir ? (
                                  <><i className="fas fa-broadcast-tower animate-bounce"></i> Broadcasting ({airTransmitProgress}%)...</>
                                ) : (
                                  <><i className="fas fa-volume-up"></i> Play Signals</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: EXTRACT */}
                  {activeTab === 'extract' && (
                    <div className="flex flex-col gap-5">
                      {!extractedData ? (
                        <>
                          <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Target Audio File</span>
                            <div className="flex items-center gap-3 p-3 bg-bgMain rounded-xl border border-borderSubtle">
                              <i className="fas fa-compact-disc text-accent text-xl"></i>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-textMain truncate">{file?.name || 'Carrier Audio'}</p>
                                <p className="text-[10px] text-textMuted">
                                  {detectedStego ? 'Covert transmission signature detected' : 'Ready for payload deconstruction'}
                                </p>
                              </div>
                            </div>

                            {/* Spectrum preview of the track to be decompiled */}
                            {carrierAudioPreviewUrl && (
                              <AudioSpectrumPlayer
                                src={carrierAudioPreviewUrl}
                                title={file?.name || 'Target Audio Track'}
                                badge={detectedStego ? 'Covert Signal' : 'Audio Track'}
                              />
                            )}

                            {/* Direct Inline Audio Dropzone */}
                            <div className="pt-2">
                              <ToolDropzone
                                icon="fa-file-audio"
                                title="Drop Different .WAV Audio to Decompile"
                                subtitle="Instantly verify any covert audio file"
                                accept="audio/*"
                                onDropFiles={(f) => {
                                  if (f[0]) inspectAudioFile(f[0]);
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-textMuted">Decryption Password (If Encrypted)</label>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Passphrase used when embedding..."
                              className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-accent"
                            />
                          </div>

                          <button
                            onClick={handleProcessExtract}
                            className="w-full py-4 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-unlock-alt"></i> Extract Hidden Payload
                          </button>
                        </>
                      ) : (
                        /* EXTRACTED PAYLOAD RESULT */
                        <div className="p-6 bg-card border border-accent/40 rounded-2xl flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              Spy Payload Successfully Extracted
                            </span>
                            {extractedData.isEncrypted && (
                              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                                AES-256 Decrypted
                              </span>
                            )}
                          </div>

                          {extractedData.type === 'text' ? (
                            <div className="p-4 bg-bgMain rounded-xl border border-borderSubtle font-mono text-sm text-textMain break-words select-text">
                              {extractedData.content}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <img src={extractedData.content} alt="Extracted Secret" className="max-h-72 object-contain rounded-xl shadow-lg border border-borderSubtle" />
                              <a
                                href={extractedData.content}
                                download="extracted_spy_image.png"
                                className="px-4 py-2 bg-textMain text-bgMain font-bold text-xs rounded-xl hover:scale-105 transition-all"
                              >
                                <i className="fas fa-download mr-1.5"></i> Download Extracted Image
                              </a>
                            </div>
                          )}

                          <button
                            onClick={() => setExtractedData(null)}
                            className="w-full py-2.5 bg-bgMain border border-borderSubtle text-textMuted hover:text-textMain font-bold text-xs rounded-xl transition-colors"
                          >
                            Extract Another Audio File
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: LIVE MIC INTERCEPT */}
                  {activeTab === 'liveMic' && (
                    <div className="flex flex-col gap-5">
                      <div className="bg-card border border-borderSubtle p-5 rounded-2xl flex flex-col items-center text-center">
                        <canvas ref={canvasRef} width={500} height={80} className="w-full h-20 mb-4 rounded-xl border border-borderSubtle bg-bgMain" />

                        <h4 className="text-base font-bold text-textMain mb-1">Live Acoustic Spectrum Interceptor</h4>
                        <p className="text-xs text-textMuted max-w-sm mb-5">
                          Listens through your device microphone for high-frequency acoustic pulses played from another speaker.
                        </p>

                        <button
                          onClick={toggleLiveMic}
                          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                            isListeningMic
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                              : 'bg-accent hover:bg-accent/90 text-white'
                          }`}
                        >
                          <i className={`fas ${isListeningMic ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                          {isListeningMic ? 'Stop Interceptor' : 'Activate Audio Interceptor'}
                        </button>

                        <p className="text-[11px] font-mono text-accent mt-3">
                          <i className="fas fa-terminal mr-1"></i> {liveMicStatus}
                        </p>
                      </div>

                      {/* Decoded Stream Box */}
                      <div className="bg-card border border-borderSubtle p-4 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Decoded Air Transmission</span>
                          {liveStreamText && (
                            <button
                              onClick={() => setLiveStreamText('')}
                              className="text-[10px] text-textMuted hover:text-textMain font-bold"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="min-h-[80px] p-4 bg-bgMain rounded-xl border border-borderSubtle font-mono text-xs text-accent tracking-wider break-words">
                          {liveStreamText || (
                            <span className="text-textMuted/40 italic">
                              {isListeningMic ? 'Listening for acoustic carrier tones in the room...' : 'Idle. Click "Activate Audio Interceptor" above to start.'}
                            </span>
                          )}
                        </div>
                      </div>
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
