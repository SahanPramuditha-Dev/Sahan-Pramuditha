import { useState } from 'react';
import type { NetworkDeviceState } from '../engine/models';

interface PropertiesPanelProps {
  device: NetworkDeviceState | null;
  onChange: (updated: NetworkDeviceState) => void;
  onOpenTerminal: () => void;
}

export default function PropertiesPanel({ device, onChange, onOpenTerminal }: PropertiesPanelProps) {
  const [tab, setTab] = useState<'config' | 'interfaces' | 'routes'>('config');

  if (!device) {
    return (
      <div className="w-80 bg-card border-l border-borderSubtle flex items-center justify-center p-6 shrink-0 h-full text-textMuted text-sm font-bold text-center">
        Select a device on the canvas to configure it.
      </div>
    );
  }

  const update = (partial: Partial<NetworkDeviceState>) => {
    onChange({ ...device, ...partial });
  };

  return (
    <div className="w-80 bg-card border-l border-borderSubtle flex flex-col shrink-0 h-full overflow-hidden">
      <div className="p-4 border-b border-borderSubtle bg-bgMain">
        <div className="flex items-center gap-3 mb-3">
          <i className="fas fa-server text-accent text-xl" />
          <input
            value={device.hostname}
            onChange={e => update({ hostname: e.target.value })}
            className="bg-transparent font-bold text-lg text-textMain outline-none w-full border-b border-transparent focus:border-accent"
          />
        </div>
        <div className="flex gap-1 bg-card rounded-lg p-1 border border-borderSubtle">
          <button onClick={() => setTab('config')} className={`flex-1 text-xs py-1.5 rounded-md font-bold ${tab === 'config' ? 'bg-bgMain text-textMain shadow' : 'text-textMuted hover:text-textMain'}`}>Config</button>
          <button onClick={() => setTab('interfaces')} className={`flex-1 text-xs py-1.5 rounded-md font-bold ${tab === 'interfaces' ? 'bg-bgMain text-textMain shadow' : 'text-textMuted hover:text-textMain'}`}>Interfaces</button>
          {['Router', 'L3Switch', 'Firewall'].includes(device.type) && (
            <button onClick={() => setTab('routes')} className={`flex-1 text-xs py-1.5 rounded-md font-bold ${tab === 'routes' ? 'bg-bgMain text-textMain shadow' : 'text-textMuted hover:text-textMain'}`}>Routes</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {tab === 'config' && (
          <div className="flex flex-col gap-3">
            {['PC', 'Server', 'Laptop'].includes(device.type) ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={device.ipDhcp} onChange={e => update({ ipDhcp: e.target.checked })} id="dhcp" />
                  <label htmlFor="dhcp" className="text-sm font-bold text-textMain">DHCP Client</label>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-textMuted">IP Address</label>
                  <input disabled={device.ipDhcp} value={Object.values(device.interfaces)[0]?.ip || ''} onChange={e => {
                    const iface = Object.values(device.interfaces)[0];
                    if (iface) update({ interfaces: { ...device.interfaces, [iface.name]: { ...iface, ip: e.target.value } } });
                  }} className="bg-bgMain border border-borderSubtle rounded px-2 py-1.5 text-sm font-mono disabled:opacity-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-textMuted">Subnet Mask</label>
                  <input disabled={device.ipDhcp} value={Object.values(device.interfaces)[0]?.subnetPrefix ? '255.255.255.0' : ''} readOnly className="bg-bgMain border border-borderSubtle rounded px-2 py-1.5 text-sm font-mono disabled:opacity-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-textMuted">Gateway</label>
                  <input disabled={device.ipDhcp} value={device.defaultGateway || ''} onChange={e => update({ defaultGateway: e.target.value })} className="bg-bgMain border border-borderSubtle rounded px-2 py-1.5 text-sm font-mono disabled:opacity-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-textMuted">DNS Server</label>
                  <input disabled={device.ipDhcp} value={device.dnsServer || ''} onChange={e => update({ dnsServer: e.target.value })} className="bg-bgMain border border-borderSubtle rounded px-2 py-1.5 text-sm font-mono disabled:opacity-50" />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-textMuted text-center py-2">Use Terminal for advanced config.</div>
                {['Router', 'Server'].includes(device.type) && (
                  <div className="bg-bgMain p-3 rounded-lg border border-borderSubtle flex flex-col gap-2">
                    <label className="flex justify-between items-center cursor-pointer">
                      <span className="text-sm font-bold text-textMain flex items-center gap-2"><i className="fas fa-network-wired text-accent" /> DHCP Server</span>
                      <input type="checkbox" checked={!!device.services?.dhcp} onChange={e => update({ services: { ...device.services, dhcp: e.target.checked } })} />
                    </label>
                    {device.services?.dhcp && (
                      <div className="text-xs text-textMuted mt-1">
                        Running on all connected subnets
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'interfaces' && (
          <div className="flex flex-col gap-3">
            {Object.values(device.interfaces).map(iface => (
              <div key={iface.name} className="bg-bgMain p-3 rounded-lg border border-borderSubtle">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-textMain">{iface.name}</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span className="text-xs font-bold text-textMuted">Up</span>
                    <input type="checkbox" checked={iface.up} onChange={e => update({ interfaces: { ...device.interfaces, [iface.name]: { ...iface, up: e.target.checked } } })} />
                  </label>
                </div>
                <div className="text-xs font-mono text-textMuted">{iface.mac}</div>
                {iface.ip && <div className="text-xs font-mono text-accent mt-1">{iface.ip} /{iface.subnetPrefix}</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'routes' && (
          <div className="flex flex-col gap-3">
            {device.routingTable.map((r, i) => (
              <div key={i} className="bg-bgMain p-2 rounded border border-borderSubtle flex justify-between text-xs font-mono">
                <span>{r.type === 'connected' ? 'C' : 'S'} {r.destination}/{r.prefix}</span>
                <span className="text-textMuted">{r.nextHop || r.interfaceName}</span>
              </div>
            ))}
            <div className="text-xs text-center text-textMuted mt-2">Add routes via Terminal</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-borderSubtle bg-bgMain mt-auto">
        <button onClick={onOpenTerminal} className="w-full py-2 bg-textMain text-bgMain font-bold rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
          <i className="fas fa-terminal" /> Open CLI Terminal
        </button>
      </div>
    </div>
  );
}
