import { useState, useRef, useEffect } from 'react';
import type { NetworkDeviceState, Topology } from '../engine/models';
import { handleRouterCommand } from '../engine/cli/router';
import { handleSwitchCommand } from '../engine/cli/switch';
import { handleHostCommand } from '../engine/cli/host';

interface TerminalProps {
  device: NetworkDeviceState;
  onChange: (updated: NetworkDeviceState) => void;
  topology: Topology;
  onClose: () => void;
}

export default function Terminal({ device, onChange, topology, onClose }: TerminalProps) {
  const [lines, setLines] = useState<string[]>([device.bannerMotd || '']);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const getPrompt = () => {
    const h = device.hostname;
    const m = device.cliSession.mode;
    if (m === 'user_exec') return `${h}>`;
    if (m === 'privileged_exec') return `${h}#`;
    if (m === 'global_config') return `${h}(config)#`;
    if (m === 'interface_config') return `${h}(config-if)#`;
    if (m === 'vlan_config') return `${h}(config-vlan)#`;
    if (m === 'line_config') return `${h}(config-line)#`;
    return `${h}>`;
  };

  const handleEnter = () => {
    const cmd = input.trim();
    const newLines = [...lines, `${getPrompt()} ${cmd}`];
    
    if (cmd) {
      setHistory([cmd, ...history]);
      setHistIdx(-1);

      let res;
      if (['Router', 'Firewall'].includes(device.type)) {
        res = handleRouterCommand(device, cmd, topology);
      } else if (['L2Switch', 'L3Switch'].includes(device.type)) {
        res = handleSwitchCommand(device, cmd, topology);
      } else {
        res = handleHostCommand(device, cmd);
      }

      if (res.output === '__CLEAR__') {
        setLines([]);
      } else {
        if (res.output) newLines.push(res.output);
        setLines(newLines);
      }

      const updated = { ...device };
      if (res.newMode) updated.cliSession.mode = res.newMode;
      if (res.newContext !== undefined) updated.cliSession.contextLabel = res.newContext;
      if (res.mutate) res.mutate(updated);
      
      onChange(updated);
    } else {
      setLines(newLines);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEnter();
    if (e.key === 'ArrowUp') {
      if (histIdx < history.length - 1) {
        setInput(history[histIdx + 1]);
        setHistIdx(histIdx + 1);
      }
    }
    if (e.key === 'ArrowDown') {
      if (histIdx > 0) {
        setInput(history[histIdx - 1]);
        setHistIdx(histIdx - 1);
      } else if (histIdx === 0) {
        setInput('');
        setHistIdx(-1);
      }
    }
  };

  return (
    <div className="absolute inset-4 sm:inset-10 z-50 bg-black border border-borderSubtle rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="h-8 bg-gray-900 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
        <span className="text-gray-400 text-xs font-mono">{device.hostname} - Terminal</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white"><i className="fas fa-times" /></button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-green-400 font-mono text-sm" ref={scrollRef} onClick={() => document.getElementById('term-input')?.focus()}>
        {lines.map((l, i) => <div key={i} className="whitespace-pre-wrap">{l}</div>)}
        <div className="flex items-center">
          <span className="mr-2">{getPrompt()}</span>
          <input
            id="term-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-green-400 caret-green-400"
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
