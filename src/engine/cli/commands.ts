/**
 * Shared command result types and constants for the CLI engine.
 */

import type { CliMode, NetworkDeviceState } from '../models';

// ---------------------------------------------------------------------------
// CmdResult
// ---------------------------------------------------------------------------

export type CmdResult = {
  /** Text printed to the terminal (may contain newlines). */
  output: string;
  /** If set, the CLI session's mode transitions to this value. */
  newMode?: CliMode;
  /** Context label, e.g. "GigabitEthernet0/0" or "vty 0 4". */
  newContext?: string;
  /** Optional state mutation applied to the device before re-rendering. */
  mutate?: (device: NetworkDeviceState) => void;
  /** When true, the output should be displayed as an error (red text etc.). */
  error?: boolean;
};

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

export const COMMAND_NOT_SUPPORTED =
  '% Command not supported in this simulator';

export const INVALID_INPUT =
  "% Invalid input detected at '^' marker.";

export const INVALID_INPUT_CONFIG =
  '% Invalid input detected';

// ---------------------------------------------------------------------------
// Utility helpers used across handler files
// ---------------------------------------------------------------------------

/**
 * Convert dotted-decimal subnet mask → CIDR prefix length.
 * e.g. "255.255.255.0" → 24
 */
export function maskToPrefix(mask: string): number {
  return mask
    .split('.')
    .reduce((acc, octet) => {
      let n = parseInt(octet, 10);
      let bits = 0;
      while (n > 0) {
        bits += n & 1;
        n >>= 1;
      }
      return acc + bits;
    }, 0);
}

/**
 * Convert CIDR prefix length → dotted-decimal subnet mask.
 * e.g. 24 → "255.255.255.0"
 */
export function prefixToMask(prefix: number): string {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return [
    (mask >>> 24) & 0xff,
    (mask >>> 16) & 0xff,
    (mask >>> 8) & 0xff,
    mask & 0xff,
  ].join('.');
}

/**
 * Derive network address from IP + prefix.
 * e.g. ("192.168.1.100", 24) → "192.168.1.0"
 */
export function networkAddress(ip: string, prefix: number): string {
  const mask = (~0 << (32 - prefix)) >>> 0;
  const octets = ip.split('.').map(Number);
  const ipInt =
    ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>>
    0;
  const netInt = (ipInt & mask) >>> 0;
  return [
    (netInt >>> 24) & 0xff,
    (netInt >>> 16) & 0xff,
    (netInt >>> 8) & 0xff,
    netInt & 0xff,
  ].join('.');
}

/**
 * Pad/truncate a string to a fixed column width.
 */
export function col(s: string, width: number): string {
  if (s.length >= width) return s.slice(0, width - 1) + ' ';
  return s.padEnd(width);
}

/**
 * Validate an IPv4 address string.
 */
export function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}
