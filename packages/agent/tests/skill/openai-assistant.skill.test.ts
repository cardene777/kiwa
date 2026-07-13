/**
 * skill test exemplar — `docs/concepts/test-taxonomy.md § skill` の pattern 実装。
 *
 * 目的 = AssistantsClient の handler が「想定 tool を実際に呼んだか / 順序 / 回数 / 引数」
 * を behavior test で担保する。 skill / assistant 開発時、 定義した通り tool が発火する事を
 * 保証する経路。
 *
 * 本 file は agent lib の exemplar。 他 skill 実装 lib (mcp / cli) は本 pattern に倣って
 * それぞれ `tests/skill/*.skill.test.ts` を配線する。
 */
import { AssistantsClient, toolCall } from '@kiwa-lab/agent';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  assertToolNotCalled,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { describe, expect, it } from 'vitest';

describe('AssistantsClient handler skill 発火 assertion', () => {
  it('handler が想定 tool を呼ぶと spy が捕捉する', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'skill-exemplar' });
    const assistant = client.createAssistant({
      name: 'chatbot',
      instructions: 'always call Read then Bash',
      handler: async () => {
        spy.record('Read', JSON.stringify({ file: 'a.md' }));
        spy.record('Bash', JSON.stringify({ cmd: 'ls' }));
        return {
          kind: 'tool_calls',
          toolCalls: [
            toolCall({ id: 'c1', name: 'Read', arguments: { file: 'a.md' } }),
            toolCall({ id: 'c2', name: 'Bash', arguments: { cmd: 'ls' } }),
          ],
        };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'do it' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    assertToolCalled(spy, 'Read');
    assertToolCalled(spy, 'Bash');
    assertToolCalled(spy, 'Read', { times: 1 });
    assertToolCallOrder(spy, ['Read', 'Bash']);
    assertToolCalledWith(spy, 'Bash', { cmd: 'ls' });
  });

  it('handler が禁止 tool を呼ばない事を assertion できる', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'no-forbidden' });
    const assistant = client.createAssistant({
      name: 'safe',
      instructions: 'never call Bash',
      handler: async () => {
        spy.record('Read', '{}');
        return {
          kind: 'message',
          content: 'no bash needed',
        };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'safe op' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    assertToolCalled(spy, 'Read');
    assertToolNotCalled(spy, 'Bash');
    assertToolNotCalled(spy, 'DangerousDelete');
  });

  it('引数不一致を検出 (mock 実装 drift 検知)', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'args-mismatch' });
    const assistant = client.createAssistant({
      name: 'a',
      instructions: '',
      handler: async () => {
        // 意図的に間違った file を Read
        spy.record('Read', JSON.stringify({ file: 'wrong.md' }));
        return { kind: 'message', content: 'done' };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'read a.md' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    assertToolCalled(spy, 'Read');
    // 期待引数 (a.md) と実際 (wrong.md) の不一致を assertion で捕捉。
    expect(() =>
      assertToolCalledWith(spy, 'Read', { file: 'a.md' }),
    ).toThrow(/no call matched expected args/);
  });
});
