import { describe, expect, it } from 'vitest';
import { AssistantsClient, END, START, StateGraph, toolCall } from '../src/index.js';

/**
 * integration test — LangGraph + Assistants を組み合わせた「agent orchestration」 の
 * 実シナリオを 1 個 exercise する。 real production では LangGraph node の中で
 * Assistants v2 の 1 run を回す形が典型的、 それを mock 2 系統で完結させる。
 */

interface AgentPipelineState {
  userQuery: string;
  classification: 'search' | 'chat' | null;
  answer: string | null;
  toolCalls: number;
}

describe('integration — LangGraph node が Assistants run を回す', () => {
  it('LangGraph の 3-node pipeline (classify → run-assistant → format) が Assistants を経由して final answer を組む', async () => {
    const assistants = new AssistantsClient();
    const searchAssistant = assistants.createAssistant({
      name: 'search-assistant',
      instructions: 'answer with search tool',
      handler: async (ctx) => {
        if (ctx.toolOutputs === undefined) {
          return {
            kind: 'tool_calls',
            toolCalls: [toolCall({ id: 'c1', name: 'search', arguments: { q: ctx.thread[0]?.content ?? '' } })],
          };
        }
        return { kind: 'message', content: `search: ${ctx.toolOutputs[0]?.output}` };
      },
    });

    const graph = new StateGraph<AgentPipelineState>()
      .addNode('classify', (s) => ({
        classification: s.userQuery.startsWith('search:') ? 'search' : 'chat',
      }))
      .addNode('run-assistant', async (s) => {
        if (s.classification !== 'search') {
          return { answer: `chat: ${s.userQuery}`, toolCalls: 0 };
        }
        const thread = assistants.createThread({
          messages: [{ role: 'user', content: s.userQuery }],
        });
        const run = assistants.createRun({
          threadId: thread.id,
          assistantId: searchAssistant.id,
        });
        // step 1: expect requires_action
        const step1 = await assistants.poll(run.id);
        expect(step1.status).toBe('requires_action');
        const call = step1.requiredAction?.toolCalls[0];
        // simulated tool 実行 (real では MCP client 経由)
        const parsed = JSON.parse(call?.function.arguments ?? '{}') as { q?: string };
        const output = `hit for "${parsed.q ?? '?'}"`;
        assistants.submitToolOutputs(run.id, {
          toolOutputs: [{ toolCallId: call!.id, output }],
        });
        const step2 = await assistants.poll(run.id);
        expect(step2.status).toBe('completed');
        const msg = assistants.getThread(thread.id)?.messages.at(-1);
        return { answer: msg?.content ?? '', toolCalls: 1 };
      })
      .addNode('format', (s) => ({
        answer: s.answer ? `[${s.classification}] ${s.answer}` : s.answer,
      }))
      .addEdge(START, 'classify')
      .addEdge('classify', 'run-assistant')
      .addEdge('run-assistant', 'format')
      .addEdge('format', END);

    const compiled = graph.compile();

    const chatResult = await compiled.invoke({
      userQuery: 'hello',
      classification: null,
      answer: null,
      toolCalls: 0,
    });
    expect(chatResult.classification).toBe('chat');
    expect(chatResult.answer).toBe('[chat] chat: hello');
    expect(chatResult.toolCalls).toBe(0);

    const searchResult = await compiled.invoke({
      userQuery: 'search: kiwa release',
      classification: null,
      answer: null,
      toolCalls: 0,
    });
    expect(searchResult.classification).toBe('search');
    expect(searchResult.answer).toBe('[search] search: hit for "search: kiwa release"');
    expect(searchResult.toolCalls).toBe(1);
  });

  it('stream 経由でも同 pipeline は 3 step を順次 yield する', async () => {
    const assistants = new AssistantsClient();
    assistants.createAssistant({
      name: 'a',
      instructions: '',
      handler: async () => ({ kind: 'message' as const, content: 'ignored' }),
    });

    const graph = new StateGraph<{ n: number; log: string[] }>()
      .addNode('a', (s) => ({ n: s.n + 1, log: [...s.log, 'a'] }))
      .addNode('b', (s) => ({ n: s.n * 2, log: [...s.log, 'b'] }))
      .addNode('c', (s) => ({ n: s.n - 3, log: [...s.log, 'c'] }))
      .addEdge(START, 'a')
      .addEdge('a', 'b')
      .addEdge('b', 'c')
      .addEdge('c', END);
    const compiled = graph.compile();

    const nodes: string[] = [];
    let last: { n: number; log: string[] } = { n: 0, log: [] };
    for await (const step of compiled.stream({ n: 5, log: [] })) {
      nodes.push(step.node);
      last = step.state;
    }
    expect(nodes).toEqual(['a', 'b', 'c']);
    // (5+1)*2 - 3 = 9
    expect(last.n).toBe(9);
    expect(last.log).toEqual(['a', 'b', 'c']);
  });
});
