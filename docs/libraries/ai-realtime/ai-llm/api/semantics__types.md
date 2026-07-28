---
title: "@kiwa-lab/ai-llm semantics__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L427) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: AiLlmTarget, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AiLlmAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L37) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export type AiLlmAxis = 'prompt-injection' | 'hallucination' | 'llm-eval' | 'guardrails' | 'rag-advanced' | 'agent-orchestration' | 'fine-tuning-eval' | 'cost-latency-sla' | 'multi-agent-orchestration' | 'agent-swarm' | 'code-interpreter' | 'fine-tuning-pipeline' | 'llm-ops' | 'prompt-engineering-advanced' | 'rag-iii' | 'cost-optimization';
```

#### <code v-pre>AiLlmTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L35) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

Advanced AI-LLM semantics — provider-neutral axis SSOT (v0.4 + v0.5). Model 4 canonical LLM SDK targets as pure state machines so kiwa fixture tests can assert on a neutral event name while still observing a provider-specific dialect through providerEventName. Provider targets (SDK 別 4): - anthropic ... Anthropic Messages API (Claude Haiku / Sonnet / Opus) - openai ... OpenAI Chat Completions (gpt-4o / gpt-4o-mini) - vercel-ai ... Vercel AI SDK (streamText + generateText、 provider agnostic) - langchain ... LangChain (BaseChatModel + Runnable) v0.4 Axes (8): - prompt-injection ... direct + indirect + jailbreak + role hijacking + XML injection defense - hallucination ... self-consistency + factuality + citation + confidence + hedging - llm-eval ... LLM-as-judge + rubric + preference + Elo + human-in-the-loop - guardrails ... JSON schema + regex + toxicity + PII + Constitutional AI - rag-advanced ... chunking + hybrid retrieval + reranking + citation + context compression - agent-orchestration ... ReAct + ToT + reflection + self-correction + planning + tool selection - fine-tuning-eval ... SFT/DPO + catastrophic forgetting + benchmark drift - cost-latency-sla ... budget + p50/p99 + model routing + fallback ladder v0.5 Axes (advanced III、 8 new): - multi-agent-orchestration ... CrewAI + AutoGen + LangGraph + supervisor + swarm coordination - agent-swarm ... role-based + task allocation + consensus + Byzantine fault tolerance - code-interpreter ... sandboxed Python REPL + tool use + rollback state machine - fine-tuning-pipeline ... dataset prep + RLHF/DPO + eval loop + drift detection - llm-ops ... model registry + rollout + A/B + canary + shadow - prompt-engineering-advanced ... CoT + few-shot + caching + versioning - rag-iii ... GraphRAG + agentic + self-querying + parent document - cost-optimization ... batch API + prompt compression + model cascade + semantic cache

```ts
export type AiLlmTarget = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';
```

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L140) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    timestampMs: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L55) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'injection.direct_detected' | 'injection.indirect_detected' | 'injection.jailbreak_blocked' | 'injection.role_hijacking_blocked' | 'injection.xml_detected' | 'hallucination.self_consistency_scored' | 'hallucination.factuality_checked' | 'hallucination.citation_verified' | 'hallucination.confidence_scored' | 'eval.judge_scored' | 'eval.rubric_applied' | 'eval.preference_ranked' | 'eval.elo_updated' | 'guardrail.schema_validated' | 'guardrail.regex_matched' | 'guardrail.toxicity_blocked' | 'guardrail.pii_redacted' | 'guardrail.constitutional_checked' | 'rag.chunked' | 'rag.hybrid_retrieved' | 'rag.reranked' | 'rag.compressed' | 'agent.react_stepped' | 'agent.tot_expanded' | 'agent.reflected' | 'agent.tool_selected' | 'ft.sft_evaluated' | 'ft.dpo_evaluated' | 'ft.catastrophic_forgetting_detected' | 'ft.benchmark_drift_detected' | 'sla.budget_checked' | 'sla.latency_measured' | 'sla.model_routed' | 'sla.fallback_engaged' | 'mao.crew_assembled' | 'mao.supervisor_delegated' | 'mao.graph_transitioned' | 'mao.round_completed' | 'swarm.roles_assigned' | 'swarm.tasks_allocated' | 'swarm.consensus_reached' | 'swarm.byzantine_tolerated' | 'ci.sandbox_started' | 'ci.code_executed' | 'ci.tool_used' | 'ci.rolled_back' | 'ftp.dataset_prepared' | 'ftp.rlhf_stepped' | 'ftp.eval_loop_ran' | 'ftp.drift_detected' | 'ops.registry_updated' | 'ops.rollout_advanced' | 'ops.ab_evaluated' | 'ops.canary_promoted' | 'ops.shadow_compared' | 'pea.chain_of_thought_expanded' | 'pea.few_shot_selected' | 'pea.cached' | 'pea.version_pinned' | 'rag3.graph_traversed' | 'rag3.agentic_stepped' | 'rag3.self_queried' | 'rag3.parent_expanded' | 'co.batch_submitted' | 'co.prompt_compressed' | 'co.cascade_stepped' | 'co.semantic_cached';
```
