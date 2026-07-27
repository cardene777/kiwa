import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  AssistantsClient,
  END,
  START,
  StateGraph,
  StateMachine,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'agent';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

interface Counter {
  count: number;
  log: string[];
}

const inc = (state: Counter) => ({
  count: state.count + 1,
  log: [...state.log, 'inc'],
});

const double = (state: Counter) => ({
  count: state.count * 2,
  log: [...state.log, 'double'],
});

interface ChatState {
  messages: string[];
  intent: string | null;
  reply: string | null;
}

describe(MODULE, () => {
  it(
    '3-layer perf: StateMachine invoke + LangGraph StateGraph invoke + Assistants client CRUD primary paths',
    async () => {
      // Pre-compiled StateMachine — invoke path exercises the compiled graph
      // walker (node handler + next-edge lookup). Setup cost is one-time.
      const machine = new StateMachine<Counter>();
      machine.addNode('inc', inc).addNode('double', double);
      machine.addEdge(START, 'inc').addEdge('inc', 'double').addEdge('double', END);
      machine.compile();

      const graph = new StateGraph<ChatState>()
        .addNode('classify', (s) => ({
          intent: s.messages[0]?.startsWith('/help') ? 'help' : 'chat',
        }))
        .addNode('answer', (s) => ({
          reply: s.intent === 'help' ? 'help topics' : `chat: ${s.messages[0]}`,
        }))
        .addEdge(START, 'classify')
        .addEdge('classify', 'answer')
        .addEdge('answer', END);
      const compiledGraph = graph.compile();

      const assistants = new AssistantsClient({ idSeed: 'perf' });
      const assistant = assistants.createAssistant({
        name: 'perf-bot',
        instructions: 'be helpful',
        handler: async () => ({ kind: 'message' as const, content: 'ok' }),
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // StateMachine.invoke — 3-step walk (START→inc→double→END).
            // Real prod path is the same compiled walker — no I/O involved.
            name: 'stateMachineInvoke',
            serialP95CapMs: 5,
            fn: async () => {
              const final = await machine.invoke({ count: 0, log: [] });
              if (final.count !== 2) throw new Error(`count drift: ${final.count}`);
            },
          },
          {
            // LangGraph StateGraph invoke — classify + answer 2-step walk.
            // Same shape as StateMachine (LangGraph 語彙対応 wrapper).
            name: 'stateGraphInvoke',
            serialP95CapMs: 5,
            fn: async () => {
              const final = await compiledGraph.invoke({
                messages: ['/help me'],
                intent: null,
                reply: null,
              });
              if (final.intent !== 'help') throw new Error(`intent drift: ${final.intent}`);
            },
          },
          {
            // AssistantsClient.createThread — deterministic id issue + Map set.
            // Real OpenAI Assistants API: HTTP POST /threads.
            name: 'assistantsCreateThread',
            serialP95CapMs: 5,
            fn: () => {
              assistants.createThread();
            },
          },
          {
            // AssistantsClient.addMessage — thread lookup + append.
            name: 'assistantsAddMessage',
            serialP95CapMs: 5,
            fn: () => {
              const thread = assistants.createThread();
              assistants.addMessage(thread.id, { role: 'user', content: 'hi' });
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
