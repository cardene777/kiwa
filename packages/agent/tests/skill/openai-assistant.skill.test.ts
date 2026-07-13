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

  it('同 tool を複数回呼出 = times で回数 assertion', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'multi-call' });
    const assistant = client.createAssistant({
      name: 'multi',
      instructions: '',
      handler: async () => {
        spy.record('Read', JSON.stringify({ file: 'a.md' }));
        spy.record('Read', JSON.stringify({ file: 'b.md' }));
        spy.record('Read', JSON.stringify({ file: 'c.md' }));
        return { kind: 'message', content: '3 reads' };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'read 3 files' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    assertToolCalled(spy, 'Read', { times: 3 });
    // 各呼出 args も確認
    assertToolCalledWith(spy, 'Read', { file: 'a.md' });
    assertToolCalledWith(spy, 'Read', { file: 'b.md' });
    assertToolCalledWith(spy, 'Read', { file: 'c.md' });
  });

  it('順序 assertion = 部分列 subset も検出できる', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'order-subset' });
    const assistant = client.createAssistant({
      name: 'ordered',
      instructions: '',
      handler: async () => {
        spy.record('Read', '{}');
        spy.record('Grep', '{}');
        spy.record('Edit', '{}');
        spy.record('Write', '{}');
        return { kind: 'message', content: 'done' };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'flow' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    // 全順序 assert
    assertToolCallOrder(spy, ['Read', 'Grep', 'Edit', 'Write']);
    // 部分列 assert = 途中の tool 抜きでも順序が保たれる
    assertToolCallOrder(spy, ['Read', 'Edit']);
    assertToolCallOrder(spy, ['Read', 'Write']);
  });

  it('順序 assertion 失敗 = throw (逆順検知)', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'order-fail' });
    const assistant = client.createAssistant({
      name: 'reverse',
      instructions: '',
      handler: async () => {
        spy.record('Bash', '{}');
        spy.record('Read', '{}');
        return { kind: 'message', content: 'done' };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'flow' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    // 実際は [Bash, Read] だが assert は [Read, Bash] を期待 = throw
    expect(() =>
      assertToolCallOrder(spy, ['Read', 'Bash']),
    ).toThrow();
  });

  it('spy 未 record tool = assertToolCalled が throw する (呼出強制)', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'never-call' });
    const assistant = client.createAssistant({
      name: 'no-op',
      instructions: '',
      handler: async () => {
        // 何も record しない
        return { kind: 'message', content: 'nothing' };
      },
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'do nothing' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    await client.poll(run.id);

    // Read が呼ばれていない → assertToolCalled は throw
    expect(() => assertToolCalled(spy, 'Read')).toThrow();
    // assertToolNotCalled は成功
    assertToolNotCalled(spy, 'Read');
  });

  it('複数 assistant で spy を共有 = 全 handler の呼出を集約', async () => {
    const spy = createToolSpy();
    const client = new AssistantsClient({ idSeed: 'multi-assistant' });

    const a1 = client.createAssistant({
      name: 'reader',
      instructions: '',
      handler: async () => {
        spy.record('Read', JSON.stringify({ file: 'from-a1' }));
        return { kind: 'message', content: 'a1 done' };
      },
    });
    const a2 = client.createAssistant({
      name: 'writer',
      instructions: '',
      handler: async () => {
        spy.record('Write', JSON.stringify({ file: 'from-a2' }));
        return { kind: 'message', content: 'a2 done' };
      },
    });

    const t1 = client.createThread();
    client.addMessage(t1.id, { role: 'user', content: 'read' });
    await client.poll(client.createRun({ threadId: t1.id, assistantId: a1.id }).id);

    const t2 = client.createThread();
    client.addMessage(t2.id, { role: 'user', content: 'write' });
    await client.poll(client.createRun({ threadId: t2.id, assistantId: a2.id }).id);

    assertToolCalled(spy, 'Read', { times: 1 });
    assertToolCalled(spy, 'Write', { times: 1 });
    assertToolCallOrder(spy, ['Read', 'Write']);
  });
});
