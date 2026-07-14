import type { DesignSpec, DesignActual, SpecDivergence, SpecConformanceResult } from './types.js';

/**
 * spec conformance check — design spec と actual UI values の差分を検知する。
 * pass = true when 全 spec key が actual に存在 + 値一致、 false when 差分あり。
 */
export function checkSpecConformance(
  spec: DesignSpec,
  actual: DesignActual,
): SpecConformanceResult {
  const divergences: SpecDivergence[] = [];
  let checkedCount = 0;

  // colors
  if (spec.colors) {
    for (const [key, expected] of Object.entries(spec.colors)) {
      checkedCount += 1;
      const got = actual.colors?.[key];
      if (got === undefined) {
        divergences.push({ path: `colors.${key}`, expected, actual: undefined, category: 'missing' });
      } else if (got !== expected) {
        divergences.push({ path: `colors.${key}`, expected, actual: got, category: 'mismatch' });
      }
    }
  }

  // spacing
  if (spec.spacing) {
    for (const [key, expected] of Object.entries(spec.spacing)) {
      checkedCount += 1;
      const got = actual.spacing?.[key];
      if (got === undefined) {
        divergences.push({ path: `spacing.${key}`, expected, actual: undefined, category: 'missing' });
      } else if (got !== expected) {
        divergences.push({ path: `spacing.${key}`, expected, actual: got, category: 'mismatch' });
      }
    }
  }

  // typography
  if (spec.typography) {
    for (const [key, expected] of Object.entries(spec.typography)) {
      checkedCount += 1;
      const got = actual.typography?.[key];
      if (got === undefined) {
        divergences.push({ path: `typography.${key}`, expected, actual: undefined, category: 'missing' });
      } else {
        for (const [prop, expectedVal] of Object.entries(expected)) {
          const actualVal = (got as Record<string, unknown>)[prop];
          if (actualVal !== expectedVal) {
            divergences.push({
              path: `typography.${key}.${prop}`,
              expected: expectedVal,
              actual: actualVal,
              category: 'mismatch',
            });
          }
        }
      }
    }
  }

  // components
  if (spec.components) {
    for (const [name, expected] of Object.entries(spec.components)) {
      checkedCount += 1;
      const got = actual.components?.[name];
      if (got === undefined) {
        divergences.push({ path: `components.${name}`, expected, actual: undefined, category: 'missing' });
      } else {
        for (const [prop, expectedVal] of Object.entries(expected)) {
          const actualVal = (got as Record<string, unknown>)[prop];
          if (actualVal !== expectedVal) {
            divergences.push({
              path: `components.${name}.${prop}`,
              expected: expectedVal,
              actual: actualVal,
              category: 'mismatch',
            });
          }
        }
      }
    }
  }

  return {
    pass: divergences.length === 0,
    divergences,
    checkedCount,
  };
}

/**
 * assertion helper — spec conformance が pass しない場合 throw する。 vitest の
 * expect と同じ contract (test body で自然に fail する)。
 */
export function assertDesignConformance(
  spec: DesignSpec,
  actual: DesignActual,
): void {
  const result = checkSpecConformance(spec, actual);
  if (!result.pass) {
    const summary = result.divergences
      .map((d) => `  - ${d.path} [${d.category}]: expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`)
      .join('\n');
    throw new Error(
      `design spec conformance failed (${result.divergences.length} divergences):\n${summary}`,
    );
  }
}
