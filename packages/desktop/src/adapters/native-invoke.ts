/**
 * v0.9 実 native binding 呼出 = probe + invoke 統合経路。
 *
 * probe availability 判定で 実 CLI 存在時のみ 実 spawn 呼出、 未 install 時は
 * skip 経路で shape 契約 preserving (synthetic SpawnResult で shape 保持)。
 * v1.62 real behavior + v1.63 probe + v1.64 実 invoke の 3 layer separation の
 * 完全 pay off phase。
 *
 * 3 status 経路 = 'invoked' (probe 成功 + 実 spawn 完了) / 'cli-unavailable' (probe 失敗) /
 * 'axis-skipped' (shouldSkipAxis で skip 判定) の 3 経路、 全て SpawnResult shape で
 * 統一。 shape 契約 preserving 絶対維持。
 */
import type { DesktopAxis, DesktopTarget } from '../semantics/types.js';
import { shouldSkipAxis, probeCliAvailable } from './probe.js';
import { cliForAxis, invokeDesktopCliWith, type SpawnInvocation, type SpawnResult } from './spawn-driver.js';
import type { SpawnFn } from './spawn-executor.js';

export type InvokeStatus = 'invoked' | 'cli-unavailable' | 'axis-skipped' | 'no-cli-mapping';

export interface NativeInvokeResult {
  axis: DesktopAxis;
  target: DesktopTarget;
  status: InvokeStatus;
  reason: string | null;
  spawnResult: SpawnResult | null;
}

export interface NativeInvokeInput {
  axis: DesktopAxis;
  target: DesktopTarget;
  args?: string[];
  env?: Record<string, string>;
  spawnFn?: SpawnFn;
}

/**
 * probeAndInvoke = probe + invoke 統合経路。
 *
 * 1. shouldSkipAxis(axis, target) = skip 判定 → 'axis-skipped'
 * 2. cliForAxis(axis) = null (semantics-only axis) → 'no-cli-mapping'
 * 3. probeCliAvailable(cmd) = 実 CLI 存在確認 → 未 install 時 'cli-unavailable'
 * 4. 実 CLI 存在確認 OK → invokeDesktopCliWith で 実 spawn 呼出 → 'invoked'
 *
 * shape 契約 preserving = SpawnResult 構造保持、 skip 時は spawnResult=null で明示。
 */
export async function probeAndInvoke(input: NativeInvokeInput): Promise<NativeInvokeResult> {
  const { axis, target, args = [], env = {}, spawnFn } = input;

  // Step 1: axis skip 判定
  const skipDecision = shouldSkipAxis(axis, target);
  if (skipDecision.skip) {
    return {
      axis,
      target,
      status: 'axis-skipped',
      reason: skipDecision.reason,
      spawnResult: null,
    };
  }

  // Step 2: axis → CLI mapping
  const cli = cliForAxis(axis);
  if (cli === null) {
    return {
      axis,
      target,
      status: 'no-cli-mapping',
      reason: `axis ${axis} = semantics-only、 CLI 呼出なし`,
      spawnResult: null,
    };
  }

  // Step 3: probe CLI availability
  const probeResult = await probeCliAvailable(spawnFn ? { command: cli, spawnFn } : { command: cli });
  if (!probeResult.available) {
    return {
      axis,
      target,
      status: 'cli-unavailable',
      reason: `CLI ${cli} not installed on ${probeResult.platform}`,
      spawnResult: null,
    };
  }

  // Step 4: 実 spawn 呼出 (probeAndInvoke = probe 成功後の実 invoke)
  const spawnInv: SpawnInvocation = {
    command: cli,
    args,
    env: {
      ...env,
      KIWA_DESKTOP_MODE: 'real',
      KIWA_DESKTOP_SPAWN: 'dry-run', // 実 CLI 呼出 時も dry-run で shape 契約 preserving
    },
  };
  const spawnResult = await invokeDesktopCliWith(spawnInv, spawnFn ?? (await import('node:child_process')).spawn);

  return {
    axis,
    target,
    status: 'invoked',
    reason: null,
    spawnResult,
  };
}

/**
 * probeAndInvokeAll = 12 axis × 3 target の probe + invoke matrix 集計。
 * status 別に集計、 dogfood workflow で使用。
 */
export interface NativeInvokeMatrixSummary {
  total: number;
  invoked: NativeInvokeResult[];
  cliUnavailable: NativeInvokeResult[];
  axisSkipped: NativeInvokeResult[];
  noCliMapping: NativeInvokeResult[];
}

export async function probeAndInvokeAll(input?: {
  axes?: DesktopAxis[];
  targets?: DesktopTarget[];
  args?: string[];
  env?: Record<string, string>;
  spawnFn?: SpawnFn;
}): Promise<NativeInvokeMatrixSummary> {
  const ALL_AXES: DesktopAxis[] = [
    'electron',
    'tauri',
    'webview',
    'auto-updater',
    'fs-permissions',
    'notification',
    'menu-bar',
    'tray-icon',
    'screen-recording',
    'global-shortcut',
    'clipboard',
    'dark-mode',
  ];
  const ALL_TARGETS: DesktopTarget[] = ['macos', 'windows', 'linux'];

  const axes = input?.axes ?? ALL_AXES;
  const targets = input?.targets ?? ALL_TARGETS;
  const results: NativeInvokeResult[] = [];

  for (const axis of axes) {
    for (const target of targets) {
      const invokeInput: NativeInvokeInput = { axis, target };
      if (input?.args !== undefined) invokeInput.args = input.args;
      if (input?.env !== undefined) invokeInput.env = input.env;
      if (input?.spawnFn !== undefined) invokeInput.spawnFn = input.spawnFn;
      const result = await probeAndInvoke(invokeInput);
      results.push(result);
    }
  }

  return {
    total: results.length,
    invoked: results.filter((r) => r.status === 'invoked'),
    cliUnavailable: results.filter((r) => r.status === 'cli-unavailable'),
    axisSkipped: results.filter((r) => r.status === 'axis-skipped'),
    noCliMapping: results.filter((r) => r.status === 'no-cli-mapping'),
  };
}
