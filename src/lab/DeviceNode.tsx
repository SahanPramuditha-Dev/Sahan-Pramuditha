import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { DeviceType } from '../engine/models';
import type { CanvasNode } from './types';

const DEVICE_ICON_MAP: Record<DeviceType, { icon: string; color: string; bg: string }> = {
  PC: { icon: 'fa-desktop', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  Laptop: { icon: 'fa-laptop', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  Server: { icon: 'fa-server', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  L2Switch: { icon: 'fa-random', color: 'text-green-400', bg: 'bg-green-500/10' },
  L3Switch: { icon: 'fa-sitemap', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  Router: { icon: 'fa-route', color: 'text-red-400', bg: 'bg-red-500/10' },
  Firewall: { icon: 'fa-shield-alt', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  Cloud: { icon: 'fa-cloud', color: 'text-blue-300', bg: 'bg-blue-400/10' },
  AccessPoint: { icon: 'fa-wifi', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  Proxy: { icon: 'fa-server', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  DNS: { icon: 'fa-globe', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  DHCP: { icon: 'fa-network-wired', color: 'text-lime-400', bg: 'bg-lime-500/10' },
  Web: { icon: 'fa-globe', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  Mail: { icon: 'fa-envelope', color: 'text-violet-400', bg: 'bg-violet-500/10' },
};

export default function DeviceNode({ data, selected }: { data: CanvasNode['data']; selected: boolean }) {
  const meta = DEVICE_ICON_MAP[data.type] || DEVICE_ICON_MAP['PC'];
  const interfaces = Object.values(data.state?.interfaces || {});
  const anyDown = interfaces.some(i => !i.up);
  const statusColor = interfaces.length === 0 ? 'bg-gray-500' : anyDown ? 'bg-red-500' : 'bg-green-500';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl shadow-lg border-2 bg-card cursor-pointer group ${
        selected ? 'border-accent shadow-[0_0_15px_rgba(var(--accent-color),0.5)]' : 'border-borderSubtle hover:border-accent'
      }`}
      data-device-type={data.type}
    >
      <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${statusColor} -translate-y-1/3 translate-x-1/3`} />
      
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}>
        <i className={`fas ${meta.icon} ${meta.color} text-xl`} />
      </div>

      <div className="absolute -bottom-6 whitespace-nowrap text-xs font-bold text-textMain bg-bgMain/90 px-1.5 py-0.5 rounded shadow-sm border border-borderSubtle">
        {data.label}
      </div>

      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-borderSubtle hover:!bg-accent !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-borderSubtle hover:!bg-accent !border-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-borderSubtle hover:!bg-accent !border-0" id="left" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-borderSubtle hover:!bg-accent !border-0" id="right" />
    </motion.div>
  );
}
