import { parseSpec } from '@kiwa-lab/core';
import type { SpecCoverageGap } from './types.js';

/**
 * Characters that can sit inside a case id, and therefore cannot end one.
 *
 * `\b` is not enough. It treats `.` and `/` as boundaries, so `TC-001` matches
 * inside `TC-001.2` and `X/TC/001` — two different cases read as one, and the
 * first one is then reported as covered by a test that never mentions it
 * (measured, PR #1905 Round 1).
 *
 * The set is the union of what ids are observed to use (`-` in `TC-001` and
 * `T-API-001`) and what a writer plausibly reaches for as a separator (`.`,
 * `/`, `_`). Widening it costs nothing here: a character in the set only makes
 * the matcher stricter about where a token ends.
 */
const ID_CHAR = 'A-Za-z0-9_./-';

/**
 * The case id shapes a generated test can carry.
 *
 * Two are in the contract, by layer. `/kiwa-design` writes `T-API-001` style
 * ids in the per-layer tables (`api` / `ui` / `data` / `cli`) and `TC-001` style
 * ids in the general 9-column table, which is what `contract` and `e2e` use.
 * The letter-prefixed variant (`TC-E001`) appears in the e2e specs.
 *
 * Bounded by the same class as `mentions`, so a longer id is not chopped into a
 * shorter one: `TC-001.2` yields nothing rather than `TC-001`. An id the shape
 * does not know goes unreported here, which is the honest answer — discovery
 * cannot name what it has no grammar for.
 *
 * Only the `extra` direction needs to discover ids this way. `missing` asks
 * whether each id the spec declares appears in the test, which needs no shape
 * at all — see `mentions`.
 */
const TC_REGEX = new RegExp(
  `(?<![${ID_CHAR}])(?:T-[A-Z0-9]+-\\d+|TC-[A-Z0-9]*\\d+)(?![${ID_CHAR}])`,
  'g',
);

/**
 * Whether the test code names this case id.
 *
 * Matched as a whole token so `TC-001` does not answer for `TC-0012`, and
 * without assuming a shape so an id the spec invents still resolves. The spec
 * is the authority on what its ids look like; the analyser only has to find
 * them.
 */
function mentions(testCode: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![${ID_CHAR}])${escaped}(?![${ID_CHAR}])`).test(testCode);
}

export interface AnalyzeSpecCoverageOptions {
  specMarkdown: string;
  testCode: string;
  module?: string;
  defaultLayer?:
    | 'contract'
    | 'unit'
    | 'integration'
    | 'e2e'
    | 'api'
    | 'ui'
    | 'data'
    | 'cli';
}

export function analyzeSpecCoverage(opts: AnalyzeSpecCoverageOptions): SpecCoverageGap {
  const parseOpts: Parameters<typeof parseSpec>[1] = {};
  if (opts.module) parseOpts.module = opts.module;
  if (opts.defaultLayer) parseOpts.defaultLayer = opts.defaultLayer;
  const spec = parseSpec(opts.specMarkdown, parseOpts);
  const specTcIds = new Set(spec.cases.map((c) => c.id));
  const testTcIds = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(TC_REGEX.source, 'g');
  while ((match = re.exec(opts.testCode)) !== null) {
    testTcIds.add(match[0]);
  }
  const missingTcIds: string[] = [];
  const extraTcIds: string[] = [];
  for (const id of specTcIds) {
    // Asked against the text, not against the discovered set: an id the shape
    // above does not know is still one the spec declared, and reporting it as
    // missing because the discovery regex could not see it would be a defect of
    // the analyser reported as a gap in the tests.
    if (!mentions(opts.testCode, id)) missingTcIds.push(id);
  }
  for (const id of testTcIds) {
    if (!specTcIds.has(id)) extraTcIds.push(id);
  }
  missingTcIds.sort();
  extraTcIds.sort();
  return {
    module: spec.module,
    layer: spec.layer,
    missingTcIds,
    extraTcIds,
  };
}
