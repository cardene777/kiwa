import type {
  AuditOptions,
  AxeResults,
  AxeRunModule,
  AxeViolation,
} from './types.js';

const IMPACT_ORDER: Record<NonNullable<AxeViolation['impact']>, number> = {
  minor: 0,
  moderate: 1,
  serious: 2,
  critical: 3,
};

async function loadAxeCore(): Promise<AxeRunModule> {
  try {
    const mod = (await import('axe-core')) as unknown as { default?: AxeRunModule } & AxeRunModule;
    return mod.default ?? mod;
  } catch {
    throw new Error('runAxe requires "axe-core" to be installed. Run `pnpm add -D axe-core`.');
  }
}

export async function runAxe(opts: AuditOptions = {}): Promise<AxeResults> {
  const axe = await loadAxeCore();
  const ctx =
    opts.context ?? (typeof document !== 'undefined' ? document : undefined);
  if (ctx === undefined) {
    throw new Error('runAxe: no context and no global document (jsdom env required).');
  }
  return axe.run(ctx as Element | Document | string, opts.runOptions ?? {});
}

export interface ViolationReport {
  violations: AxeViolation[];
  blocking: AxeViolation[];
  summary: string;
}

export function reportViolations(
  results: AxeResults,
  opts: { maxImpact?: AuditOptions['maxImpact'] } = {},
): ViolationReport {
  const maxImpact = opts.maxImpact ?? 'minor';
  const threshold = IMPACT_ORDER[maxImpact];
  const blocking = results.violations.filter((v) => {
    if (!v.impact) return false;
    return IMPACT_ORDER[v.impact] >= threshold;
  });
  const summary = blocking.length === 0
    ? `No a11y violations at impact >= "${maxImpact}".`
    : `${blocking.length} a11y violation(s) at impact >= "${maxImpact}":\n` +
      blocking.map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`).join('\n');
  return { violations: results.violations, blocking, summary };
}

export function expectNoViolations(
  results: AxeResults,
  expect: { (actual: unknown): { toBe: (expected: unknown) => void } },
  opts: { maxImpact?: AuditOptions['maxImpact'] } = {},
): void {
  const report = reportViolations(results, opts);
  if (report.blocking.length > 0) {
    throw new Error(report.summary);
  }
  expect(report.blocking.length).toBe(0);
}
