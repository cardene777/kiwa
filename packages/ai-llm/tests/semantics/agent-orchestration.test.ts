import { describe, expect, it } from 'vitest';
import {
  expandToT,
  reactStep,
  reflectAndCorrect,
  selectTool,
  startAgentSession,
} from '../../src/semantics/index.js';

describe('startAgentSession', () => {
  it('creates idle session', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.reactTrace).toEqual([]);
    expect(s.totTree).toBeNull();
  });

  it('throws when sessionId empty', () => {
    expect(() => startAgentSession({ target: 'openai', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('reactStep', () => {
  it('appends step to trace with monotonic index', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    reactStep(s, {
      thought: 'search',
      action: { tool: 'search', input: 'x' },
      observation: 'ok',
    });
    reactStep(s, {
      thought: 'read',
      action: { tool: 'read', input: 'y' },
      observation: 'ok',
    });
    expect(s.reactTrace).toHaveLength(2);
    expect(s.reactTrace[0]?.index).toBe(0);
    expect(s.reactTrace[1]?.index).toBe(1);
  });

  it('throws when tool empty', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      reactStep(s, { thought: 't', action: { tool: '', input: 'x' }, observation: 'y' }),
    ).toThrow('tool must not be empty');
  });

  it('state becomes react-stepped', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    expect(s.state).toBe('react-stepped');
  });
});

describe('expandToT', () => {
  it('builds tree with expected node count', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    const { nodeCount } = expandToT(s, {
      root: { thought: 'root' },
      branches: [
        { thought: 'a', score: 1 },
        { thought: 'b', score: 0.5 },
      ],
      depth: 2,
    });
    expect(nodeCount).toBe(3);
  });

  it('deeper tree yields more nodes', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    const { nodeCount } = expandToT(s, {
      root: { thought: 'root' },
      branches: [
        { thought: 'a', score: 1 },
        { thought: 'b', score: 0.5 },
      ],
      depth: 3,
    });
    expect(nodeCount).toBe(7);
  });

  it('throws when depth <= 0', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      expandToT(s, { root: { thought: 'x' }, branches: [{ thought: 'a', score: 1 }], depth: 0 }),
    ).toThrow('depth must be positive');
  });

  it('throws when branches empty', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    expect(() => expandToT(s, { root: { thought: 'x' }, branches: [], depth: 2 })).toThrow(
      'branches must not be empty',
    );
  });
});

describe('reflectAndCorrect', () => {
  it('finds no violations for clean output', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { reflection } = reflectAndCorrect(s, {
      output: 'clean output',
      critiqueRules: ['forbidden'],
    });
    expect(reflection.critique).toContain('no rule violations');
  });

  it('replaces violating words in revised output', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { reflection } = reflectAndCorrect(s, {
      output: 'this contains forbidden phrasing',
      critiqueRules: ['forbidden'],
    });
    expect(reflection.revised).toContain('[revised]');
    expect(reflection.critique).toContain('violated');
  });

  it('increments cycle across calls', () => {
    const s = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    reflectAndCorrect(s, { output: 'a', critiqueRules: [] });
    const r2 = reflectAndCorrect(s, { output: 'a', critiqueRules: [] });
    expect(r2.reflection.cycle).toBe(2);
  });

  it('throws when session idle', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    expect(() => reflectAndCorrect(s, { output: 'x', critiqueRules: [] })).toThrow(
      'run react or tot first',
    );
  });
});

describe('selectTool', () => {
  it('selects tool whose description overlaps intent tokens', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { selected } = selectTool(s, {
      intent: 'fetch weather',
      candidates: [
        { name: 'weather', description: 'fetch weather data for a city' },
        { name: 'read-file', description: 'read local files from disk' },
      ],
    });
    expect(selected?.name).toBe('weather');
  });

  it('returns null when no candidate overlaps', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { selected } = selectTool(s, {
      intent: 'zzz zzz zzz zzz',
      candidates: [
        { name: 'weather', description: 'fetch data' },
        { name: 'read-file', description: 'read files' },
      ],
    });
    expect(selected).toBeNull();
  });

  it('throws when candidates empty', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    expect(() => selectTool(s, { intent: 'x', candidates: [] })).toThrow(
      'candidates must not be empty',
    );
  });

  it('ranking sorted descending', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { ranking } = selectTool(s, {
      intent: 'search weather',
      candidates: [
        { name: 'w', description: 'weather search' },
        { name: 'x', description: 'foo bar' },
      ],
    });
    expect(ranking[0]?.score).toBeGreaterThanOrEqual(ranking[1]?.score ?? 0);
  });
});
