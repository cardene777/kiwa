# kiwa v1.38 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.38 リリース — AI/LLM 深化 II が land.

@kiwa/ai-llm v0.3.0 → v0.4.0 minor bump. 4 provider (Anthropic + OpenAI + Vercel AI SDK + LangChain) 上に advanced AI/LLM production semantics 8 axis を追加.

real driver env-gate (KIWA_MODE=real + ANTHROPIC_API_KEY / OPENAI_API_KEY / VERCEL_AI_SDK_READY / LANGCHAIN_READY) で opt-in production fidelity 走査. dogfood 3 app 新規 (llm-prompt-injection-defense-app + llm-hallucination-eval-app + llm-agent-orchestration-app) 全 7 軸 release gate PASS.

## Tweet 2 — 8 axis AI/LLM advanced semantics

Prompt injection defense / Hallucination detection / LLM eval (LLM-as-judge + rubric) / Guardrails (Constitutional AI + PII) / RAG advanced (hybrid retrieval + reranking) / Agent orchestration (ReAct + ToT + reflection) / Fine-tuning eval / Cost / latency SLA.

## Tweet 3 — 縦深化 pair pattern 10 pair grid

AI/LLM v1.12 → v1.15 → v1.38 の 3 段深化拡張 pattern (Payment v1.14→v1.23→v1.33、 Observability v1.14→v1.17→v1.35 に続く 3 例目). Auth + Realtime + Streaming + Database + Payment + Frontend + Observability + Search + Security に続く 10 pair 目. kiwa 系 monorepo 36 packages 維持.

## Tweet 4 — snippet streak + npm publish

16 milestone 連続 snippet validation streak (v1.23-v1.38) 達成.

`pnpm add -D @kiwa/ai-llm` で v0.4.0 が入る. breaking change なし. migration guide は https://cardene777.github.io/kiwa/migrations/v1.37-to-v1.38
