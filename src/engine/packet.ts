export type MACAddress = string;
export type IPAddress = string;

export interface EthernetFrame {
  sourceMac: MACAddress;
  destinationMac: MACAddress;
  vlanTag?: number;
  ethertype: 'ARP' | 'IPv4';
  payload: ARPFrame | IPv4Packet;
}

export interface ARPFrame {
  operation: 'REQUEST' | 'REPLY';
  senderMac: MACAddress;
  senderIp: IPAddress;
  targetMac: MACAddress;
  targetIp: IPAddress;
}

export interface IPv4Packet {
  sourceIp: IPAddress;
  destinationIp: IPAddress;
  ttl: number;
  protocol: 'ICMP' | 'TCP' | 'UDP' | 'DNS';
  payload: ICMPPacket | TcpSegment | UdpDatagram | DnsMessage | any;
}

export interface ICMPPacket {
  type: 'ECHO_REQUEST' | 'ECHO_REPLY' | 'DESTINATION_UNREACHABLE' | 'TIME_EXCEEDED';
  code: number;
  identifier?: number;
  sequenceNumber?: number;
}

export interface TcpSegment {
  sourcePort: number;
  destinationPort: number;
  flags: ('SYN' | 'ACK' | 'FIN' | 'RST' | 'PSH')[];
  data?: string;
}

export interface UdpDatagram {
  sourcePort: number;
  destinationPort: number;
  data?: string;
}

export interface DnsMessage {
  id: number;
  isQuery: boolean;
  questionName: string;
  answerIp?: string;
}

export type PacketEventAction =
  | 'TX'
  | 'RX'
  | 'DROP'
  | 'PROCESS'
  | 'ROUTE'
  | 'SWITCH'
  | 'ARP_LEARN'
  | 'NAT'
  | 'ACL_PERMIT'
  | 'ACL_DENY'
  | 'DHCP'
  | 'DNS';

export interface PacketEvent {
  time: number;
  deviceId: string;
  deviceName?: string;
  interfaceName?: string;
  action: PacketEventAction;
  reason?: string;
  frame: EthernetFrame;
  layer?: 2 | 3 | 4;
  summary?: string;
}
