/**
 * Axis 7 — Software Bill Of Materials (SBOM) tooling。
 *
 * 4 sub-axis ...
 * - CycloneDX (industry-standard SBOM format、 v1.5 minimal schema)
 * - SPDX (Linux Foundation format、 v2.3 minimal schema)
 * - OSV / NVD (advisory feed lookup、 component + version → advisory list)
 * - license (SPDX license id + policy allow / warn / deny)
 */

import type { SecurityEvent } from './types.js';

export interface SbomComponent {
  name: string;
  version: string;
  /** Package URL — e.g., pkg:npm/foo@1.2.3。 */
  purl: string;
  /** SPDX license expression (e.g., MIT, Apache-2.0, "MIT OR Apache-2.0")。 */
  license?: string;
}

export interface SbomDocument {
  format: 'cyclonedx' | 'spdx';
  formatVersion: string;
  components: SbomComponent[];
  generatedAtIso: string;
}

/** CycloneDX 1.5 minimal — components が bomFormat = "CycloneDX"、 specVersion = "1.5"。 */
export function toCycloneDx(components: SbomComponent[], nowIso: string = new Date().toISOString()): SbomDocument {
  return {
    format: 'cyclonedx',
    formatVersion: '1.5',
    components,
    generatedAtIso: nowIso,
  };
}

/** SPDX 2.3 minimal — packages list + relationships (DESCRIBES / DEPENDS_ON)。 */
export function toSpdx(components: SbomComponent[], nowIso: string = new Date().toISOString()): SbomDocument {
  return {
    format: 'spdx',
    formatVersion: '2.3',
    components,
    generatedAtIso: nowIso,
  };
}

/** SBOM validation — mandatory fields + purl syntax check。 */
export function validateSbom(doc: SbomDocument): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const c of doc.components) {
    if (!c.name) errors.push(`component missing name (purl ${c.purl})`);
    if (!c.version) errors.push(`component missing version (name ${c.name})`);
    if (!c.purl.startsWith('pkg:')) {
      errors.push(`component ${c.name} has invalid purl (${c.purl}), must start with "pkg:"`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** OSV / NVD advisory shape 。 kiwa の in-memory advisory feed で使用。 */
export interface Advisory {
  id: string;
  affects: { purl: string; versionRange: string }[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  source: 'osv' | 'nvd';
}

export interface AdvisoryFeed {
  advisories: Advisory[];
}

export interface AdvisoryLookupResult {
  component: SbomComponent;
  advisories: Advisory[];
}

/**
 * Simple semver "in range" check — accepts `>= a.b.c`, `< a.b.c`, `< a.b.c || >= x.y.z`,
 * or an exact version string. Full semver range algebra is out of scope for the
 * mock (real driver = actual OSV client)。
 */
export function versionInRange(version: string, range: string): boolean {
  const clauses = range.split(/\s*\|\|\s*/);
  for (const clause of clauses) {
    if (matchClause(version, clause.trim())) return true;
  }
  return false;
}

function matchClause(version: string, clause: string): boolean {
  const match = clause.match(/^(>=|<=|<|>|=)\s*([0-9]+(?:\.[0-9]+){0,2})$/);
  if (!match) {
    return clause === version;
  }
  const op = match[1] as '>=' | '<=' | '<' | '>' | '=';
  const target = match[2] ?? '';
  const cmp = compareSemver(version, target);
  switch (op) {
    case '>=':
      return cmp >= 0;
    case '<=':
      return cmp <= 0;
    case '>':
      return cmp > 0;
    case '<':
      return cmp < 0;
    case '=':
      return cmp === 0;
  }
}

function compareSemver(a: string, b: string): number {
  const aParts = a.split('.').map((p) => Number.parseInt(p, 10) || 0);
  const bParts = b.split('.').map((p) => Number.parseInt(p, 10) || 0);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
    const av = aParts[i] ?? 0;
    const bv = bParts[i] ?? 0;
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}

export function lookupAdvisories(
  doc: SbomDocument,
  feed: AdvisoryFeed,
): AdvisoryLookupResult[] {
  const results: AdvisoryLookupResult[] = [];
  for (const component of doc.components) {
    const purlBase = stripPurlVersion(component.purl);
    const hits: Advisory[] = [];
    for (const adv of feed.advisories) {
      for (const affect of adv.affects) {
        if (stripPurlVersion(affect.purl) !== purlBase) continue;
        if (versionInRange(component.version, affect.versionRange)) {
          hits.push(adv);
        }
      }
    }
    if (hits.length > 0) {
      results.push({ component, advisories: hits });
    }
  }
  return results;
}

function stripPurlVersion(purl: string): string {
  const at = purl.lastIndexOf('@');
  return at === -1 ? purl : purl.slice(0, at);
}

/** License policy — SPDX license id ごとに allow / warn / deny 判定。 */
export type LicenseVerdict = 'allow' | 'warn' | 'deny';

export interface LicensePolicy {
  allow: string[];
  warn: string[];
  deny: string[];
}

export const DEFAULT_LICENSE_POLICY: LicensePolicy = {
  allow: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense'],
  warn: ['MPL-2.0', 'LGPL-2.1', 'LGPL-3.0'],
  deny: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL-1.0'],
};

export function evaluateLicense(license: string | undefined, policy: LicensePolicy = DEFAULT_LICENSE_POLICY): LicenseVerdict {
  if (!license) return 'warn';
  // Handle "X OR Y" as the most permissive of the two.
  const clauses = license.split(/\s+OR\s+/i).map((c) => c.trim());
  const verdicts = clauses.map((c) => singleVerdict(c, policy));
  if (verdicts.includes('allow')) return 'allow';
  if (verdicts.includes('warn')) return 'warn';
  return 'deny';
}

function singleVerdict(clause: string, policy: LicensePolicy): LicenseVerdict {
  if (policy.allow.includes(clause)) return 'allow';
  if (policy.deny.includes(clause)) return 'deny';
  if (policy.warn.includes(clause)) return 'warn';
  return 'warn';
}

export function toSbomEvent(input: {
  provider: 'helmet' | 'coraza';
  verdict: 'allow' | 'deny' | 'warn';
  reason: string;
  payload: unknown;
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'sbom',
    provider: input.provider,
    verdict: input.verdict,
    reason: input.reason,
    payload: input.payload,
    timestamp: input.timestamp,
  };
}
