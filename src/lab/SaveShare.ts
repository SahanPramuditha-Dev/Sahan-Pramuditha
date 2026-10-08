import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { LabState } from './types';

export function saveToUrl(nodes: any[], edges: any[]): string {
  const json = JSON.stringify({ nodes, edges });
  const compressed = compressToEncodedURIComponent(json);
  const url = new URL(window.location.href);
  url.searchParams.set('lab', compressed);
  return url.toString();
}

export function loadFromUrl(): { nodes: any[], edges: any[] } | null {
  const url = new URL(window.location.href);
  const compressed = url.searchParams.get('lab');
  if (!compressed) return null;
  try {
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse lab from URL', e);
    return null;
  }
}

export function downloadJson(nodes: any[], edges: any[]) {
  const json = JSON.stringify({ nodes, edges }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `network-lab-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
