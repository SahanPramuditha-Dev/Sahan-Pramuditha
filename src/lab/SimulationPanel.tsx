import type { PacketEvent } from '../engine/packet';

interface SimulationPanelProps {
  events: PacketEvent[];
  onClose: () => void;
}

export default function SimulationPanel({ events, onClose }: SimulationPanelProps) {
  if (events.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-card border-t border-borderSubtle flex flex-col z-20 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="h-8 bg-bgMain flex items-center justify-between px-4 border-b border-borderSubtle shrink-0">
        <span className="text-textMain text-sm font-bold flex items-center gap-2">
          <i className="fas fa-play-circle text-accent" /> Packet Trace Simulation
        </span>
        <button onClick={onClose} className="text-textMuted hover:text-textMain"><i className="fas fa-times" /></button>
      </div>
      
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
        {events.map((e, i) => (
          <div key={i} className="min-w-[160px] max-w-[200px] h-full bg-bgMain rounded-lg border border-borderSubtle p-2 text-xs flex flex-col relative shrink-0 shadow-sm">
            {/* Arrow line connecting to next */}
            {i < events.length - 1 && (
              <div className="absolute top-1/2 -right-4 w-4 border-t-2 border-dashed border-accent/50" />
            )}
            
            <div className="font-bold text-textMain mb-1 flex items-center gap-1">
              {e.action === 'DROP' && <i className="fas fa-times-circle text-red-500" />}
              {e.action === 'RX' && <i className="fas fa-arrow-circle-down text-green-500" />}
              {e.action === 'TX' && <i className="fas fa-arrow-circle-up text-blue-500" />}
              {e.action === 'ROUTE' && <i className="fas fa-route text-orange-500" />}
              {e.action === 'SWITCH' && <i className="fas fa-random text-purple-500" />}
              {(e.action === 'PROCESS' || e.action === 'ARP_LEARN') && <i className="fas fa-cog text-gray-400" />}
              <span className="truncate">{e.deviceName}</span>
            </div>
            
            {e.interfaceName && (
              <div className="text-textMuted font-mono text-[10px] mb-1">{e.interfaceName}</div>
            )}
            
            <div className="text-[10px] text-textMuted break-words line-clamp-3">
              {e.reason || e.summary}
            </div>
            
            <div className="mt-auto pt-2 text-[9px] font-mono text-accent truncate border-t border-borderSubtle/50">
              {e.frame.ethertype}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
