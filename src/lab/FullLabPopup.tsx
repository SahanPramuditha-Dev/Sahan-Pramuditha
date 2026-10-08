import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ReactFlow, Background, Controls, addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Connection, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { LabState, CanvasNode, CanvasEdge, CableType } from './types';
import type { DeviceType, NetworkDeviceState, Topology } from '../engine/models';
import { createDeviceState } from '../engine/models';
import { NetworkSimulatorEngine } from '../engine/simulator';

import DeviceNode from './DeviceNode';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import Terminal from './Terminal';
import SimulationPanel from './SimulationPanel';
import SecurityAudit from './SecurityAudit';
import IPPlan from './IPPlan';
import { saveToUrl, loadFromUrl, downloadJson } from './SaveShare';
import { SCENARIOS } from './Scenarios';
import type { PacketEvent } from '../engine/packet';

const nodeTypes = { device: DeviceNode };

interface FullLabPopupProps {
  onClose: () => void;
}

export default function FullLabPopup({ onClose }: FullLabPopupProps) {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'connect'>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTerminalDeviceId, setActiveTerminalDeviceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'security' | 'ipplan'>('properties');
  const [simEvents, setSimEvents] = useState<PacketEvent[]>([]);
  const [showTour, setShowTour] = useState(true);
  const engineRef = useRef<NetworkSimulatorEngine | null>(null);

  // Initialize engine on mount
  useEffect(() => {
    const loaded = loadFromUrl();
    if (loaded) {
      setNodes(loaded.nodes);
      setEdges(loaded.edges);
    }
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as CanvasNode[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as CanvasEdge[]),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const srcId = connection.source;
      const dstId = connection.target;
      if (!srcId || !dstId || srcId === dstId) return;

      const newEdge: CanvasEdge = {
        ...connection,
        id: `e-${srcId}-${dstId}-${Date.now()}`,
        type: 'smoothstep',
        data: {
          linkId: `l-${Date.now()}`,
          cableType: 'straight',
          srcInterface: `Fa0/${Math.floor(Math.random() * 24) + 1}`,
          dstInterface: `Fa0/${Math.floor(Math.random() * 24) + 1}`,
          up: true
        }
      } as CanvasEdge;

      setEdges((eds) => addEdge(newEdge, eds) as CanvasEdge[]);
      
      // Update device interfaces
      setNodes((nds) => nds.map(n => {
        if (n.id === srcId || n.id === dstId) {
          const ifaceName = n.id === srcId ? newEdge.data!.srcInterface : newEdge.data!.dstInterface;
          return {
            ...n,
            data: {
              ...n.data,
              state: {
                ...n.data.state,
                interfaces: {
                  ...n.data.state.interfaces,
                  [ifaceName]: { name: ifaceName, mac: `00:11:22:33:44:${Math.floor(Math.random()*90)+10}`, up: true }
                }
              }
            }
          };
        }
        return n;
      }));
    },
    [setEdges, setNodes]
  );

  const onAddDevice = (type: DeviceType) => {
    const id = `dev-${Date.now()}`;
    const newNode: CanvasNode = {
      id,
      type: 'device',
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: {
        deviceId: id,
        type,
        label: `${type}-${nodes.length + 1}`,
        state: createDeviceState(id, type, `${type}${nodes.length + 1}`)
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_: React.MouseEvent, node: CanvasNode) => {
    setSelectedNodeId(node.id);
  };

  const onPaneClick = () => {
    setSelectedNodeId(null);
  };

  const getTopology = (): Topology => {
    const devices: Record<string, NetworkDeviceState> = {};
    nodes.forEach(n => { devices[n.id] = n.data.state; });
    const links: Record<string, import('../engine/models').Link> = {};
    edges.forEach(e => {
      links[e.data!.linkId] = {
        id: e.data!.linkId,
        sourceId: e.source,
        sourceInterface: e.data!.srcInterface,
        targetId: e.target,
        targetInterface: e.data!.dstInterface,
        up: e.data!.up,
        cableType: e.data!.cableType
      };
    });
    return { devices, links };
  };

  const handleDeviceChange = (updated: NetworkDeviceState) => {
    setNodes(nds => nds.map(n => n.id === updated.id ? { ...n, data: { ...n.data, state: updated } } : n));
  };

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const terminalDevice = useMemo(() => nodes.find(n => n.id === activeTerminalDeviceId)?.data.state, [nodes, activeTerminalDeviceId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md text-textMain"
      style={{
        '--bg-main': '#09090b',
        '--card': '#18181b',
        '--border-subtle': '#27272a',
        '--text-main': '#fafafa',
        '--text-muted': '#a1a1aa'
      } as React.CSSProperties}
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        className="w-full max-w-7xl h-full max-h-[900px] bg-card border border-borderSubtle rounded-2xl shadow-2xl flex overflow-hidden relative"
      >
        <Toolbar
          onAddDevice={onAddDevice}
          activeTool={activeTool}
          onSetTool={setActiveTool}
          onUndo={() => {}}
          onRedo={() => {}}
          onDelete={() => {
            if (selectedNodeId) {
              setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
              setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
              setSelectedNodeId(null);
            }
          }}
          onSave={() => downloadJson(nodes, edges)}
          onLoad={() => {
            const url = saveToUrl(nodes, edges);
            window.history.pushState({}, '', url);
            alert('Saved to URL! Copy the link to share.');
          }}
          onExportPng={() => {}}
          onClearAll={() => { setNodes([]); setEdges([]); }}
          onLoadScenario={(name) => {
            const scenario = SCENARIOS.find(s => s.name === name);
            if (scenario) {
              setNodes(scenario.nodes);
              setEdges(scenario.edges);
              setSimEvents([]);
              engineRef.current = new NetworkSimulatorEngine({ devices: scenario.devices, links: {} });
            }
          }}
          onSimulatePacket={() => {
            if (!engineRef.current) engineRef.current = new NetworkSimulatorEngine(getTopology());
            const engine = engineRef.current;
            engine.topology = getTopology();
            
            // Just simulate a ping from first PC to second device as an example
            const devices = Object.values(engine.topology.devices);
            const pcs = devices.filter(d => d.type === 'PC' || d.type === 'Server');
            if (pcs.length >= 2) {
              const src = pcs[0].id;
              const dstIp = Object.values(pcs[1].interfaces)[0]?.ip;
              if (dstIp) {
                const events = engine.getPacketPath(src, dstIp);
                setSimEvents(events);
              } else {
                alert('Second device needs an IP address.');
              }
            } else {
              alert('Need at least 2 endpoints with IPs to simulate a ping.');
            }
          }}
          canUndo={false}
          canRedo={false}
        />

        <div className="flex-1 relative border-l border-r border-borderSubtle flex flex-col">
          <ReactFlow
          nodes={nodes}
          edges={edges.map(e => ({ ...e, animated: simEvents.length > 0 }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          snapToGrid={true}
          fitView
          className="bg-bgMain"
          colorMode="dark"
        >
          <Background gap={24} size={1} color="#334155" />
          <Controls />
        </ReactFlow>

        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-card border border-borderSubtle rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors shadow-lg">
          <i className="fas fa-times"></i>
        </button>

        {simEvents.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {simEvents.map((e, i) => {
              const node = nodes.find(n => n.id === e.deviceId);
              if (!node) return null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.5, duration: 0.3 }}
                  className={`absolute w-4 h-4 rounded-full -ml-2 -mt-2 shadow-[0_0_10px_currentColor] ${
                    e.action === 'DROP' ? 'bg-red-500 text-red-500' :
                    e.action === 'RX' ? 'bg-green-500 text-green-500' :
                    e.action === 'TX' ? 'bg-blue-500 text-blue-500' :
                    'bg-yellow-500 text-yellow-500'
                  }`}
                  style={{
                    left: node.position.x + 28, // center of 56px node
                    top: node.position.y + 28
                  }}
                />
              );
            })}
          </div>
        )}

        {activeTerminalDeviceId && terminalDevice && (
          <Terminal
            device={terminalDevice}
            topology={getTopology()}
            onChange={handleDeviceChange}
            onClose={() => setActiveTerminalDeviceId(null)}
          />
        )}
        <SimulationPanel events={simEvents} onClose={() => setSimEvents([])} />
      </div>

      <div className="w-80 flex flex-col shrink-0 bg-card border-l border-borderSubtle z-20">
        <div className="flex bg-bgMain border-b border-borderSubtle">
          <button onClick={() => setActiveTab('properties')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'properties' ? 'text-accent border-b-2 border-accent' : 'text-textMuted hover:text-textMain'}`}>Properties</button>
          <button onClick={() => setActiveTab('security')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'security' ? 'text-accent border-b-2 border-accent' : 'text-textMuted hover:text-textMain'}`}>Audit</button>
          <button onClick={() => setActiveTab('ipplan')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'ipplan' ? 'text-accent border-b-2 border-accent' : 'text-textMuted hover:text-textMain'}`}>IP Plan</button>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'properties' && (
            <PropertiesPanel
              device={selectedNode?.data.state || null}
              onChange={handleDeviceChange}
              onOpenTerminal={() => {
                if (selectedNodeId) setActiveTerminalDeviceId(selectedNodeId);
              }}
            />
          )}
          {activeTab === 'security' && <SecurityAudit topology={getTopology()} />}
          {activeTab === 'ipplan' && <IPPlan topology={getTopology()} />}
        </div>
        {showTour && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-accent/20 border border-accent rounded-xl p-4 shadow-2xl backdrop-blur-md z-50 max-w-sm text-center text-sm text-accent">
            <h3 className="font-bold mb-2"><i className="fas fa-magic" /> Welcome to the Network Lab</h3>
            <p className="mb-3 text-textMain">1. Use the left toolbar to <b>Load a Scenario</b>.<br/>2. Click a device to view <b>Properties</b> or <b>Audit</b>.<br/>3. Click <b>Simulate Ping</b> to trace packets!</p>
            <button onClick={() => setShowTour(false)} className="px-4 py-1.5 bg-accent text-bgMain font-bold rounded hover:opacity-90">Got it</button>
          </div>
        )}

      </div>
      </motion.div>
    </motion.div>
  );
}
