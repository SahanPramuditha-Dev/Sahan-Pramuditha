export function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

export function getSubnetMask(prefix: number): number {
  return prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
}

export function getNetworkAddress(ip: string, prefix: number): number {
  return ipToNumber(ip) & getSubnetMask(prefix);
}

export function isSameSubnet(ip1: string, ip2: string, prefix: number): boolean {
  return getNetworkAddress(ip1, prefix) === getNetworkAddress(ip2, prefix);
}

export function generateMac(): string {
  return "02:" + Array.from({length: 5}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':');
}

/** Convert a dotted-decimal subnet mask to a prefix length (e.g. "255.255.255.0" → 24) */
export function maskToPrefix(mask: string): number {
  const n = ipToNumber(mask);
  let count = 0;
  for (let bit = 31; bit >= 0; bit--) {
    if (n & (1 << bit)) count++;
    else break;
  }
  return count;
}

/** Convert a prefix length to a dotted-decimal subnet mask (e.g. 24 → "255.255.255.0") */
export function prefixToMask(prefix: number): string {
  return numberToIp(prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0);
}
