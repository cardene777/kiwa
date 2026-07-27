import { AssistantsClient, END, START, StateGraph, toolCall } from '@kiwa-lab/agent';
import { describe, expect, it } from 'vitest';

describe('library documentation agent recipes', () => {
  it('merges a graph node patch into the input state', async () => {
    type State = { input: string; reply?: string };
    const graph = new StateGraph<State>()
      .addNode('reply', (state) => ({ reply: `received ${state.input}` }))
      .addEdge(START, 'reply')
      .addEdge('reply', END);

    await expect(graph.compile().invoke({ input: 'hello' })).resolves.toEqual({
      input: 'hello',
      reply: 'received hello',
    });
  });

  it('resumes a run after the application returns a tool result', async () => {
    const client = new AssistantsClient({ idSeed: 'weather' });
    const assistant = client.createAssistant({
      name: 'weather assistant',
      instructions: 'Use the weather tool before replying.',
      handler: async ({ toolOutputs }) => {
        if (toolOutputs === undefined) {
          return {
            kind: 'tool_calls' as const,
            toolCalls: [
              toolCall({
                id: 'weather-call-1',
                name: 'get_weather',
                arguments: { city: 'Tokyo' },
              }),
            ],
          };
        }
        return { kind: 'message' as const, content: `Tokyo weather is ${toolOutputs[0]?.output}` };
      },
    });
    const thread = client.createThread({
      messages: [{ role: 'user', content: 'What is the weather in Tokyo' }],
    });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    const waitingForTool = await client.poll(run.id);
    expect(waitingForTool).toMatchObject({
      status: 'requires_action',
      requiredAction: { type: 'submit_tool_outputs' },
    });
    expect(waitingForTool.requiredAction?.toolCalls[0]?.function).toMatchObject({
      name: 'get_weather',
      arguments: '{"city":"Tokyo"}',
    });

    expect(
      client.submitToolOutputs(run.id, {
        toolOutputs: [{ toolCallId: 'weather-call-1', output: 'sunny and 22 C' }],
      }).status,
    ).toBe('queued');

    await expect(client.poll(run.id)).resolves.toMatchObject({ status: 'completed' });
    expect(client.getThread(thread.id)?.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'Tokyo weather is sunny and 22 C',
    });
  });

  it('records a handler failure without adding an assistant message', async () => {
    const client = new AssistantsClient({ idSeed: 'failure' });
    const assistant = client.createAssistant({
      name: 'unavailable assistant',
      instructions: 'Reply with inventory information.',
      handler: async () => {
        throw new Error('inventory service is unavailable');
      },
    });
    const thread = client.createThread({
      messages: [{ role: 'user', content: 'Is item 42 available' }],
    });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    await expect(client.poll(run.id)).resolves.toMatchObject({
      status: 'failed',
      lastError: {
        code: 'handler_error',
        message: 'inventory service is unavailable',
      },
    });
    expect(client.getThread(thread.id)?.messages).toHaveLength(1);
  });

  it('cancels a queued run before its handler is invoked', async () => {
    const client = new AssistantsClient({ idSeed: 'cancel' });
    const assistant = client.createAssistant({
      name: 'slow assistant',
      instructions: 'Wait for an external result.',
      handler: async () => ({ kind: 'message' as const, content: 'This must not run' }),
    });
    const thread = client.createThread();
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    expect(client.cancel(run.id)).toMatchObject({
      status: 'failed',
      lastError: { code: 'cancelled' },
    });
    await expect(client.poll(run.id)).resolves.toMatchObject({ status: 'failed' });
    expect(client.getThread(thread.id)?.messages).toHaveLength(0);
  });
});
