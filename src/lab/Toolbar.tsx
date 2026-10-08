import type { DeviceType } from '../engine/models';

interface ToolbarProps {
  onAddDevice: (type: DeviceType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExportPng: () => void;
  onClearAll: () => void;
  onSimulatePacket: () => void;
  onLoadScenario?: (name: string) => void;
  activeTool: 'select' | 'connect';
  onSetTool: (t: 'select' | 'connect') => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ENDPOINTS: { type: DeviceType; icon: string; color: string }[] = [
  { type: 'PC', icon: 'fa-desktop', color: 'text-blue-400' },
  { type: 'Laptop', icon: 'fa-laptop', color: 'text-sky-400' },
  { type: 'Server', icon: 'fa-server', color: 'text-purple-400' },
];

const INFRA: { type: DeviceType; icon: string; color: string }[] = [
  { type: 'Router', icon: 'fa-route', color: 'text-red-400' },
  { type: 'L2Switch', icon: 'fa-random', color: 'text-green-400' },
  { type: 'L3Switch', icon: 'fa-sitemap', color: 'text-teal-400' },
  { type: 'Firewall', icon: 'fa-shield-alt', color: 'text-orange-500' },
  { type: 'AccessPoint', icon: 'fa-wifi', color: 'text-yellow-400' },
  { type: 'Cloud', icon: 'fa-cloud', color: 'text-blue-300' },
];

const SERVERS: { type: DeviceType; icon: string; color: string }[] = [
  { type: 'DNS', icon: 'fa-globe', color: 'text-cyan-400' },
  { type: 'DHCP', icon: 'fa-network-wired', color: 'text-lime-400' },
  { type: 'Web', icon: 'fa-globe', color: 'text-pink-400' },
  { type: 'Mail', icon: 'fa-envelope', color: 'text-violet-400' },
];

export default function Toolbar(props: ToolbarProps) {
  return (
    <div className="w-[72px] h-full bg-card border-r border-borderSubtle flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto no-scrollbar z-10 shadow-lg">
      <div className="flex flex-col gap-2 w-full px-2 border-b border-borderSubtle pb-4">
        <button
          onClick={() => props.onSetTool('select')}
          className={`w-full h-10 rounded-lg flex items-center justify-center transition-colors ${props.activeTool === 'select' ? 'bg-accent/20 text-accent border border-accent/50' : 'text-textMuted hover:bg-bgMain'}`}
          title="Select (V)"
        >
          <i className="fas fa-mouse-pointer" />
        </button>
        <button
          onClick={() => props.onSetTool('connect')}
          className={`w-full h-10 rounded-lg flex items-center justify-center transition-colors ${props.activeTool === 'connect' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'text-textMuted hover:bg-bgMain'}`}
          title="Connect Cables (C)"
        >
          <i className="fas fa-plug" />
        </button>
      </div>

      <div className="flex flex-col gap-1 w-full px-2">
        <div className="text-[9px] font-bold text-textMuted uppercase text-center mb-1">Endpoints</div>
        {ENDPOINTS.map(d => (
          <button key={d.type} onClick={() => props.onAddDevice(d.type)} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-textMuted transition-colors group" title={`Add ${d.type}`}>
            <i className={`fas ${d.icon} group-hover:${d.color}`} />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1 w-full px-2 border-t border-borderSubtle pt-3">
        <div className="text-[9px] font-bold text-textMuted uppercase text-center mb-1">Infra</div>
        {INFRA.map(d => (
          <button key={d.type} onClick={() => props.onAddDevice(d.type)} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-textMuted transition-colors group" title={`Add ${d.type}`}>
            <i className={`fas ${d.icon} group-hover:${d.color}`} />
          </button>
        ))}
      </div>
      
      <div className="flex flex-col gap-1 w-full px-2 border-t border-borderSubtle pt-3">
        <div className="text-[9px] font-bold text-textMuted uppercase text-center mb-1">Servers</div>
        {SERVERS.map(d => (
          <button key={d.type} onClick={() => props.onAddDevice(d.type)} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-textMuted transition-colors group" title={`Add ${d.type}`}>
            <i className={`fas ${d.icon} group-hover:${d.color}`} />
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1 w-full px-2 border-t border-borderSubtle pt-3 pb-2 relative group">
        <button className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-textMuted transition-colors" title="Load Scenario">
          <i className="fas fa-folder-open" />
        </button>
        <div className="absolute bottom-12 left-16 w-48 bg-card border border-borderSubtle rounded-lg shadow-xl hidden group-hover:flex flex-col overflow-hidden z-50">
          <div className="text-xs font-bold text-textMuted p-2 bg-bgMain border-b border-borderSubtle">Load Scenario</div>
          <button onClick={() => props.onLoadScenario?.('Basic Office')} className="p-2 text-left text-sm text-textMain hover:bg-accent/20 hover:text-accent">Basic Office</button>
          <button onClick={() => props.onLoadScenario?.('Security Nightmare')} className="p-2 text-left text-sm text-textMain hover:bg-accent/20 hover:text-accent">Security Nightmare</button>
        </div>
        
        <button onClick={props.onUndo} disabled={!props.canUndo} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-textMuted disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
          <i className="fas fa-undo" />
        </button>
        <button onClick={props.onDelete} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-colors" title="Delete Selected (Del)">
          <i className="fas fa-trash-alt" />
        </button>
        <button onClick={props.onSave} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-textMuted transition-colors" title="Download JSON">
          <i className="fas fa-download" />
        </button>
        <button onClick={props.onLoad} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-bgMain text-accent transition-colors" title="Share via URL">
          <i className="fas fa-share-alt" />
        </button>
        <button onClick={props.onSimulatePacket} className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-green-500/20 text-green-400 transition-colors" title="Simulate Ping (PC to PC)">
          <i className="fas fa-play" />
        </button>
      </div>
    </div>
  );
}
