import type { NetworkDeviceState, Topology, Link as EngineLink } from './models';
import { createDeviceState } from './models';

export function buildTopology(devices: any[], links: any[]): Topology {
  const topo: Topology = { devices: {}, links: {} };

  // Helper to find links
  const getConnections = (id: string) => links.filter(l => l.from === id || l.to === id).map(l => l.from === id ? l.to : l.from);

  // Auto assign logic
  devices.forEach((d, i) => {
    const typeStr = d.type === 'PC' ? 'PC' : d.type === 'Proxy' || d.type === 'Mail' ? 'Server' : d.type;
    const dev = createDeviceState(d.id, typeStr, `${d.type}-${i}`);

    if (d.type === 'PC') {
      dev.interfaces['eth0'] = { name: 'eth0', mac: `00:PC:00:00:00:0${i}`, ip: `192.168.1.${10+i}`, up: true };
      dev.defaultGateway = '192.168.1.1';
      dev.routingTable.push({ destination: '192.168.1.0', prefix: 24, interfaceName: 'eth0', metric: 0, type: 'connected' });
      dev.routingTable.push({ destination: '0.0.0.0', prefix: 0, nextHop: '192.168.1.1', interfaceName: 'eth0', metric: 1, type: 'static' });
    } else if (d.type === 'Switch') {
      const conns = getConnections(d.id);
      conns.forEach((cId, idx) => {
        dev.interfaces[`fa0/${idx+1}`] = { name: `fa0/${idx+1}`, mac: `00:SW:00:00:00:0${idx}`, up: true };
      });
    } else if (d.type === 'Router') {
      dev.interfaces['g0/0'] = { name: 'g0/0', mac: `00:RT:00:00:00:01`, ip: `192.168.1.1`, up: true };
      dev.interfaces['g0/1'] = { name: 'g0/1', mac: `00:RT:00:00:00:02`, ip: `203.0.113.1`, up: true };
      dev.routingTable.push({ destination: '192.168.1.0', prefix: 24, interfaceName: 'g0/0', metric: 0, type: 'connected' });
      dev.routingTable.push({ destination: '203.0.113.0', prefix: 30, interfaceName: 'g0/1', metric: 0, type: 'connected' });
      dev.routingTable.push({ destination: '0.0.0.0', prefix: 0, nextHop: '203.0.113.2', interfaceName: 'g0/1', metric: 1, type: 'static' });
    } else if (d.type === 'Firewall') {
      dev.interfaces['eth0'] = { name: 'eth0', mac: `00:FW:00:00:00:01`, ip: `203.0.113.2`, up: true };
      dev.interfaces['eth1'] = { name: 'eth1', mac: `00:FW:00:00:00:02`, ip: `10.0.0.1`, up: true };
      dev.routingTable.push({ destination: '203.0.113.0', prefix: 30, interfaceName: 'eth0', metric: 0, type: 'connected' });
      dev.routingTable.push({ destination: '10.0.0.0', prefix: 24, interfaceName: 'eth1', metric: 0, type: 'connected' });
      dev.routingTable.push({ destination: '192.168.1.0', prefix: 24, nextHop: '203.0.113.1', interfaceName: 'eth0', metric: 1, type: 'static' });
    } else if (d.type === 'Proxy' || d.type === 'Mail') {
      dev.interfaces['eth0'] = { name: 'eth0', mac: `00:SV:00:00:00:0${i}`, ip: `10.0.0.${10+i}`, up: true };
      dev.defaultGateway = '10.0.0.1';
      dev.routingTable.push({ destination: '10.0.0.0', prefix: 24, interfaceName: 'eth0', metric: 0, type: 'connected' });
      dev.routingTable.push({ destination: '0.0.0.0', prefix: 0, nextHop: '10.0.0.1', interfaceName: 'eth0', metric: 1, type: 'static' });
    } else if (d.type === 'Cloud') {
       dev.interfaces['eth0'] = { name: 'eth0', mac: `00:CL:00:00:00:01`, ip: `8.8.8.8`, up: true };
       dev.routingTable.push({ destination: '0.0.0.0', prefix: 0, nextHop: '203.0.113.2', interfaceName: 'eth0', metric: 1, type: 'static' }); // Fake route back
    }

    topo.devices[d.id] = dev;
  });

  // Link assignment
  links.forEach((l, i) => {
    const sDev = topo.devices[l.from];
    const tDev = topo.devices[l.to];
    if (!sDev || !tDev) return;

    // Pick first available interface
    const sIf = Object.keys(sDev.interfaces)[0];
    const tIf = Object.keys(tDev.interfaces)[0];

    topo.links[i.toString()] = {
      id: i.toString(),
      sourceId: l.from,
      sourceInterface: sIf,
      targetId: l.to,
      targetInterface: tIf,
      up: true,
      cableType: 'straight'
    };
  });

  return topo;
}
