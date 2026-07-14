import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { setupCliEnv } from '../../src/index.js';

describe('cli-test skill — setupCliEnv skill flow', () => {
  it('T-SKL-D-001 setup + writeFile + readFile skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupCliEnv();
    spy.record('cli-test.setup', '{}');
    await env.writeFile('a.txt', 'ok');
    spy.record('cli-test.writeFile', '{}');
    const content = await env.readFile('a.txt');
    spy.record('cli-test.readFile', '{}');

    assertToolCallOrder(spy, ['cli-test.setup', 'cli-test.writeFile', 'cli-test.readFile']);
    expect(content).toBe('ok');
    await env.stop();
  });

  it('T-SKL-D-002 runCli skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupCliEnv();
    const result = await env.runCli({ cmd: 'echo', args: ['test'] });
    spy.record('cli-test.runCli', JSON.stringify({ cmd: 'echo' }));

    assertToolCalled(spy, 'cli-test.runCli');
    expect(result.exitCode).toBe(0);
    await env.stop();
  });

  it('T-SKL-D-003 batch write skill (times=3)', async () => {
    const spy = createToolSpy();
    const env = await setupCliEnv();
    await env.writeFile('a.txt', 'a');
    spy.record('cli-test.writeFile', '{}');
    await env.writeFile('b.txt', 'b');
    spy.record('cli-test.writeFile', '{}');
    await env.writeFile('c.txt', 'c');
    spy.record('cli-test.writeFile', '{}');

    assertToolCalled(spy, 'cli-test.writeFile', { times: 3 });
    await env.stop();
  });

  it('T-SKL-D-004 fileExists + listFiles skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupCliEnv();
    await env.writeFile('f.txt', 'x');
    spy.record('cli-test.writeFile', '{}');
    await env.fileExists('f.txt');
    spy.record('cli-test.fileExists', '{}');
    await env.listFiles();
    spy.record('cli-test.listFiles', '{}');

    assertToolCallOrder(spy, ['cli-test.writeFile', 'cli-test.fileExists', 'cli-test.listFiles']);
    await env.stop();
  });

  it('T-SKL-D-005 tempDir isolation skill', async () => {
    const spy = createToolSpy();
    const env1 = await setupCliEnv();
    const env2 = await setupCliEnv();
    spy.record('cli-test.setup', '{}');
    spy.record('cli-test.setup', '{}');

    expect(env1.tempDir).not.toBe(env2.tempDir);
    assertToolCalled(spy, 'cli-test.setup', { times: 2 });
    await env1.stop();
    await env2.stop();
  });
});
