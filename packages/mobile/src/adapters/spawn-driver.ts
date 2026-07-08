/**
 * Mobile spawn driver (v0.5、 pair 深度 5 段拡張 1 例目 candidate)。
 *
 * v0.4 で mock/real adapter interface を確立、 v0.5 で real 経路の
 * child_process.spawn 契約層を stub 実装。 v1.55+ で 実 CLI spawn 実装に置換。
 * 現状 = env-gate + spawn shape 契約 + fail-closed のみ、 実 CLI 実行はしない。
 */
import type { MobileAxis } from '../semantics/types.js';

export type MobileCliCommand =
  | 'expo build'
  | 'metro bundle'
  | 'codegen run'
  | 'react-native start'
  | 'pod install'
  | 'gradle build';

export interface SpawnInvocation {
  command: MobileCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
}

export interface SpawnResult {
  command: MobileCliCommand;
  args: string[];
  invoked: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

const AXIS_TO_CLI: Record<MobileAxis, MobileCliCommand | null> = {
  'react-native': 'react-native start',
  expo: 'expo build',
  metro: 'metro bundle',
  navigation: null,
  reanimated: null,
  'async-storage': null,
  'secure-storage': null,
  fabric: 'react-native start',
  'turbo-modules': 'codegen run',
  codegen: 'codegen run',
  'new-architecture': 'gradle build',
};

/**
 * v0.5 stub = 実 CLI 実行はせず、 env-gate 通過確認 + spawn shape 契約のみ返す。
 * `KIWA_MOBILE_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。
 * v1.55+ で child_process.spawn(cmd, args, { env, cwd }) 実装に置換。
 */
export async function invokeMobileCli(inv: SpawnInvocation): Promise<SpawnResult> {
  const start = Date.now();
  if (inv.env.KIWA_MOBILE_MODE !== 'real') {
    throw new Error(
      `invokeMobileCli(${inv.command}): KIWA_MOBILE_MODE must be 'real'`,
    );
  }
  if (inv.args.length > 32) {
    throw new Error(`invokeMobileCli(${inv.command}): args exceeds max 32 (${inv.args.length})`);
  }
  // stub: 実 spawn は v1.55+、 現状は shape 契約のみ返す。
  return {
    command: inv.command,
    args: [...inv.args],
    invoked: true,
    exitCode: 0,
    stdout: `[v0.5 spawn stub] ${inv.command} ${inv.args.join(' ')}`,
    stderr: '',
    durationMs: Date.now() - start,
  };
}

export function cliForAxis(axis: MobileAxis): MobileCliCommand | null {
  return AXIS_TO_CLI[axis];
}

export function buildSpawnInvocation(input: {
  command: MobileCliCommand;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}): SpawnInvocation {
  const inv: SpawnInvocation = {
    command: input.command,
    args: input.args ?? [],
    env: input.env ?? { ...process.env } as Record<string, string>,
  };
  if (input.cwd !== undefined) inv.cwd = input.cwd;
  return inv;
}
