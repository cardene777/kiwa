import {
  cliForAxis,
  invokeDesktopCli,
  type DesktopAxis,
  type DesktopCliCommand,
  type SpawnResult,
} from '@kiwa-test/desktop';

const ALL_CLIS: DesktopCliCommand[] = [
  'electron-builder',
  'electron-updater',
  'ffmpeg',
  'xclip',
  'osascript',
  'notify-send',
  'defaults',
  'reg',
];

const CLI_BACKED_AXES: DesktopAxis[] = [
  'auto-updater',
  'fs-permissions',
  'notification',
  'menu-bar',
  'tray-icon',
  'screen-recording',
  'global-shortcut',
  'clipboard',
];

const NON_CLI_AXES: DesktopAxis[] = ['electron', 'tauri', 'webview', 'dark-mode'];

export async function runAllCliStubs(env: Record<string, string>): Promise<SpawnResult[]> {
  const results: SpawnResult[] = [];
  for (const cmd of ALL_CLIS) {
    results.push(
      await invokeDesktopCli({
        command: cmd,
        args: [`--target=${cmd.split('-')[0] ?? cmd}`],
        env,
      }),
    );
  }
  return results;
}

export async function runAxisBackedCliChain(env: Record<string, string>): Promise<{
  axis: DesktopAxis;
  cli: DesktopCliCommand | null;
  result: SpawnResult | null;
}[]> {
  const out: {
    axis: DesktopAxis;
    cli: DesktopCliCommand | null;
    result: SpawnResult | null;
  }[] = [];
  for (const axis of CLI_BACKED_AXES) {
    const cli = cliForAxis(axis);
    if (cli === null) {
      out.push({ axis, cli: null, result: null });
      continue;
    }
    const result = await invokeDesktopCli({ command: cli, args: [], env });
    out.push({ axis, cli, result });
  }
  return out;
}

export function listNonCliAxes(): DesktopAxis[] {
  return NON_CLI_AXES.slice();
}

export { ALL_CLIS, CLI_BACKED_AXES, NON_CLI_AXES };
