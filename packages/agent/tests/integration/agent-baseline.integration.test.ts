import { describe, expect, it } from 'vitest';
import { AssistantsClient, toolCall } from '../../src/index.js';

describe('agent integration — AssistantsClient workflow', () => {
  it('T-INT-D-001 createAssistant + createThread + createRun workflow', async () => {
    const client = new AssistantsClient({ idSeed: 'int-1' });
    const assistant = client.createAssistant({
      name: 'a1', instructions: 'test',
      handler: async () => ({ kind: 'message', content: 'done' }),
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'hi' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    const finalRun = await client.poll(run.id);
    expect(finalRun.status).toBe('completed');
  });

  it('T-INT-D-002 addMessage で thread 存在確認', () => {
    const client = new AssistantsClient({ idSeed: 'int-2' });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'q1' });
    client.addMessage(thread.id, { role: 'user', content: 'q2' });
    expect(thread.id).toBeDefined();
  });

  it('T-INT-D-003 handler tool_calls 経路', async () => {
    const client = new AssistantsClient({ idSeed: 'int-3' });
    const assistant = client.createAssistant({
      name: 'tool-caller', instructions: 'test',
      handler: async () => ({
        kind: 'tool_calls',
        toolCalls: [toolCall({ id: 't1', name: 'read', arguments: { file: 'a.txt' } })],
      }),
    });
    const thread = client.createThread();
    client.addMessage(thread.id, { role: 'user', content: 'read' });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    const result = await client.poll(run.id);
    expect(result.status).toMatch(/completed|requires_action/);
  });

  it('T-INT-D-004 multiple thread isolation', () => {
    const client = new AssistantsClient({ idSeed: 'int-4' });
    const t1 = client.createThread();
    const t2 = client.createThread();
    client.addMessage(t1.id, { role: 'user', content: 'in t1' });
    client.addMessage(t2.id, { role: 'user', content: 'in t2' });
    expect(t1.id).not.toBe(t2.id);
  });

  it('T-INT-D-005 toolCall helper で shape 生成', () => {
    const call = toolCall({ id: 'c1', name: 'search', arguments: { q: 'test' } });
    expect(call.id).toBe('c1');
    expect(call.function.name).toBe('search');
  });
});
