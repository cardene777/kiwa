/**
 * DevSecOps adapter interface (v0.2)。
 *
 * v0.1 semantics = pure state-machine helper で AxisStep を生成、 provider payload
 * dialect には非依存。 v0.2 adapter = 実 CLI (semgrep / trivy / gitleaks / tfsec /
 * OWASP ZAP / grype) 呼出を隠蔽し、 v0.1 semantics AxisStep[] に変換する経路。
 *
 * v0.1 API は変更なし = backward compat 絶対維持、 adapter は新規 optional path。
 * env `KIWA_SECURITY_MODE=real` で real driver 走査 opt-in、 unset なら mock driver。
 */
import type { AxisStep, DevSecOpsAxis } from '../semantics/types.js';
import type { SastState } from '../semantics/sast.js';
import type { ScaState } from '../semantics/sca.js';
import type { SecretScanState } from '../semantics/secret-scan.js';
import type { IacScanState } from '../semantics/iac-scan.js';
import type { DastState } from '../semantics/dast.js';
import type { ContainerSecState } from '../semantics/container-security.js';

export type AdapterMode = 'mock' | 'real';

export interface AdapterInvocation {
  scanId: string;
  target: string;
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}

export interface AdapterResult<TState> {
  axis: DevSecOpsAxis;
  mode: AdapterMode;
  history: AxisStep<TState>[];
  completed: boolean;
  durationMs: number;
}

export interface SastAdapter {
  axis: 'sast';
  scan(input: AdapterInvocation): Promise<AdapterResult<SastState>>;
}

export interface ScaAdapter {
  axis: 'sca';
  scan(input: AdapterInvocation): Promise<AdapterResult<ScaState>>;
}

export interface SecretAdapter {
  axis: 'secret-scan';
  scan(input: AdapterInvocation): Promise<AdapterResult<SecretScanState>>;
}

export interface IacAdapter {
  axis: 'iac-scan';
  scan(input: AdapterInvocation): Promise<AdapterResult<IacScanState>>;
}

export interface DastAdapter {
  axis: 'dast';
  scan(input: AdapterInvocation): Promise<AdapterResult<DastState>>;
}

export interface ContainerAdapter {
  axis: 'container-security';
  scan(input: AdapterInvocation): Promise<AdapterResult<ContainerSecState>>;
}

export type AnyAdapter =
  | SastAdapter
  | ScaAdapter
  | SecretAdapter
  | IacAdapter
  | DastAdapter
  | ContainerAdapter;
