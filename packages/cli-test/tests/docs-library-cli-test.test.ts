import { afterEach, describe, expect, it } from 'vitest';
import {
  dispatchCliEvent,
  setupCliEnv,
  startCli,
  summarizeCli,
  type CliTestEnv,
} from '../src/index.js';

const envs: CliTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) await envs.pop()?.stop();
});

describe('documentation examples', () => {
  it('the quickstart writes a child result into the temporary directory', async () => {
    const env = await setupCliEnv({ seedFiles: { 'input.txt': 'hello' }, env: { KIWA_PREFIX: 'result' } });
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        "const fs=require('node:fs'); fs.writeFileSync('output.txt', process.env.KIWA_PREFIX + ':' + fs.readFileSync('input.txt', 'utf8')); console.log('done')",
      ],
    });
    expect(result).toMatchObject({ exitCode: 0, signal: null, stdout: 'done\n' });
    expect(await env.readFile('output.txt')).toBe('result:hello');
  });

  it('the how-to separates command output, timeout rejection, and lifecycle state', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await env.writeFile('config/app.json', '{"enabled":true}');
    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        "const fs=require('node:fs'); process.stdin.on('data', d => { fs.writeFileSync('imported.txt', d); console.log(fs.existsSync('app.json')); });",
      ],
      cwd: 'config',
      stdin: 'hello',
    });
    expect(result.stdout.trim()).toBe('true');
    expect(await env.readFile('config/imported.txt')).toBe('hello');
    await expect(env.runCli({ cmd: 'node', args: ['-e', 'setTimeout(() => {}, 5000)'], timeoutMs: 50 })).rejects.toThrow(/timed out/);

    const started = startCli({ timestamp: '2026-01-01T00:00:00.000Z' });
    const running = dispatchCliEvent({ session: started, event: 'spawn-succeeded', timestamp: '2026-01-01T00:00:01.000Z' });
    const exited = dispatchCliEvent({ session: running, event: 'exit-detected', timestamp: '2026-01-01T00:00:02.000Z' });
    expect(summarizeCli(exited)).toMatchObject({ currentState: 'exited', spawns: 1 });
  });
});
