/**
 * CLI Parser – tokenises raw Cisco IOS CLI strings and expands abbreviations.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedCommand {
  verb: string;
  args: string[];
}

// ---------------------------------------------------------------------------
// Abbreviation table (order matters – longer prefixes first)
// ---------------------------------------------------------------------------

/** Exact-match abbreviations for whole commands / tokens */
const EXACT_ABBREVS: Record<string, string> = {
  'en': 'enable',
  'conf': 'configure',
  't': 'terminal',
  'int': 'interface',
  'sh': 'show',
  'no sh': 'no shutdown',
  'wr': 'write',
  'cop': 'copy',
  'exi': 'exit',
  'conf t': 'configure terminal',
  'wr mem': 'write memory',
  'wr m': 'write memory',
  'sh ip int br': 'show ip interface brief',
  'sh ip int brief': 'show ip interface brief',
  'sh int': 'show interfaces',
  'sh ip ro': 'show ip route',
  'sh run': 'show running-config',
  'sh ver': 'show version',
  'sh arp': 'show arp',
  'sh vlan br': 'show vlan brief',
  'sh mac': 'show mac address-table',
  'sh mac addr': 'show mac address-table',
  'sh int trunk': 'show interfaces trunk',
};

/** Prefix-based expansions for interface names */
const PREFIX_EXPANSIONS: Array<[string, string]> = [
  ['gigabitethernet', 'GigabitEthernet'],
  ['gi', 'GigabitEthernet'],
  ['fastethernet', 'FastEthernet'],
  ['fa', 'FastEthernet'],
  ['serial', 'Serial'],
  ['se', 'Serial'],
  ['loopback', 'Loopback'],
  ['lo', 'Loopback'],
  ['vlan', 'Vlan'],
  ['vl', 'Vlan'],
  ['ethernet', 'Ethernet'],
  ['eth', 'Ethernet'],
  ['tunnel', 'Tunnel'],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Expand an interface-name token, e.g. "gi0/0" → "GigabitEthernet0/0" */
function expandInterfaceName(token: string): string {
  const lower = token.toLowerCase();
  for (const [prefix, full] of PREFIX_EXPANSIONS) {
    if (lower.startsWith(prefix)) {
      const suffix = token.slice(prefix.length);
      return full + suffix;
    }
  }
  return token;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lowercases, trims and splits a raw CLI string into verb + args.
 */
export function parseCommand(raw: string): ParsedCommand {
  const trimmed = raw.trim().toLowerCase();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const [verb = '', ...args] = parts;
  return { verb, args };
}

/**
 * Expand Cisco abbreviations in a raw command string.
 * Tries exact-match table first, then token-level prefix expansion.
 */
export function expandAbbrev(cmd: string): string {
  const trimmed = cmd.trim();
  const lower = trimmed.toLowerCase();

  // 1. Exact-match lookup (case-insensitive on key)
  if (EXACT_ABBREVS[lower]) {
    return EXACT_ABBREVS[lower];
  }

  // 2. Token-by-token expansion
  const tokens = trimmed.split(/\s+/);
  const expanded = tokens.map((tok, idx) => {
    // First token: check abbreviation table
    if (idx === 0) {
      const abbr = EXACT_ABBREVS[tok.toLowerCase()];
      if (abbr) return abbr;
    }
    // Interface name tokens
    return expandInterfaceName(tok);
  });

  return expanded.join(' ');
}

// ---------------------------------------------------------------------------
// Mode-aware completions
// ---------------------------------------------------------------------------

const MODE_COMMANDS: Record<string, string[]> = {
  user_exec: [
    'enable',
    'exit',
    'show version',
    'show ?',
    'ping',
    'traceroute',
    'help',
  ],
  privileged_exec: [
    'configure terminal',
    'disable',
    'reload',
    'write memory',
    'copy running-config startup-config',
    'show ip interface brief',
    'show ip route',
    'show interfaces',
    'show running-config',
    'show arp',
    'show version',
    'show vlan brief',
    'show mac address-table',
    'show interfaces trunk',
    'ping',
    'traceroute',
    'debug',
    'undebug',
    'clock',
    'exit',
  ],
  global_config: [
    'hostname',
    'enable secret',
    'service password-encryption',
    'no ip domain-lookup',
    'ip domain-name',
    'ip route',
    'no ip route',
    'interface',
    'line console 0',
    'line vty 0 4',
    'banner motd',
    'username',
    'crypto key generate rsa',
    'ip access-list extended',
    'ip dhcp pool',
    'ip dhcp excluded-address',
    'ip nat inside source list',
    'vlan',
    'do',
    'exit',
    'end',
  ],
  interface_config: [
    'ip address',
    'no ip address',
    'no shutdown',
    'shutdown',
    'description',
    'encapsulation dot1q',
    'switchport mode access',
    'switchport mode trunk',
    'switchport access vlan',
    'switchport trunk allowed vlan',
    'ip nat inside',
    'ip nat outside',
    'ip access-group',
    'ip helper-address',
    'switchport port-security',
    'switchport port-security maximum',
    'switchport port-security violation',
    'switchport port-security mac-address sticky',
    'do',
    'exit',
    'end',
  ],
  line_config: [
    'password',
    'login',
    'exec-timeout',
    'transport input ssh',
    'transport input telnet',
    'transport input none',
    'do',
    'exit',
    'end',
  ],
  vlan_config: [
    'name',
    'state active',
    'state suspend',
    'exit',
    'end',
  ],
};

/**
 * Return possible completions for a partial command in a given CLI mode.
 */
export function getHelp(partialCmd: string, mode: string): string[] {
  const commands = MODE_COMMANDS[mode] ?? MODE_COMMANDS['privileged_exec'];
  if (!partialCmd.trim()) return commands;

  const lower = partialCmd.toLowerCase().trim();
  return commands.filter((c) => c.toLowerCase().startsWith(lower));
}
