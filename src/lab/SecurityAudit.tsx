import type { NetworkDeviceState, Topology } from '../engine/models';

interface SecurityAuditProps {
  topology: Topology;
}

export default function SecurityAudit({ topology }: SecurityAuditProps) {
  const devices = Object.values(topology.devices);
  const routersAndSwitches = devices.filter(d => ['Router', 'Firewall', 'L2Switch', 'L3Switch'].includes(d.type));
  
  const findings: { type: 'high' | 'medium' | 'low' | 'good'; msg: string; fix?: string }[] = [];
  let score = 100;

  routersAndSwitches.forEach(d => {
    // Check Enable Secret
    if (!d.enableSecret) {
      score -= 15;
      findings.push({
        type: 'high',
        msg: `${d.hostname}: No enable secret configured.`,
        fix: 'enable secret <password>'
      });
    }

    // Check Password Encryption
    if (!d.passwordEncryption) {
      score -= 10;
      findings.push({
        type: 'medium',
        msg: `${d.hostname}: Service password-encryption is disabled.`,
        fix: 'service password-encryption'
      });
    }

    // Check SSH vs Telnet
    if (!d.sshEnabled) {
      score -= 5;
      findings.push({
        type: 'low',
        msg: `${d.hostname}: SSH is not enabled (no RSA keys).`,
        fix: 'crypto key generate rsa'
      });
    }
  });

  // Flat network check
  const hasVlans = devices.some(d => d.vlans && d.vlans.length > 1);
  const routers = devices.filter(d => d.type === 'Router');
  if (!hasVlans && routers.length <= 1) {
    score -= 10;
    findings.push({
      type: 'medium',
      msg: 'Flat network detected. Consider segmenting traffic with VLANs or multiple routed subnets.',
    });
  }

  if (score === 100 && devices.length > 0) {
    findings.push({ type: 'good', msg: 'Excellent! No major security misconfigurations detected.' });
  }

  score = Math.max(0, score);
  
  const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const circleColor = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-yellow-500' : 'border-red-500';

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-borderSubtle bg-bgMain shrink-0">
        <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
          <i className="fas fa-shield-alt text-accent" /> Security Audit
        </h2>
      </div>

      <div className="p-6 flex flex-col items-center justify-center border-b border-borderSubtle shrink-0">
        <div className={`w-32 h-32 rounded-full border-4 ${circleColor} flex items-center justify-center mb-2`}>
          <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
        </div>
        <div className="text-textMuted text-sm font-bold">Network Security Score</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {findings.map((f, i) => (
          <div key={i} className={`p-3 rounded-lg border ${
            f.type === 'high' ? 'bg-red-500/10 border-red-500/30' :
            f.type === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
            f.type === 'low' ? 'bg-blue-500/10 border-blue-500/30' :
            'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-start gap-2">
              <i className={`fas mt-1 ${
                f.type === 'high' ? 'fa-exclamation-circle text-red-500' :
                f.type === 'medium' ? 'fa-exclamation-triangle text-yellow-500' :
                f.type === 'low' ? 'fa-info-circle text-blue-500' :
                'fa-check-circle text-green-500'
              }`} />
              <div>
                <div className="text-sm font-bold text-textMain">{f.msg}</div>
                {f.fix && (
                  <div className="mt-2 text-xs font-mono bg-black/30 p-1.5 rounded text-green-400">
                    Fix: {f.fix}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
