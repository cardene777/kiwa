import type { AxisStep, Severity } from './types.js';

/**
 * DAST (Dynamic Application Security Testing) axis — OWASP ZAP-style
 * live-app crawl + attack attempt + vulnerability confirmation。
 */
export type DastState = 'idle' | 'crawling' | 'attacking' | 'vuln-found' | 'completed';

export interface DastAttack {
  attackType: 'xss' | 'sqli' | 'csrf' | 'xxe' | 'ssrf' | 'command-injection' | 'path-traversal';
  targetUrl: string;
  payload: string;
  successful: boolean;
}

export interface DastVuln {
  vulnClass: string;
  cweId: string;
  targetUrl: string;
  severity: Severity;
  evidence: string;
}

export interface DastSession {
  scanId: string;
  provider: 'owasp-zap';
  target: string;
  crawledUrls: number;
  attacks: DastAttack[];
  vulns: DastVuln[];
  state: DastState;
  history: AxisStep<DastState>[];
}

export function startDastScan(input: { scanId: string; target: string }): DastSession {
  const session: DastSession = {
    scanId: input.scanId,
    provider: 'owasp-zap',
    target: input.target,
    crawledUrls: 0,
    attacks: [],
    vulns: [],
    state: 'crawling',
    history: [],
  };
  const step: AxisStep<DastState> = {
    neutralEvent: 'dast.crawl-started',
    provider: 'owasp-zap',
    state: 'crawling',
    metadata: { scanId: input.scanId, target: input.target },
  };
  session.history.push(step);
  return session;
}

export function crawlDastUrls(
  session: DastSession,
  input: { count: number },
): AxisStep<DastState> {
  session.crawledUrls += input.count;
  const step: AxisStep<DastState> = {
    neutralEvent: 'dast.crawl-started',
    provider: 'owasp-zap',
    state: session.state,
    metadata: { scanId: session.scanId, count: input.count, totalCrawled: session.crawledUrls },
  };
  session.history.push(step);
  return step;
}

export function attemptDastAttack(
  session: DastSession,
  attack: DastAttack,
): AxisStep<DastState> {
  session.attacks.push(attack);
  session.state = 'attacking';
  const step: AxisStep<DastState> = {
    neutralEvent: 'dast.attack-attempted',
    provider: 'owasp-zap',
    state: 'attacking',
    metadata: {
      scanId: session.scanId,
      attackType: attack.attackType,
      targetUrl: attack.targetUrl,
      successful: attack.successful,
    },
  };
  session.history.push(step);
  return step;
}

export function confirmDastVuln(
  session: DastSession,
  vuln: DastVuln,
): AxisStep<DastState> {
  session.vulns.push(vuln);
  session.state = 'vuln-found';
  const step: AxisStep<DastState> = {
    neutralEvent: 'dast.vulnerability-confirmed',
    provider: 'owasp-zap',
    state: 'vuln-found',
    metadata: {
      scanId: session.scanId,
      vulnClass: vuln.vulnClass,
      cweId: vuln.cweId,
      severity: vuln.severity,
      targetUrl: vuln.targetUrl,
    },
  };
  session.history.push(step);
  return step;
}

export function completeDastScan(session: DastSession): AxisStep<DastState> {
  session.state = 'completed';
  const successfulAttacks = session.attacks.filter((a) => a.successful).length;
  const criticalCount = session.vulns.filter((v) => v.severity === 'critical').length;
  const step: AxisStep<DastState> = {
    neutralEvent: 'dast.scan-completed',
    provider: 'owasp-zap',
    state: 'completed',
    metadata: {
      scanId: session.scanId,
      crawledUrls: session.crawledUrls,
      attackCount: session.attacks.length,
      successfulAttacks,
      vulnCount: session.vulns.length,
      criticalCount,
    },
  };
  session.history.push(step);
  return step;
}
