# LLM eval — hallucination detection + LLM-as-judge + rubric + Elo ranking in 15 min

## What you'll build

A vitest suite wired to `@kiwa/ai-llm` v0.4 that models the 5 pieces of a real LLM evaluation pipeline that every non-trivial LLM-backed product eventually needs — a self-consistency scorer that runs multiple samples of the same prompt and measures the token-overlap Jaccard similarity so a low score flags a non-deterministic (hallucination-prone) response, a factuality checker that compares a `claim` against an `evidence` corpus and returns the overlap ratio so a low score flags a citation-less claim, a citation verifier that walks the response's `citations` list against a known-source `corpus` and returns the list of missing (fabricated) citations, an LLM-as-judge scorer that ranks candidate responses against a `prompt` and optional `groundTruth` and returns per-candidate score + reasoning, and a rubric + preference-pair + Elo pipeline (`applyRubric()` → `rankPreference()` → `updateElo()`) that layers a weighted rubric on top of the judge scores so a downstream ranking survives the noise of any single judgment. `startHallucinationSession()` + `scoreSelfConsistency()` + `checkFactuality()` + `verifyCitation()` + `scoreConfidence()` + `startEvalSession()` + `judgeCandidates()` + `applyRubric()` + `rankPreference()` + `updateElo()` give you every one of those pieces without booting a real OpenAI Chat Completions endpoint. This is the pattern kiwa's `examples/dogfood-llm-hallucination-eval-app` exercises against the real OpenAI Chat Completions API under `KIWA_MODE=real` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the factuality score said 0.9 but 3 of the 5 citations pointed to URLs the model hallucinated because the citation-verifier was never chained after `checkFactuality`" gap a reviewer sees in the eval-drift post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-llm-eval && cd kiwa-llm-eval
pnpm init
pnpm add -D @kiwa/ai-llm@^0.4 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.4 surface exports the hallucination axis (`startHallucinationSession` / `scoreSelfConsistency` / `checkFactuality` / `verifyCitation` / `scoreConfidence`) and the llm-eval axis (`startEvalSession` / `judgeCandidates` / `applyRubric` / `rankPreference` / `updateElo`) directly from the package root. This tutorial focuses on the hallucination + eval end-to-end chain; tutorial 79 covers the prompt-injection axis, tutorial 81 covers the agent-orchestration axis.

### 2. `scoreSelfConsistency` — the multi-sample overlap floor

`tests/hallucination/self-consistency.test.ts` — a self-consistency check runs the same prompt N times and measures the average Jaccard similarity across every pair of token sets. A high score (0.7+) means the samples converge on the same answer; a low score (< 0.3) means the model is generating different content each time — a strong hallucination signal. `scoreSelfConsistency()` accepts at least 2 samples and requires the session to be `idle` on first call; it moves the session to `self-consistency-scored`.

```ts
import { describe, expect, it } from 'vitest';
import {
  scoreSelfConsistency,
  startHallucinationSession,
} from '@kiwa/ai-llm';

describe('hallucination — self-consistency', () => {
  it('returns a high score for near-identical samples', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    const { score } = scoreSelfConsistency(s, [
      'the capital of Japan is Tokyo',
      'the capital of Japan is Tokyo',
      'Tokyo is the capital of Japan',
    ]);
    expect(score).toBeGreaterThan(0.5);
    expect(s.state).toBe('self-consistency-scored');
  });

  it('returns a low score for divergent samples', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    const { score } = scoreSelfConsistency(s, [
      'the capital of Japan is Tokyo',
      'blue clouds float over quiet mountains',
      'server logs indicate a spike at 3am',
    ]);
    expect(score).toBeLessThan(0.3);
  });

  it('throws when only one sample is provided', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    expect(() => scoreSelfConsistency(s, ['only one'])).toThrow(
      /need at least 2 samples/,
    );
  });
});
```

The score is stored on `session.scores.selfConsistency` for downstream aggregation — a follow-up gate can refuse to answer when the score falls below a project-specific threshold.

### 3. `checkFactuality` — the claim vs. evidence overlap

`tests/hallucination/factuality.test.ts` — `checkFactuality()` compares a `claim` against a list of `evidence` documents and returns the ratio of evidence items whose token overlap with the claim is at least 30 %. A high score (1.0) means every evidence item supports the claim; a low score (0.0) means the claim is unsupported and probably hallucinated. It requires the session to have been through self-consistency (`session.state === 'self-consistency-scored'`) so the two scores stack on the same session.

```ts
import { describe, expect, it } from 'vitest';
import {
  checkFactuality,
  scoreSelfConsistency,
  startHallucinationSession,
} from '@kiwa/ai-llm';

describe('hallucination — factuality', () => {
  it('returns 1.0 when every evidence item supports the claim', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['identical claim', 'identical claim']);
    const { score } = checkFactuality(s, {
      claim: 'the capital of Japan is Tokyo',
      evidence: [
        'Tokyo is the capital city of Japan',
        'Japan Tokyo capital metropolitan area',
      ],
    });
    expect(score).toBeGreaterThan(0.5);
    expect(s.state).toBe('factuality-checked');
  });

  it('returns 0.0 when no evidence supports the claim', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['sample one', 'sample two']);
    const { score, matches } = checkFactuality(s, {
      // The factuality match uses the token-overlap gate `max(2, floor(claim.size * 0.3))` — pick
      // a claim that shares zero tokens with the evidence to force the "no match" branch.
      claim: 'greenland penguins waddle',
      evidence: [
        'quartz crystals refract sunlight',
        'silicon fabrication requires lithography',
      ],
    });
    expect(score).toBe(0);
    expect(matches).toEqual([]);
  });

  it('throws when the session has not yet been scored for self-consistency', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      checkFactuality(s, { claim: 'x', evidence: ['y'] }),
    ).toThrow(/run self-consistency first/);
  });
});
```

The `matches` array names the exact evidence items that supported the claim — the downstream response can attach them as sources so an operator can audit the citation chain.

### 4. `verifyCitation` — the corpus-membership check

`tests/hallucination/citation.test.ts` — the model can produce a plausible-looking citation URL that does not exist in the corpus. `verifyCitation()` walks the `citations` list against a known-source `corpus` (as a `Set` of source ids or URLs) and returns the ratio of citations that survive the membership check plus the list of missing ones. The missing list is the audit trail — every entry is a fabricated citation.

```ts
import { describe, expect, it } from 'vitest';
import {
  checkFactuality,
  scoreSelfConsistency,
  startHallucinationSession,
  verifyCitation,
} from '@kiwa/ai-llm';

describe('hallucination — citation', () => {
  it('returns 1.0 when every citation is in the corpus', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    checkFactuality(s, { claim: 'x', evidence: ['x'] });
    const { score, missing } = verifyCitation(s, {
      citations: ['doc-1', 'doc-2'],
      corpus: ['doc-1', 'doc-2', 'doc-3'],
    });
    expect(score).toBe(1);
    expect(missing).toEqual([]);
    expect(s.state).toBe('citation-verified');
  });

  it('lists the missing citations when some point to fabricated sources', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    checkFactuality(s, { claim: 'x', evidence: ['x'] });
    const { score, missing } = verifyCitation(s, {
      citations: ['doc-1', 'doc-fabricated'],
      corpus: ['doc-1', 'doc-2'],
    });
    expect(score).toBe(0.5);
    expect(missing).toContain('doc-fabricated');
  });

  it('throws when citations is empty', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    checkFactuality(s, { claim: 'x', evidence: ['x'] });
    expect(() =>
      verifyCitation(s, { citations: [], corpus: ['doc-1'] }),
    ).toThrow(/citations must not be empty/);
  });
});
```

The `missing` list is what the downstream retry gate reads — one fabricated citation is enough to refuse the response and ask the model to re-cite from the known corpus.

### 5. `judgeCandidates` + `applyRubric` — LLM-as-judge over multiple candidates

`tests/eval/judge.test.ts` — `judgeCandidates()` ranks a list of candidate responses against a `prompt` and optional per-candidate `groundTruth`, returning a `JudgeVerdict[]` with `candidateId` + `score` + `reasoning`. The deterministic mock computes the score as `overlap(prompt, cand) * 0.5 + overlap(groundTruth, cand) * 0.5` so a candidate that mirrors the prompt tokens plus matches the ground truth wins. `applyRubric()` layers a weighted rubric (e.g. `helpfulness × 0.4 + safety × 0.3 + accuracy × 0.3`) on top so the final ranking survives noise from any single judgment.

```ts
import { describe, expect, it } from 'vitest';
import {
  applyRubric,
  judgeCandidates,
  startEvalSession,
} from '@kiwa/ai-llm';

describe('eval — LLM-as-judge + rubric', () => {
  it('judgeCandidates scores each candidate and returns reasoning', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    const { verdicts } = judgeCandidates(s, {
      prompt: 'summarize the article about Tokyo',
      candidates: [
        { id: 'c-1', text: 'Tokyo is the capital of Japan', groundTruth: 'Tokyo Japan capital' },
        { id: 'c-2', text: 'random unrelated text', groundTruth: 'Tokyo Japan capital' },
      ],
    });
    expect(verdicts).toHaveLength(2);
    expect(verdicts[0]?.reasoning).toContain('overlap');
    expect(s.state).toBe('judged');
  });

  it('applyRubric combines criteria into a single weighted score', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, {
      prompt: 'summarize',
      candidates: [{ id: 'c-1', text: 'a good summary' }],
    });
    const { weightedScore } = applyRubric(s, {
      candidateId: 'c-1',
      criteria: [
        { key: 'helpfulness', weight: 0.4, score: 0.9 },
        { key: 'safety', weight: 0.3, score: 1.0 },
        { key: 'accuracy', weight: 0.3, score: 0.8 },
      ],
    });
    expect(weightedScore).toBeCloseTo(0.9);
    expect(s.state).toBe('rubric-applied');
  });

  it('applyRubric throws when total weight is zero', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, {
      prompt: 'p',
      candidates: [{ id: 'c-1', text: 'x' }],
    });
    expect(() =>
      applyRubric(s, {
        candidateId: 'c-1',
        criteria: [{ key: 'k', weight: 0, score: 1 }],
      }),
    ).toThrow(/totalWeight must be positive/);
  });
});
```

The `judgeCandidates()` / `applyRubric()` chain is the entry point for LLM-as-judge — a downstream A/B experiment records the per-candidate weighted score and uses it as the ranking signal for the next iteration.

### 6. `rankPreference` + `updateElo` — preference pairs + Elo ladder

`tests/eval/preference.test.ts` — after `judgeCandidates()` and (optionally) `applyRubric()`, the preference-pair + Elo pipeline layers a longer-horizon ranking on top so a candidate that consistently wins across many pairs bubbles to the top. `rankPreference()` accepts a list of pairs (`{ a, b, preferred: 'a' | 'b' | 'tie' }`) and returns win / loss / tie counts per candidate. `updateElo()` walks the winner + loser through the standard Elo update (K = 32 by default) so the ranking persists across sessions.

```ts
import { describe, expect, it } from 'vitest';
import {
  judgeCandidates,
  rankPreference,
  startEvalSession,
  updateElo,
} from '@kiwa/ai-llm';

describe('eval — preference + Elo', () => {
  it('rankPreference tallies wins / losses / ties per candidate', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, {
      prompt: 'p',
      candidates: [
        { id: 'a', text: 'x' },
        { id: 'b', text: 'y' },
      ],
    });
    const { ranking } = rankPreference(s, {
      pairs: [
        { a: 'a', b: 'b', preferred: 'a' },
        { a: 'a', b: 'b', preferred: 'a' },
        { a: 'a', b: 'b', preferred: 'tie' },
      ],
    });
    const rowA = ranking.find((r) => r.id === 'a');
    expect(rowA?.wins).toBe(2);
    expect(rowA?.ties).toBe(1);
    expect(s.state).toBe('preference-ranked');
  });

  it('updateElo shifts the ratings after a win', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, {
      prompt: 'p',
      candidates: [
        { id: 'a', text: 'x' },
        { id: 'b', text: 'y' },
      ],
    });
    rankPreference(s, { pairs: [{ a: 'a', b: 'b', preferred: 'a' }] });
    const { winnerRating, loserRating } = updateElo(s, {
      winner: 'a',
      loser: 'b',
    });
    expect(winnerRating).toBeGreaterThan(1200);
    expect(loserRating).toBeLessThan(1200);
    expect(s.state).toBe('elo-updated');
  });

  it('updateElo throws when winner equals loser', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, {
      prompt: 'p',
      candidates: [{ id: 'a', text: 'x' }],
    });
    rankPreference(s, { pairs: [{ a: 'a', b: 'a', preferred: 'tie' }] });
    expect(() => updateElo(s, { winner: 'a', loser: 'a' })).toThrow(
      /winner and loser must differ/,
    );
  });
});
```

The Elo ladder is the persistent signal — the `eloRatings` `Map` on the session survives across many pairs and eventually converges on a stable ranking that survives even a single noisy judgment.

## Wrap up

Run `pnpm test`. Every step should pass in under 500 ms — the mock path is deterministic and does not hit the network. The full pipeline (self-consistency → factuality → citation → judge → rubric → preference → Elo) is the same one `examples/dogfood-llm-hallucination-eval-app` runs against the real OpenAI Chat Completions API under `KIWA_MODE=real` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` — flip the env variables and the assertions run through real LLM-as-judge cost accounting instead of pattern matching. The concept doc `docs/concepts/ai-llm-real-driver-testing.md` is the SSOT for the 8-axis grid + provider event dialect table; the migration guide `docs/migrations/v1.37-to-v1.38.md` covers what v1.38 added on top of v1.37.
