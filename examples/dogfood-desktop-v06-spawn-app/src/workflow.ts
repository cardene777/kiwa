import {
  invokeDesktopCli,
  invokeDesktopCliWith,
  sanitizeEnv,
  type DesktopCliCommand,
  type SpawnFn,
  type SpawnResult,
} from '@kiwa-test/desktop';

/** dry-run mode = 実 CLI 未 install 環境でも決定的挙動、 shape 契約 のみ検証。 */
export async function runDryRunWorkflow(): Promise<SpawnResult[]> {
  const commands: DesktopCliCommand[] = [
    'electron-builder',
    'electron-updater',
    'ffmpeg',
    'xclip',
    'osascript',
    'notify-send',
    'defaults',
    'reg',
  ];
  const results: SpawnResult[] = [];
  for (const cmd of commands) {
    results.push(
      await invokeDesktopCli({
        command: cmd,
        args: [],
        env: { KIWA_DESKTOP_MODE: 'real', KIWA_DESKTOP_SPAWN: 'dry-run', PATH: '/usr/bin' },
      }),
    );
  }
  return results;
}

/** DI 経路 = SpawnFn を注入して決定的な spawn 挙動を CI で検証。 */
export async function runWithInjectedSpawn(spawnFn: SpawnFn): Promise<SpawnResult> {
  return invokeDesktopCliWith(
    {
      command: 'ffmpeg',
      args: ['-version'],
      env: { KIWA_DESKTOP_MODE: 'real', PATH: '/usr/bin' },
    },
    spawnFn,
  );
}

/** env sanitize 経路 = secret を削ぎ落として command 毎の allowlist のみ通す。 */
export function sanitizeEnvForCommand(
  command: DesktopCliCommand,
  env: Record<string, string>,
): Record<string, string> {
  return sanitizeEnv(command, env);
}
