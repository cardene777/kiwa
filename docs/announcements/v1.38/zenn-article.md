# kiwa v1.38 released — AI/LLM 深化 II (@kiwa-test/ai-llm v0.4.0 advanced 8 axis + 縦深化 pair 第 10 pair 連続化 + 3 段拡張 3 例目)

## TL;DR

- **kiwa v1.38 released** — AI/LLM 深化 II milestone
- **`@kiwa-test/ai-llm` v0.3.0 → v0.4.0 minor bump** — advanced 8 axis + real driver env-gate + 4 provider × 8 axis neutral state machine
- **8 axis advanced semantics** = Prompt injection defense + Hallucination detection + LLM eval + Guardrails + RAG advanced + Agent orchestration + Fine-tuning eval + Cost / latency SLA
- **3 dogfood app 新規** — llm-prompt-injection-defense-app (109 test) + llm-hallucination-eval-app (90 test) + llm-agent-orchestration-app (89 test)
- **縦深化 pair pattern 第 10 pair 連続化** — AI/LLM v1.12 → v1.15 → v1.38 の 3 段深化拡張 pattern (Payment v1.14→v1.23→v1.33、 Observability v1.14→v1.17→v1.35 に続く 3 例目)
- **16 milestone 連続 snippet validation streak** (v1.23-v1.38)
- **kiwa 系 monorepo 36 packages 維持** (ai-llm 既存 package の minor 拡張)
- v1.11 以降 28 milestone 連続完遂

## v1.38 が解決したい問題 — AI/LLM production semantics の testing gap

kiwa は v1.37 まで dApp / web app / full-stack framework / 実 backend / real-time / payment / observability / search / security の 35 layer + release-invariants + a11y + component / performance / mutation の quality gate maximum grid を cover していたが、 AI/LLM 領域は v1.12 で 3 provider (Anthropic + OpenAI + Vercel AI SDK) 統一 mock を、 v1.15 で multimodal (image + audio) + Whisper transcription mock を追加していた base + intermediate layer に留まり、 production の advanced semantics (prompt injection defense / hallucination detection / LLM-as-judge eval / guardrails / RAG advanced / agent orchestration / fine-tuning eval / cost-latency SLA) が **未 cover** の状態だった.

v1.38 で `@kiwa-test/ai-llm` v0.3.0 → v0.4.0 minor bump し、 advanced 8 axis を Anthropic + OpenAI + Vercel AI SDK + LangChain の 4 provider 統一 mock として実装、 prompt injection direct + indirect + jailbreak、 hallucination self-consistency + factuality + citation、 LLM eval LLM-as-judge + rubric + Elo、 guardrails JSON schema + Constitutional AI、 RAG chunking + hybrid retrieval + reranking、 agent orchestration ReAct + ToT + reflection、 fine-tuning SFT/DPO eval、 cost-latency budget + p50/p99 + model routing を 1 test surface で扱える AI/LLM backbone testing 基盤を追加した.

## v1.38 で追加した 8 axis advanced AI/LLM semantics

### 1. Prompt injection defense

direct injection + indirect injection + jailbreak + role hijacking + XML injection + system prompt leak defense.

### 2. Hallucination detection

self-consistency + factuality check + citation grounding + confidence scoring + hedging detection + knowledge cutoff.

### 3. LLM eval

LLM-as-judge + rubric-based eval + preference eval + Elo ranking + human-in-the-loop + inter-rater agreement.

### 4. Guardrails

JSON schema validation + regex guardrails + toxicity detection + PII redaction + Constitutional AI + refusal handling.

### 5. RAG advanced

chunking strategy + hybrid retrieval (dense + sparse) + reranking + citation + context compression + query rewriting.

### 6. Agent orchestration

ReAct (Reasoning + Acting) + Tree of Thoughts + reflection + self-correction + planning + tool selection + multi-turn.

### 7. Fine-tuning eval

SFT (Supervised Fine-Tuning) + DPO (Direct Preference Optimization) + catastrophic forgetting + benchmark drift + eval leakage.

### 8. Cost / latency SLA

budget tracking + p50/p99 latency + model routing + fallback ladder + rate limit + cost per 1M token.

## 3 dogfood LLM app 新規

### `dogfood-llm-prompt-injection-defense-app` 新規

Anthropic + prompt injection + jailbreak + guardrails + Constitutional AI walkthrough、 109 test.

### `dogfood-llm-hallucination-eval-app` 新規

OpenAI + LLM-as-judge + rubric-based eval + citation grounding walkthrough、 90 test.

### `dogfood-llm-agent-orchestration-app` 新規

Vercel AI SDK + ReAct + tree of thoughts + reflection + tool selection walkthrough、 89 test.

## Try it

```bash
pnpm add -D @kiwa-test/ai-llm
```

Migration guide (additive-only、 breaking change なし):

- [v1.37 → v1.38 migration guide](https://cardene777.github.io/kiwa/migrations/v1.37-to-v1.38)
- [AI/LLM real-driver testing SSOT concept doc](https://cardene777.github.io/kiwa/concepts/ai-llm-real-driver-testing)
