import type { LabState } from './types';
import { createDeviceState } from '../engine/models';

function createScenario(name: string, nodes: any[], edges: any[], devices: any) {
  return { name, nodes, edges, devices };
}

// 1. Basic Office Network
const officeDevices = {
  'router1': createDeviceState('router1', 'Router', 'HQ-Router'),
  'sw1': createDeviceState('sw1', 'L2Switch', 'Core-SW'),
  'pc1': createDeviceState('pc1', 'PC', 'CEO-PC'),
  'srv1': createDeviceState('srv1', 'Server', 'Web-Server'),
};
// Configure Office
officeDevices['router1'].interfaces['g0/0'] = { name: 'g0/0', mac: '00:00:00:00:00:01', ip: '192.168.1.1', subnetPrefix: 24, up: true };
officeDevices['router1'].interfaces['g0/1'] = { name: 'g0/1', mac: '00:00:00:00:00:02', ip: '10.0.0.1', subnetPrefix: 24, up: true };
officeDevices['router1'].enableSecret = 'cisco';
officeDevices['router1'].passwordEncryption = true;
officeDevices['router1'].sshEnabled = true;

officeDevices['pc1'].interfaces['eth0'] = { name: 'eth0', mac: '00:11:22:33:44:55', ip: '192.168.1.10', subnetPrefix: 24, up: true };
officeDevices['pc1'].defaultGateway = '192.168.1.1';

officeDevices['srv1'].interfaces['eth0'] = { name: 'eth0', mac: '00:11:22:33:44:66', ip: '10.0.0.10', subnetPrefix: 24, up: true };
officeDevices['srv1'].defaultGateway = '10.0.0.1';

officeDevices['sw1'].interfaces['fa0/1'] = { name: 'fa0/1', mac: '00:SW:00:00:00:01', up: true, switchport: { mode: 'access', vlan: 1 } };
officeDevices['sw1'].interfaces['fa0/2'] = { name: 'fa0/2', mac: '00:SW:00:00:00:02', up: true, switchport: { mode: 'access', vlan: 1 } };
officeDevices['sw1'].interfaces['fa0/3'] = { name: 'fa0/3', mac: '00:SW:00:00:00:03', up: true, switchport: { mode: 'access', vlan: 1 } };

const officeNodes = [
  { id: 'router1', type: 'device', position: { x: 400, y: 100 }, data: { deviceId: 'router1', type: 'Router', label: 'HQ-Router', state: officeDevices['router1'] } },
  { id: 'sw1', type: 'device', position: { x: 400, y: 250 }, data: { deviceId: 'sw1', type: 'L2Switch', label: 'Core-SW', state: officeDevices['sw1'] } },
  { id: 'pc1', type: 'device', position: { x: 200, y: 400 }, data: { deviceId: 'pc1', type: 'PC', label: 'CEO-PC', state: officeDevices['pc1'] } },
  { id: 'srv1', type: 'device', position: { x: 600, y: 400 }, data: { deviceId: 'srv1', type: 'Server', label: 'Web-Server', state: officeDevices['srv1'] } },
];

const officeEdges = [
  { id: 'e-r1-sw1', source: 'router1', target: 'sw1', type: 'smoothstep', data: { linkId: 'l1', cableType: 'straight', srcInterface: 'g0/0', dstInterface: 'fa0/1', up: true } },
  { id: 'e-sw1-pc1', source: 'sw1', target: 'pc1', type: 'smoothstep', data: { linkId: 'l2', cableType: 'straight', srcInterface: 'fa0/2', dstInterface: 'eth0', up: true } },
  { id: 'e-sw1-srv1', source: 'sw1', target: 'srv1', type: 'smoothstep', data: { linkId: 'l3', cableType: 'straight', srcInterface: 'fa0/3', dstInterface: 'eth0', up: true } },
];

export const OFFICE_SCENARIO = createScenario('Basic Office', officeNodes, officeEdges, officeDevices);

// 2. Security Nightmare
const nightmareDevices = JSON.parse(JSON.stringify(officeDevices));
nightmareDevices['router1'].enableSecret = '';
nightmareDevices['router1'].passwordEncryption = false;
nightmareDevices['router1'].sshEnabled = false;
nightmareDevices['pc1'].defaultGateway = ''; // Broken gateway for puzzle
const nightmareNodes = JSON.parse(JSON.stringify(officeNodes));
nightmareNodes.forEach((n: any) => n.data.state = nightmareDevices[n.id]);

export const NIGHTMARE_SCENARIO = createScenario('Security Nightmare', nightmareNodes, officeEdges, nightmareDevices);

export const SCENARIOS = [
  OFFICE_SCENARIO,
  NIGHTMARE_SCENARIO
];
