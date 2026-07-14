import { describe, expect, it } from 'vitest';
import { AssistantsClient, toolCall } from '../../src/index.js';

describe('agent fidelity — AssistantsClient contract', () => {
  it('T-FID-D-001 idSeed で deterministic id 生成', () => {
    const c1 = new AssistantsClient({ idSeed: 'seed-1' });
    const c2 = new AssistantsClient({ idSeed: 'seed-1' });
    const a1 = c1.createAssistant({ name: 'a', instructions: 'test' });
    const a2 = c2.createAssistant({ name: 'a', instructions: 'test' });
    expect(a1.id).toBe(a2.id);
  });

  it('T-FID-D-002 toolCall arguments JSON string 化', () => {
    const call = toolCall({ id: 'c', name: 'fn', arguments: { x: 1, y: 'z' } });
    const parsed = JSON.parse(call.function.arguments);
    expect(parsed).toEqual({ x: 1, y: 'z' });
  });

  it('T-FID-D-003 assistant createAssistant で unique id', () => {
    const client = new AssistantsClient({ idSeed: 'unique' });
    const a1 = client.createAssistant({ name: 'x', instructions: 'test' });
    const a2 = client.createAssistant({ name: 'y', instructions: 'test' });
    expect(a1.id).not.toBe(a2.id);
  });

  it('T-FID-D-004 thread createThread で unique id', () => {
    const client = new AssistantsClient({ idSeed: 'thread-unique' });
    const t1 = client.createThread();
    const t2 = client.createThread();
    expect(t1.id).not.toBe(t2.id);
  });

  it('T-FID-D-005 handler final result 経路 for empty message', async () => {
    const client = new AssistantsClient({ idSeed: 'final' });
    const a = client.createAssistant({
      name: 'a', instructions: 'test',
      handler: async () => ({ kind: 'message', content: 'answer' }),
    });
    const t = client.createThread();
    client.addMessage(t.id, { role: 'user', content: 'ask' });
    const r = client.createRun({ threadId: t.id, assistantId: a.id });
    const result = await client.poll(r.id);
    expect(result.status).toBe('completed');
  });
});
