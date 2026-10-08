import type { EthernetFrame, PacketEvent, IPv4Packet, ARPFrame, ICMPPacket, UdpDatagram } from './packet';
import type { Topology, NetworkDeviceState, Link, AclEntry, Acl, NatEntry, Route } from './models';
import { isSameSubnet, ipToNumber, numberToIp, maskToPrefix, prefixToMask, getNetworkAddress } from './utils';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/** Invert each octet of a mask to produce a wildcard mask */
function maskToWildcard(mask: string): string {
  return mask.split('.').map(o => (255 - parseInt(o, 10)).toString()).join('.');
}

/** Check if an IP matches a (network, wildcard-mask) pair */
function ipMatchesWildcard(ip: string, network: string, wildcard: string): boolean {
  const ipNum  = ipToNumber(ip);
  const netNum = ipToNumber(network);
  const wcNum  = ipToNumber(wildcard);
  return (ipNum & ~wcNum) === (netNum & ~wcNum);
}

/** Shallow-clone an IPv4 packet (keeps payload reference) */
function cloneIpPacket(p: IPv4Packet): IPv4Packet {
  return { ...p };
}

// ---------------------------------------------------------------------------
// Main engine
// ---------------------------------------------------------------------------

export class NetworkSimulatorEngine {
  topology: Topology;
  events: PacketEvent[] = [];
  time: number = 0;

  /** PAT port counter – starts above the well-known range */
  private _patPortCounter = 1024;

  constructor(initialTopology: Topology) {
    this.topology = JSON.parse(JSON.stringify(initialTopology)); // deep copy
  }

  // -------------------------------------------------------------------------
  // Link helpers
  // -------------------------------------------------------------------------

  /** Find all links that touch a specific device interface */
  getLinks(deviceId: string, interfaceName: string): Link[] {
    return Object.values(this.topology.links).filter(
      l =>
        (l.sourceId === deviceId && l.sourceInterface === interfaceName) ||
        (l.targetId === deviceId && l.targetInterface === interfaceName)
    );
  }

  // -------------------------------------------------------------------------
  // Event logging
  // -------------------------------------------------------------------------

  logEvent(
    deviceId: string,
    action: PacketEvent['action'],
    frame: EthernetFrame,
    interfaceName?: string,
    reason?: string,
    summary?: string
  ): void {
    const device = this.topology.devices[deviceId];
    const deviceName = device?.hostname ?? deviceId;
    this.events.push({
      time: this.time++,
      deviceId,
      deviceName,
      interfaceName,
      action,
      reason,
      summary,
      frame: JSON.parse(JSON.stringify(frame)),
    });
  }

  // -------------------------------------------------------------------------
  // Layer-2 transmit / receive
  // -------------------------------------------------------------------------

  transmit(fromDeviceId: string, fromInterface: string, frame: EthernetFrame): void {
    const device = this.topology.devices[fromDeviceId];
    if (!device) return;
    const iface = device.interfaces[fromInterface];
    if (!iface || !iface.up) return;

    // Loop prevention: limit hop count to 20 to prevent L2 broadcast storms
    const hopCount = (frame as any)._hopCount || 0;
    if (hopCount > 20) {
      this.logEvent(fromDeviceId, 'DROP', frame, fromInterface, 'Loop detected (hop count > 20)');
      return;
    }
    const nextFrame = { ...frame, _hopCount: hopCount + 1 };

    this.logEvent(fromDeviceId, 'TX', nextFrame, fromInterface, undefined, this._frameSummary(nextFrame));

    const links = this.getLinks(fromDeviceId, fromInterface);
    for (const link of links) {
      if (!link.up) continue;
      const targetId  = link.sourceId === fromDeviceId ? link.targetId  : link.sourceId;
      const targetIf  = link.sourceId === fromDeviceId ? link.targetInterface : link.sourceInterface;
      // Copy to prevent mutation by reference in receive
      this.receive(targetId, targetIf, JSON.parse(JSON.stringify(nextFrame)));
    }
  }

  receive(deviceId: string, interfaceName: string, frame: EthernetFrame): void {
    const device = this.topology.devices[deviceId];
    if (!device) return;
    const iface = device.interfaces[interfaceName];
    if (!iface || !iface.up) {
      this.logEvent(deviceId, 'DROP', frame, interfaceName, 'Interface down or non-existent');
      return;
    }

    const isBroadcast = frame.destinationMac === 'ff:ff:ff:ff:ff:ff';
    const isSwitch = device.type === 'L2Switch' || device.type === 'L3Switch';

    // Switches accept all frames; hosts/routers filter on destination MAC
    if (!isBroadcast && frame.destinationMac !== iface.mac && !isSwitch) {
      this.logEvent(
        deviceId, 'DROP', frame, interfaceName,
        `Not destination MAC (expected ${iface.mac}, got ${frame.destinationMac})`
      );
      return;
    }

    this.logEvent(deviceId, 'RX', frame, interfaceName, undefined, this._frameSummary(frame));

    if (isSwitch) {
      this.processSwitch(device, interfaceName, frame);
      return;
    }

    if (frame.ethertype === 'ARP') {
      this.processArp(device, interfaceName, frame.payload as ARPFrame);
    } else if (frame.ethertype === 'IPv4') {
      this.processIpv4(device, interfaceName, frame.payload as IPv4Packet, frame);
    }
  }

  // -------------------------------------------------------------------------
  // Layer-2 switching (VLAN-aware)
  // -------------------------------------------------------------------------

  processSwitch(device: NetworkDeviceState, incomingIf: string, frame: EthernetFrame): void {
    const sw = device.interfaces[incomingIf]?.switchport;
    let vlanId = frame.vlanTag ?? 1;

    // --- Ingress VLAN policy ---
    if (sw?.mode === 'access') {
      const accessVlan = sw.vlan ?? 1;
      if (frame.vlanTag !== undefined && frame.vlanTag !== accessVlan) {
        // Tagged frame on access port that doesn't match → drop
        this.logEvent(device.id, 'DROP', frame, incomingIf, `VLAN tag ${frame.vlanTag} not allowed on access port (VLAN ${accessVlan})`);
        return;
      }
      vlanId = accessVlan;
    } else if (sw?.mode === 'trunk') {
      const allowed = sw.allowedVlans ?? [];
      const effectiveVlan = frame.vlanTag ?? 1;
      if (allowed.length > 0 && !allowed.includes(effectiveVlan)) {
        this.logEvent(device.id, 'DROP', frame, incomingIf, `VLAN ${effectiveVlan} not in allowed list on trunk`);
        return;
      }
      vlanId = effectiveVlan;
    }

    this.logEvent(device.id, 'SWITCH', frame, incomingIf, `L2 forwarding VLAN ${vlanId}`);

    // --- MAC learning ---
    const existingMac = device.macTable.find(m => m.mac === frame.sourceMac && m.vlan === vlanId);
    if (existingMac) {
      existingMac.interfaceName = incomingIf;
      existingMac.expiresAt = this.time + 300;
    } else {
      device.macTable.push({ mac: frame.sourceMac, interfaceName: incomingIf, vlan: vlanId, expiresAt: this.time + 300 });
      this.logEvent(device.id, 'ARP_LEARN', frame, incomingIf, `Learned MAC ${frame.sourceMac} on ${incomingIf} VLAN ${vlanId}`);
    }

    // --- Forwarding ---
    const isBroadcast = frame.destinationMac === 'ff:ff:ff:ff:ff:ff';
    const destEntry   = isBroadcast ? null : device.macTable.find(m => m.mac === frame.destinationMac && m.vlan === vlanId);

    const egress: string[] = destEntry
      ? (destEntry.interfaceName !== incomingIf ? [destEntry.interfaceName] : [])
      : Object.keys(device.interfaces).filter(iface => iface !== incomingIf && device.interfaces[iface].up);

    if (!destEntry && !isBroadcast) {
      this.logEvent(device.id, 'SWITCH', frame, incomingIf, 'Unknown unicast – flooding');
    }

    for (const outIf of egress) {
      const outSw = device.interfaces[outIf]?.switchport;
      let   outFrame: EthernetFrame = JSON.parse(JSON.stringify(frame));

      // --- Egress VLAN tag handling ---
      if (outSw?.mode === 'access') {
        const outAccessVlan = outSw.vlan ?? 1;
        if (outAccessVlan !== vlanId) continue; // wrong VLAN, skip
        delete outFrame.vlanTag; // strip tag on egress access port
      } else if (outSw?.mode === 'trunk') {
        const outAllowed = outSw.allowedVlans ?? [];
        if (outAllowed.length > 0 && !outAllowed.includes(vlanId)) continue;
        outFrame.vlanTag = vlanId; // ensure tag is set on trunk egress
      }

      if (device.interfaces[outIf].up) {
        this.transmit(device.id, outIf, outFrame);
      }
    }
  }

  // -------------------------------------------------------------------------
  // ARP
  // -------------------------------------------------------------------------

  processArp(device: NetworkDeviceState, incomingIf: string, arp: ARPFrame): void {
    // Try to match against any interface IP (router-on-a-stick sub-interfaces too)
    const matchingIface = Object.values(device.interfaces).find(i => i.ip === arp.targetIp);
    const receiveIface  = device.interfaces[incomingIf];

    // Learn sender
    this._learnArp(device, arp.senderIp, arp.senderMac, incomingIf);

    if (arp.operation === 'REQUEST' && matchingIface) {
      this.logEvent(device.id, 'PROCESS', this._arpToFrame(arp), incomingIf, `ARP Request for my IP ${arp.targetIp}`);
      const replyFrame: EthernetFrame = {
        sourceMac: matchingIface.mac,
        destinationMac: arp.senderMac,
        ethertype: 'ARP',
        payload: {
          operation: 'REPLY',
          senderMac: matchingIface.mac,
          senderIp: matchingIface.ip!,
          targetMac: arp.senderMac,
          targetIp: arp.senderIp,
        },
      };
      this.transmit(device.id, incomingIf, replyFrame);
    } else if (arp.operation === 'REPLY') {
      // Check if one of our IPs is the target
      const myIface = Object.values(device.interfaces).find(i => i.ip === arp.targetIp);
      if (myIface) {
        this.logEvent(
          device.id, 'PROCESS', this._arpToFrame(arp), incomingIf,
          `ARP Reply: ${arp.senderIp} is-at ${arp.senderMac}`
        );
      }
    }
  }

  private _learnArp(device: NetworkDeviceState, ip: string, mac: string, ifaceName: string): void {
    const existing = device.arpTable.find(a => a.ip === ip);
    if (existing) {
      existing.mac = mac;
      existing.interfaceName = ifaceName;
      existing.expiresAt = this.time + 1200;
    } else {
      device.arpTable.push({ ip, mac, interfaceName: ifaceName, expiresAt: this.time + 1200 });
    }
  }

  // -------------------------------------------------------------------------
  // IPv4 processing
  // -------------------------------------------------------------------------

  processIpv4(
    device: NetworkDeviceState,
    incomingIf: string,
    ipPacket: IPv4Packet,
    frame: EthernetFrame
  ): void {
    // Check ACL inbound
    if (!this.checkAcl(device, ipPacket, 'in', incomingIf)) {
      this.logEvent(device.id, 'ACL_DENY', frame, incomingIf, `ACL denied inbound packet from ${ipPacket.sourceIp}`);
      return;
    }

    const forMe = Object.values(device.interfaces).some(i => i.ip === ipPacket.destinationIp)
      || (device.defaultGateway === undefined && ipPacket.destinationIp === '255.255.255.255');

    if (forMe) {
      this.logEvent(device.id, 'PROCESS', frame, incomingIf, `Packet for my IP ${ipPacket.destinationIp}`);

      if (ipPacket.protocol === 'ICMP') {
        const icmp = ipPacket.payload as ICMPPacket;
        if (icmp.type === 'ECHO_REQUEST') {
          this.logEvent(device.id, 'PROCESS', frame, incomingIf, `ICMP Echo Request from ${ipPacket.sourceIp}`);
          this._sendIpPacket(device.id, {
            sourceIp: ipPacket.destinationIp,
            destinationIp: ipPacket.sourceIp,
            protocol: 'ICMP',
            ttl: 64,
            payload: {
              type: 'ECHO_REPLY',
              code: 0,
              identifier: icmp.identifier,
              sequenceNumber: icmp.sequenceNumber,
            } as ICMPPacket,
          });
        }
      } else if (ipPacket.protocol === 'UDP') {
        const udp = ipPacket.payload as UdpDatagram;
        // DHCP server (port 67)
        if (udp.destinationPort === 67 && device.services?.dhcp) {
          this.processDhcp(device, incomingIf, udp);
        }
      }
      return;
    }

    // Not for me – forward if capable
    if (device.type === 'Router' || device.type === 'Firewall' || device.type === 'L3Switch') {
      if (ipPacket.ttl <= 1) {
        this.logEvent(device.id, 'DROP', frame, incomingIf, 'TTL exceeded');
        this.sendIcmpUnreachable(device.id, ipPacket, 0);
        return;
      }

      // Check outbound ACL
      if (!this.checkAcl(device, ipPacket, 'out', incomingIf)) {
        this.logEvent(device.id, 'ACL_DENY', frame, incomingIf, `ACL denied outbound packet to ${ipPacket.destinationIp}`);
        return;
      }

      // NAT inside → outside
      const natedPacket = this._applyNatOut(device, cloneIpPacket(ipPacket));
      const forwardPacket = cloneIpPacket(natedPacket);
      forwardPacket.ttl -= 1;

      this.logEvent(device.id, 'ROUTE', frame, incomingIf, `Routing to ${forwardPacket.destinationIp}`);
      this.routeIpPacket(device.id, forwardPacket);
    } else {
      this.logEvent(
        device.id, 'DROP', frame, incomingIf,
        `Not a router – dropping packet for ${ipPacket.destinationIp}`
      );
    }
  }

  // -------------------------------------------------------------------------
  // ACL
  // -------------------------------------------------------------------------

  checkAcl(device: NetworkDeviceState, ipPacket: IPv4Packet, direction: 'in' | 'out', interfaceName: string): boolean {
    // Find an ACL applied to this interface + direction.
    // Convention: ACL names stored as "<ifName>-in" or "<ifName>-out" OR a device-wide ACL named "global".
    const candidateNames = [`${interfaceName}-${direction}`, direction, 'global'];
    let acl: Acl | undefined;
    for (const name of candidateNames) {
      acl = device.acls.find(a => a.name === name);
      if (acl) break;
    }
    if (!acl) return true; // no ACL → implicit permit

    for (const entry of acl.entries.sort((a, b) => a.seq - b.seq)) {
      let match = false;

      if (acl.type === 'standard') {
        // Standard: source IP only
        match = ipMatchesWildcard(ipPacket.sourceIp, entry.srcIp, entry.srcWildcard);
      } else {
        // Extended / named: src + dst + protocol + optional dst port
        const srcMatch  = ipMatchesWildcard(ipPacket.sourceIp,      entry.srcIp, entry.srcWildcard);
        const dstMatch  = ipMatchesWildcard(ipPacket.destinationIp,  entry.dstIp, entry.dstWildcard);
        const protoMatch = entry.protocol === 'ip' || entry.protocol === ipPacket.protocol.toLowerCase() as any;
        let   portMatch  = true;
        if (entry.dstPort !== undefined && (ipPacket.protocol === 'TCP' || ipPacket.protocol === 'UDP')) {
          const seg = ipPacket.payload as any;
          portMatch = seg?.destinationPort === entry.dstPort;
        }
        match = srcMatch && dstMatch && protoMatch && portMatch;
      }

      if (match) {
        entry.hitCount++;
        return entry.action === 'permit';
      }
    }

    // Implicit deny at end of ACL
    return false;
  }

  // -------------------------------------------------------------------------
  // Routing (longest-prefix match)
  // -------------------------------------------------------------------------

  routeIpPacket(deviceId: string, ipPacket: IPv4Packet): void {
    const device = this.topology.devices[deviceId];
    if (!device) return;

    const bestRoute = this._longestPrefixMatch(device, ipPacket.destinationIp);

    if (!bestRoute) {
      // Try default gateway
      if (device.defaultGateway) {
        this._forwardViaNextHop(deviceId, ipPacket, device.defaultGateway, undefined);
        return;
      }
      this.logEvent(deviceId, 'DROP', { payload: ipPacket, ethertype: 'IPv4', sourceMac: '', destinationMac: '' }, undefined, `No route to host ${ipPacket.destinationIp}`);
      return;
    }

    const outIf    = bestRoute.interfaceName;
    const nextHop  = bestRoute.nextHop ?? ipPacket.destinationIp;

    this._forwardViaNextHop(deviceId, ipPacket, nextHop, outIf);
  }

  /** Longest-prefix-match against device routing table + auto-derived connected routes */
  private _longestPrefixMatch(device: NetworkDeviceState, destIp: string): Route | undefined {
    let best: Route | undefined;
    let maxPrefix = -1;

    // Build combined list: explicit routes + auto-connected
    const routes: Route[] = [...device.routingTable, ...this._connectedRoutes(device)];

    for (const route of routes) {
      const netNum  = ipToNumber(route.destination);
      const destNum = ipToNumber(destIp);
      const mask    = route.prefix === 0 ? 0 : (~0 << (32 - route.prefix)) >>> 0;
      if ((destNum & mask) === (netNum & mask)) {
        if (route.prefix > maxPrefix) {
          maxPrefix = route.prefix;
          best = route;
        }
      }
    }
    return best;
  }

  /** Auto-derive connected routes from interface IPs */
  private _connectedRoutes(device: NetworkDeviceState): Route[] {
    const routes: Route[] = [];
    for (const [name, iface] of Object.entries(device.interfaces)) {
      if (iface.ip && iface.subnetPrefix !== undefined && iface.up) {
        const mask = iface.subnetPrefix === 0 ? 0 : (~0 << (32 - iface.subnetPrefix)) >>> 0;
        const net  = numberToIp(ipToNumber(iface.ip) & mask);
        routes.push({ destination: net, prefix: iface.subnetPrefix, interfaceName: name, metric: 0, type: 'connected' });
      }
    }
    return routes;
  }

  private _forwardViaNextHop(
    deviceId: string,
    ipPacket: IPv4Packet,
    nextHopIp: string,
    outIfName: string | undefined
  ): void {
    const device = this.topology.devices[deviceId];
    if (!device) return;

    // Determine outgoing interface
    let outIf = outIfName;
    if (!outIf) {
      // Find the interface that can reach nextHopIp
      for (const [name, iface] of Object.entries(device.interfaces)) {
        if (iface.ip && iface.subnetPrefix !== undefined && iface.up) {
          if (isSameSubnet(iface.ip, nextHopIp, iface.subnetPrefix)) {
            outIf = name;
            break;
          }
        }
      }
    }

    if (!outIf || !device.interfaces[outIf]) {
      this.logEvent(deviceId, 'DROP', { payload: ipPacket, ethertype: 'IPv4', sourceMac: '', destinationMac: '' }, undefined, `No outgoing interface for ${nextHopIp}`);
      return;
    }

    // ARP resolution
    const arpEntry = device.arpTable.find(a => a.ip === nextHopIp);
    if (!arpEntry) {
      // Send ARP request
      const arpReqFrame: EthernetFrame = {
        sourceMac: device.interfaces[outIf].mac,
        destinationMac: 'ff:ff:ff:ff:ff:ff',
        ethertype: 'ARP',
        payload: {
          operation: 'REQUEST',
          senderMac: device.interfaces[outIf].mac,
          senderIp: device.interfaces[outIf].ip!,
          targetMac: '00:00:00:00:00:00',
          targetIp: nextHopIp,
        } as ARPFrame,
      };
      this.transmit(deviceId, outIf, arpReqFrame);
      // For MVP: re-check ARP (the synchronous transmit above may have resolved it)
      const resolved = device.arpTable.find(a => a.ip === nextHopIp);
      if (!resolved) {
        this.logEvent(deviceId, 'DROP', { payload: ipPacket, ethertype: 'IPv4', sourceMac: '', destinationMac: '' }, outIf, `Packet dropped – pending ARP for ${nextHopIp}`);
        return;
      }
      const frame: EthernetFrame = {
        sourceMac: device.interfaces[outIf].mac,
        destinationMac: resolved.mac,
        ethertype: 'IPv4',
        payload: ipPacket,
      };
      this.transmit(deviceId, outIf, frame);
      return;
    }

    const frame: EthernetFrame = {
      sourceMac: device.interfaces[outIf].mac,
      destinationMac: arpEntry.mac,
      ethertype: 'IPv4',
      payload: ipPacket,
    };
    this.transmit(deviceId, outIf, frame);
  }

  // -------------------------------------------------------------------------
  // NAT / PAT
  // -------------------------------------------------------------------------

  /**
   * Apply NAT on the outbound (inside → outside) path.
   * Returns a (potentially modified) copy of the packet.
   */
  private _applyNatOut(device: NetworkDeviceState, ipPacket: IPv4Packet): IPv4Packet {
    if (!device.natTable?.length) return ipPacket;
    return this.processNat(device, ipPacket, 'out');
  }

  processNat(device: NetworkDeviceState, ipPacket: IPv4Packet, direction: 'in' | 'out'): IPv4Packet {
    const result = cloneIpPacket(ipPacket);

    if (direction === 'out') {
      // inside-local → inside-global
      const entry = device.natTable.find(
        n => n.insideLocal === ipPacket.sourceIp &&
             (n.insideLocalPort === undefined || n.insideLocalPort === (ipPacket.payload as any)?.sourcePort)
      );
      if (entry) {
        result.sourceIp = entry.insideGlobal;
        if (entry.insideGlobalPort !== undefined) {
          (result.payload as any).sourcePort = entry.insideGlobalPort;
        }
        this.logEvent(
          device.id, 'NAT', this._ipToFrame(result), undefined,
          `NAT out: ${ipPacket.sourceIp} → ${entry.insideGlobal}`,
          'NAT translation applied'
        );
        return result;
      }

      // PAT (overload) – check if src is in an inside-local range (simplified: any match with insideGlobal set)
      const overload = device.natTable.find(n => n.insideLocal === '0.0.0.0' || n.insideLocal === ipPacket.sourceIp);
      if (overload) {
        const port = this._patPortCounter++;
        result.sourceIp = overload.insideGlobal;
        if ((result.payload as any).sourcePort !== undefined) {
          (result.payload as any).sourcePort = port;
        }
        // Record dynamic entry
        device.natTable.push({
          protocol: ipPacket.protocol as any,
          insideLocal: ipPacket.sourceIp,
          insideLocalPort: (ipPacket.payload as any)?.sourcePort,
          insideGlobal: overload.insideGlobal,
          insideGlobalPort: port,
          outsideGlobal: ipPacket.destinationIp,
          outsideGlobalPort: (ipPacket.payload as any)?.destinationPort,
        });
        this.logEvent(
          device.id, 'NAT', this._ipToFrame(result), undefined,
          `PAT: ${ipPacket.sourceIp} → ${overload.insideGlobal}:${port}`,
          'PAT translation'
        );
      }
    } else {
      // outside → inside (reverse translation)
      const entry = device.natTable.find(
        n =>
          n.insideGlobal === ipPacket.destinationIp &&
          (n.insideGlobalPort === undefined || n.insideGlobalPort === (ipPacket.payload as any)?.destinationPort)
      );
      if (entry) {
        result.destinationIp = entry.insideLocal;
        if (entry.insideLocalPort !== undefined) {
          (result.payload as any).destinationPort = entry.insideLocalPort;
        }
        this.logEvent(
          device.id, 'NAT', this._ipToFrame(result), undefined,
          `NAT in: ${ipPacket.destinationIp} → ${entry.insideLocal}`
        );
      }
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // ICMP Unreachable
  // -------------------------------------------------------------------------

  sendIcmpUnreachable(fromDeviceId: string, originalPacket: IPv4Packet, code: number): void {
    const device = this.topology.devices[fromDeviceId];
    if (!device) return;

    // Find source interface IP
    const srcIface = Object.values(device.interfaces).find(i => i.ip && i.up);
    if (!srcIface?.ip) return;

    this._sendIpPacket(fromDeviceId, {
      sourceIp: srcIface.ip,
      destinationIp: originalPacket.sourceIp,
      protocol: 'ICMP',
      ttl: 64,
      payload: {
        type: 'DESTINATION_UNREACHABLE',
        code,
      } as ICMPPacket,
    });
  }

  // -------------------------------------------------------------------------
  // DHCP
  // -------------------------------------------------------------------------

  processDhcp(device: NetworkDeviceState, interfaceName: string, udpDatagram: UdpDatagram): void {
    const data = JSON.parse(udpDatagram.data ?? '{}') as {
      type?: string;
      clientMac?: string;
      requestedIp?: string;
      hostname?: string;
    };
    const { type, clientMac = '', requestedIp, hostname } = data;

    if (!type) return;

    // Find a suitable pool
    const iface   = device.interfaces[interfaceName];
    const pool    = device.dhcpPools.find(p => {
      if (!iface?.ip) return false;
      return isSameSubnet(iface.ip, p.network, p.prefix);
    }) ?? device.dhcpPools[0];

    if (!pool) {
      this.logEvent(device.id, 'DHCP', this._udpToFrame(udpDatagram), interfaceName, 'No DHCP pool found');
      return;
    }

    const allocate = (): string | null => {
      // Check if already bound to this MAC
      const existing = device.dhcpBindings.find(b => b.mac === clientMac);
      if (existing) return existing.ip;

      // Find next available IP in pool
      const netBase = ipToNumber(pool.network) + 1;
      const netEnd  = ipToNumber(pool.network) | (~(~0 << (32 - pool.prefix))) >>> 0;
      for (let n = netBase; n < netEnd; n++) {
        const candidate = numberToIp(n);
        // Check excluded ranges
        const excluded = pool.excludedRanges.some(
          r => n >= ipToNumber(r.start) && n <= ipToNumber(r.end)
        );
        if (excluded) continue;
        // Check not already bound
        const taken = device.dhcpBindings.find(b => b.ip === candidate);
        if (!taken) return candidate;
      }
      return null;
    };

    if (type === 'DISCOVER' || type === 'REQUEST') {
      const offeredIp = requestedIp ?? allocate();
      if (!offeredIp) {
        this.logEvent(device.id, 'DHCP', this._udpToFrame(udpDatagram), interfaceName, 'DHCP pool exhausted');
        return;
      }

      const replyType = type === 'DISCOVER' ? 'OFFER' : 'ACK';

      if (replyType === 'ACK') {
        // Store binding
        const already = device.dhcpBindings.find(b => b.mac === clientMac);
        if (!already) {
          device.dhcpBindings.push({
            ip: offeredIp,
            mac: clientMac,
            hostname,
            expiresAt: this.time + pool.leaseTime,
          });
        }
      }

      const serverIp = iface?.ip ?? pool.defaultRouter;
      const replyPayload: UdpDatagram = {
        sourcePort: 67,
        destinationPort: 68,
        data: JSON.stringify({
          type: replyType,
          offeredIp,
          subnetMask: prefixToMask(pool.prefix),
          gateway: pool.defaultRouter,
          dns: pool.dnsServer,
          leaseTime: pool.leaseTime,
          serverIp,
        }),
      };

      const replyFrame: EthernetFrame = {
        sourceMac: iface?.mac ?? '00:00:00:00:00:00',
        destinationMac: clientMac || 'ff:ff:ff:ff:ff:ff',
        ethertype: 'IPv4',
        payload: {
          sourceIp: serverIp,
          destinationIp: '255.255.255.255',
          protocol: 'UDP',
          ttl: 64,
          payload: replyPayload,
        } as IPv4Packet,
      };

      this.logEvent(device.id, 'DHCP', replyFrame, interfaceName, `DHCP ${replyType} for ${offeredIp} → ${clientMac}`);
      this.transmit(device.id, interfaceName, replyFrame);
    }
  }

  // -------------------------------------------------------------------------
  // High-level simulation helpers
  // -------------------------------------------------------------------------

  /**
   * Simulate ping from srcDeviceId to dstIp (count probes).
   * Returns IOS-style result with success/fail counts.
   */
  simulatePing(srcDeviceId: string, dstIp: string, count = 5): {
    success: number;
    fail: number;
    results: string[];
  } {
    const device = this.topology.devices[srcDeviceId];
    if (!device) return { success: 0, fail: count, results: [`% Device ${srcDeviceId} not found`] };

    const srcIp = Object.values(device.interfaces).find(i => i.ip && i.up)?.ip;
    if (!srcIp) return { success: 0, fail: count, results: ['% No usable source IP found'] };

    const beforeEventCount = this.events.length;
    let success = 0;
    let symbols = '';

    for (let seq = 1; seq <= count; seq++) {
      const startTime = this.time;
      this._sendEchoRequest(srcDeviceId, srcIp, dstIp, seq);

      // Check if a ECHO_REPLY was received by the source device
      const gotReply = this.events.slice(startTime).some(
        e =>
          e.deviceId === srcDeviceId &&
          e.action === 'RX' &&
          e.frame?.ethertype === 'IPv4' &&
          (e.frame.payload as IPv4Packet)?.protocol === 'ICMP' &&
          ((e.frame.payload as IPv4Packet)?.payload as ICMPPacket)?.type === 'ECHO_REPLY' &&
          ((e.frame.payload as IPv4Packet)?.payload as ICMPPacket)?.sequenceNumber === seq
      );

      if (gotReply) {
        success++;
        symbols += '!';
      } else {
        symbols += '.';
      }
    }

    const fail = count - success;
    const loss = Math.round((fail / count) * 100);
    const results: string[] = [
      `Type escape sequence to abort.`,
      `Sending ${count}, 100-byte ICMP Echos to ${dstIp}, timeout is 2 seconds:`,
      symbols,
      `Success rate is ${100 - loss} percent (${success}/${count})`,
    ];

    return { success, fail, results };
  }

  /**
   * Simulate traceroute from srcDeviceId to dstIp.
   * Returns per-hop output lines in IOS format.
   */
  simulateTraceroute(srcDeviceId: string, dstIp: string, maxHops = 30): string[] {
    const device = this.topology.devices[srcDeviceId];
    if (!device) return [`% Device ${srcDeviceId} not found`];

    const srcIp = Object.values(device.interfaces).find(i => i.ip && i.up)?.ip;
    if (!srcIp) return ['% No usable source IP found'];

    const lines: string[] = [
      `Tracing the route to ${dstIp}`,
      '',
    ];

    for (let ttl = 1; ttl <= maxHops; ttl++) {
      const probeResults: string[] = [];
      let hopIp: string | null = null;
      let reached = false;

      for (let probe = 0; probe < 3; probe++) {
        const beforeLen = this.events.length;

        // Build a probe packet with specified TTL
        const probePacket: IPv4Packet = {
          sourceIp: srcIp,
          destinationIp: dstIp,
          ttl,
          protocol: 'ICMP',
          payload: { type: 'ECHO_REQUEST', code: 0, identifier: ttl, sequenceNumber: probe } as ICMPPacket,
        };
        this._sendIpPacketDirect(srcDeviceId, probePacket);

        // Look for TIME_EXCEEDED or ECHO_REPLY directed back to src
        const newEvents = this.events.slice(beforeLen);
        const ttlExceeded = newEvents.find(
          e =>
            e.deviceId === srcDeviceId &&
            e.action === 'RX' &&
            e.frame?.ethertype === 'IPv4' &&
            (e.frame.payload as IPv4Packet)?.protocol === 'ICMP' &&
            ((e.frame.payload as IPv4Packet)?.payload as ICMPPacket)?.type === 'TIME_EXCEEDED'
        );
        const echoReply = newEvents.find(
          e =>
            e.deviceId === srcDeviceId &&
            e.action === 'RX' &&
            e.frame?.ethertype === 'IPv4' &&
            (e.frame.payload as IPv4Packet)?.protocol === 'ICMP' &&
            ((e.frame.payload as IPv4Packet)?.payload as ICMPPacket)?.type === 'ECHO_REPLY'
        );

        if (echoReply) {
          hopIp = (echoReply.frame.payload as IPv4Packet).sourceIp;
          probeResults.push(`${probe === 0 ? `  ${ttl.toString().padStart(2)} ` : ''}1 ms`);
          reached = true;
        } else if (ttlExceeded) {
          hopIp = (ttlExceeded.frame.payload as IPv4Packet).sourceIp;
          probeResults.push(`${probe === 0 ? `  ${ttl.toString().padStart(2)} ` : ''}1 ms`);
        } else {
          probeResults.push(`${probe === 0 ? `  ${ttl.toString().padStart(2)} ` : ''}*`);
        }
      }

      const hopLabel = hopIp ?? '*';
      lines.push(`  ${ttl.toString().padStart(2)}  ${hopLabel}  ${probeResults.join('  ')}`);

      if (reached) break;
    }

    return lines;
  }

  /**
   * Run a ping and return all related events for packet-path visualisation.
   */
  getPacketPath(srcDeviceId: string, dstIp: string): PacketEvent[] {
    const before = this.events.length;
    this.simulatePing(srcDeviceId, dstIp, 1);
    return this.events.slice(before);
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Send an ICMP echo request and trigger processing */
  private _sendEchoRequest(deviceId: string, srcIp: string, dstIp: string, seq: number): void {
    this._sendIpPacketDirect(deviceId, {
      sourceIp: srcIp,
      destinationIp: dstIp,
      protocol: 'ICMP',
      ttl: 64,
      payload: {
        type: 'ECHO_REQUEST',
        code: 0,
        identifier: 1,
        sequenceNumber: seq,
      } as ICMPPacket,
    });
  }

  /** Public-facing alias kept for backwards compatibility */
  sendIpPacket(deviceId: string, ipPacket: IPv4Packet): void {
    this._sendIpPacket(deviceId, ipPacket);
  }

  private _sendIpPacket(deviceId: string, ipPacket: IPv4Packet): void {
    this.routeIpPacket(deviceId, ipPacket);
  }

  private _sendIpPacketDirect(deviceId: string, ipPacket: IPv4Packet): void {
    this.routeIpPacket(deviceId, ipPacket);
  }

  /** Build a minimal EthernetFrame wrapper around an ARP payload (for logging) */
  private _arpToFrame(arp: ARPFrame): EthernetFrame {
    return {
      sourceMac: arp.senderMac,
      destinationMac: arp.targetMac,
      ethertype: 'ARP',
      payload: arp,
    };
  }

  /** Build a minimal EthernetFrame wrapper around an IPv4 packet (for logging) */
  private _ipToFrame(ipPacket: IPv4Packet): EthernetFrame {
    return {
      sourceMac: '00:00:00:00:00:00',
      destinationMac: '00:00:00:00:00:00',
      ethertype: 'IPv4',
      payload: ipPacket,
    };
  }

  /** Build a minimal EthernetFrame wrapper around a UDP datagram (for logging) */
  private _udpToFrame(udp: UdpDatagram): EthernetFrame {
    return {
      sourceMac: '00:00:00:00:00:00',
      destinationMac: 'ff:ff:ff:ff:ff:ff',
      ethertype: 'IPv4',
      payload: {
        sourceIp: '0.0.0.0',
        destinationIp: '255.255.255.255',
        protocol: 'UDP',
        ttl: 64,
        payload: udp,
      } as IPv4Packet,
    };
  }

  /** Human-readable one-liner for a frame (used in summary field) */
  private _frameSummary(frame: EthernetFrame): string {
    if (frame.ethertype === 'ARP') {
      const arp = frame.payload as ARPFrame;
      return `ARP ${arp.operation} ${arp.senderIp} → ${arp.targetIp}`;
    }
    if (frame.ethertype === 'IPv4') {
      const ip = frame.payload as IPv4Packet;
      if (ip.protocol === 'ICMP') {
        const icmp = ip.payload as ICMPPacket;
        return `ICMP ${icmp.type} ${ip.sourceIp} → ${ip.destinationIp} seq=${icmp.sequenceNumber ?? '?'}`;
      }
      return `IPv4 ${ip.protocol} ${ip.sourceIp} → ${ip.destinationIp}`;
    }
    return `L2 ${frame.ethertype}`;
  }
}
