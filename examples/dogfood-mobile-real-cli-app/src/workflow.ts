import {
  cliForAxis,
  invokeMobileCli,
  type MobileAxis,
  type MobileCliCommand,
  type SpawnResult,
} from '@kiwa/mobile';

const ALL_CLIS: MobileCliCommand[] = [
  'expo build',
  'metro bundle',
  'codegen run',
  'react-native start',
  'pod install',
  'gradle build',
];

const CLI_BACKED_AXES: MobileAxis[] = [
  'react-native',
  'expo',
  'metro',
  'fabric',
  'turbo-modules',
  'codegen',
  'new-architecture',
];

const NON_CLI_AXES: MobileAxis[] = ['navigation', 'reanimated', 'async-storage', 'secure-storage'];

export async function runAllCliStubs(env: Record<string, string>): Promise<SpawnResult[]> {
  const results: SpawnResult[] = [];
  for (const cmd of ALL_CLIS) {
    results.push(
      await invokeMobileCli({
        command: cmd,
        args: [`--target=${cmd.split(' ')[0]}`],
        env,
      }),
    );
  }
  return results;
}

export async function runAxisBackedCliChain(env: Record<string, string>): Promise<{
  axis: MobileAxis;
  cli: MobileCliCommand | null;
  result: SpawnResult | null;
}[]> {
  const out: {
    axis: MobileAxis;
    cli: MobileCliCommand | null;
    result: SpawnResult | null;
  }[] = [];
  for (const axis of CLI_BACKED_AXES) {
    const cli = cliForAxis(axis);
    if (cli === null) {
      out.push({ axis, cli: null, result: null });
      continue;
    }
    const result = await invokeMobileCli({ command: cli, args: [], env });
    out.push({ axis, cli, result });
  }
  return out;
}

export function listNonCliAxes(): MobileAxis[] {
  return NON_CLI_AXES.slice();
}
