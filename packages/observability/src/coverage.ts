export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface CoverageFileEntry {
  path: string;
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

export interface CoverageSummary {
  total: CoverageFileEntry;
  files: CoverageFileEntry[];
}

interface IstanbulCoverageMetric {
  total?: number;
  covered?: number;
  skipped?: number;
  pct?: number;
}

interface IstanbulFileSummary {
  statements?: IstanbulCoverageMetric;
  branches?: IstanbulCoverageMetric;
  functions?: IstanbulCoverageMetric;
  lines?: IstanbulCoverageMetric;
}

export type IstanbulCoverageSummary = Record<string, IstanbulFileSummary>;

function readMetric(raw: IstanbulCoverageMetric | undefined): CoverageMetric {
  const total = raw?.total ?? 0;
  const covered = raw?.covered ?? 0;
  const skipped = raw?.skipped ?? 0;
  const pct = raw?.pct ?? (total === 0 ? 100 : (covered / total) * 100);
  return { total, covered, skipped, pct };
}

function aggregateFiles(files: CoverageFileEntry[]): CoverageFileEntry {
  const agg: Record<'statements' | 'branches' | 'functions' | 'lines', { total: number; covered: number; skipped: number }> = {
    statements: { total: 0, covered: 0, skipped: 0 },
    branches: { total: 0, covered: 0, skipped: 0 },
    functions: { total: 0, covered: 0, skipped: 0 },
    lines: { total: 0, covered: 0, skipped: 0 },
  };
  for (const file of files) {
    for (const key of ['statements', 'branches', 'functions', 'lines'] as const) {
      agg[key].total += file[key].total;
      agg[key].covered += file[key].covered;
      agg[key].skipped += file[key].skipped;
    }
  }
  const buildMetric = (key: 'statements' | 'branches' | 'functions' | 'lines'): CoverageMetric => ({
    total: agg[key].total,
    covered: agg[key].covered,
    skipped: agg[key].skipped,
    pct: agg[key].total === 0 ? 100 : (agg[key].covered / agg[key].total) * 100,
  });
  return {
    path: 'total',
    statements: buildMetric('statements'),
    branches: buildMetric('branches'),
    functions: buildMetric('functions'),
    lines: buildMetric('lines'),
  };
}

export function fromIstanbulCoverageSummary(raw: IstanbulCoverageSummary): CoverageSummary {
  const files: CoverageFileEntry[] = [];
  let totalEntry: CoverageFileEntry | null = null;
  for (const [path, summary] of Object.entries(raw)) {
    const entry: CoverageFileEntry = {
      path,
      statements: readMetric(summary.statements),
      branches: readMetric(summary.branches),
      functions: readMetric(summary.functions),
      lines: readMetric(summary.lines),
    };
    if (path === 'total') {
      totalEntry = entry;
    } else {
      files.push(entry);
    }
  }
  if (!totalEntry) {
    totalEntry = aggregateFiles(files);
  }
  return { total: totalEntry, files };
}

export interface CoverageThresholds {
  statements?: number;
  branches?: number;
  functions?: number;
  lines?: number;
}

export interface ThresholdCheckResult {
  ok: boolean;
  failures: Array<{ metric: keyof CoverageThresholds; required: number; actual: number }>;
}

export function checkThresholds(
  summary: CoverageSummary,
  thresholds: CoverageThresholds,
): ThresholdCheckResult {
  const failures: ThresholdCheckResult['failures'] = [];
  const metrics: Array<keyof CoverageThresholds> = ['statements', 'branches', 'functions', 'lines'];
  for (const metric of metrics) {
    const required = thresholds[metric];
    if (required === undefined) continue;
    const actual = summary.total[metric].pct;
    if (actual + 0.0001 < required) {
      failures.push({ metric, required, actual });
    }
  }
  return { ok: failures.length === 0, failures };
}
