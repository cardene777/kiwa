import { describe, expect, it } from 'vitest';
import { AssistantsClient } from '../src/openai-assistants.js';
import type { AssistantHandlerResult, ToolOutput } from '../src/types.js';

describe('openai-assistants defensive branches', () => {
  it('submitToolOutputs throws when run id unknown', async () => {
    const client = new AssistantsClient();
    expect(() =>
      client.submitToolOutputs('run-missing', { toolOutputs: [] as ToolOutput[] }),
    ).toThrow(/unknown run id: run-missing/);
  });

  it('pollUntilFinal with explicit maxAttempts uses the override', async () => {
    const client = new AssistantsClient();
    const asst = client.createAssistant({
      name: 'A',
      instructions: '',
      handler: async (): Promise<AssistantHandlerResult> => ({
        kind: 'message',
        content: 'ok',
      }),
    });
    const thread = client.createThread({});
    const run = client.createRun({
      threadId: thread.id,
      assistantId: asst.id,
    });
    const finalRun = await client.pollUntilFinal(run.id, { maxAttempts: 5 });
    expect(finalRun.status).toBe('completed');
  });

  it('pollUntilFinal with default options (no arg) works', async () => {
    const client = new AssistantsClient();
    const asst = client.createAssistant({
      name: 'B',
      instructions: '',
      handler: async (): Promise<AssistantHandlerResult> => ({
        kind: 'message',
        content: 'ok',
      }),
    });
    const thread = client.createThread({});
    const run = client.createRun({
      threadId: thread.id,
      assistantId: asst.id,
    });
    const finalRun = await client.pollUntilFinal(run.id);
    expect(finalRun.status).toBe('completed');
  });

  it('run handler with toolOutputs context after submitToolOutputs', async () => {
    const client = new AssistantsClient();
    let toolOutputsSeen: readonly ToolOutput[] | undefined;
    let callCount = 0;
    const asst = client.createAssistant({
      name: 'Tools',
      instructions: '',
      handler: async (ctx): Promise<AssistantHandlerResult> => {
        callCount += 1;
        if (callCount === 1) {
          return {
            kind: 'tool_calls',
            toolCalls: [
              {
                id: 'tc-1',
                type: 'function',
                function: {
                  name: 'get_weather',
                  arguments: '{"city":"tokyo"}',
                },
              },
            ],
          };
        }
        toolOutputsSeen = ctx.toolOutputs;
        return { kind: 'message', content: 'done' };
      },
    });
    const thread = client.createThread({});
    const run = client.createRun({
      threadId: thread.id,
      assistantId: asst.id,
    });
    const raStatus = await client.pollUntilFinal(run.id);
    expect(raStatus.status).toBe('requires_action');
    client.submitToolOutputs(run.id, {
      toolOutputs: [{ toolCallId: 'tc-1', output: 'sunny' }],
    });
    const done = await client.pollUntilFinal(run.id);
    expect(done.status).toBe('completed');
    expect(toolOutputsSeen).toBeDefined();
  });
});
