// Consolidated guard tests for startXxxSession(sessionId='') throws.
// Several v0.4 axis files (rag-iii, llm-ops, prompt-engineering-advanced,
// fine-tuning-pipeline) had no dedicated per-file test module and their
// empty-sessionId throw at lines 4-5 was uncovered. Also pins the
// providerEventName `?? neutral` fallback in types.ts.

import { describe, expect, it } from 'vitest';
import {
  startRag3Session,
  startOpsSession,
  startPeaSession,
  startFtpSession,
  startSwarmSession,
  startCiSession,
  startMaoSession,
  startCoSession,
  providerEventName,
} from '../../src/index.js';

describe('startXxxSession — empty sessionId guards', () => {
  it('startRag3Session throws on empty sessionId', () => {
    expect(() => startRag3Session({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startOpsSession throws on empty sessionId', () => {
    expect(() => startOpsSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startPeaSession throws on empty sessionId', () => {
    expect(() => startPeaSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startFtpSession throws on empty sessionId', () => {
    expect(() => startFtpSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startSwarmSession throws on empty sessionId', () => {
    expect(() => startSwarmSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startCiSession throws on empty sessionId', () => {
    expect(() => startCiSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startMaoSession throws on empty sessionId', () => {
    expect(() => startMaoSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('startCoSession throws on empty sessionId', () => {
    expect(() => startCoSession({ target: 'openai', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });
});

describe('providerEventName — unknown neutral event falls back to neutral name', () => {
  it('unknown neutral event returns the vendor-neutral name for every target', () => {
    // The dialect map is `Partial<Record<...>>` so future neutral events added to
    // the union but not to a per-target sub-map surface with the neutral name
    // instead of undefined. Cast to bypass the type union and exercise the
    // runtime `?? neutral` fallback at types.ts line 313.
    for (const target of ['openai', 'anthropic', 'vercel-ai', 'langchain'] as const) {
      // biome-ignore lint/suspicious/noExplicitAny: exercising a runtime fallback
      expect(providerEventName(target, 'not-in-dialect-map' as any)).toBe('not-in-dialect-map');
    }
  });
});
