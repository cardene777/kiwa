export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{ target: string[]; html: string; failureSummary?: string }>;
}

export interface AxeResults {
  violations: AxeViolation[];
  passes: Array<{ id: string }>;
  incomplete: Array<{ id: string }>;
  inapplicable: Array<{ id: string }>;
}

export interface AuditOptions {
  /** Element / selector / Document to scan (default: document) */
  context?: Element | Document | string;
  /** axe-core run options (passed verbatim) */
  runOptions?: Record<string, unknown>;
  /** Maximum impact level allowed before reportViolations throws */
  maxImpact?: 'minor' | 'moderate' | 'serious' | 'critical';
}

export interface AxeRunModule {
  run: (
    context?: Element | Document | string,
    options?: Record<string, unknown>,
  ) => Promise<AxeResults>;
}
