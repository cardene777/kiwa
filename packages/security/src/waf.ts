/**
 * Axis 4 — Web Application Firewall (WAF) rule engine。
 *
 * 4 sub-axis ...
 * - OWASP CRS (Core Rule Set の代表的 rule id 群 SSOT)
 * - rule engine (regex / SQL injection / XSS pattern matching)
 * - false positive (allowlist / exception rule で誤検知抑止)
 * - custom rule (project 固有 rule の追加 + priority)
 */

import type { SecurityEvent } from './types.js';

/** WAF が判定する request の共通形状。 */
export interface WafRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: string;
  ip?: string;
}

export type WafRuleAction = 'block' | 'warn' | 'allow';

export interface WafRule {
  id: string;
  /** OWASP CRS category (WAF_XSS / WAF_SQLI / WAF_LFI / WAF_RFI 等)。 */
  category: string;
  /** 適合すれば match、 検査対象は request.path + body の join 検査。 */
  pattern: RegExp;
  action: WafRuleAction;
  /** 大きいほど先に評価。 default 100。 */
  priority?: number;
  /** false positive suppression 用の exception path。 */
  exceptionPaths?: string[];
}

export interface WafDecision {
  action: WafRuleAction;
  matchedRuleId: string | null;
  matchedCategory: string | null;
  reason: string;
}

/** OWASP CRS の代表 rule id を kiwa が使う shape に写像した既定 rule 集。 */
export const OWASP_CRS_DEFAULT: WafRule[] = [
  {
    id: 'CRS-941100',
    category: 'WAF_XSS',
    // Any <script>-like tag OR a bare `javascript:` URI prefix.
    pattern: /(<\s*script\b|javascript:)/i,
    action: 'block',
    priority: 900,
  },
  {
    id: 'CRS-942100',
    category: 'WAF_SQLI',
    // SQLi tautologies + UNION SELECT + comment injection.
    pattern: /(\bunion\b\s+\bselect\b|('|")\s*or\s+\d+=\d+|--\s*$|;\s*drop\b)/i,
    action: 'block',
    priority: 900,
  },
  {
    id: 'CRS-930100',
    category: 'WAF_LFI',
    // ../ traversal or /etc/passwd probe.
    pattern: /(\.\.\/|\/etc\/passwd|\/proc\/self)/i,
    action: 'block',
    priority: 800,
  },
  {
    id: 'CRS-931100',
    category: 'WAF_RFI',
    // http(s):// injected into a path/body without allowlisted host.
    pattern: /((https?|ftp):\/\/[^\s]+)/i,
    action: 'warn',
    priority: 700,
  },
];

export interface WafPolicy {
  rules: WafRule[];
}

export function createWafPolicy(rules: WafRule[] = OWASP_CRS_DEFAULT): WafPolicy {
  const sorted = [...rules].sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
  return { rules: sorted };
}

export function addCustomRule(policy: WafPolicy, rule: WafRule): WafPolicy {
  return createWafPolicy([...policy.rules, rule]);
}

export function evaluateWaf(policy: WafPolicy, request: WafRequest): WafDecision {
  const target = [request.path, request.body ?? '', ...Object.values(request.query ?? {})]
    .join(' ');
  for (const rule of policy.rules) {
    if ((rule.exceptionPaths ?? []).some((ep) => request.path.startsWith(ep))) {
      continue;
    }
    if (rule.pattern.test(target)) {
      return {
        action: rule.action,
        matchedRuleId: rule.id,
        matchedCategory: rule.category,
        reason: `waf: rule ${rule.id} (${rule.category}) matched — action ${rule.action}`,
      };
    }
  }
  return {
    action: 'allow',
    matchedRuleId: null,
    matchedCategory: null,
    reason: 'waf: no rule matched',
  };
}

/**
 * False positive suppression — allow-list per path で特定 rule を除外する
 * partial policy override。 使い方は既存 policy + 部分 rule の rebuild。
 */
export function suppressFalsePositive(
  policy: WafPolicy,
  ruleId: string,
  exceptionPath: string,
): WafPolicy {
  const nextRules = policy.rules.map((rule) => {
    if (rule.id !== ruleId) return rule;
    return {
      ...rule,
      exceptionPaths: [...(rule.exceptionPaths ?? []), exceptionPath],
    };
  });
  return createWafPolicy(nextRules);
}

export function toWafEvent(input: {
  provider: 'coraza' | 'helmet';
  decision: WafDecision;
  request: WafRequest;
  timestamp: number;
}): SecurityEvent {
  const verdict = input.decision.action === 'allow'
    ? 'allow'
    : input.decision.action === 'warn'
      ? 'warn'
      : 'deny';
  return {
    axis: 'waf',
    provider: input.provider,
    verdict,
    reason: input.decision.reason,
    payload: {
      path: input.request.path,
      method: input.request.method,
      matchedRuleId: input.decision.matchedRuleId,
      matchedCategory: input.decision.matchedCategory,
    },
    timestamp: input.timestamp,
  };
}
