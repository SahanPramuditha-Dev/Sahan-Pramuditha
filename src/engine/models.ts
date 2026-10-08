import type { MACAddress, IPAddress, EthernetFrame, PacketEvent } from './packet';

export type DeviceType =
  | 'PC'
  | 'Laptop'
  | 'Server'
  | 'L2Switch'
  | 'L3Switch'
  | 'Router'
  | 'Firewall'
  | 'Cloud'
  | 'AccessPoint'
  | 'Proxy'
  | 'DNS'
  | 'DHCP'
  | 'Web'
  | 'Mail';

export interface InterfaceConfig {
  name: string;
  mac: MACAddress;
  ip?: IPAddress;
  subnetPrefix?: number;
  up: boolean;
  description?: string;
  switchport?: {
    mode: 'access' | 'trunk';
    vlan?: number;
    allowedVlans?: number[];
  };
  /** Sub-interface (router-on-a-stick) */
  subIf?: {
    encapDot1q: number; // vlan id
  };
}

export interface Route {
  destination: IPAddress;
  prefix: number;
  nextHop?: IPAddress;
  interfaceName?: string;
  metric: number;
  type: 'connected' | 'static' | 'ospf' | 'rip' | 'default';
  adminDistance?: number;
}

export interface ArpEntry {
  ip: IPAddress;
  mac: MACAddress;
  interfaceName: string;
  expiresAt: number;
}

export interface MacTableEntry {
  mac: MACAddress;
  interfaceName: string;
  vlan: number;
  expiresAt: number;
}

export interface VlanEntry {
  id: number;
  name: string;
  active: boolean;
}

export interface DhcpPool {
  poolName: string;
  network: IPAddress;
  prefix: number;
  defaultRouter: IPAddress;
  dnsServer?: IPAddress;
  leaseTime: number; // seconds
  excludedRanges: { start: IPAddress; end: IPAddress }[];
}

export interface DhcpBinding {
  ip: IPAddress;
  mac: MACAddress;
  hostname?: string;
  expiresAt: number;
}

export interface NatEntry {
  protocol: 'TCP' | 'UDP' | 'ICMP';
  insideLocal: IPAddress;
  insideLocalPort?: number;
  insideGlobal: IPAddress;
  insideGlobalPort?: number;
  outsideGlobal: IPAddress;
  outsideGlobalPort?: number;
}

export interface AclEntry {
  seq: number;
  action: 'permit' | 'deny';
  protocol: 'ip' | 'tcp' | 'udp' | 'icmp';
  srcIp: IPAddress;
  srcWildcard: string;
  dstIp: IPAddress;
  dstWildcard: string;
  dstPort?: number;
  hitCount: number;
}

export interface Acl {
  name: string; // number or name
  type: 'standard' | 'extended' | 'named';
  entries: AclEntry[];
}

export interface PortSecurity {
  enabled: boolean;
  maxMacs: number;
  violation: 'protect' | 'restrict' | 'shutdown';
  sticky: boolean;
  learnedMacs: MACAddress[];
}

export interface ServiceConfig {
  http: boolean;
  https: boolean;
  dns: boolean;
  dhcp: boolean;
  smtp: boolean;
  imap: boolean;
  /** DNS records: name -> ip */
  dnsRecords: Record<string, string>;
  /** Simple HTTP pages: path -> html content */
  httpPages: Record<string, string>;
}

/** CLI mode state-machine per device */
export type CliMode =
  | 'user_exec'
  | 'privileged_exec'
  | 'global_config'
  | 'interface_config'
  | 'line_config'
  | 'vlan_config'
  | 'subif_config';

export interface CliSession {
  mode: CliMode;
  contextLabel: string; // e.g. "GigabitEthernet0/0", "vty 0 4"
  history: string[];
  enableSecret?: string;
}

export interface NetworkDeviceState {
  id: string;
  type: DeviceType;
  hostname: string;
  interfaces: Record<string, InterfaceConfig>;
  routingTable: Route[];
  arpTable: ArpEntry[];
  macTable: MacTableEntry[];
  vlans: VlanEntry[];
  dhcpPools: DhcpPool[];
  dhcpBindings: DhcpBinding[];
  natTable: NatEntry[];
  acls: Acl[];
  portSecurity: Record<string, PortSecurity>; // by interface name
  services: ServiceConfig;
  cliSession: CliSession;
  // Security config
  enableSecret?: string;
  passwordEncryption: boolean;
  domainName?: string;
  sshEnabled: boolean;
  bannerMotd?: string;
  // IP-specific
  defaultGateway?: IPAddress; // For hosts
  dnsServer?: IPAddress;
  // DHCP client flag
  ipDhcp: boolean;
}

export interface Link {
  id: string;
  sourceId: string;
  sourceInterface: string;
  targetId: string;
  targetInterface: string;
  up: boolean;
  cableType: 'straight' | 'crossover' | 'serial' | 'console' | 'fiber';
}

export interface Topology {
  devices: Record<string, NetworkDeviceState>;
  links: Record<string, Link>;
}

export interface SimulationState {
  topology: Topology;
  events: PacketEvent[];
  time: number;
}

/** Default factory for a new device state */
export function createDeviceState(id: string, type: DeviceType, hostname: string): NetworkDeviceState {
  return {
    id,
    type,
    hostname,
    interfaces: {},
    routingTable: [],
    arpTable: [],
    macTable: [],
    vlans: [{ id: 1, name: 'default', active: true }],
    dhcpPools: [],
    dhcpBindings: [],
    natTable: [],
    acls: [],
    portSecurity: {},
    services: {
      http: type === 'Web' || type === 'Server',
      https: false,
      dns: type === 'DNS',
      dhcp: type === 'DHCP',
      smtp: type === 'Mail',
      imap: type === 'Mail',
      dnsRecords: {},
      httpPages: { '/': '<h1>Welcome</h1>' },
    },
    cliSession: {
      mode: 'user_exec',
      contextLabel: '',
      history: [],
    },
    passwordEncryption: false,
    sshEnabled: false,
    ipDhcp: false,
  };
}
