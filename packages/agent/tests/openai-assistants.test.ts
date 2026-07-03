import { describe, expect, it } from 'vitest';
import { AssistantsClient, toolCall } from '../src/index.js';

describe('AssistantsClient — resource CRUD', () => {
  it('createAssistant + createThread + addMessage は id を deterministic に発行する', () => {
    const client = new AssistantsClient({ idSeed: 'test' });
    const assistant = client.createAssistant({
      name: 'chatbot',
      instructions: 'be helpful',
      handler: async () => ({ kind: 'message' as const, content: 'ok' }),
    });
    expect(assistant.id).toBe('test_asst_1');
    expect(assistant.name).toBe('chatbot');

    const thread = client.createThread();
    expect(thread.id).toBe('test_thread_2');

    const msg = client.addMessage(thread.id, { role: 'user', content: 'hi' });
    expect(msg.id).toBe('test_msg_3');
    expect(msg.role).toBe('user');
    expect(client.getThread(thread.id)?.messages).toHaveLength(1);
  });

  it('createThread は初期 messages を受け付けて append する', () => {
    const client = new AssistantsClient();
    const thread = client.createThread({
      messages: [
        { role: 'user', content: 'first' },
        { role: 'user', content: 'second' },
      ],
    });
    expect(thread.messages).toHaveLength(2);
    expect(thread.messages[0]?.content).toBe('first');
    expect(thread.messages[1]?.content).toBe('second');
  });

  it('未登録 handler で createRun すると throw する', () => {
    const client = new AssistantsClient();
    const assistant = client.createAssistant({ name: 'a', instructions: '' });
    const thread = client.createThread();
    expect(() => client.createRun({ threadId: thread.id, assistantId: assistant.id })).toThrow(
      /no handler registered/,
    );
  });

  it('registerHandler で後付けの handler を差し込める', async () => {
    const client = new AssistantsClient();
    const assistant = client.createAssistant({ name: 'a', instructions: '' });
    client.registerHandler(assistant.id, async () => ({ kind: 'message' as const, content: 'late-bound' }));
    const thread = client.createThread();
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    const final = await client.pollUntilFinal(run.id);
    expect(final.status).toBe('completed');
    expect(client.getThread(thread.id)?.messages.at(-1)?.content).toBe('late-bound');
  });
});

describe('AssistantsClient — Run status transition', () => {
  it('queued → in_progress → completed の basic flow (real API polling model)', async () => {
    const client = new AssistantsClient();
    const assistant = client.createAssistant({
      name: 'echo',
      instructions: '',
      handler: async (ctx) => ({
        kind: 'message',
        content: `echo: ${ctx.thread.at(-1)?.content}`,
      }),
    });
    const thread = client.createThread({ messages: [{ role: 'user', content: 'hello' }] });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    expect(run.status).toBe('queued');

    const polled = await client.poll(run.id);
    expect(polled.status).toBe('completed');
    expect(polled.completedAt).toBeGreaterThan(0);

    // 追加 poll では status 変化なし
    const stable = await client.poll(run.id);
    expect(stable.status).toBe('completed');

    // thread に assistant message が append されている
    const msgs = client.getThread(thread.id)?.messages ?? [];
    expect(msgs.at(-1)?.role).toBe('assistant');
    expect(msgs.at(-1)?.content).toBe('echo: hello');
  });

  it('handler throw で status = failed + lastError.code = handler_error', async () => {
    const client = new AssistantsClient();
    const assistant = client.createAssistant({
      name: 'broken',
      instructions: '',
      handler: async () => {
        throw new Error('boom');
      },
    });
    const thread = client.createThread({ messages: [{ role: 'user', content: 'hi' }] });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    const polled = await client.poll(run.id);
    expect(polled.status).toBe('failed');
    expect(polled.lastError?.code).toBe('handler_error');
    expect(polled.lastError?.message).toBe('boom');
    expect(polled.failedAt).toBeGreaterThan(0);
  });

  it('cancel は queued run を failed(cancelled) に倒す', async () => {
    const client = new AssistantsClient();
    const assistant = client.createAssistant({
      name: 'slow',
      instructions: '',
      handler: async () => ({ kind: 'message', content: 'x' }),
    });
    const thread = client.createThread();
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    expect(run.status).toBe('queued');
    const cancelled = client.cancel(run.id);
    expect(cancelled.status).toBe('failed');
    expect(cancelled.lastError?.code).toBe('cancelled');

    // cancel 後の poll は failed のまま
    const polled = await client.poll(run.id);
    expect(polled.status).toBe('failed');
  });
});

describe('AssistantsClient — tool_calls (requires_action) roundtrip', () => {
  it('tool_calls → requires_action → submitToolOutputs → completed の 2-turn flow', async () => {
    const client = new AssistantsClient();
    let calledTwice = 0;
    const assistant = client.createAssistant({
      name: 'weather-agent',
      instructions: '',
      handler: async (ctx) => {
        calledTwice += 1;
        if (ctx.toolOutputs === undefined) {
          // 1 st turn — tool を呼びたい
          return {
            kind: 'tool_calls',
            toolCalls: [toolCall({ id: 'call_1', name: 'weather', arguments: { city: 'tokyo' } })],
          };
        }
        // 2nd turn — tool result を踏まえて final message
        const result = ctx.toolOutputs[0]?.output ?? 'n/a';
        return { kind: 'message', content: `weather: ${result}` };
      },
    });
    const thread = client.createThread({ messages: [{ role: 'user', content: 'weather in tokyo?' }] });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    const step1 = await client.poll(run.id);
    expect(step1.status).toBe('requires_action');
    expect(step1.requiredAction?.type).toBe('submit_tool_outputs');
    expect(step1.requiredAction?.toolCalls[0]?.function.name).toBe('weather');
    // arguments は JSON string
    expect(JSON.parse(step1.requiredAction!.toolCalls[0]!.function.arguments)).toEqual({ city: 'tokyo' });

    // client 側で tool 実行して結果を返す
    const resumed = client.submitToolOutputs(run.id, {
      toolOutputs: [{ toolCallId: 'call_1', output: 'sunny 22C' }],
    });
    expect(resumed.status).toBe('queued');

    const step2 = await client.poll(run.id);
    expect(step2.status).toBe('completed');
    expect(calledTwice).toBe(2);

    const msgs = client.getThread(thread.id)?.messages ?? [];
    expect(msgs.at(-1)?.content).toBe('weather: sunny 22C');
  });

  it('submitToolOutputs は requires_action 以外の Run で throw する', () => {
    const client = new AssistantsClient();
    const assistant = client.createAssistant({
      name: 'a',
      instructions: '',
      handler: async () => ({ kind: 'message' as const, content: 'x' }),
    });
    const thread = client.createThread();
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    // まだ queued
    expect(() =>
      client.submitToolOutputs(run.id, { toolOutputs: [{ toolCallId: 'x', output: 'y' }] }),
    ).toThrow(/not requires_action/);
  });

  it('pollUntilFinal は requires_action / completed / failed のいずれかで停止する', async () => {
    const client = new AssistantsClient();
    let phase = 0;
    const assistant = client.createAssistant({
      name: 'multistep',
      instructions: '',
      handler: async () => {
        phase += 1;
        if (phase === 1) {
          return {
            kind: 'tool_calls',
            toolCalls: [toolCall({ id: 'c1', name: 'search', arguments: { q: 'kiwa' } })],
          };
        }
        return { kind: 'message', content: 'done' };
      },
    });
    const thread = client.createThread({ messages: [{ role: 'user', content: 'q' }] });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });
    const first = await client.pollUntilFinal(run.id);
    expect(first.status).toBe('requires_action');

    client.submitToolOutputs(run.id, { toolOutputs: [{ toolCallId: 'c1', output: 'ok' }] });
    const second = await client.pollUntilFinal(run.id);
    expect(second.status).toBe('completed');
  });

  it('toolCall() helper は real API と同じ shape (type: function + arguments: JSON string) を組む', () => {
    const call = toolCall({ id: 'x', name: 'calc', arguments: { op: 'add', a: 1, b: 2 } });
    expect(call.type).toBe('function');
    expect(call.function.name).toBe('calc');
    expect(call.function.arguments).toBe('{"op":"add","a":1,"b":2}');
  });
});
