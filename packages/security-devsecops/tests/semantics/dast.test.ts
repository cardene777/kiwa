import { describe, expect, it } from 'vitest';
import {
  attemptDastAttack,
  completeDastScan,
  confirmDastVuln,
  crawlDastUrls,
  startDastScan,
} from '../../src/index.js';

describe('dast axis', () => {
  it('startDastScan initializes with owasp-zap', () => {
    const s = startDastScan({ scanId: 's-1', target: 'https://target.example' });
    expect(s.provider).toBe('owasp-zap');
    expect(s.state).toBe('crawling');
  });

  it('crawlDastUrls accumulates', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    crawlDastUrls(s, { count: 50 });
    expect(s.crawledUrls).toBe(50);
  });

  it('attemptDastAttack records attack', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    const step = attemptDastAttack(s, {
      attackType: 'sqli',
      targetUrl: 'https://x/login',
      payload: "' OR 1=1--",
      successful: true,
    });
    expect(step.state).toBe('attacking');
    expect(step.metadata.attackType).toBe('sqli');
  });

  it('confirmDastVuln records confirmed vuln', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    const step = confirmDastVuln(s, {
      vulnClass: 'SQL Injection',
      cweId: 'CWE-89',
      targetUrl: 'https://x/login',
      severity: 'critical',
      evidence: 'Error-based extraction',
    });
    expect(step.state).toBe('vuln-found');
    expect(step.metadata.cweId).toBe('CWE-89');
  });

  it('completeDastScan counts successful attacks + critical vulns', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    attemptDastAttack(s, {
      attackType: 'xss',
      targetUrl: 'x',
      payload: 'x',
      successful: true,
    });
    attemptDastAttack(s, {
      attackType: 'sqli',
      targetUrl: 'x',
      payload: 'x',
      successful: false,
    });
    confirmDastVuln(s, {
      vulnClass: 'XSS',
      cweId: 'CWE-79',
      targetUrl: 'x',
      severity: 'critical',
      evidence: 'x',
    });
    const step = completeDastScan(s);
    expect(step.metadata.successfulAttacks).toBe(1);
    expect(step.metadata.criticalCount).toBe(1);
  });

  it('all 7 attack types work', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    for (const attackType of [
      'xss',
      'sqli',
      'csrf',
      'xxe',
      'ssrf',
      'command-injection',
      'path-traversal',
    ] as const) {
      const step = attemptDastAttack(s, {
        attackType,
        targetUrl: 'x',
        payload: 'x',
        successful: false,
      });
      expect(step.metadata.attackType).toBe(attackType);
    }
    expect(s.attacks).toHaveLength(7);
  });

  it('history accumulates events', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    crawlDastUrls(s, { count: 5 });
    attemptDastAttack(s, {
      attackType: 'xss',
      targetUrl: 'x',
      payload: 'x',
      successful: true,
    });
    confirmDastVuln(s, {
      vulnClass: 'XSS',
      cweId: 'CWE-79',
      targetUrl: 'x',
      severity: 'high',
      evidence: 'x',
    });
    completeDastScan(s);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'dast.crawl-started',
      'dast.crawl-started',
      'dast.attack-attempted',
      'dast.vulnerability-confirmed',
      'dast.scan-completed',
    ]);
  });
});
