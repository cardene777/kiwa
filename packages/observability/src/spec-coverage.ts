import { parseSpec } from '@kiwa-lab/core';
import type { SpecCoverageGap } from './types.js';

const TC_REGEX = /\bT-[A-Z0-9]+-\d+\b/g;

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
    if (!testTcIds.has(id)) missingTcIds.push(id);
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
