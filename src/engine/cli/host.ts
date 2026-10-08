import type { CmdResult } from './commands';
import type { NetworkDeviceState } from '../models';

export function handleHostCommand(device: NetworkDeviceState, raw: string): CmdResult {
  const [cmd, ...args] = raw.toLowerCase().trim().split(/\s+/);
  
  if (cmd === 'ipconfig') {
    const isAll = args.includes('/all');
    const iface = Object.values(device.interfaces)[0];
    if (!iface) return { output: 'No interfaces configured.' };
    
    let output = `\nWindows IP Configuration\n\nEthernet adapter Ethernet0:\n\n`;
    output += `   Connection-specific DNS Suffix  . : ${device.domainName || ''}\n`;
    output += `   IPv4 Address. . . . . . . . . . . : ${iface.ip || '0.0.0.0'}\n`;
    // Needs prefixToMask helper but simplify for now
    output += `   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n`;
    output += `   Default Gateway . . . . . . . . . : ${device.defaultGateway || '0.0.0.0'}\n`;
    
    if (isAll) {
      output += `   DNS Servers . . . . . . . . . . . : ${device.dnsServer || '0.0.0.0'}\n`;
      output += `   Physical Address. . . . . . . . . : ${iface.mac}\n`;
    }
    return { output };
  } else if (cmd === 'ping') {
    return { output: `\nPinging ${args[0]} with 32 bytes of data:\nReply from ${args[0]}: bytes=32 time<1ms TTL=128\nReply from ${args[0]}: bytes=32 time<1ms TTL=128\nReply from ${args[0]}: bytes=32 time<1ms TTL=128\nReply from ${args[0]}: bytes=32 time<1ms TTL=128\n` };
  } else if (cmd === 'cls') {
    return { output: '__CLEAR__' };
  } else if (cmd === 'help') {
    return { output: 'Commands: ipconfig, ping, tracert, arp -a, nslookup, cls, help' };
  }
  
  return { output: `'${cmd}' is not recognized as an internal or external command, operable program or batch file.` };
}
