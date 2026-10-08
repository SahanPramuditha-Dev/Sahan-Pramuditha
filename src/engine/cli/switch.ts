import type { CmdResult } from './commands';
import type { NetworkDeviceState, Topology } from '../models';

export function handleSwitchCommand(device: NetworkDeviceState, raw: string, topology: Topology): CmdResult {
  const [cmd, ...args] = raw.toLowerCase().trim().split(/\s+/);
  
  if (device.cliSession.mode === 'global_config') {
    if (cmd === 'vlan') {
      const vlanId = parseInt(args[0], 10);
      if (isNaN(vlanId)) return { output: '% Invalid input detected at \'^\' marker.' };
      return { 
        output: '', 
        newMode: 'vlan_config',
        newContext: args[0],
        mutate: (d) => {
          if (!d.vlans.find(v => v.id === vlanId)) {
            d.vlans.push({ id: vlanId, name: `VLAN${vlanId}`, active: true });
          }
        }
      };
    }
  } else if (device.cliSession.mode === 'vlan_config') {
    if (cmd === 'name') {
      return {
        output: '',
        mutate: (d) => {
          const v = d.vlans.find(v => v.id.toString() === d.cliSession.contextLabel);
          if (v) v.name = args[0];
        }
      };
    } else if (cmd === 'exit') {
      return { output: '', newMode: 'global_config', newContext: '' };
    }
  } else if (device.cliSession.mode === 'privileged_exec') {
    if (cmd === 'show' && args[0] === 'vlan' && args[1] === 'brief') {
      const lines = ['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------'];
      for (const vlan of device.vlans) {
        const ports = Object.entries(device.interfaces)
          .filter(([_, i]) => i.switchport?.mode === 'access' && i.switchport.vlan === vlan.id)
          .map(([name, _]) => name).join(', ');
        lines.push(`${vlan.id.toString().padEnd(4)} ${vlan.name.padEnd(32)} active    ${ports}`);
      }
      return { output: lines.join('\n') };
    } else if (cmd === 'show' && args[0] === 'mac' && args[1] === 'address-table') {
      const lines = ['          Mac Address Table', '-------------------------------------------', '', 'Vlan    Mac Address       Type        Ports', '----    -----------       --------    -----'];
      for (const entry of device.macTable) {
        lines.push(`${entry.vlan.toString().padEnd(4)}    ${entry.mac}    DYNAMIC     ${entry.interfaceName}`);
      }
      return { output: lines.join('\n') };
    }
  }

  // Fallback to router commands
  return { output: '% Command not supported' };
}
