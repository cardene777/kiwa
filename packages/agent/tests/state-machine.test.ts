import { describe, expect, it } from 'vitest';
import {
  END,
  GraphCompileError,
  MaxStepsExceededError,
  START,
  StateMachine,
} from '../src/index.js';

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

describe('StateMachine — node / edge registration', () => {
  it('addNode + addEdge track counts', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc).addNode('double', double);
    m.addEdge(START, 'inc').addEdge('inc', 'double').addEdge('double', END);
    expect(m.nodeCount).toBe(2);
    expect(m.edgeCount).toBe(3);
    expect(m.isCompiled).toBe(false);
  });

  it('addNode rejects empty / reserved names', () => {
    const m = new StateMachine<Counter>();
    expect(() => m.addNode('', inc)).toThrow(GraphCompileError);
    expect(() => m.addNode(START, inc)).toThrow(/reserved/);
    expect(() => m.addNode(END, inc)).toThrow(/reserved/);
  });

  it('compile flips isCompiled to true on valid graph', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addEdge(START, 'inc').addEdge('inc', END);
    m.compile();
    expect(m.isCompiled).toBe(true);
  });
});

describe('StateMachine — compile validation', () => {
  it('rejects graph without START edge', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addEdge('inc', END);
    expect(() => m.compile()).toThrow(/no START edge/);
  });

  it('rejects graph with multiple START edges', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addNode('double', double);
    m.addEdge(START, 'inc').addEdge(START, 'double');
    m.addEdge('inc', END).addEdge('double', END);
    expect(() => m.compile()).toThrow(/START edges/);
  });

  it('rejects START edge targeting unknown node', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addEdge(START, 'unknown').addEdge('inc', END);
    expect(() => m.compile()).toThrow(/START edge targets unknown node/);
  });

  it('rejects edge.to referencing unknown node', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addEdge(START, 'inc').addEdge('inc', 'ghost');
    expect(() => m.compile()).toThrow(/edge.to references unknown node/);
  });

  it('rejects isolated node with no outgoing edge', () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addNode('orphan', double);
    m.addEdge(START, 'inc').addEdge('inc', END);
    expect(() => m.compile()).toThrow(/no outgoing edge/);
  });
});

describe('StateMachine — invoke / stream execution', () => {
  it('invoke walks START → inc → double → END and returns final state', async () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc).addNode('double', double);
    m.addEdge(START, 'inc').addEdge('inc', 'double').addEdge('double', END);
    m.compile();
    const final = await m.invoke({ count: 3, log: [] });
    // (3 + 1) * 2 = 8
    expect(final.count).toBe(8);
    expect(final.log).toEqual(['inc', 'double']);
  });

  it('stream yields one GraphStep per node in order', async () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc).addNode('double', double);
    m.addEdge(START, 'inc').addEdge('inc', 'double').addEdge('double', END);
    m.compile();
    const steps = [];
    for await (const step of m.stream({ count: 0, log: [] })) {
      steps.push(step);
    }
    expect(steps.map((s) => s.node)).toEqual(['inc', 'double']);
    expect(steps[0]?.state.count).toBe(1);
    expect(steps[1]?.state.count).toBe(2);
    expect(steps[1]?.patch).toEqual({ count: 2, log: ['inc', 'double'] });
  });

  it('invoke throws when called before compile()', async () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc', inc);
    m.addEdge(START, 'inc').addEdge('inc', END);
    await expect(m.invoke({ count: 0, log: [] })).rejects.toThrow(/not compiled/);
  });

  it('async node handler is awaited', async () => {
    const m = new StateMachine<Counter>();
    m.addNode('inc-async', async (s) => {
      await new Promise((r) => setTimeout(r, 5));
      return { count: s.count + 10, log: [...s.log, 'inc-async'] };
    });
    m.addEdge(START, 'inc-async').addEdge('inc-async', END);
    m.compile();
    const final = await m.invoke({ count: 0, log: [] });
    expect(final.count).toBe(10);
    expect(final.log).toEqual(['inc-async']);
  });
});

describe('StateMachine — max steps guard', () => {
  it('throws MaxStepsExceededError on runaway loop', async () => {
    // artifical loop = inc → inc (self loop via two nodes)
    const m = new StateMachine<Counter>();
    m.addNode('a', inc);
    m.addNode('b', inc);
    m.addEdge(START, 'a').addEdge('a', 'b').addEdge('b', 'a');
    m.compile();
    await expect(m.invoke({ count: 0, log: [] }, { maxSteps: 5 })).rejects.toBeInstanceOf(
      MaxStepsExceededError,
    );
  });

  it('MaxStepsExceededError carries steps count', async () => {
    const m = new StateMachine<Counter>();
    m.addNode('a', inc);
    m.addNode('b', inc);
    m.addEdge(START, 'a').addEdge('a', 'b').addEdge('b', 'a');
    m.compile();
    try {
      await m.invoke({ count: 0, log: [] }, { maxSteps: 3 });
      expect.fail('expected MaxStepsExceededError');
    } catch (err) {
      expect(err).toBeInstanceOf(MaxStepsExceededError);
      expect((err as MaxStepsExceededError).steps).toBe(4);
    }
  });
});
