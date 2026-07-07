# kiwa v1.38 x-thread (English)

## Tweet 1 — hook

kiwa v1.38 is out — AI/LLM 深化 II land.

@kiwa-test/ai-llm v0.3.0 → v0.4.0 minor bump. 8 axis advanced AI/LLM production semantics across 4 provider × 8 axis = 32 cell fidelity grid.

Real driver env-gate (KIWA_MODE=real + ANTHROPIC_API_KEY / OPENAI_API_KEY / VERCEL_AI_SDK_READY / LANGCHAIN_READY). 3 dogfood app new (llm-prompt-injection-defense-app + llm-hallucination-eval-app + llm-agent-orchestration-app) 全 7 軸 release gate PASS.

Vertical deepening pair pattern 第 10 pair 連続化 (3-stage extension 3rd example, following Payment v1.14→v1.23→v1.33 and Observability v1.14→v1.17→v1.35).

## Tweet 2 — 8 axis AI/LLM advanced semantics

- Prompt injection defense — direct + indirect + jailbreak + role hijacking + XML injection
- Hallucination detection — self-consistency + factuality + citation + confidence + hedging
- LLM eval — LLM-as-judge + rubric + preference + Elo + human-in-the-loop
- Guardrails — JSON schema + regex + toxicity + PII + Constitutional AI
- RAG advanced — chunking + hybrid retrieval + reranking + citation + context compression
- Agent orchestration — ReAct + ToT + reflection + self-correction + planning + tool selection
- Fine-tuning eval — SFT/DPO + catastrophic forgetting + benchmark drift
- Cost / latency SLA — budget + p50/p99 + model routing + fallback ladder

## Tweet 3 — vertical deepening pair pattern 10 pair grid

Auth / Realtime / Streaming / Database / Payment / Frontend / Observability / Search / Security + AI/LLM. kiwa 系 monorepo 36 packages 維持 (ai-llm 既存 package の minor 拡張). 3-stage extension 3rd example completed.

## Tweet 4 — snippet streak + npm publish

16 milestone 連続 snippet validation streak (v1.23-v1.38) 達成.

`pnpm add -D @kiwa-test/ai-llm` で v0.4.0 が入る. zero breaking changes. migration guide は https://cardene777.github.io/kiwa/migrations/v1.37-to-v1.38
