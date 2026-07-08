# kiwa v1.38 released — AI/LLM 深化 II (@kiwa/ai-llm v0.4.0 advanced 8 axis + real driver + 縦深化 pair 第 10 pair 連続化 + 3 段拡張 3 例目 + 16 milestone snippet streak)

v1.38 is out. **`@kiwa/ai-llm` v0.3.0 → v0.4.0 minor bump** で advanced AI/LLM production semantics 8 axis を追加。 v1.12 (ai-llm v0.1 3 provider Anthropic / OpenAI / Vercel AI SDK 統一 mock) → v1.15 (ai-llm v0.2 / v0.3 multimodal + Whisper transcription) → v1.38 (ai-llm v0.4 advanced 8 axis + 4 provider real driver) の **3 段深化拡張 pattern** (Payment v1.14→v1.23→v1.33、 Observability v1.14→v1.17→v1.35 に続く 3 例目) を完成、 縦深化 pair pattern 第 10 pair 連続化で kiwa の縦深化戦略 SSOT を AI/LLM production layer に拡張した milestone.

## What shipped

- **`@kiwa/ai-llm` v0.3.0 → v0.4.0 minor bump**. advanced AI/LLM semantics 8 axis + 4 provider × 8 axis = 32 combination fidelity harness + real driver env-gate を追加、 436 test.
- **v1.38-1 ai-llm v0.4 advanced 8 axis** (Issue #1102). Prompt injection defense (direct + indirect + jailbreak + role hijacking + XML injection) / Hallucination detection (self-consistency + factuality + citation + confidence + hedging) / LLM eval (LLM-as-judge + rubric + preference + Elo + human-in-the-loop) / Guardrails (JSON schema + regex + toxicity + PII + Constitutional AI) / RAG advanced (chunking + hybrid retrieval + reranking + citation + context compression) / Agent orchestration (ReAct + ToT + reflection + self-correction + planning + tool selection) / Fine-tuning eval (SFT/DPO + catastrophic forgetting + benchmark drift) / Cost / latency SLA (budget + p50/p99 + model routing + fallback ladder) の 8 axis を統一実装、 4 provider (Anthropic + OpenAI + Vercel AI SDK + LangChain) × 8 axis = 32 cell fidelity grid を確立、 436 test.
- **v1.38-2 dogfood-llm-prompt-injection-defense-app 新規** (Issue #1103). Anthropic + prompt injection + jailbreak + guardrails + Constitutional AI walkthrough、 109 test.
- **v1.38-3 dogfood-llm-hallucination-eval-app 新規** (Issue #1104). OpenAI + LLM-as-judge + rubric-based eval + citation grounding walkthrough、 90 test.
- **v1.38-4 dogfood-llm-agent-orchestration-app 新規** (Issue #1105). Vercel AI SDK + ReAct + tree of thoughts + reflection + tool selection walkthrough、 89 test.
- **v1.38-5 docs 補強** (Issue #1106). `docs/tutorials/79-prompt-injection-defense.md` + `docs/tutorials/80-llm-eval-hallucination.md` + `docs/tutorials/81-agent-orchestration.md` + `docs/migrations/v1.37-to-v1.38.md` + `docs/concepts/ai-llm-real-driver-testing.md` + `packages/ai-llm/tests/docs-tutorial-v1.38.test.ts` snippet validation で **16 milestone 連続 snippet validation pattern** (v1.23-v1.38) 達成.
- **v1.38-6 publish** (Issue #1107, this PR). `.claude-plugin/plugin.json` 1.37.0 → 1.38.0 + description v1.38 marker + ai-llm keywords + Roadmap ✅ v1.38 row + announcement 4 file + release-smoke `v1-38-publish.test.ts` + release script filter に `@kiwa/ai-llm` 存在確認 (13 度目の適用).

## Numbers

- **6 sub-Issues resolved** (#1102 / #1103 / #1104 / #1105 / #1106 / #1107)
- **1 npm package minor bump** (`@kiwa/ai-llm` v0.3.0 → v0.4.0)
- **8 axis AI/LLM advanced semantics** (Prompt injection + Hallucination + Eval + Guardrails + RAG + Agent orchestration + Fine-tuning + Cost/latency SLA)
- **32 cell fidelity grid** (4 provider × 8 axis = 32 cell)
- **3 dogfood LLM app 新規** (llm-prompt-injection-defense-app + llm-hallucination-eval-app + llm-agent-orchestration-app)
- **16 milestone 連続 snippet validation streak** (v1.23-v1.38)
- **436 test 追加** (ai-llm v0.4 8 axis semantics)
- **kiwa 系 monorepo 36 packages 維持** (ai-llm 既存 package の minor 拡張)

## Why 縦深化 pair pattern 第 10 pair 連続化 (3 段拡張 3 例目)

AI/LLM は v1.12 → v1.15 → v1.38 の **3 段深化拡張 pattern** で第 10 pair に到達。 Payment v1.14→v1.23→v1.33、 Observability v1.14→v1.17→v1.35 に続く 3 段拡張 3 例目、 縦深化 pair pattern (Auth + Realtime + Streaming + Database + Payment + Frontend + Observability + Search + Security + AI/LLM) 10 pair 連続化.

## Try it

```bash
pnpm add -D @kiwa/ai-llm
```

See the migration guide at https://cardene777.github.io/kiwa/migrations/v1.37-to-v1.38. Zero breaking changes.
