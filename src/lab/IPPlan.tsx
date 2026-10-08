import type { NetworkDeviceState, Topology } from '../engine/models';

interface IPPlanProps {
  topology: Topology;
}

export default function IPPlan({ topology }: IPPlanProps) {
  const devices = Object.values(topology.devices);
  const subnets = new Map<string, { network: string, devices: string[] }>();

  devices.forEach(d => {
    Object.values(d.interfaces).forEach(iface => {
      if (iface.ip && iface.subnetPrefix) {
        // Simplified subnet key
        const key = `${iface.ip}/${iface.subnetPrefix}`;
        if (!subnets.has(key)) subnets.set(key, { network: key, devices: [] });
        subnets.get(key)!.devices.push(`${d.hostname} (${iface.name})`);
      }
    });
  });

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-borderSubtle bg-bgMain shrink-0">
        <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
          <i className="fas fa-network-wired text-accent" /> IP Plan
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {Array.from(subnets.values()).length === 0 ? (
          <div className="text-textMuted text-sm text-center mt-10">No IP addresses configured yet.</div>
        ) : (
          Array.from(subnets.values()).map((sn, i) => (
            <div key={i} className="bg-bgMain p-3 rounded-lg border border-borderSubtle">
              <div className="font-mono text-sm text-accent font-bold mb-2">{sn.network}</div>
              <ul className="text-xs text-textMuted flex flex-col gap-1 list-disc pl-4">
                {sn.devices.map((dev, j) => <li key={j}>{dev}</li>)}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
