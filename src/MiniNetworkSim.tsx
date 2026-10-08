import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DeviceType = 'Cloud' | 'Router' | 'Firewall' | 'Switch' | 'PC' | 'Proxy' | 'Mail';

interface Device {
  id: string;
  type: DeviceType;
  x: number;
  y: number;
}

interface Link {
  from: string;
  to: string;
}

const DEVICE_ICONS: Record<DeviceType, { icon: string; color: string }> = {
  Cloud: { icon: 'fas fa-cloud', color: 'text-blue-400' },
  Router: { icon: 'fas fa-route', color: 'text-red-400' },
  Firewall: { icon: 'fas fa-shield-alt', color: 'text-orange-500' },
  Switch: { icon: 'fas fa-random', color: 'text-green-400' },
  PC: { icon: 'fas fa-desktop', color: 'text-blue-300' },
  Proxy: { icon: 'fas fa-server', color: 'text-purple-400' },
  Mail: { icon: 'fas fa-envelope', color: 'text-purple-500' },
};

const THREATS = [
  { icon: 'fa-virus',            label: 'VIRUS',      color: '#ef4444' },
  { icon: 'fa-bug',              label: 'MALWARE',    color: '#f97316' },
  { icon: 'fa-user-ninja',       label: 'HACKER',     color: '#a855f7' },
  { icon: 'fa-skull-crossbones', label: 'ATTACKER',   color: '#dc2626' },
  { icon: 'fa-bomb',             label: 'EXPLOIT',    color: '#ef4444' },
  { icon: 'fa-biohazard',        label: 'RANSOMWARE', color: '#fb923c' },
];

const CHALLENGE_DEVICES: Device[] = [
  { id: 'cloud', type: 'Cloud', x: 10, y: 50 },
  { id: 'router', type: 'Router', x: 26, y: 50 },
  { id: 'fw', type: 'Firewall', x: 44, y: 50 },
  { id: 'sw1', type: 'Switch', x: 62, y: 26 },
  { id: 'sw2', type: 'Switch', x: 62, y: 74 },
  { id: 'pc1', type: 'PC', x: 84, y: 26 },
  { id: 'proxy', type: 'Proxy', x: 84, y: 62 },
  { id: 'mail', type: 'Mail', x: 84, y: 86 },
];

const INITIAL_CHALLENGE_LINKS: Link[] = [
  { from: 'cloud', to: 'router' },
  { from: 'router', to: 'sw1' }, // Flaw: Bypassing FW completely
  { from: 'sw1', to: 'pc1' },
  { from: 'sw1', to: 'proxy' }, // Flaw: Servers mixed with PC (No DMZ)
  { from: 'sw1', to: 'mail' },
];



const MiniNetworkSim = React.memo(function MiniNetworkSim({ onOpenFullEditor }: { onOpenFullEditor: () => void }) {
  const [mode, setMode] = useState<'challenge' | 'sandbox'>('challenge');
  const [sandboxDevices, setSandboxDevices] = useState<Device[]>([]);
  const [sandboxLinks, setSandboxLinks] = useState<Link[]>([]);
  
  const [challengeDevices, setChallengeDevices] = useState<Device[]>(CHALLENGE_DEVICES);
  const [challengeLinks, setChallengeLinks] = useState<Link[]>(INITIAL_CHALLENGE_LINKS);
  
  const devices = mode === 'challenge' ? challengeDevices : sandboxDevices;
  const links = mode === 'challenge' ? challengeLinks : sandboxLinks;

  const setDevices = (newDevices: Device[]) => { mode === 'challenge' ? setChallengeDevices(newDevices) : setSandboxDevices(newDevices); };
  const setLinks = (newLinks: Link[]) => { mode === 'challenge' ? setChallengeLinks(newLinks) : setSandboxLinks(newLinks); };
  
  const [selectedPalette, setSelectedPalette] = useState<DeviceType | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ msg: string; type: 'error' | 'success' | 'info' } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Dragging State
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragInfo = useRef<{ moved: boolean }>({ moved: false });

  // Dynamic Topology Analysis
  const adj = new Map<string, string[]>();
  devices.forEach(d => adj.set(d.id, []));
  links.forEach(l => {
    adj.get(l.from)?.push(l.to);
    adj.get(l.to)?.push(l.from);
  });

  const findPaths = (start: string, target: string) => {
    const paths: string[][] = [];
    const dfs = (current: string, path: string[], visited: Set<string>) => {
      if (current === target) {
        paths.push([...path, current]);
        return;
      }
      const neighbors = adj.get(current) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          const newVisited = new Set(visited);
          newVisited.add(n);
          dfs(n, [...path, current], newVisited);
        }
      }
    };
    dfs(start, [], new Set([start]));
    return paths;
  };

  const getPathStatus = (paths: string[][]) => {
    if (paths.length === 0) return 'offline';
    if (paths.some(p => !p.includes('fw'))) return 'compromised';
    return 'secured';
  };

  const pcPaths = findPaths('cloud', 'pc1');
  const proxyPaths = findPaths('cloud', 'proxy');
  const mailPaths = findPaths('cloud', 'mail');

  const pcStatus = getPathStatus(pcPaths);
  const proxyStatus = getPathStatus(proxyPaths);
  const mailStatus = getPathStatus(mailPaths);

  const compromisedPaths: string[][] = [];
  const securedPaths: string[][] = [];
  const fwBlockedPaths: string[][] = []; // Paths from cloud to FW (for blocked animations)

  if (mode === 'challenge') {
    [pcPaths, proxyPaths, mailPaths].forEach(paths => {
      const status = getPathStatus(paths);
      if (status === 'compromised') {
        compromisedPaths.push(...paths.filter(p => !p.includes('fw')));
      } else if (status === 'secured') {
        securedPaths.push(...paths);
      }
    });

  }

  // Alerts Evaluation
  const alerts: { id: string, msg: string, type: 'error'|'success'|'warning'|'info' }[] = [];
  
  if (mode === 'challenge') {
    if (pcStatus === 'compromised' || proxyStatus === 'compromised' || mailStatus === 'compromised') {
      alerts.push({ id: 'compromised', msg: 'FIREWALL BYPASSED! NETWORK UNDER ATTACK', type: 'error' });
    } else {
      if (pcStatus === 'secured' && proxyStatus === 'secured' && mailStatus === 'secured') {
        const pcSwitches = pcPaths.map(p => p[p.length - 2]);
        const proxySwitches = proxyPaths.map(p => p[p.length - 2]);
        const mailSwitches = mailPaths.map(p => p[p.length - 2]);
        
        const pcSharesSwitch = pcSwitches.some(sw => proxySwitches.includes(sw) || mailSwitches.includes(sw));
        
        if (pcSharesSwitch) {
          alerts.push({ id: 'flat', msg: 'FLAT NETWORK: PC secured from outside, but vulnerable to compromised servers! Use a DMZ.', type: 'warning' });
        } else {
          alerts.push({ id: 'dmz', msg: 'DMZ ARCHITECTURE SECURED! 10/10 PERFECT.', type: 'success' });
        }
      } else if (pcStatus === 'secured' || proxyStatus === 'secured' || mailStatus === 'secured') {
        alerts.push({ id: 'partial', msg: 'PARTIAL SECURITY: Data is flowing to secured devices! Keep connecting the rest.', type: 'info' });
      } else {
        alerts.push({ id: 'hint', msg: 'Route traffic from Cloud -> Router -> Firewall -> Switches to secure the network.', type: 'info' });
      }
    }
  }

  const isLinkInPaths = (l: Link, paths: string[][]) => {
    return paths.some(p => {
      for (let i = 0; i < p.length - 1; i++) {
        if ((p[i] === l.from && p[i+1] === l.to) || (p[i] === l.to && p[i+1] === l.from)) return true;
      }
      return false;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (selectedPalette && canvasRef.current && mode === 'sandbox') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDevices([...devices, { id: Math.random().toString(36).substr(2, 9), type: selectedPalette, x, y }]);
      setSelectedPalette(null);
    }
  };

  const handleDeviceClick = (_e: React.MouseEvent | React.PointerEvent, id: string) => {
    if (linkingFrom) {
      if (linkingFrom !== id) {
        const exists = links.find(l => (l.from === linkingFrom && l.to === id) || (l.to === linkingFrom && l.from === id));
        if (exists) {
          setLinks(links.filter(l => l !== exists));
        } else {
          setLinks([...links, { from: linkingFrom, to: id }]);
        }
      }
      setLinkingFrom(null);
    } else {
      setLinkingFrom(id);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDraggingNode(id);
    dragInfo.current.moved = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNode && canvasRef.current) {
      dragInfo.current.moved = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
      setDevices(devices.map(d => d.id === draggingNode ? { ...d, x, y } : d));
    }
  };

  const handlePointerUp = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (draggingNode) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingNode(null);
      if (!dragInfo.current.moved) {
        handleDeviceClick(e, id);
      }
    }
  };

  const resetLab = () => {
    if (mode === 'challenge') {
      setChallengeDevices(CHALLENGE_DEVICES);
      setChallengeLinks(INITIAL_CHALLENGE_LINKS);
    } else {
      setSandboxDevices([]);
      setSandboxLinks([]);
    }
    setLinkingFrom(null);
  };

  // Dynamic Path Particle Component
  // Threat particle with label — travels along a compromised path
  const ThreatPathParticle = React.memo(({ pathIds, threat, duration, delay = 0, isBlocked = false }: any) => {
    const pathKey = pathIds.join('-');
    const { animProps, transitionProps, initialProps, pathNodes } = useMemo(() => {
      const pNodes = pathIds.map((id: string) => devices.find(d => d.id === id)).filter(Boolean);
      if (pNodes.length < 2) return { pathNodes: [], animProps: null, transitionProps: null, initialProps: null };
      
      const xCoords = pNodes.map((n: any) => `${n.x}%`);
      const yCoords = pNodes.map((n: any) => `${n.y}%`);
      const len = xCoords.length;
      
      const anim = isBlocked ? {
        left: xCoords, top: yCoords,
        opacity: [...Array(len - 1).fill(1), 0],
        scale:   [...Array(len - 1).fill(1), 2],
        rotate:  [...Array(len - 1).fill(0), 180],
      } : {
        // Duplicate the last coordinate so it stays there for a moment before repeating
        left: [...xCoords, xCoords[len - 1]], 
        top: [...yCoords, yCoords[len - 1]],
        opacity: [...Array(len).fill(1), 0],
        scale:   [...Array(len).fill(1), 1.5],
      };
      
      // Calculate times to ensure Framer Motion interpolates correctly across the arrays
      const times = anim.left.map((_: any, i: number) => i / (anim.left.length - 1));
      (anim as any).times = times;

      const trans = { duration, repeat: Infinity, delay, ease: 'linear' as const };
      const init = { left: anim.left[0], top: anim.top[0], opacity: 0, scale: 0.5 };
      
      return { pathNodes: pNodes, animProps: anim, transitionProps: trans, initialProps: init };
    }, [pathKey, isBlocked, duration, delay]);

    if (!animProps || pathNodes.length < 2) return null;

    return (
      <motion.div
        initial={initialProps}
        animate={animProps}
        transition={transitionProps}
        className="absolute z-30 pointer-events-none flex items-center justify-center"
        style={{ transform: 'translate(-50%, -50%)', color: threat.color, filter: `drop-shadow(0 0 5px ${threat.color})` }}
      >
        <i className={`fas ${threat.icon} text-lg`} />
      </motion.div>
    );
  }, (prev, next) => prev.pathIds.join('-') === next.pathIds.join('-') && prev.isBlocked === next.isBlocked);

  // Simple green dot for secured data packets
  const SecurePathParticle = React.memo(({ pathIds, duration, delay = 0 }: any) => {
    const pathKey = pathIds.join('-');
    const { animProps, transitionProps, initialProps, pathNodes } = useMemo(() => {
      const pNodes = pathIds.map((id: string) => devices.find(d => d.id === id)).filter(Boolean);
      if (pNodes.length < 2) return { pathNodes: [], animProps: null, transitionProps: null, initialProps: null };
      
      const xCoords = pNodes.map((n: any) => `${n.x}%`);
      const yCoords = pNodes.map((n: any) => `${n.y}%`);
      const len = xCoords.length;
      
      const anim = {
        left: [...xCoords, xCoords[len - 1]], 
        top: [...yCoords, yCoords[len - 1]],
        opacity: [...Array(len).fill(0.8), 0],
        scale:   [...Array(len).fill(1), 0.5],
      };

      const times = anim.left.map((_: any, i: number) => i / (anim.left.length - 1));
      (anim as any).times = times;

      const trans = { duration, repeat: Infinity, delay, ease: 'linear' as const };
      const init = { left: anim.left[0], top: anim.top[0], opacity: 0, scale: 0.5 };
      return { pathNodes: pNodes, animProps: anim, transitionProps: trans, initialProps: init };
    }, [pathKey, duration, delay]);

    if (!animProps || pathNodes.length < 2) return null;

    return (
      <motion.div
        initial={initialProps}
        animate={animProps}
        transition={transitionProps}
        className="absolute z-30 pointer-events-none text-green-400 text-[8px] drop-shadow-md"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <i className="fas fa-circle" />
      </motion.div>
    );
  }, (prev, next) => prev.pathIds.join('-') === next.pathIds.join('-'));

  return (
    <div className="w-full h-full flex-1 flex flex-col bg-bgMain p-4 relative">
      <style>{`
        @keyframes dashFlow { to { stroke-dashoffset: -20; } }
        .cable-flow { animation: dashFlow 1s linear infinite; }
        .cable-flow-fast { animation: dashFlow 0.3s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-sm font-bold text-textMain flex items-center gap-2 z-20">
          <i className="fas fa-network-wired text-accent"></i> Mini Network Designer
        </h3>
        
        {/* Mode Toggle */}
        <div className="flex items-center bg-card border border-borderSubtle rounded-lg p-0.5 z-20">
          <button 
            onClick={() => { setMode('challenge'); setLinkingFrom(null); }}
            className={`text-[10px] px-3 py-1 font-bold rounded-md transition-colors ${mode === 'challenge' ? 'bg-accent/10 text-accent' : 'text-textMuted hover:text-textMain'}`}
          >
            Challenge
          </button>
          <button 
            onClick={() => { setMode('sandbox'); setLinkingFrom(null); }}
            className={`text-[10px] px-3 py-1 font-bold rounded-md transition-colors ${mode === 'sandbox' ? 'bg-accent/10 text-accent' : 'text-textMuted hover:text-textMain'}`}
          >
            Sandbox
          </button>
        </div>

        <div className="flex gap-2 z-20">
          <button onClick={() => {}} className="bg-accent/10 hover:bg-accent/20 text-accent text-[10px] px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1">
            Check <i className="fas fa-play text-[8px]"></i>
          </button>
          <button onClick={resetLab} className="bg-card hover:bg-black/10 dark:hover:bg-white/10 text-textMuted w-7 h-7 flex items-center justify-center rounded-full border border-borderSubtle transition-colors">
            <i className="fas fa-undo text-[10px]"></i>
          </button>
        </div>
      </div>

      {/* Dynamic Alerts */}
      <div className="shrink-0 mb-3 space-y-2">
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div 
              key={alert.id}
              initial={{ y: -10, opacity: 0, height: 0 }} 
              animate={{ y: 0, opacity: 1, height: 'auto' }} 
              exit={{ y: -10, opacity: 0, height: 0 }}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 drop-shadow-sm uppercase ${
                alert.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 tracking-wider' :
                alert.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 tracking-widest' :
                alert.type === 'warning' ? 'bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 tracking-wide' :
                'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 tracking-wide'
              }`}
            >
              <i className={`fas ${
                alert.type === 'error' ? 'fa-exclamation-triangle animate-pulse' : 
                alert.type === 'success' ? 'fa-shield-alt' : 
                alert.type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'
              } text-base`}></i> 
              {alert.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        onClick={handleCanvasClick}
        onPointerMove={handlePointerMove}
        className={`flex-1 relative z-10 rounded-xl bg-card overflow-hidden border-2 transition-all duration-500 cursor-crosshair min-h-[400px] ${
          alerts.some(a => a.type === 'error') ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 
          alerts.some(a => a.type === 'success') ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 
          'border-borderSubtle'
        }`}
        style={{
          backgroundImage: 'radial-gradient(rgba(var(--accent-color), 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {mode === 'sandbox' && devices.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-textMuted/40 font-bold text-sm tracking-widest uppercase">
              Click anywhere to place device
            </span>
          </div>
        )}

        <style>{`
          @keyframes dashFlow {
            to { stroke-dashoffset: -20; }
          }
        `}</style>

        {/* ── Network Zones (Visual separation for LAN/DMZ) ── */}
        <div className="absolute inset-0 pointer-events-none z-0 p-4">
          <div className="absolute top-[5%] bottom-[5%] left-[2%] w-[32%] bg-blue-500/5 border border-blue-500/10 rounded-2xl flex justify-start items-start p-4 opacity-70">
            <span className="text-blue-500/60 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-globe"></i> Internet
            </span>
          </div>
          <div className="absolute top-[5%] left-[54%] right-[2%] h-[42%] bg-green-500/5 border border-green-500/10 rounded-2xl flex justify-start items-start p-4 opacity-70">
            <span className="text-green-500/60 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-network-wired"></i> LAN (Secure)
            </span>
          </div>
          <div className="absolute bottom-[5%] left-[54%] right-[2%] h-[42%] bg-orange-500/5 border border-orange-500/10 rounded-2xl flex justify-start items-end p-4 opacity-70">
            <span className="text-orange-500/60 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-shield-alt"></i> DMZ (Public Facing)
            </span>
          </div>
        </div>

        {/* ── Red attack vignette overlay when network is compromised ── */}
        {mode === 'challenge' && compromisedPaths.length > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-[1] rounded-xl"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              background:
                'radial-gradient(ellipse at 5% 50%, rgba(239,68,68,0.22) 0%, rgba(239,68,68,0.06) 45%, transparent 75%)',
            }}
          />
        )}
        {/* ── Threat particles travelling along compromised paths (1 per path) ── */}
        {compromisedPaths.map((path, pathIdx) => (
          <ThreatPathParticle
            key={`comp-${pathIdx}`}
            pathIds={path}
            threat={THREATS[pathIdx % THREATS.length]}
            duration={path.length * 0.8}
            delay={pathIdx * 0.3}
          />
        ))}


        {/* ── Secure data dots on protected paths ── */}
        {securedPaths.map((path, idx) => (
          <SecurePathParticle
            key={`sec-${idx}`}
            pathIds={path}
            duration={path.length * 1.0}
            delay={idx * 0.6}
          />
        ))}

        {/* SVG Cables Overlay */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-15 drop-shadow-sm">
          {links.map((l, i) => {
            const sDev = devices.find(d => d.id === l.from);
            const tDev = devices.find(d => d.id === l.to);
            if (!sDev || !tDev) return null;

            const sX = sDev.x;
            const sY = sDev.y;
            const tX = tDev.x;
            const tY = tDev.y;

            let strokeColor = "#94a3b8"; // Default slate-400 (faded grey)
            let animationClass = "";
            let isAnimating = false;

            if (mode === 'challenge') {
              const isCompromisedLink = isLinkInPaths(l, compromisedPaths);
              const isSecuredLink = isLinkInPaths(l, securedPaths);

              if (isCompromisedLink) {
                strokeColor = "#ef4444"; // Red
                animationClass = "cable-flow-fast";
                isAnimating = true;
              } else if (isSecuredLink) {
                strokeColor = "#22c55e"; // Green internal
                animationClass = "cable-flow";
                isAnimating = true;
              }
            }

            // Smooth cubic bezier curve (horizontal priority)
            const dx = Math.abs(tX - sX) * 0.5;
            const pathD = `M ${sX} ${sY} C ${sX + dx} ${sY}, ${tX - dx} ${tY}, ${tX} ${tY}`;

            const isCompromisedLink = mode === 'challenge' && isLinkInPaths(l, compromisedPaths);

            return (
              <path 
                key={i} 
                d={pathD}
                stroke={strokeColor} 
                strokeWidth={isAnimating ? "3" : "2"} 
                strokeDasharray="6 6"
                className={animationClass}
                style={{ animation: isAnimating ? (isCompromisedLink ? 'dashFlow 0.5s linear infinite' : 'dashFlow 1s linear infinite') : 'none' }}
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* Devices Overlay */}
        {devices.map((d) => (
          <div 
            key={d.id} 
            className={`absolute z-20 group ${draggingNode === d.id ? 'opacity-90' : ''}`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
          >
            {/* Security Effects */}
            {d.type === 'Firewall' && mode === 'challenge' && compromisedPaths.length > 0 && (
              <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping z-0 pointer-events-none"></div>
            )}
            {d.type === 'Firewall' && mode === 'challenge' && securedPaths.length > 0 && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} 
                transition={{ repeat: Infinity, duration: 2 }} 
                className="absolute -inset-4 border-2 border-green-500/50 rounded-full z-0 pointer-events-none"
              />
            )}
            {['PC', 'Proxy', 'Mail'].includes(d.type) && mode === 'challenge' && compromisedPaths.some(p => p.includes(d.id)) && (
              <div className="absolute -inset-1 bg-red-500/30 rounded-lg animate-pulse z-0 pointer-events-none"></div>
            )}

            <div 
              id={`node-${d.id}`}
              onPointerDown={(e) => handlePointerDown(e, d.id)}
              onPointerUp={(e) => handlePointerUp(e, d.id)}
              className={`peer relative w-11 h-11 rounded-xl bg-card border-2 flex items-center justify-center text-xl z-20 pointer-events-auto transition-all cursor-pointer ${
                draggingNode === d.id ? 'border-accent shadow-[0_0_25px_rgba(var(--accent-color),0.8)] scale-110' :
                linkingFrom === d.id ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-110' : 
                (mode === 'challenge' && compromisedPaths.some(p => p.includes(d.id)) && ['PC', 'Proxy', 'Mail'].includes(d.type)) ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                (mode === 'challenge' && securedPaths.length > 0 && d.type === 'Firewall') ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' :
                (mode === 'challenge' && d.type === 'Firewall' && !links.some(l => l.from === d.id || l.to === d.id)) ? 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] animate-pulse' :
                'border-borderSubtle/60 hover:border-accent hover:shadow-[0_0_15px_rgba(var(--accent-color),0.3)] shadow-sm'
              }`}
            >
              <i className={`${DEVICE_ICONS[d.type].icon} ${DEVICE_ICONS[d.type].color} drop-shadow-sm pointer-events-none`}></i>
            </div>
            
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black text-textMain/70 uppercase tracking-widest pointer-events-none transition-colors peer-hover:text-textMain bg-bgMain/80 px-1 rounded-sm backdrop-blur-sm">
              {d.type}
            </div>

            {/* Firewall Educational Tooltip */}
            {d.type === 'Firewall' && (
              <div className="absolute bottom-full mb-6 w-56 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] p-3 rounded-lg shadow-xl opacity-0 invisible peer-hover:opacity-100 peer-hover:visible pointer-events-none transition-all duration-300 z-50 left-1/2 -translate-x-1/2 text-left border border-gray-700/50">
                <div className="font-bold border-b border-gray-700 pb-1.5 mb-1.5 text-orange-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <i className="fas fa-shield-alt"></i> Traffic Rules
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-green-400 flex items-center gap-1"><i className="fas fa-check text-[8px] w-3"></i> LAN → Internet</div>
                  <div className="text-green-400 flex items-center gap-1"><i className="fas fa-check text-[8px] w-3"></i> Internet → DMZ</div>
                  <div className="text-red-400 flex items-center gap-1"><i className="fas fa-times text-[8px] w-3"></i> Internet → LAN</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Feedback Bar */}
      <div className="min-h-[2rem] flex items-center justify-center mt-2 shrink-0">
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div 
              key={feedback.msg}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-[11px] px-3 py-1 rounded font-mono shadow-sm ${
                feedback.type === 'error' ? 'text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/30' : 
                feedback.type === 'success' ? 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 
                'text-textMuted bg-card border border-borderSubtle'
              }`}
            >
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Palette & Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-borderSubtle pt-3 shrink-0">
        <div className="flex flex-wrap gap-1.5 flex-1 transition-opacity">
          {mode === 'sandbox' && (Object.keys(DEVICE_ICONS) as DeviceType[]).map(type => (
            <button 
              key={type}
              onClick={() => { setSelectedPalette(type); setLinkingFrom(null); setFeedback({ msg: `Click anywhere on the canvas to place ${type}`, type: 'info' }); }}
              className={`group relative h-7 px-2 rounded-md bg-card border flex items-center justify-center gap-1.5 transition-all duration-300 ${
                selectedPalette === type ? 'border-accent shadow-[0_0_10px_rgba(var(--accent-color),0.2)] bg-accent/5' : 'border-borderSubtle hover:border-textMuted hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <i className={`${DEVICE_ICONS[type].icon} ${DEVICE_ICONS[type].color} text-[10px] transition-transform ${selectedPalette === type ? 'scale-110' : 'group-hover:scale-110'}`}></i>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedPalette === type ? 'text-accent' : 'text-textMuted group-hover:text-textMain'} transition-colors hidden sm:block`}>{type}</span>
            </button>
          ))}
        </div>
        
        <button onClick={onOpenFullEditor} className="text-[10px] font-bold text-bgMain bg-textMain hover:bg-accent px-3 py-1.5 rounded-full flex items-center gap-1 z-20 shrink-0 ml-4 transition-colors">
          Open Full Lab <i className="fas fa-external-link-alt ml-1"></i>
        </button>
      </div>
    </div>
  );
});

export default MiniNetworkSim;
