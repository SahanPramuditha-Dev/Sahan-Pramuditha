import type { Node, Edge } from '@xyflow/react';
import type { DeviceType, NetworkDeviceState } from '../engine/models';

export type CanvasNode = Node<{
  deviceId: string;
  type: DeviceType;
  label: string;
  state: NetworkDeviceState;
}, 'device'>;

export type CableType = 'straight' | 'crossover' | 'serial' | 'console' | 'fiber';

export type CanvasEdge = Edge<{
  linkId: string;
  cableType: CableType;
  srcInterface: string;
  dstInterface: string;
  up: boolean;
}>;

export interface LabState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  devices: Record<string, NetworkDeviceState>;
  activeTerminalDeviceId: string | null;
  selectedNodeId: string | null;
  simEvents: import('../engine/packet').PacketEvent[];
  simPlaying: boolean;
  simStep: number;
  panelTab: 'properties' | 'terminal' | 'services' | 'simulation' | 'security' | 'ipplan';
}
