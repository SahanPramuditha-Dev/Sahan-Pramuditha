import { useEffect, useRef, useState } from 'react';

interface AudioSpectrumPlayerProps {
  src: string;
  title?: string;
  badge?: string;
}

export default function AudioSpectrumPlayer({ src, title = "Sonic Audio Stream", badge = "Covert Audio" }: AudioSpectrumPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup Web Audio Analyser node when playback starts
  const initAudioContext = () => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.warn("Web Audio API visualizer init skipped/already connected", e);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    initAudioContext();
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.9;

          // Cyber electric gradient (cyan to cobalt blue)
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
          grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.85)');
          grad.addColorStop(1, 'rgba(96, 165, 250, 1.0)');

          ctx.fillStyle = grad;
          // Rounded top bars
          ctx.beginPath();
          const rx = x;
          const ry = height - barHeight;
          const rw = Math.max(2, barWidth - 2);
          const rh = barHeight;
          ctx.roundRect(rx, ry, rw, rh, [3, 3, 0, 0]);
          ctx.fill();

          // Glowing peak cap
          if (barHeight > 4) {
            ctx.fillStyle = '#93C5FD';
            ctx.fillRect(rx, ry - 1, rw, 1.5);
          }

          x += barWidth;
          if (x >= width) break;
        }
      } else {
        // Idle gentle waveform shimmer
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sliceWidth = width / 40;
        let x = 0;
        for (let i = 0; i < 40; i++) {
          const v = Math.sin(i * 0.3 + localOffset) * 6;
          const y = height / 2 + v;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        localOffset += 0.05;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Clean up Web Audio nodes
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-bgMain border border-borderSubtle rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex items-center justify-between text-left">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-textMain truncate">{title}</p>
          <p className="text-[10px] text-textMuted font-mono">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold">
          {badge}
        </span>
      </div>

      {/* Spectrum Visualizer Canvas */}
      <div className="relative w-full h-16 bg-card rounded-xl border border-borderSubtle overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={64}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bgMain/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Scrubber & Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-all shadow-md shrink-0 active:scale-95"
        >
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs ${isPlaying ? '' : 'ml-0.5'}`}></i>
        </button>

        {/* Progress Bar */}
        <div
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pos * duration;
          }}
          className="flex-1 h-2 bg-borderSubtle/50 rounded-full cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-accent transition-all duration-100 rounded-full"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <span className="text-[10px] font-mono text-textMuted shrink-0">
          {isPlaying ? 'STREAMING' : 'READY'}
        </span>
      </div>
    </div>
  );
}
