import {
  generateLeanSpec,
  verifyLeanSpec,
  type OrchestratorSpec,
  type VerifyResult,
} from '@kiwa-lab/lean';

export function specToVerify(spec: OrchestratorSpec): VerifyResult {
  const out = generateLeanSpec(spec);
  return verifyLeanSpec([out]);
}

export function batchVerify(
  specs: readonly OrchestratorSpec[],
  opts: { skip?: boolean } = {},
): VerifyResult {
  const outs = specs.map((s) => generateLeanSpec(s));
  return verifyLeanSpec(outs, opts);
}

export function isSkippedOrNotInstalled(result: VerifyResult): boolean {
  return result.status === 'skipped-by-env' || result.status === 'lean-not-installed';
}
