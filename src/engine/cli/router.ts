/**
 * Router CLI command handler – Cisco IOS-style privileged/config command set.
 */

import type { NetworkDeviceState, InterfaceConfig, Route } from '../models';
import type { Topology } from '../models';
import type { CmdResult } from './commands';
import {
  COMMAND_NOT_SUPPORTED,
  INVALID_INPUT,
  INVALID_INPUT_CONFIG,
  maskToPrefix,
  prefixToMask,
  networkAddress,
  col,
} from './commands';
import { expandAbbrev } from './parser';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function prompt(device: NetworkDeviceState): string {
  const h = device.hostname;
  switch (device.cliSession.mode) {
    case 'user_exec':
      return `${h}>`;
    case 'privileged_exec':
      return `${h}#`;
    case 'global_config':
      return `${h}(config)#`;
    case 'interface_config':
      return `${h}(config-if)#`;
    case 'line_config':
      return `${h}(config-line)#`;
    case 'vlan_config':
      return `${h}(config-vlan)#`;
    default:
      return `${h}#`;
  }
}

/** Resolve an interface by abbreviated name (gi0/0, Gi0/0, GigabitEthernet0/0…). */
function resolveInterface(
  device: NetworkDeviceState,
  name: string
): InterfaceConfig | undefined {
  // Direct match
  if (device.interfaces[name]) return device.interfaces[name];
  // Case-insensitive
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(device.interfaces)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

/** Build the "show ip interface brief" table. */
function showIpIntBrief(device: NetworkDeviceState): string {
  const header =
    col('Interface', 23) +
    col('IP-Address', 16) +
    col('OK?', 5) +
    col('Method', 8) +
    col('Status', 22) +
    'Protocol';
  const rows = Object.values(device.interfaces).map((iface) => {
    const ip = iface.ip ?? 'unassigned';
    const ok = iface.ip ? 'YES' : 'NO ';
    const method = iface.ip ? 'manual' : 'unset ';
    const status = iface.up ? 'up' : 'administratively down';
    const protocol = iface.up && iface.ip ? 'up' : 'down';
    return (
      col(iface.name, 23) +
      col(ip, 16) +
      col(ok, 5) +
      col(method, 8) +
      col(status, 22) +
      protocol
    );
  });
  return [header, ...rows].join('\n');
}

/** Build the "show interfaces" output. */
function showInterfaces(device: NetworkDeviceState): string {
  return Object.values(device.interfaces)
    .map((iface) => {
      const status = iface.up
        ? 'GigabitEthernet is up, line protocol is up'
        : 'GigabitEthernet is administratively down, line protocol is down';
      const ipLine = iface.ip
        ? `  Internet address is ${iface.ip}/${iface.subnetPrefix ?? '?'}`
        : '  Internet address is not configured';
      const descLine = iface.description
        ? `  Description: ${iface.description}`
        : '';
      return [
        `${iface.name} ${status}`,
        `  Hardware is Gigabit Ethernet, address is ${iface.mac}`,
        ipLine,
        descLine,
        `  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec`,
        `     reliability 255/255, txload 1/255, rxload 1/255`,
        `  Encapsulation ARPA, loopback not set`,
        `  Full-duplex, 1000Mb/s, media type is RJ45`,
        `  5 minute input rate 0 bits/sec, 0 packets/sec`,
        `  5 minute output rate 0 bits/sec, 0 packets/sec`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

/** Build the "show ip route" output. */
function showIpRoute(device: NetworkDeviceState): string {
  const legend = [
    'Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP',
    '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
    '       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2',
    '       E1 - OSPF external type 1, E2 - OSPF external type 2',
    '       * - candidate default, U - per-user static route',
    '',
    'Gateway of last resort is not set',
    '',
  ];

  const routes = device.routingTable.map((r) => {
    const typeCode =
      r.type === 'connected'
        ? 'C'
        : r.type === 'static'
        ? 'S'
        : r.type === 'ospf'
        ? 'O'
        : r.type === 'rip'
        ? 'R'
        : r.type === 'default'
        ? 'S*'
        : 'U';
    const network = `${r.destination}/${r.prefix}`;
    const ad = r.adminDistance ?? (r.type === 'static' ? 1 : 0);
    if (r.type === 'connected') {
      return `${typeCode}    ${network} is directly connected, ${r.interfaceName ?? ''}`;
    }
    return `${typeCode}    ${network} [${ad}/${r.metric}] via ${r.nextHop ?? '?'}`;
  });

  if (routes.length === 0) {
    return [...legend, '% No routes found'].join('\n');
  }
  return [...legend, ...routes].join('\n');
}

/** Build the "show arp" output. */
function showArp(device: NetworkDeviceState): string {
  const header =
    col('Protocol', 10) +
    col('Address', 16) +
    col('Age (min)', 10) +
    col('Hardware Addr', 16) +
    col('Type', 7) +
    'Interface';
  const rows = device.arpTable.map((e) => {
    const age = Math.floor((Date.now() - e.expiresAt) / 60000);
    return (
      col('Internet', 10) +
      col(e.ip, 16) +
      col(age < 0 ? '-' : String(age), 10) +
      col(e.mac, 16) +
      col('ARPA', 7) +
      e.interfaceName
    );
  });
  return [header, ...rows].join('\n');
}

/** Build the "show running-config" output. */
function showRunningConfig(device: NetworkDeviceState): string {
  const lines: string[] = [
    'Building configuration...',
    '',
    'Current configuration:',
    '!',
    'version 15.7',
    'service timestamps debug datetime msec',
    'service timestamps log datetime msec',
    device.passwordEncryption ? 'service password-encryption' : 'no service password-encryption',
    '!',
    `hostname ${device.hostname}`,
    '!',
  ];

  if (device.enableSecret) {
    lines.push(`enable secret 5 ${device.enableSecret}`, '!');
  }
  if (device.bannerMotd) {
    lines.push(`banner motd ^C${device.bannerMotd}^C`, '!');
  }
  if (device.domainName) {
    lines.push(`ip domain-name ${device.domainName}`);
  }
  if (device.sshEnabled) {
    lines.push('crypto key generate rsa modulus 2048');
    lines.push('ip ssh version 2');
  }
  lines.push('!');

  // Interfaces
  for (const iface of Object.values(device.interfaces)) {
    lines.push(`interface ${iface.name}`);
    if (iface.description) lines.push(` description ${iface.description}`);
    if (iface.ip) {
      lines.push(` ip address ${iface.ip} ${prefixToMask(iface.subnetPrefix ?? 0)}`);
    }
    if (iface.subIf) {
      lines.push(` encapsulation dot1Q ${iface.subIf.encapDot1q}`);
    }
    if (iface.switchport) {
      lines.push(` switchport mode ${iface.switchport.mode}`);
      if (iface.switchport.vlan) {
        lines.push(` switchport access vlan ${iface.switchport.vlan}`);
      }
    }
    if (!iface.up) lines.push(' shutdown');
    lines.push('!');
  }

  // Static routes
  const staticRoutes = device.routingTable.filter((r) => r.type === 'static' || r.type === 'default');
  for (const r of staticRoutes) {
    lines.push(`ip route ${r.destination} ${prefixToMask(r.prefix)} ${r.nextHop ?? ''}`);
  }
  if (staticRoutes.length) lines.push('!');

  // ACLs
  for (const acl of device.acls) {
    lines.push(`ip access-list extended ${acl.name}`);
    for (const entry of acl.entries) {
      lines.push(
        ` ${entry.seq} ${entry.action} ${entry.protocol} ${entry.srcIp} ${entry.srcWildcard} ${entry.dstIp} ${entry.dstWildcard}`
      );
    }
    lines.push('!');
  }

  lines.push('end');
  return lines.join('\n');
}

/** Fake IOS version banner. */
function showVersion(device: NetworkDeviceState): string {
  return [
    `Cisco IOS Software, Version 15.7(3)M4a, RELEASE SOFTWARE (fc2)`,
    `Technical Support: http://www.cisco.com/techsupport`,
    `Copyright (c) 1986-2019 by Cisco Systems, Inc.`,
    ``,
    `ROM: System Bootstrap, Version 15.7(3)r`,
    ``,
    `${device.hostname} uptime is 1 hour, 23 minutes`,
    `System returned to ROM by reload`,
    ``,
    `Cisco 2901 (revision 1.0) with 491520K/32768K bytes of memory.`,
    `Processor board ID FTX152400KS`,
    `2 Gigabit Ethernet interfaces`,
    `2 Serial(sync/async) interfaces`,
    `DRAM configuration is 64 bits wide with parity enabled.`,
    `255K bytes of non-volatile configuration memory.`,
    `249856K bytes of ATA System CompactFlash 0 (Read/Write)`,
    ``,
    `License Info:`,
    `License UDI:`,
    ``,
    `Device#   PID                   SN`,
    `-------------------------------------------------`,
    `*0        CISCO2901/K9          FTX1524005W`,
    ``,
    `Technology Package License Information for Module:'c2900'`,
    ``,
    `Technology    Technology-package          Technology-package`,
    `              Current       Type          Next reboot`,
    `-----------------------------------------------------------------`,
    `ipbase        ipbasek9      Permanent     ipbasek9`,
    `security      securityk9    Permanent     securityk9`,
    `data          datak9        Permanent     datak9`,
    ``,
    `Configuration register is 0x2102`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Sub-handlers per mode
// ---------------------------------------------------------------------------

function handleUserExec(device: NetworkDeviceState, tokens: string[]): CmdResult {
  const cmd = tokens.join(' ');

  if (tokens[0] === 'enable') {
    return { output: '', newMode: 'privileged_exec' };
  }
  if (tokens[0] === 'exit' || tokens[0] === 'logout') {
    return { output: 'Connection closed by foreign host.' };
  }
  if (tokens[0] === 'show') {
    return {
      output: `% Invalid input detected at '^' marker.\n\n${device.hostname}>`,
      error: true,
    };
  }
  if (tokens[0] === 'ping' && tokens[1]) {
    return pingOutput(tokens[1]);
  }
  if (tokens[0] === '?') {
    return { output: 'enable\nexit\nping\nshow\ntraceroute' };
  }

  return {
    output: `% Unknown command or computer not configured - '${cmd}'\n\n${device.hostname}>`,
    error: true,
  };
}

function pingOutput(ip: string): CmdResult {
  return {
    output: [
      `Type escape sequence to abort.`,
      `Sending 5, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:`,
      `!!!!!`,
      `Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`,
    ].join('\n'),
  };
}

function tracerouteOutput(ip: string): CmdResult {
  return {
    output: [
      `Type escape sequence to abort.`,
      `Tracing the route to ${ip}`,
      `VRF info: (vrf in name/id, vrf out name/id)`,
      `  1   * * *`,
      `  2   * * *`,
      `  3  ${ip}  4 msec  4 msec  4 msec`,
    ].join('\n'),
  };
}

function handlePrivExec(
  device: NetworkDeviceState,
  tokens: string[],
  _topology: Topology
): CmdResult {
  const full = tokens.join(' ');

  if (tokens[0] === 'configure' && tokens[1] === 'terminal') {
    return {
      output: 'Enter configuration commands, one per line.  End with CNTL/Z.',
      newMode: 'global_config',
    };
  }
  if (tokens[0] === 'disable') {
    return { output: '', newMode: 'user_exec' };
  }
  if (tokens[0] === 'exit' || tokens[0] === 'logout') {
    return { output: 'Connection closed by foreign host.' };
  }

  // show commands
  if (tokens[0] === 'show') {
    const sub = tokens.slice(1).join(' ');
    if (sub === 'ip interface brief' || sub === 'ip int br' || sub === 'ip int brief') {
      return { output: showIpIntBrief(device) };
    }
    if (sub === 'interfaces' || sub === 'int') {
      return { output: showInterfaces(device) };
    }
    if (sub === 'ip route' || sub === 'ip ro') {
      return { output: showIpRoute(device) };
    }
    if (sub === 'running-config' || sub === 'run') {
      return { output: showRunningConfig(device) };
    }
    if (sub === 'arp') {
      return { output: showArp(device) };
    }
    if (sub === 'version' || sub === 'ver') {
      return { output: showVersion(device) };
    }
    return { output: INVALID_INPUT, error: true };
  }

  if (tokens[0] === 'ping' && tokens[1]) {
    return pingOutput(tokens[1]);
  }
  if (tokens[0] === 'traceroute' && tokens[1]) {
    return tracerouteOutput(tokens[1]);
  }

  if (
    full === 'write memory' ||
    full === 'write mem' ||
    full === 'copy running-config startup-config' ||
    full === 'copy run start'
  ) {
    return { output: 'Building configuration...\n[OK]' };
  }

  if (tokens[0] === 'reload') {
    return { output: 'Reload requested by console.\n\nProceed with reload? [confirm]' };
  }

  return { output: `${INVALID_INPUT}\n\n${device.hostname}#`, error: true };
}

function handleGlobalConfig(
  device: NetworkDeviceState,
  tokens: string[],
  topology: Topology
): CmdResult {
  const full = tokens.join(' ');

  // do <cmd> – run in priv exec context
  if (tokens[0] === 'do') {
    const subTokens = tokens.slice(1);
    return handlePrivExec(device, subTokens, topology);
  }
  if (full === 'exit') {
    return { output: '', newMode: 'privileged_exec' };
  }
  if (full === 'end') {
    return { output: '', newMode: 'privileged_exec' };
  }

  // hostname <name>
  if (tokens[0] === 'hostname' && tokens[1]) {
    const name = tokens[1];
    return {
      output: '',
      mutate: (d) => { d.hostname = name; },
    };
  }

  // enable secret <pw>
  if (tokens[0] === 'enable' && tokens[1] === 'secret' && tokens[2]) {
    const pw = tokens[2];
    return {
      output: '',
      mutate: (d) => { d.enableSecret = pw; },
    };
  }

  // service password-encryption
  if (full === 'service password-encryption') {
    return { output: '', mutate: (d) => { d.passwordEncryption = true; } };
  }
  if (full === 'no service password-encryption') {
    return { output: '', mutate: (d) => { d.passwordEncryption = false; } };
  }

  // no ip domain-lookup
  if (full === 'no ip domain-lookup') {
    return { output: '' }; // noop flag
  }

  // ip domain-name <name>
  if (tokens[0] === 'ip' && tokens[1] === 'domain-name' && tokens[2]) {
    const name = tokens[2];
    return { output: '', mutate: (d) => { d.domainName = name; } };
  }

  // banner motd # <text> #
  if (tokens[0] === 'banner' && tokens[1] === 'motd') {
    const raw = tokens.slice(2).join(' ');
    const delim = raw[0];
    const text = raw.slice(1).replace(new RegExp(`${delim}$`), '').trim();
    return { output: '', mutate: (d) => { d.bannerMotd = text; } };
  }

  // ip route <dest> <mask> <nexthop>
  if (tokens[0] === 'ip' && tokens[1] === 'route' && tokens.length >= 5) {
    const dest = tokens[2];
    const mask = tokens[3];
    const nextHop = tokens[4];
    const prefix = maskToPrefix(mask);
    const net = networkAddress(dest, prefix);
    return {
      output: '',
      mutate: (d) => {
        // Remove existing same route
        d.routingTable = d.routingTable.filter(
          (r) => !(r.destination === net && r.prefix === prefix)
        );
        d.routingTable.push({
          destination: net,
          prefix,
          nextHop,
          metric: 1,
          type: 'static',
          adminDistance: 1,
        });
      },
    };
  }

  // no ip route <dest> <mask>
  if (tokens[0] === 'no' && tokens[1] === 'ip' && tokens[2] === 'route' && tokens.length >= 5) {
    const dest = tokens[3];
    const mask = tokens[4];
    const prefix = maskToPrefix(mask);
    const net = networkAddress(dest, prefix);
    return {
      output: '',
      mutate: (d) => {
        d.routingTable = d.routingTable.filter(
          (r) => !(r.destination === net && r.prefix === prefix)
        );
      },
    };
  }

  // username <name> privilege 15 secret <pw>
  if (tokens[0] === 'username') {
    return { output: '' }; // noop ok
  }

  // crypto key generate rsa
  if (tokens[0] === 'crypto' && tokens[1] === 'key' && tokens[2] === 'generate' && tokens[3] === 'rsa') {
    return {
      output: [
        'The name for the keys will be: ' + device.hostname + '.' + (device.domainName ?? 'domain.com'),
        'Choose the size of the key modulus in the range of 360 to 4096 for your',
        '  General Purpose Keys. Choosing a key modulus greater than 512 may take',
        '  a few minutes.',
        '',
        'How many bits in the modulus [512]: 2048',
        '% Generating 2048 bit RSA keys, keys will be non-exportable...',
        '[OK] (elapsed time was 2 seconds)',
      ].join('\n'),
      mutate: (d) => { d.sshEnabled = true; },
    };
  }

  // interface <ifname>
  if (tokens[0] === 'interface' && tokens[1]) {
    const ifName = tokens.slice(1).join('');
    // Ensure interface exists
    return {
      output: '',
      newMode: 'interface_config',
      newContext: ifName,
      mutate: (d) => {
        if (!d.interfaces[ifName]) {
          d.interfaces[ifName] = {
            name: ifName,
            mac: Array.from({ length: 6 }, () =>
              Math.floor(Math.random() * 256)
                .toString(16)
                .padStart(2, '0')
            ).join(':'),
            up: false,
          };
        }
      },
    };
  }

  // line console 0 / line vty 0 4
  if (tokens[0] === 'line') {
    const ctx = tokens.slice(1).join(' ');
    return { output: '', newMode: 'line_config', newContext: ctx };
  }

  // ip access-list extended <name>
  if (tokens[0] === 'ip' && tokens[1] === 'access-list' && tokens[2] === 'extended' && tokens[3]) {
    const name = tokens[3];
    return {
      output: '',
      newMode: 'global_config',
      newContext: `acl:${name}`,
      mutate: (d) => {
        if (!d.acls.find((a) => a.name === name)) {
          d.acls.push({ name, type: 'extended', entries: [] });
        }
      },
    };
  }

  // ip dhcp pool <name>
  if (tokens[0] === 'ip' && tokens[1] === 'dhcp' && tokens[2] === 'pool' && tokens[3]) {
    const name = tokens[3];
    return {
      output: '',
      newMode: 'global_config',
      newContext: `dhcp:${name}`,
      mutate: (d) => {
        if (!d.dhcpPools.find((p) => p.poolName === name)) {
          d.dhcpPools.push({
            poolName: name,
            network: '0.0.0.0',
            prefix: 0,
            defaultRouter: '0.0.0.0',
            leaseTime: 86400,
            excludedRanges: [],
          });
        }
      },
    };
  }

  // ip dhcp excluded-address <start> [<end>]
  if (tokens[0] === 'ip' && tokens[1] === 'dhcp' && tokens[2] === 'excluded-address' && tokens[3]) {
    const start = tokens[3];
    const end = tokens[4] ?? tokens[3];
    return {
      output: '',
      mutate: (d) => {
        const pool = d.dhcpPools[d.dhcpPools.length - 1];
        if (pool) pool.excludedRanges.push({ start, end });
      },
    };
  }

  // ip nat inside source list <acl> interface <if> overload
  if (tokens[0] === 'ip' && tokens[1] === 'nat') {
    return { output: '' }; // noop ok
  }

  return { output: INVALID_INPUT_CONFIG, error: true };
}

function handleInterfaceConfig(
  device: NetworkDeviceState,
  tokens: string[],
  topology: Topology
): CmdResult {
  const ctx = device.cliSession.contextLabel;
  const iface = resolveInterface(device, ctx);
  const full = tokens.join(' ');

  // do <cmd>
  if (tokens[0] === 'do') {
    return handlePrivExec(device, tokens.slice(1), topology);
  }
  if (full === 'exit') {
    return { output: '', newMode: 'global_config' };
  }
  if (full === 'end') {
    return { output: '', newMode: 'privileged_exec' };
  }

  if (!iface) {
    return { output: `% Interface ${ctx} not found`, error: true };
  }

  // ip address <ip> <mask>
  if (tokens[0] === 'ip' && tokens[1] === 'address' && tokens[2] && tokens[3]) {
    const ip = tokens[2];
    const prefix = maskToPrefix(tokens[3]);
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) { i.ip = ip; i.subnetPrefix = prefix; }
      },
    };
  }

  // no ip address
  if (tokens[0] === 'no' && tokens[1] === 'ip' && tokens[2] === 'address') {
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) { delete i.ip; delete i.subnetPrefix; }
      },
    };
  }

  // no shutdown
  if (full === 'no shutdown') {
    return {
      output: `%LINK-5-CHANGED: Interface ${ctx}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${ctx}, changed state to up`,
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) i.up = true;
      },
    };
  }

  // shutdown
  if (full === 'shutdown') {
    return {
      output: `%LINK-5-CHANGED: Interface ${ctx}, changed state to administratively down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${ctx}, changed state to down`,
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) i.up = false;
      },
    };
  }

  // description <text>
  if (tokens[0] === 'description' && tokens[1]) {
    const desc = tokens.slice(1).join(' ');
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) i.description = desc;
      },
    };
  }

  // encapsulation dot1q <vlan>
  if (tokens[0] === 'encapsulation' && tokens[1] === 'dot1q' && tokens[2]) {
    const vlan = parseInt(tokens[2], 10);
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) i.subIf = { encapDot1q: vlan };
      },
    };
  }

  // switchport mode access / trunk
  if (tokens[0] === 'switchport' && tokens[1] === 'mode') {
    const mode = tokens[2] as 'access' | 'trunk';
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) {
          i.switchport = i.switchport
            ? { ...i.switchport, mode }
            : { mode };
        }
      },
    };
  }

  // switchport access vlan <n>
  if (tokens[0] === 'switchport' && tokens[1] === 'access' && tokens[2] === 'vlan' && tokens[3]) {
    const vlan = parseInt(tokens[3], 10);
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) {
          i.switchport = { mode: 'access', ...(i.switchport ?? {}), vlan };
        }
      },
    };
  }

  // switchport trunk allowed vlan <list>
  if (tokens[0] === 'switchport' && tokens[1] === 'trunk' && tokens[2] === 'allowed' && tokens[3] === 'vlan' && tokens[4]) {
    const vlans = tokens[4].split(',').map((v) => parseInt(v.trim(), 10)).filter(Boolean);
    return {
      output: '',
      mutate: (d) => {
        const i = resolveInterface(d, ctx);
        if (i) {
          i.switchport = { mode: 'trunk', ...(i.switchport ?? {}), allowedVlans: vlans };
        }
      },
    };
  }

  // ip nat inside / outside
  if (tokens[0] === 'ip' && tokens[1] === 'nat') {
    return { output: '' }; // noop ok
  }

  // ip access-group <name> in|out
  if (tokens[0] === 'ip' && tokens[1] === 'access-group') {
    return { output: '' }; // noop ok
  }

  // ip helper-address <ip>
  if (tokens[0] === 'ip' && tokens[1] === 'helper-address') {
    return { output: '' }; // noop ok
  }

  return { output: INVALID_INPUT_CONFIG, error: true };
}

function handleLineConfig(
  device: NetworkDeviceState,
  tokens: string[],
  topology: Topology
): CmdResult {
  const full = tokens.join(' ');

  if (tokens[0] === 'do') {
    return handlePrivExec(device, tokens.slice(1), topology);
  }
  if (full === 'exit') return { output: '', newMode: 'global_config' };
  if (full === 'end') return { output: '', newMode: 'privileged_exec' };

  if (tokens[0] === 'password') return { output: '' }; // noop ok
  if (tokens[0] === 'login') return { output: '' };
  if (tokens[0] === 'exec-timeout') return { output: '' };
  if (tokens[0] === 'transport' && tokens[1] === 'input') return { output: '' };
  if (tokens[0] === 'logging') return { output: '' };

  return { output: INVALID_INPUT_CONFIG, error: true };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function handleRouterCommand(
  device: NetworkDeviceState,
  raw: string,
  topology: Topology
): CmdResult {
  if (!raw.trim()) return { output: '' };

  const expanded = expandAbbrev(raw.trim());
  const tokens = expanded.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // Re-parse with original casing for values
  const origTokens = expanded.trim().split(/\s+/).filter(Boolean);

  const mode = device.cliSession.mode;

  switch (mode) {
    case 'user_exec':
      return handleUserExec(device, origTokens);
    case 'privileged_exec':
      return handlePrivExec(device, origTokens, topology);
    case 'global_config':
      return handleGlobalConfig(device, origTokens, topology);
    case 'interface_config':
      return handleInterfaceConfig(device, origTokens, topology);
    case 'line_config':
      return handleLineConfig(device, origTokens, topology);
    default:
      return { output: COMMAND_NOT_SUPPORTED, error: true };
  }
}
