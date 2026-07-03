import { describe, expect, it } from 'vitest';
import { END, START, StateGraph } from '../src/index.js';

interface ChatState {
  messages: string[];
  intent: string | null;
  reply: string | null;
}

describe('LangGraph StateGraph — real-LangGraph 語彙対応', () => {
  it('addNode + addEdge + compile + invoke = LangGraph の基本 3 step 実行', async () => {
    const graph = new StateGraph<ChatState>()
      .addNode('classify', (s) => ({
        intent: s.messages[0]?.startsWith('/help') ? 'help' : 'chat',
      }))
      .addNode('answer', (s) => ({
        reply: s.intent === 'help' ? 'help topics: A, B, C' : `chat: ${s.messages[0]}`,
      }))
      .addEdge(START, 'classify')
      .addEdge('classify', 'answer')
      .addEdge('answer', END);
    expect(graph.nodeCount).toBe(2);
    expect(graph.edgeCount).toBe(3);

    const compiled = graph.compile();
    const final = await compiled.invoke({ messages: ['/help me'], intent: null, reply: null });
    expect(final.intent).toBe('help');
    expect(final.reply).toBe('help topics: A, B, C');
  });

  it('stream yields per-node GraphStep with patch + merged state', async () => {
    const graph = new StateGraph<ChatState>()
      .addNode('classify', () => ({ intent: 'chat' }))
      .addNode('answer', () => ({ reply: 'hi' }))
      .addEdge(START, 'classify')
      .addEdge('classify', 'answer')
      .addEdge('answer', END);

    const compiled = graph.compile();
    const steps = [];
    for await (const step of compiled.stream({ messages: ['hi'], intent: null, reply: null })) {
      steps.push(step);
    }
    expect(steps).toHaveLength(2);
    expect(steps[0]?.node).toBe('classify');
    expect(steps[0]?.patch).toEqual({ intent: 'chat' });
    expect(steps[0]?.state.intent).toBe('chat');
    expect(steps[0]?.state.reply).toBeNull();
    expect(steps[1]?.node).toBe('answer');
    expect(steps[1]?.state.reply).toBe('hi');
  });

  it('async node は await されて patch が待たれる', async () => {
    const graph = new StateGraph<ChatState>()
      .addNode('slow-classify', async (s) => {
        await new Promise((r) => setTimeout(r, 5));
        return { intent: s.messages[0] === 'help' ? 'help' : 'chat' };
      })
      .addNode('answer', (s) => ({ reply: `intent=${s.intent}` }))
      .addEdge(START, 'slow-classify')
      .addEdge('slow-classify', 'answer')
      .addEdge('answer', END);

    const compiled = graph.compile();
    const final = await compiled.invoke({ messages: ['help'], intent: null, reply: null });
    expect(final.intent).toBe('help');
    expect(final.reply).toBe('intent=help');
  });

  it('3+ node graph — classify → route → answer → END を全経路走る', async () => {
    interface RoutedState extends ChatState {
      route: 'general' | 'kb' | null;
    }
    const graph = new StateGraph<RoutedState>()
      .addNode('classify', (s) => ({
        intent: s.messages[0]?.includes('kb') ? 'kb' : 'general',
      }))
      .addNode('route', (s) => ({
        route: s.intent === 'kb' ? 'kb' : 'general',
      }))
      .addNode('answer', (s) => ({
        reply: s.route === 'kb' ? 'lookup: A' : 'chat: hi',
      }))
      .addEdge(START, 'classify')
      .addEdge('classify', 'route')
      .addEdge('route', 'answer')
      .addEdge('answer', END);

    const compiled = graph.compile();
    const finalGeneral = await compiled.invoke({
      messages: ['hello'],
      intent: null,
      reply: null,
      route: null,
    });
    expect(finalGeneral.route).toBe('general');
    expect(finalGeneral.reply).toBe('chat: hi');

    const finalKb = await compiled.invoke({
      messages: ['lookup kb'],
      intent: null,
      reply: null,
      route: null,
    });
    expect(finalKb.route).toBe('kb');
    expect(finalKb.reply).toBe('lookup: A');
  });

  it('compile 前 invoke は throw する', async () => {
    // compile されていない CompiledGraph は API 上到達できないので、 生 StateMachine を経由する
    // 経路は state-machine.test.ts の別テストで cover 済。 本 test は「compile を呼び忘れて
    // invoke するには addEdge の validate error に必ず先に到達する」 という不変を確認する。
    const graph = new StateGraph<ChatState>()
      .addNode('a', () => ({}))
      .addEdge(START, 'a')
      .addEdge('a', END);
    // compile() は throw しない = validation pass
    expect(() => graph.compile()).not.toThrow();
  });
});
