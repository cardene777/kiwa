# @kiwa-lab/ai-llm リファレンス

## mock factory

| API | 返す操作面 | 用途 |
| --- | --- | --- |
| `createAnthropicMock` | `messages.create` | Anthropic Messages API を使うコード |
| `createOpenAIMock` | `chat.completions.create` と `audio.transcriptions.create` | OpenAI completion、stream、transcription |
| `createVercelAiMock` | `generateText` と `streamText` | Vercel AI SDK の text generation |
| `createLangchainMock` | `invoke` と stream | LangChain chat model |

すべての factory は `MockConfig` を受け取ります。SDK ごとに異なる response object を返しますが、fixture 選択、usage、metrics の考え方は共通です。

## 設定

| 設定 | 内容 | 既定値 |
| --- | --- | --- |
| `responses` | 最後の user message を key にする fixture table | 未設定 |
| `defaultResponse` | fixture miss 時の本文 | `mock default response` |
| `artificialLatencyMs` | 擬似応答遅延 | `10` |
| `costPer1kTokens` | prompt と completion の単価 | Claude Haiku 相当の単価 |
| `model` | response に入れる model identifier | `mock-model` |
| `transcriptions` | Whisper 用の transcription table | 未設定 |
| `imageTokenCost` | 画像一つの base prompt token | `1500` |
| `audioTokenCost` | 30 秒までの音声の base prompt token | `500` |

audio が 30 秒を超える場合は token 見積りが比例して増えます。画像の token 見積りは detail に応じて変わります。これらは provider の課金を完全再現する値ではなく、テストで利用量の分岐を固定する近似値です。

## fidelity と品質レポート

`runFidelityCheck` は real と mock の cost、latency、token、accuracy の差を集計して `FidelityReport` を返します。`buildAiLlmReport` は fidelity と test count、coverage、mutation、performance sample から `@kiwa-lab/quality-metrics` 用の report を作ります。

AI LLM 用の release gate は、provider 名が `@kiwa-lab/ai-` で始まる場合に追加の AI 軸を適用します。mock の unit test を通しただけで fidelity が保証されるわけではありません。

## lifecycle

`getMetrics()` は累積値を返し、`reset()` は mock の状態を初期化します。test が同じ mock を再利用する場合は、各 case の前後で reset するか、metrics の累積を前提に assertion を書きます。stream を途中で中断する application では、SDK 側の消費を止めた後の UI state も別に確認してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `Poisson lambda must be >= 0, got ${lambda}` | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L44) |
| `Poisson lambda > 30 unsupported by Knuth variant; use a larger-lambda algorithm or split into chunks (got ${lambda})` | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L49) |
| `Zipf n must be >= 1, got ${n}` | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L83) |
| `Zipf s must be > 1 (Devroye rejection requires s > 1), got ${s}` | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L84) |
| 'reflectAndCorrect: run react or tot first' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L123) |
| 'selectTool: run react or tot first' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L153) |
| 'selectTool: candidates must not be empty' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L155) |
| 'startAgentSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L55) |
| `reactStep: session is ${session.state}` | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L72) |
| 'reactStep: tool must not be empty' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L74) |
| `expandToT: session is ${session.state}` | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L91) |
| 'expandToT: depth must be positive' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L93) |
| 'expandToT: branches must not be empty' | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L94) |
| 'reachConsensus: assign roles first' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L123) |
| 'reachConsensus: votes must not be empty' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L124) |
| 'tolerateByzantine: assign roles first' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L154) |
| 'tolerateByzantine: no agents assigned' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L156) |
| 'startSwarmSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L53) |
| 'startSwarmSession: faultThreshold must be in [0, 1)' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L56) |
| 'assignRoles: agents must not be empty' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L73) |
| 'assignRoles: roles must not be empty' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L74) |
| 'assignRoles: reliability must be in [0, 1]' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L77) |
| 'allocateTasks: assign roles first' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L98) |
| 'allocateTasks: tasks must not be empty' | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L99) |
| 'useTool: start sandbox first' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L117) |
| 'useTool: tool name must not be empty' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L118) |
| 'rollback: start sandbox first' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L136) |
| 'rollback: steps must be positive' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L137) |
| 'startCiSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L49) |
| 'startSandbox: sandboxId must not be empty' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L69) |
| 'startSandbox: timeoutMs must be positive' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L70) |
| 'executeCode: start sandbox first' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L84) |
| 'executeCode: code must not be empty' | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L85) |
| 'routeModel: check budget or measure latency first' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L121) |
| 'routeModel: candidates must not be empty' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L123) |
| `engageFallback: session is ${session.state}` | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L145) |
| 'engageFallback: ladder must not be empty' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L147) |
| 'startSlaSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L45) |
| 'startSlaSession: budgetUsd must be non-negative' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L47) |
| 'checkBudget: cost must be non-negative' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L62) |
| 'measureLatency: samples must not be empty' | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L90) |
| `measureLatency: session is ${session.state}` | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L92) |
| 'stepCascade: tiers must not be empty' | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L100) |
| 'lookupSemanticCache: queryHash must not be empty' | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L128) |
| 'startCoSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L32) |
| `submitBatch: session is ${session.state}` | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L48) |
| 'submitBatch: requests must not be empty' | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L51) |
| 'compressPrompt: run submitBatch or startCoSession first' | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L72) |
| 'stepCascade: run submitBatch or compressPrompt first' | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L97) |
| 'detectCatastrophicForgetting: run sft/dpo eval first' | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L122) |
| 'detectCatastrophicForgetting: baseline / post length mismatch' | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L125) |
| `detectBenchmarkDrift: session is ${session.state}` | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L154) |
| 'detectBenchmarkDrift: baselineBenchmarks empty — run detectCatastrophicForgetting first to seed baseline' | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L157) |
| 'startFtSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L47) |
| 'evaluateSft: samples must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L62) |
| 'evaluateDpo: samples must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L91) |
| `evaluateDpo: session is ${session.state}` | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L93) |
| 'stepRlhf: prepare dataset first' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L102) |
| 'stepRlhf: rewards must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L103) |
| 'stepRlhf: learningRate must be positive' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L105) |
| 'runEvalLoop: prepare dataset first' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L126) |
| 'runEvalLoop: epochScores must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L128) |
| 'detectDrift: prepare dataset first' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L154) |
| 'detectDrift: run eval loop first' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L156) |
| 'detectDrift: threshold must be non-negative' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L157) |
| 'startFtpSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L53) |
| 'prepareDataset: samples must not be empty' | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L71) |
| 'matchRegex: run schema validation first' | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L121) |
| 'blockToxicity: run earlier checks first' | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L154) |
| 'redactPii: run earlier checks first' | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L192) |
| 'checkConstitutional: run earlier checks first' | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L217) |
| 'startGuardrailSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L49) |
| `validateSchema: session is ${session.state}` | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L64) |
| `verifyCitation: session is ${session.state}` | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L113) |
| 'verifyCitation: citations must not be empty' | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L116) |
| 'scoreConfidence: run other checks first' | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L141) |
| 'startHallucinationSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L37) |
| 'scoreSelfConsistency: need at least 2 samples' | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L53) |
| 'checkFactuality: run self-consistency first' | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L81) |
| 'checkFactuality: evidence must not be empty' | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L84) |
| `rankPreference: session is ${session.state}` | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L109) |
| 'rankPreference: pairs must not be empty' | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L112) |
| `updateElo: session is ${session.state}` | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L153) |
| 'updateElo: winner and loser must differ' | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L156) |
| 'startEvalSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L40) |
| `judgeCandidates: session is ${session.state}` | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L56) |
| 'judgeCandidates: candidates must not be empty' | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L59) |
| `applyRubric: session is ${session.state}, expected judged` | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L86) |
| 'applyRubric: criteria must not be empty' | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L89) |
| 'applyRubric: totalWeight must be positive' | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L92) |
| 'evaluateAb: update registry first' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L114) |
| 'evaluateAb: need at least 2 variants' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L115) |
| 'promoteCanary: update registry first' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L146) |
| 'promoteCanary: errorRate must be in [0, 1]' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L148) |
| 'promoteCanary: threshold must be in [0, 1]' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L150) |
| 'compareShadow: update registry first' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L172) |
| 'compareShadow: scores must not be empty' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L174) |
| 'startOpsSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L48) |
| 'updateRegistry: version must not be empty' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L66) |
| `updateRegistry: version ${input.version} already registered` | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L68) |
| 'advanceRollout: update registry first' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L90) |
| 'advanceRollout: targetPercent must be in [0, 100]' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L92) |
| 'advanceRollout: incrementPercent must be positive' | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L94) |
| 'delegateBySupervisor: assemble crew first' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L100) |
| 'delegateBySupervisor: workerIds must not be empty' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L102) |
| 'delegateBySupervisor: task must not be empty' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L103) |
| `delegateBySupervisor: supervisor ${input.supervisorId} not in crew` | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L105) |
| `delegateBySupervisor: worker ${worker} not in crew` | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L110) |
| 'transitionGraph: assemble crew first' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L132) |
| 'transitionGraph: nodes must not be empty' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L133) |
| `transitionGraph: entry ${input.entryNodeId} not in nodes` | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L135) |
| 'completeRound: assemble crew first' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L164) |
| 'completeRound: minDelegations must be non-negative' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L166) |
| 'startMaoSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L60) |
| 'assembleCrew: agents must not be empty' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L80) |
| 'assembleCrew: agent id must not be empty' | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L83) |
| `assembleCrew: duplicate agent id ${a.id}` | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L84) |
| 'cachePrompt: expand CoT first' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L113) |
| 'cachePrompt: key must not be empty' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L114) |
| 'pinVersion: expand CoT first' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L140) |
| 'pinVersion: semver must match N.N.N' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L142) |
| 'pinVersion: hash must be at least 4 chars' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L143) |
| 'startPeaSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L53) |
| 'expandChainOfThought: thoughts must not be empty' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L72) |
| 'expandChainOfThought: individual thought must not be empty' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L77) |
| 'selectFewShot: expand CoT first' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L93) |
| 'selectFewShot: pool must not be empty' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L94) |
| 'selectFewShot: k must be positive' | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L95) |
| `classifyDirect: session is ${session.state}, expected analyzed` | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L133) |
| `classifyIndirect: session is ${session.state}` | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L150) |
| 'blockJailbreak: analyze first' | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L167) |
| 'blockRoleHijacking: analyze first' | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L184) |
| 'startInjectionSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L47) |
| `detectInjection: session is ${session.state}, cannot analyze` | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L96) |
| `rerank: session is ${session.state}, expected hybrid-retrieved` | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L118) |
| 'rerank: hits must not be empty' | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L120) |
| `compressContext: session is ${session.state}, expected reranked` | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L142) |
| 'compressContext: maxTokens must be positive' | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L144) |
| 'startRagSession: sessionId must not be empty' | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L39) |
| `chunkDocument: session is ${session.state}` | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L55) |
| 'chunkDocument: chunkSize must be positive' | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L57) |
| 'chunkDocument: overlap must be in [0, chunkSize)' | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L59) |
| `hybridRetrieve: session is ${session.state}, expected chunked` | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L85) |
| 'hybridRetrieve: topK must be positive' | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L87) |
| 'stepAgentic: traverse graph first' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L123) |
| 'stepAgentic: confidence must be in [0, 1]' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L125) |
| 'stepAgentic: threshold must be in [0, 1]' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L127) |
| 'stepAgentic: reason must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L129) |
| 'selfQuery: traverse graph first' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L148) |
| 'selfQuery: question must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L150) |
| 'selfQuery: schemaFields must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L152) |
| 'expandParent: traverse graph first' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L175) |
| 'expandParent: parents must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L177) |
| 'expandParent: chunkId must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L179) |
| 'startRag3Session: sessionId must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L59) |
| 'traverseGraph: nodes must not be empty' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L82) |
| 'traverseGraph: maxHops must be positive' | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L83) |
| `traverseGraph: startNode ${input.startNodeId} not in nodes` | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L85) |
| 'resolveBudgetGuard: KIWA_LLM_BUDGET_USD must be a non-negative number' | [packages/ai-llm/src/semantics/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L79) |
| 'resolveBudgetGuard: KIWA_LLM_PER_CALL_CAP_USD must be a non-negative number' | [packages/ai-llm/src/semantics/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L82) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `advanceRollout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L86) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export function advanceRollout(
  session: OpsSession,
  input: { targetPercent: number; incrementPercent: number },
): { step: AxisStep<OpsState>; currentPercent: number; reachedTarget: boolean };
```

#### `AI_LLM_AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L21) `packages/ai-llm/src/semantics/fidelity.ts`

```ts
export declare const AI_LLM_AXIS_TO_EVENTS: Record<AiLlmAxis, NeutralEventName[]>;
```

#### `allocateTasks`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L94) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export function allocateTasks(
  session: SwarmSession,
  input: { tasks: Array<{ id: string; priority: number }> },
): { step: AxisStep<SwarmState>; allocations: SwarmTask[] };
```

#### `apiKeyEnvVar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L48) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function apiKeyEnvVar(backend: LlmBackend): string;
```

#### `applyRubric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L81) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export function applyRubric(
  session: EvalSession,
  input: { candidateId: string; criteria: RubricCriterion[] },
): { step: AxisStep<EvalState>; weightedScore: number };
```

#### `assembleCrew`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L76) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export function assembleCrew(
  session: MaoSession,
  input: { agents: MaoAgent[] },
): { step: AxisStep<MaoState>; agentCount: number };
```

#### `assignRoles`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L69) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export function assignRoles(
  session: SwarmSession,
  input: { agents: Array<{ id: string; reliability: number }>; roles: string[] },
): { step: AxisStep<SwarmState>; assignments: SwarmAgent[] };
```

#### `blockJailbreak`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L162) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export function blockJailbreak(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean };
```

#### `blockRoleHijacking`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L179) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export function blockRoleHijacking(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean };
```

#### `blockToxicity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L149) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export function blockToxicity(
  session: GuardrailSession,
  input: { text: string; threshold?: number },
): { step: AxisStep<GuardrailState>; blocked: boolean; score: number };
```

#### `buildAiLlmReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L59) `packages/ai-llm/src/report.ts`

実測 fidelity + coverage + test count + mutation + perf を `QualityReport` に統合する。 AI-LLM 4 軸は `fidelity.records` から 自動集計。

```ts
export function buildAiLlmReport(input: BuildAiLlmReportInput): QualityReport;
```

#### `buildAiLlmReportFromMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L106) `packages/ai-llm/src/report.ts`

mock adapter の `getMetrics()` から直接 `QualityReport` を組み立てる light path。 fidelity harness を回さず、 mock 単体の実測値だけを report 化する用途 (unit test 内で release gate 検証したいとき等)。

```ts
export function buildAiLlmReportFromMock(input: {
  provider: string;
  version: string;
  mock: AiLlmMock;
  /** accuracy は fidelity 経路が必要なので単体経路では固定値を渡す。 */
  accuracyScore: number;
  accuracyMethod: string;
  surfaceCoverage?: { mockCoveredMethods: number; realTotalMethods: number };
  testCount?: { behavior: number; integration: number; e2e: number };
  notes?: string;
}): QualityReport;
```

#### `buildRealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L120) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function buildRealDriverConfig(
  backend: LlmBackend,
  overrides: Partial<Omit<RealDriverConfig, 'backend'>> = {},
  env: NodeJS.ProcessEnv = process.env,
): RealDriverConfig;
```

#### `cachePrompt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L109) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export function cachePrompt(
  session: PeaSession,
  input: { key: string; value: string },
): { step: AxisStep<PeaState>; entry: PeaCacheEntry; wasHit: boolean };
```

#### `chargeBudget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L87) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function chargeBudget(
  guard: BudgetGuardConfig,
  costUsd: number,
): { allowed: boolean; reason: string; remaining: number };
```

#### `checkBudget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L58) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export function checkBudget(
  session: SlaSession,
  input: { cost: number },
): { step: AxisStep<SlaState>; allowed: boolean; remaining: number };
```

#### `checkConstitutional`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L212) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export function checkConstitutional(
  session: GuardrailSession,
  input: { text: string; principles: ConstitutionalPrinciple[] },
): { step: AxisStep<GuardrailState>; violations: Array<{ id: string; word: string }> };
```

#### `checkFactuality`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L76) `packages/ai-llm/src/semantics/hallucination.ts`

```ts
export function checkFactuality(
  session: HallucinationSession,
  input: { claim: string; evidence: string[] },
): { step: AxisStep<HallucinationState>; score: number; matches: string[] };
```

#### `chunkDocument`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L50) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export function chunkDocument(
  session: RagSession,
  input: { doc: string; chunkSize: number; overlap: number },
): { step: AxisStep<RagState>; chunks: Array<{ id: string; text: string }> };
```

#### `classifyDirect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L128) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export function classifyDirect(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean };
```

#### `classifyIndirect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L145) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export function classifyIndirect(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; blocked: boolean };
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L118) `packages/ai-llm/src/semantics/fidelity.ts`

```ts
export function collectFidelityCoverage(
  providers: AiLlmTarget[] = ['anthropic', 'openai', 'vercel-ai', 'langchain'],
): FidelityCoverage;
```

#### `compareShadow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L168) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export function compareShadow(
  session: OpsSession,
  input: { productionScores: number[]; shadowScores: number[] },
): { step: AxisStep<OpsState>; delta: number; better: boolean };
```

#### `completeRound`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L160) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export function completeRound(
  session: MaoSession,
  input: { minDelegations: number },
): { step: AxisStep<MaoState>; roundsCompleted: number; sufficient: boolean };
```

#### `compressContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L137) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export function compressContext(
  session: RagSession,
  input: { hits: RerankedHit[]; maxTokens: number },
): { step: AxisStep<RagState>; compressed: string; keptCount: number; totalTokens: number };
```

#### `compressPrompt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L67) `packages/ai-llm/src/semantics/cost-optimization.ts`

```ts
export function compressPrompt(
  session: CoSession,
  input: { prompt: string; maxChars?: number },
): { step: AxisStep<CoState>; compressed: string; ratio: number };
```

#### `costForTokens`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L87) `packages/ai-llm/src/pricing.ts`

Compute cost in USD for a request given raw `input_tokens` + `output_tokens`. The vendor SSE / JSON payload names are kept out of the signature — accepts plain numbers so both Anthropic-shaped (`input_tokens`) and OpenAI-shaped (`prompt_tokens`) callers wire in without a shim.

```ts
export function costForTokens(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number;
```

#### `createAnthropicMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L126) `packages/ai-llm/src/anthropic.ts`

```ts
export function createAnthropicMock(config: MockConfig = {}): AnthropicMock;
```

#### `createLangchainMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L89) `packages/ai-llm/src/langchain.ts`

```ts
export function createLangchainMock(config: MockConfig = {}): LangchainMock;
```

#### `createOpenAIMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L182) `packages/ai-llm/src/openai.ts`

```ts
export function createOpenAIMock(config: MockConfig = {}): OpenAiMock;
```

#### `createVercelAiMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L97) `packages/ai-llm/src/vercel-ai.ts`

```ts
export function createVercelAiMock(config: MockConfig = {}): VercelAiMock;
```

#### `delegateBySupervisor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L96) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export function delegateBySupervisor(
  session: MaoSession,
  input: { supervisorId: string; task: string; workerIds: string[] },
): { step: AxisStep<MaoState>; delegation: MaoDelegation };
```

#### `detectBenchmarkDrift`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L149) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export function detectBenchmarkDrift(
  session: FtSession,
  input: { current: BenchmarkResult[]; driftThreshold?: number },
): { step: AxisStep<FtState>; drifted: Array<{ name: string; delta: number }> };
```

#### `detectCatastrophicForgetting`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L113) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export function detectCatastrophicForgetting(
  session: FtSession,
  input: { baseline: BenchmarkResult[]; postFineTune: BenchmarkResult[]; threshold?: number },
): {
  step: AxisStep<FtState>;
  forgotten: Array<{ name: string; drop: number }>;
  averageDrop: number;
};
```

#### `detectDrift`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L150) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export function detectDrift(
  session: FtpSession,
  input: { threshold: number },
): { step: AxisStep<FtpState>; drifted: boolean; delta: number };
```

#### `detectInjection`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L91) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export function detectInjection(
  session: InjectionSession,
  input: string,
): { step: AxisStep<InjectionState>; detections: InjectionDetection[] };
```

#### `endpointEnvKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L35) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function endpointEnvKey(backend: LlmBackend): string;
```

#### `engageFallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L140) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export function engageFallback(
  session: SlaSession,
  input: { ladder: string[]; failed: string[] },
): { step: AxisStep<SlaState>; nextModel: string | null; attemptedCount: number };
```

#### `estimateMultimodalTokens`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L141) `packages/ai-llm/src/multimodal.ts`

parts に含まれる image / audio の token 換算量を返す。 token 見積の内訳は `imageTokenCost` (default 1500) × image 数 + `audioTokenCost` (default 500) × audio 数 (durationSeconds &gt; 30 の場合は比例増分)。 detail hint は OpenAI vision の課金モデルに寄せて low = 1/2、 high = 実額、 auto = 実額の 0.8 を掛ける。

```ts
export function estimateMultimodalTokens(
  parts: MessagePart[] | undefined,
  config: { imageTokenCost?: number; audioTokenCost?: number } = {},
): number;
```

#### `evaluateAb`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L110) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export function evaluateAb(
  session: OpsSession,
  input: { results: OpsAbResult[]; minSamples: number },
): { step: AxisStep<OpsState>; winner: string | null; delta: number };
```

#### `evaluateDpo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L87) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export function evaluateDpo(
  session: FtSession,
  samples: DpoSample[],
): { step: AxisStep<FtState>; averageMargin: number; preferenceAccuracy: number };
```

#### `evaluateSft`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L58) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export function evaluateSft(
  session: FtSession,
  samples: SftSample[],
): { step: AxisStep<FtState>; averageF1: number; exactMatchRate: number };
```

#### `executeCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L80) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export function executeCode(
  session: CiSession,
  input: { code: string; assigns?: Record<string, string> },
): { step: AxisStep<CiState>; execution: CiExecution };
```

#### `expandChainOfThought`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L67) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export function expandChainOfThought(
  session: PeaSession,
  input: { thoughts: string[] },
): { step: AxisStep<PeaState>; steps: CotStep[] };
```

#### `expandParent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L171) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export function expandParent(
  session: Rag3Session,
  input: { chunkId: string; parents: RagParentDoc[] },
): { step: AxisStep<Rag3State>; parent: RagParentDoc | null };
```

#### `expandToT`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L86) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export function expandToT(
  session: AgentSession,
  input: { root: { thought: string }; branches: Array<{ thought: string; score: number }>; depth: number },
): { step: AxisStep<AgentState>; nodeCount: number };
```

#### `extractTextFromParts`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L126) `packages/ai-llm/src/multimodal.ts`

parts から text 部分だけを結合 (adapter が下位 engine に渡す用)。

```ts
export function extractTextFromParts(parts: MessagePart[]): string;
```

#### `hasAudioPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L181) `packages/ai-llm/src/multimodal.ts`

「audio 1 件以上を含む parts」 の shape guard。

```ts
export function hasAudioPart(parts: MessagePart[] | undefined): boolean;
```

#### `hasImagePart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L175) `packages/ai-llm/src/multimodal.ts`

「image 1 件以上を含む parts」 の shape guard。 adapter の分岐用。

```ts
export function hasImagePart(parts: MessagePart[] | undefined): boolean;
```

#### `hasMultimodalParts`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L120) `packages/ai-llm/src/multimodal.ts`

`parts` に image / audio が 1 件でも含まれるか。

```ts
export function hasMultimodalParts(parts: MessagePart[] | undefined): boolean;
```

#### `hybridRetrieve`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L80) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export function hybridRetrieve(
  session: RagSession,
  input: { query: string; denseWeight: number; sparseWeight: number; topK: number },
): { step: AxisStep<RagState>; hits: RetrievalHit[] };
```

#### `isKiwaModeReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L15) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function isKiwaModeReal(env: NodeJS.ProcessEnv = process.env): boolean;
```

#### `jaccardSimilarity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L103) `packages/ai-llm/src/fidelity.ts`

Jaccard 単語 similarity — 実 LLM tokenizer なしで文字列近似を計算する 軽量 default。 embedding cosine と厳密には一致しないが、 mock 検証には 十分 (完全一致 = 1.0、 無関係 = 0.0)。

```ts
export function jaccardSimilarity(a: string, b: string): number;
```

#### `judgeCandidates`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L51) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export function judgeCandidates(
  session: EvalSession,
  input: { prompt: string; candidates: Array<{ id: string; text: string; groundTruth?: string }> },
): { step: AxisStep<EvalState>; verdicts: JudgeVerdict[] };
```

#### `lookupModelPrice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L70) `packages/ai-llm/src/pricing.ts`

Look up a model's price entry. Alias-resolves first, then reads `PRICE_TABLE`. Unknown models fall back to Anthropic Sonnet 3.5 rates with `wasFallback: true` so callers can log the drift instead of silently emitting zero-cost figures. `Object.hasOwn` guards against inherited property lookups (e.g. `toString` / `__proto__`) that would otherwise resolve to non-price built-ins.

```ts
export function lookupModelPrice(model: string): PriceLookupResult;
```

#### `lookupSemanticCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L123) `packages/ai-llm/src/semantics/cost-optimization.ts`

```ts
export function lookupSemanticCache(
  session: CoSession,
  input: { queryHash: string; value?: string },
): { step: AxisStep<CoState>; hit: boolean; cached: string | null };
```

#### `makeSeededRandom`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L20) `packages/ai-llm/src/sampling.ts`

mulberry32 seeded PRNG — 32-bit state, returns floats in [0, 1). Same seed always yields the same sequence, so a perf test with `seed=42` observes identical samples on every run and can gate on the resulting distribution shape.

```ts
export function makeSeededRandom(seed: number): () => number;
```

#### `matchRegex`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L116) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export function matchRegex(
  session: GuardrailSession,
  input: { text: string; patterns: RegExp[]; mode: 'allow' | 'deny' },
): { step: AxisStep<GuardrailState>; passed: boolean; hits: string[] };
```

#### `measureLatency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L80) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export function measureLatency(
  session: SlaSession,
  samples: LatencySample[],
): {
  step: AxisStep<SlaState>;
  p50: number;
  p95: number;
  p99: number;
  count: number;
};
```

#### `MockEngine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/engine.ts#L29) `packages/ai-llm/src/engine.ts`

```ts
export declare class MockEngine {
  readonly config: ResolvedConfig;
  private totalCostUsd = 0;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private latencySamplesMs: number[] = [];
  private requestCount = 0;
  private responseCallIndex = new Map<string, number>();
  constructor(config: MockConfig = {});
  async runChat(input: ChatInput): Promise<ChatCompletion>;
  async *runStream(input: ChatInput): AsyncGenerator<StreamEvent, void, unknown>;
  getMetrics(): ReturnType<AiLlmMock['getMetrics']>;
  reset(): void;
  private resolveResponse(userPrompt: string): MockResponse;
  private buildUsage(input: ChatInput, resp: MockResponse): Usage;
  private computeCost(usage: Usage): number;
  private async simulateLatency(): Promise<void>;
  private record(costUsd: number, usage: Usage, latencyMs: number): void;
}
```

#### `pinVersion`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L136) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export function pinVersion(
  session: PeaSession,
  input: { semver: string; hash: string },
): { step: AxisStep<PeaState>; version: string };
```

#### `prepareDataset`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L67) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export function prepareDataset(
  session: FtpSession,
  input: { samples: FtpSample[]; dedupe: boolean },
): { step: AxisStep<FtpState>; sampleCount: number; deduped: number };
```

#### `PRICE_ALIASES`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L40) `packages/ai-llm/src/pricing.ts`

Alias → canonical model name. Vendors publish moving aliases like `-latest` that we resolve.

```ts
export declare const PRICE_ALIASES: Readonly<Record<string, string>>;
```

#### `PRICE_TABLE`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L27) `packages/ai-llm/src/pricing.ts`

Prices per 1M tokens keyed by model identifier as the vendor names it. Aliases like `claude-3-5-sonnet-latest` route to the concrete versioned entry (`claude-3-5-sonnet-20241022`) via `PRICE_ALIASES` so a bump on the vendor side that renames the alias target does not silently break lookup.

```ts
export declare const PRICE_TABLE: Readonly<Record<string, ModelPrice>>;
```

#### `promoteCanary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L142) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export function promoteCanary(
  session: OpsSession,
  input: { canaryVersion: string; errorRate: number; threshold: number },
): { step: AxisStep<OpsState>; promoted: boolean };
```

#### `providerEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L427) `packages/ai-llm/src/semantics/types.ts`

```ts
export function providerEventName(target: AiLlmTarget, neutral: NeutralEventName): string;
```

#### `rankPreference`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L104) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export function rankPreference(
  session: EvalSession,
  input: { pairs: Array<{ a: string; b: string; preferred: 'a' | 'b' | 'tie' }> },
): { step: AxisStep<EvalState>; ranking: Array<{ id: string; wins: number; losses: number; ties: number }> };
```

#### `reachConsensus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L119) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export function reachConsensus(
  session: SwarmSession,
  input: { votes: SwarmVote[] },
): { step: AxisStep<SwarmState>; winner: string | null; agreementRatio: number };
```

#### `reactStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L67) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export function reactStep(
  session: AgentSession,
  input: { thought: string; action: { tool: string; input: string }; observation: string },
): { step: AxisStep<AgentState>; trace: ReactStep[] };
```

#### `redactPii`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L187) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export function redactPii(
  session: GuardrailSession,
  text: string,
): { step: AxisStep<GuardrailState>; redacted: string; hits: Array<{ kind: string; count: number }> };
```

#### `reflectAndCorrect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L118) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export function reflectAndCorrect(
  session: AgentSession,
  input: { output: string; critiqueRules: string[] },
): { step: AxisStep<AgentState>; reflection: Reflection };
```

#### `rerank`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L113) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export function rerank(
  session: RagSession,
  input: { query: string; hits: RetrievalHit[] },
): { step: AxisStep<RagState>; reranked: RerankedHit[] };
```

#### `resolveApiKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L61) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function resolveApiKey(
  backend: LlmBackend,
  env: NodeJS.ProcessEnv = process.env,
): string | null;
```

#### `resolveBudgetGuard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L75) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function resolveBudgetGuard(env: NodeJS.ProcessEnv = process.env): BudgetGuardConfig;
```

#### `resolveLlmEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L26) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function resolveLlmEndpoint(
  backend: LlmBackend,
  env: NodeJS.ProcessEnv = process.env,
): string;
```

#### `rollback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L132) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export function rollback(
  session: CiSession,
  input: { steps: number },
): { step: AxisStep<CiState>; poppedCount: number; remaining: number };
```

#### `routeModel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L112) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export function routeModel(
  session: SlaSession,
  input: {
    candidates: RoutingCandidate[];
    slaLatencyMs: number;
    minQuality: number;
  },
): { step: AxisStep<SlaState>; chosen: RoutingCandidate | null; considered: RoutingCandidate[] };
```

#### `runEvalLoop`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L122) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export function runEvalLoop(
  session: FtpSession,
  input: { epochScores: number[] },
): { step: AxisStep<FtpState>; bestScore: number; averageScore: number };
```

#### `runFidelityCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L61) `packages/ai-llm/src/fidelity.ts`

fidelity 実行 — 全 prompt を real / mock 両方に投げて diff を計測。

```ts
export async function runFidelityCheck(input: FidelityInput): Promise<FidelityReport>;
```

#### `samplePoisson`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L38) `packages/ai-llm/src/sampling.ts`

Poisson-distributed sample stream. Knuth's algorithm — simple, correct for the small lambdas (0.5–20) perf tests use for arrival-interval / request-count models. For lambda &gt; ~30 numerical underflow makes this variant unusable, but that regime is out of scope for the dogfood perf suite.

```ts
export function samplePoisson(
  count: number,
  lambda: number,
  rng: () => number,
): number[];
```

#### `sampleZipf`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L76) `packages/ai-llm/src/sampling.ts`

Zipf-distributed sample stream — heavy-tail integer draws from {1..n}. Rejection method with Devroye's shape parameter is used so larger `s` (skew) values still converge; perf tests use s ≈ 1.07 to approximate the observed prompt-length distribution in production chat traffic.

```ts
export function sampleZipf(
  count: number,
  n: number,
  s: number,
  rng: () => number,
): number[];
```

#### `scoreConfidence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L136) `packages/ai-llm/src/semantics/hallucination.ts`

```ts
export function scoreConfidence(
  session: HallucinationSession,
  text: string,
): { step: AxisStep<HallucinationState>; score: number; hedgingRatio: number };
```

#### `scoreSelfConsistency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L48) `packages/ai-llm/src/semantics/hallucination.ts`

```ts
export function scoreSelfConsistency(
  session: HallucinationSession,
  samples: string[],
): { step: AxisStep<HallucinationState>; score: number };
```

#### `selectFewShot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L89) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export function selectFewShot(
  session: PeaSession,
  input: { pool: FewShotExample[]; k: number },
): { step: AxisStep<PeaState>; selected: FewShotExample[] };
```

#### `selectTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L148) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export function selectTool(
  session: AgentSession,
  input: { intent: string; candidates: Array<{ name: string; description: string }> },
): { step: AxisStep<AgentState>; selected: ToolCandidate | null; ranking: ToolCandidate[] };
```

#### `selfQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L144) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export function selfQuery(
  session: Rag3Session,
  input: { question: string; schemaFields: string[] },
): { step: AxisStep<Rag3State>; predicate: string; matchedFields: string[] };
```

#### `skipUnlessReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L134) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export function skipUnlessReal(env: NodeJS.ProcessEnv = process.env): {
  skip: boolean;
  reason: string;
};
```

#### `startAgentSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L50) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export function startAgentSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): AgentSession;
```

#### `startCiSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L44) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export function startCiSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): CiSession;
```

#### `startCoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L27) `packages/ai-llm/src/semantics/cost-optimization.ts`

```ts
export function startCoSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): CoSession;
```

#### `startEvalSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L35) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export function startEvalSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): EvalSession;
```

#### `startFtpSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L48) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export function startFtpSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): FtpSession;
```

#### `startFtSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L42) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export function startFtSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): FtSession;
```

#### `startGuardrailSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L44) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export function startGuardrailSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): GuardrailSession;
```

#### `startHallucinationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L32) `packages/ai-llm/src/semantics/hallucination.ts`

```ts
export function startHallucinationSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): HallucinationSession;
```

#### `startInjectionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L42) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export function startInjectionSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): InjectionSession;
```

#### `startMaoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L55) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export function startMaoSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): MaoSession;
```

#### `startOpsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L43) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export function startOpsSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): OpsSession;
```

#### `startPeaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L48) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export function startPeaSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): PeaSession;
```

#### `startRag3Session`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L54) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export function startRag3Session(input: {
  target: AiLlmTarget;
  sessionId: string;
}): Rag3Session;
```

#### `startRagSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L34) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export function startRagSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): RagSession;
```

#### `startSandbox`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L64) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export function startSandbox(
  session: CiSession,
  input: { sandboxId: string; timeoutMs: number },
): { step: AxisStep<CiState>; sandboxId: string };
```

#### `startSlaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L39) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export function startSlaSession(input: {
  target: AiLlmTarget;
  sessionId: string;
  budgetUsd: number;
}): SlaSession;
```

#### `startSwarmSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L47) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export function startSwarmSession(input: {
  target: AiLlmTarget;
  sessionId: string;
  faultThreshold?: number;
}): SwarmSession;
```

#### `stepAgentic`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L119) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export function stepAgentic(
  session: Rag3Session,
  input: { confidence: number; threshold: number; reason: string },
): { step: AxisStep<Rag3State>; action: 'fetch' | 'answer'; index: number };
```

#### `stepCascade`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L89) `packages/ai-llm/src/semantics/cost-optimization.ts`

```ts
export function stepCascade(
  session: CoSession,
  input: {
    confidence: number;
    tiers: Array<{ name: string; costPerToken: number; confidenceThreshold: number }>;
  },
): { step: AxisStep<CoState>; selectedTier: string; escalated: boolean };
```

#### `stepRlhf`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L98) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export function stepRlhf(
  session: FtpSession,
  input: { rewards: number[]; learningRate: number },
): { step: AxisStep<FtpState>; totalStep: FtpRlhfStep };
```

#### `submitBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L43) `packages/ai-llm/src/semantics/cost-optimization.ts`

```ts
export function submitBatch(
  session: CoSession,
  input: { requests: Array<{ id: string; tokens: number }>; batchSizeLimit?: number },
): { step: AxisStep<CoState>; batchCount: number; estimatedSavings: number };
```

#### `tolerateByzantine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L150) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export function tolerateByzantine(
  session: SwarmSession,
  input: { faultyAgentIds: string[] },
): { step: AxisStep<SwarmState>; tolerated: boolean; honestRatio: number };
```

#### `toTranscriptionKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L167) `packages/ai-llm/src/multimodal.ts`

audio part を transcription key に変換 (mock dict lookup 用)。 base64 は `base64:{先頭 32 文字}`、 url は `url:{url}` を使う。 先頭 32 文字 hash は 「同じ audio を渡せば同じ key」 を担保する軽量 fingerprint。

```ts
export function toTranscriptionKey(source: MediaSource): string;
```

#### `transitionGraph`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L128) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export function transitionGraph(
  session: MaoSession,
  input: { nodes: MaoGraphNode[]; edges: MaoGraphEdge[]; entryNodeId: string },
): { step: AxisStep<MaoState>; visited: string[] };
```

#### `traverseGraph`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L73) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export function traverseGraph(
  session: Rag3Session,
  input: {
    nodes: RagGraphNode[];
    edges: RagGraphEdge[];
    startNodeId: string;
    maxHops: number;
  },
): { step: AxisStep<Rag3State>; visited: string[]; totalWeight: number };
```

#### `updateElo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L148) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export function updateElo(
  session: EvalSession,
  input: { winner: string; loser: string; k?: number },
): { step: AxisStep<EvalState>; winnerRating: number; loserRating: number };
```

#### `updateRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L61) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export function updateRegistry(
  session: OpsSession,
  input: { version: string; activate: boolean },
): { step: AxisStep<OpsState>; registrySize: number };
```

#### `useTool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L113) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export function useTool(
  session: CiSession,
  input: { name: string; args: Record<string, string | number | boolean> },
): { step: AxisStep<CiState>; call: CiToolCall };
```

#### `validateSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L59) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export function validateSchema(
  session: GuardrailSession,
  input: { value: unknown; schema: SimpleSchema },
): { step: AxisStep<GuardrailState>; valid: boolean; errors: string[] };
```

#### `verifyCitation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L108) `packages/ai-llm/src/semantics/hallucination.ts`

```ts
export function verifyCitation(
  session: HallucinationSession,
  input: { citations: string[]; corpus: string[] },
): { step: AxisStep<HallucinationState>; score: number; missing: string[] };
```

### 型

#### `AgentSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L15) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export interface AgentSession {
  target: AiLlmTarget;
  sessionId: string;
  state: AgentState;
  history: AxisStep<AgentState>[];
  reactTrace: ReactStep[];
  totTree: ToTNode | null;
}
```

#### `AgentState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L8) `packages/ai-llm/src/semantics/agent-orchestration.ts`

Agent orchestration axis — ReAct + Tree-of-Thought + reflection + self-correction + planning + tool selection state machine。

```ts
export type AgentState =
  | 'idle'
  | 'react-stepped'
  | 'tot-expanded'
  | 'reflected'
  | 'tool-selected';
```

#### `AiLlmAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L37) `packages/ai-llm/src/semantics/types.ts`

```ts
export type AiLlmAxis =
  | 'prompt-injection'
  | 'hallucination'
  | 'llm-eval'
  | 'guardrails'
  | 'rag-advanced'
  | 'agent-orchestration'
  | 'fine-tuning-eval'
  | 'cost-latency-sla'
  | 'multi-agent-orchestration'
  | 'agent-swarm'
  | 'code-interpreter'
  | 'fine-tuning-pipeline'
  | 'llm-ops'
  | 'prompt-engineering-advanced'
  | 'rag-iii'
  | 'cost-optimization';
```

#### `AiLlmMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L163) `packages/ai-llm/src/types.ts`

kiwa mock を全 SDK adapter が満たすべき最小 interface。 SDK 固有の API (`messages.create` / `chat.completions.create` / `generateText` / `invoke` 等) は adapter 別に定義、 本 interface は 4 SDK 共通の低レベル呼出だけ を集約する。 `chatCompletion` = non-streaming、 `chatStream` = SSE 相当の async iterable。 SDK 表面の名前 (`chat` / `stream`) と衝突しないよう prefix を付ける。

```ts
export interface AiLlmMock {
  /** SDK 名 (`anthropic` / `openai` / `vercel-ai` / `langchain`)。 */
  readonly sdk: string;
  chatCompletion(input: ChatInput): Promise<ChatCompletion>;
  chatStream(input: ChatInput): AsyncIterable<StreamEvent>;
  /** 累積の cost / token / latency を返す (fidelity 計測用)。 */
  getMetrics(): {
    totalCostUsd: number;
    totalTokens: Usage;
    latencySamplesMs: number[];
    requests: number;
  };
  /** metric 状態を初期化する。 */
  reset(): void;
}
```

#### `AiLlmTarget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L35) `packages/ai-llm/src/semantics/types.ts`

Advanced AI-LLM semantics — provider-neutral axis SSOT (v0.4 + v0.5). Model 4 canonical LLM SDK targets as pure state machines so kiwa fixture tests can assert on a neutral event name while still observing a provider-specific dialect through providerEventName. Provider targets (SDK 別 4): - anthropic ... Anthropic Messages API (Claude Haiku / Sonnet / Opus) - openai ... OpenAI Chat Completions (gpt-4o / gpt-4o-mini) - vercel-ai ... Vercel AI SDK (streamText + generateText、 provider agnostic) - langchain ... LangChain (BaseChatModel + Runnable) v0.4 Axes (8): - prompt-injection ... direct + indirect + jailbreak + role hijacking + XML injection defense - hallucination ... self-consistency + factuality + citation + confidence + hedging - llm-eval ... LLM-as-judge + rubric + preference + Elo + human-in-the-loop - guardrails ... JSON schema + regex + toxicity + PII + Constitutional AI - rag-advanced ... chunking + hybrid retrieval + reranking + citation + context compression - agent-orchestration ... ReAct + ToT + reflection + self-correction + planning + tool selection - fine-tuning-eval ... SFT/DPO + catastrophic forgetting + benchmark drift - cost-latency-sla ... budget + p50/p99 + model routing + fallback ladder v0.5 Axes (advanced III、 8 new): - multi-agent-orchestration ... CrewAI + AutoGen + LangGraph + supervisor + swarm coordination - agent-swarm ... role-based + task allocation + consensus + Byzantine fault tolerance - code-interpreter ... sandboxed Python REPL + tool use + rollback state machine - fine-tuning-pipeline ... dataset prep + RLHF/DPO + eval loop + drift detection - llm-ops ... model registry + rollout + A/B + canary + shadow - prompt-engineering-advanced ... CoT + few-shot + caching + versioning - rag-iii ... GraphRAG + agentic + self-querying + parent document - cost-optimization ... batch API + prompt compression + model cascade + semantic cache

```ts
export type AiLlmTarget = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';
```

#### `AnthropicContentBlock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L32) `packages/ai-llm/src/anthropic.ts`

Anthropic content block union (v0.2 で image 追加、 real API 準拠)。 text / image は well-typed、 tool_use / tool_result は real SDK の柔軟な shape を保つため field を optional にしてある。 dogfood app が段階的に request を組み立てる経路 (id / name を後で埋める) を許容する。

```ts
export type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source:
        | { type: 'base64'; media_type: string; data: string }
        | { type: 'url'; url: string };
    }
  | {
      type: 'tool_use';
      id?: string;
      name?: string;
      input: Record<string, unknown>;
    }
  | {
      type: 'tool_result';
      tool_use_id: string;
      content: string;
    }
  | {
      // 逃げ道 — v0.1 で許容していた「type: string」 の柔軟な shape。
      type: string;
      text?: string;
      tool_use_id?: string;
      content?: string;
      input?: unknown;
    };
```

#### `AnthropicMessagesRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L60) `packages/ai-llm/src/anthropic.ts`

```ts
export interface AnthropicMessagesRequest {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | AnthropicContentBlock[];
  }>;
  system?: string;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: ToolDefinition['parameters'];
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}
```

#### `AnthropicMessagesResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L77) `packages/ai-llm/src/anthropic.ts`

```ts
export interface AnthropicMessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  >;
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: {
    input_tokens: number;
    output_tokens: number;
    /** cache read / write は Anthropic real API v0.2 で shape 互換保持。 */
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  /** kiwa 拡張 — mock 実測 cost / latency を SDK response に添付。 */
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}
```

#### `AnthropicMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L118) `packages/ai-llm/src/anthropic.ts`

Anthropic mock client。 real SDK と同じ `messages.create` / `messages.stream` API surface を提供。

```ts
export interface AnthropicMock extends AiLlmMock {
  readonly sdk: 'anthropic';
  messages: {
    create(req: AnthropicMessagesRequest): Promise<AnthropicMessagesResponse>;
    stream(req: AnthropicMessagesRequest): AsyncIterable<AnthropicStreamEvent>;
  };
}
```

#### `AnthropicStreamEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L101) `packages/ai-llm/src/anthropic.ts`

```ts
export interface AnthropicStreamEvent {
  type:
    | 'message_start'
    | 'content_block_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop';
  delta?: { type: 'text_delta'; text: string } | { stop_reason: string };
  usage?: { input_tokens: number; output_tokens: number };
  _kiwa?: { costUsd: number; latencyMs: number };
}
```

#### `AudioPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L66) `packages/ai-llm/src/multimodal.ts`

Audio 入力 (Whisper transcription や OpenAI audio input で使用)。

```ts
export interface AudioPart {
  type: 'audio';
  source: MediaSource;
  /** 音声 duration の秒数 hint (mock token 計算に使用、 未指定は 10s と仮定)。 */
  durationSeconds?: number;
  /**
   * `chat` = OpenAI Chat Completions の `input_audio` (音声を chat context に
   * 差し込む) / `transcription` = Whisper 単発 transcription 用。
   * default `chat`。
   */
  purpose?: 'chat' | 'transcription';
}
```

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L140) `packages/ai-llm/src/semantics/types.ts`

```ts
export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  timestampMs: number;
  metadata: Record<string, string | number | boolean>;
}
```

#### `Base64Data`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L34) `packages/ai-llm/src/multimodal.ts`

base64 data + media type、 real API と shape 整合。

```ts
export interface Base64Data {
  kind: 'base64';
  /** MIME type (`image/jpeg` / `image/png` / `image/webp` / `audio/wav` / `audio/mpeg` 等)。 */
  mediaType: string;
  /** base64 encoded payload (data URI prefix なし)。 */
  data: string;
}
```

#### `BenchmarkResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L37) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export interface BenchmarkResult {
  name: string;
  score: number;
}
```

#### `BudgetGuardConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L69) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export interface BudgetGuardConfig {
  limitUsd: number;
  spentUsd: number;
  perCallCapUsd: number;
}
```

#### `BuildAiLlmReportInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L28) `packages/ai-llm/src/report.ts`

`@kiwa-lab/ai-llm` 実測値を `@kiwa-lab/quality-metrics` `QualityReport` に集約する adapter。 dogfood app が fidelity harness を回した後、 本 adapter で `QualityReport` に変換 → `evaluateReleaseGate` に渡す、 の流れを想定。 accuracy / cost / latency / token 4 軸は `FidelityReport.records` の 実測値 (mock 側) を集計、 fidelity の 5 軸目 (surface coverage) は 別途 mock 側の `mockCoveredMethods` / `realTotalMethods` 引数で指定。

```ts
export interface BuildAiLlmReportInput {
  provider: string;
  version: string;
  /** fidelity harness の結果 (real vs mock 4 metric 実測) */
  fidelity: FidelityReport;
  /**
   * mock 側 SDK 表面の cover 数。 `@kiwa-lab/quality-metrics` 5 軸目の
   * fidelity ratio 用。 default `{ mock: 4, real: 4 }` (4 SDK 全 cover)。
   */
  surfaceCoverage?: { mockCoveredMethods: number; realTotalMethods: number };
  /** vitest 由来の test count breakdown。 */
  testCount?: { behavior: number; integration: number; e2e: number };
  /** v8 coverage summary (c8 `coverage-summary.json` の `total` block)。 */
  coverageV8Summary?: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  /** stryker / cargo-mutants mutation report。 */
  mutation?: { mutations: number; killed: number };
  /** unit-scope adapter perf (100 回計測の p95 用)。 */
  perfSamplesMs?: number[];
  /** notes to embed in the emitted markdown report。 */
  notes?: string;
}
```

#### `ChatCompletion`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L78) `packages/ai-llm/src/types.ts`

1 回の chat request 結果 (non-streaming)。

```ts
export interface ChatCompletion {
  /** assistant 生成 message (通常 role='assistant')。 */
  message: ChatMessage;
  usage: Usage;
  /** 実測 US$ (mock は固定 rate、 real は SDK 実測)。 */
  costUsd: number;
  /** 実測 latency (ms、 mock は artificial delay、 real は wall clock)。 */
  latencyMs: number;
  /** stop / tool_use / length など終了理由。 */
  finishReason: 'stop' | 'tool_use' | 'length' | 'content_filter';
}
```

#### `ChatInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L180) `packages/ai-llm/src/types.ts`

chat / stream 共通の入力。

```ts
export interface ChatInput {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  /** temperature / topP / maxTokens 等 provider 共通の hint。 */
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}
```

#### `ChatMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L31) `packages/ai-llm/src/types.ts`

Provider agnostic chat message。 tool_call / tool_result は `toolCalls` / `toolCallId` field で表現する。 v0.2 (Issue #746) で multimodal 対応追加。 `parts` optional field に image / audio を含む `MessagePart[]` を渡せる。 `parts` 指定時は adapter が SDK 固有の image/audio shape に変換、 未指定時は従来通り `content: string` を使う (完全後方互換)。

```ts
export interface ChatMessage {
  role: MessageRole;
  content: string;
  /**
   * multimodal input — image / audio / text を混在させる場合の順序保持
   * 配列。 未指定時は従来通り `content: string` のみで処理。
   */
  parts?: import('./multimodal.js').MessagePart[];
  /** assistant message が tool_use を持つ場合の呼出 payload。 */
  toolCalls?: ToolCall[];
  /** role === 'tool' のとき、 元の tool_call を紐付ける id。 */
  toolCallId?: string;
  /** tool 名 (role === 'tool' のとき使用)。 */
  name?: string;
}
```

#### `CiExecution`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L19) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export interface CiExecution {
  index: number;
  code: string;
  stdout: string;
  ok: boolean;
}
```

#### `CiSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L32) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export interface CiSession {
  target: AiLlmTarget;
  sessionId: string;
  state: CiState;
  history: AxisStep<CiState>[];
  sandboxId: string | null;
  executions: CiExecution[];
  toolCalls: CiToolCall[];
  memory: Record<string, string>;
  memorySnapshots: Array<Record<string, string>>;
}
```

#### `CiState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L12) `packages/ai-llm/src/semantics/code-interpreter.ts`

Code interpreter axis — sandboxed Python REPL + tool use + rollback state machine。 Deterministic mock で 4 signal 系統。 sandbox start binds an isolated cell、 code execution accumulates history and side-effects、 tool use is external effect record、 rollback pops N most-recent executions and restores state。

```ts
export type CiState =
  | 'idle'
  | 'sandbox-started'
  | 'code-executed'
  | 'tool-used'
  | 'rolled-back';
```

#### `CiToolCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L26) `packages/ai-llm/src/semantics/code-interpreter.ts`

```ts
export interface CiToolCall {
  name: string;
  args: Record<string, string | number | boolean>;
  ok: boolean;
}
```

#### `ConstitutionalPrinciple`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L38) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export interface ConstitutionalPrinciple {
  id: string;
  ruleText: string;
  forbidden: string[];
}
```

#### `CoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L19) `packages/ai-llm/src/semantics/cost-optimization.ts`

```ts
export interface CoSession {
  target: AiLlmTarget;
  sessionId: string;
  state: CoState;
  history: AxisStep<CoState>[];
  cache: Map<string, string>;
}
```

#### `CoState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L12) `packages/ai-llm/src/semantics/cost-optimization.ts`

Cost optimization axis — batch API + prompt compression + model cascade + semantic cache state machine。 Deterministic mock で 4 signal 系統。 batch submit is size + estimate、 prompt compression is char delta、 model cascade is threshold + tier、 semantic cache is hash lookup。

```ts
export type CoState =
  | 'idle'
  | 'batch-submitted'
  | 'prompt-compressed'
  | 'cascade-stepped'
  | 'semantic-cached';
```

#### `CotStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L19) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export interface CotStep {
  index: number;
  thought: string;
}
```

#### `DpoSample`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L29) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export interface DpoSample {
  prompt: string;
  chosen: string;
  rejected: string;
  chosenLogp: number;
  rejectedLogp: number;
}
```

#### `EvalSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L15) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export interface EvalSession {
  target: AiLlmTarget;
  sessionId: string;
  state: EvalState;
  history: AxisStep<EvalState>[];
  eloRatings: Map<string, number>;
}
```

#### `EvalState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L8) `packages/ai-llm/src/semantics/llm-eval.ts`

LLM eval axis — LLM-as-judge + rubric + preference + Elo + human-in-the-loop state machine。 deterministic mock で 4 signal 系統を提供。

```ts
export type EvalState =
  | 'idle'
  | 'judged'
  | 'rubric-applied'
  | 'preference-ranked'
  | 'elo-updated';
```

#### `FewShotExample`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L24) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export interface FewShotExample {
  id: string;
  input: string;
  output: string;
  score: number;
}
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L15) `packages/ai-llm/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
  providers: AiLlmTarget[];
  axes: AiLlmAxis[];
  rows: FidelityRow[];
}
```

#### `FidelityInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L14) `packages/ai-llm/src/fidelity.ts`

Real vs mock 差分計測 harness。 v1.12-2/-3/-4 dogfood app が real provider (Anthropic / OpenAI / Vercel AI) と kiwa mock の両方に同じ prompt を投げ、 4 metric (cost / latency / token / accuracy) の diff を計測する SSOT。 accuracy は「real 出力 vs mock 出力の similarity」 を 0-1 で返す。 default は文字列 Jaccard similarity (BLEU / embedding cosine は v1.12-3 で opt-in を検討)、 mock 検証には十分な近似。

```ts
export interface FidelityInput {
  /** kiwa mock (any SDK adapter)。 */
  mock: AiLlmMock;
  /**
   * real provider 呼出 wrapper。 dogfood app 側で
   * `async (input) => callRealAnthropic(...)` のように implement する。
   */
  real: (input: ChatInput) => Promise<ChatCompletion>;
  /** 対象 prompt 列。 */
  prompts: ChatInput[];
  /**
   * accuracy 計測 method (default `jaccard`)。 external similarity
   * scorer を injection する余地を残す。
   */
  accuracyMethod?: 'jaccard' | ((real: string, mock: string) => number);
}
```

#### `FidelityRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L32) `packages/ai-llm/src/fidelity.ts`

1 prompt 単位の diff 記録。

```ts
export interface FidelityRecord {
  prompt: string;
  real: ChatCompletion;
  mock: ChatCompletion;
  /** real - mock (負数 = mock の方が cheap / 速い / 少token)。 */
  costDiffUsd: number;
  latencyDiffMs: number;
  tokenDiffTotal: number;
  /** real 出力 vs mock 出力の similarity 0-1。 */
  accuracyScore: number;
}
```

#### `FidelityReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L45) `packages/ai-llm/src/fidelity.ts`

fidelity 実測結果全体。

```ts
export interface FidelityReport {
  records: FidelityRecord[];
  /** 集計値 (平均)。 */
  summary: {
    avgCostDiffUsd: number;
    avgLatencyDiffMs: number;
    avgTokenDiffTotal: number;
    avgAccuracyScore: number;
    prompts: number;
    accuracyMethod: string;
  };
}
```

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L8) `packages/ai-llm/src/semantics/fidelity.ts`

```ts
export interface FidelityRow {
  provider: AiLlmTarget;
  axis: AiLlmAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}
```

#### `FtpEvalRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L32) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export interface FtpEvalRecord {
  epoch: number;
  score: number;
}
```

#### `FtpRlhfStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L26) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export interface FtpRlhfStep {
  step: number;
  reward: number;
  policyDelta: number;
}
```

#### `FtpSample`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L20) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export interface FtpSample {
  prompt: string;
  chosen: string;
  rejected: string;
}
```

#### `FtpSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L37) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

```ts
export interface FtpSession {
  target: AiLlmTarget;
  sessionId: string;
  state: FtpState;
  history: AxisStep<FtpState>[];
  dataset: FtpSample[];
  rlhfSteps: FtpRlhfStep[];
  evalHistory: FtpEvalRecord[];
  baselineScore: number | null;
}
```

#### `FtpState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L13) `packages/ai-llm/src/semantics/fine-tuning-pipeline.ts`

Fine-tuning pipeline axis — dataset prep + RLHF/DPO + eval loop + drift detection state machine。 Deterministic mock で 4 signal 系統。 dataset prep is dedup + shuffle by hash、 RLHF stepping is reward gradient sign + policy update、 eval loop accumulates score history、 drift detection compares latest eval vs baseline via absolute threshold。

```ts
export type FtpState =
  | 'idle'
  | 'dataset-prepared'
  | 'rlhf-stepped'
  | 'eval-loop-ran'
  | 'drift-detected';
```

#### `FtSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L15) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export interface FtSession {
  target: AiLlmTarget;
  sessionId: string;
  state: FtState;
  history: AxisStep<FtState>[];
  baselineBenchmarks: Map<string, number>;
}
```

#### `FtState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L8) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

Fine-tuning eval axis — SFT/DPO + catastrophic forgetting + benchmark drift state machine。 deterministic mock で 4 signal 系統。

```ts
export type FtState =
  | 'idle'
  | 'sft-evaluated'
  | 'dpo-evaluated'
  | 'forgetting-detected'
  | 'drift-detected';
```

#### `GuardrailSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L16) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export interface GuardrailSession {
  target: AiLlmTarget;
  sessionId: string;
  state: GuardrailState;
  history: AxisStep<GuardrailState>[];
}
```

#### `GuardrailState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L8) `packages/ai-llm/src/semantics/guardrails.ts`

Guardrails axis — JSON schema + regex + toxicity + PII + Constitutional AI state machine。 deterministic mock で 5 signal 系統を提供。

```ts
export type GuardrailState =
  | 'idle'
  | 'schema-validated'
  | 'regex-matched'
  | 'toxicity-blocked'
  | 'pii-redacted'
  | 'constitutional-checked';
```

#### `HallucinationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L19) `packages/ai-llm/src/semantics/hallucination.ts`

```ts
export interface HallucinationSession {
  target: AiLlmTarget;
  sessionId: string;
  state: HallucinationState;
  history: AxisStep<HallucinationState>[];
  scores: {
    selfConsistency?: number;
    factuality?: number;
    citation?: number;
    confidence?: number;
  };
}
```

#### `HallucinationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L12) `packages/ai-llm/src/semantics/hallucination.ts`

Hallucination detection axis — self-consistency + factuality + citation + confidence + hedging state machine。 Deterministic mock で 5 signal 系統。 self-consistency は複数 sample 間の token-overlap 比率、 factuality は claim vs evidence の string match、 citation は引用先の存在 check、 confidence / hedging は modal 語彙密度。

```ts
export type HallucinationState =
  | 'idle'
  | 'self-consistency-scored'
  | 'factuality-checked'
  | 'citation-verified'
  | 'confidence-scored';
```

#### `ImagePart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L58) `packages/ai-llm/src/multimodal.ts`

Image 入力。 detail は OpenAI vision の resolution hint と互換。

```ts
export interface ImagePart {
  type: 'image';
  source: MediaSource;
  /** OpenAI vision detail hint (default 'auto')。 mock は token 計算に反映。 */
  detail?: 'low' | 'high' | 'auto';
}
```

#### `InjectionDetection`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L35) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export interface InjectionDetection {
  kind: InjectionKind;
  confidence: number;
  excerpt: string;
  matchedPattern: string;
}
```

#### `InjectionKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L12) `packages/ai-llm/src/semantics/prompt-injection.ts`

Prompt injection defense axis — direct + indirect + jailbreak + role hijacking + XML injection detection state machine。 Deterministic mock で 5 signal 系統を提供 (pattern-based classifier)。 real driver 経路では実 LLM に対し injection payload を投げて refusal を 観測する。

```ts
export type InjectionKind =
  | 'direct'
  | 'indirect'
  | 'jailbreak'
  | 'role-hijacking'
  | 'xml-injection';
```

#### `InjectionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L27) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export interface InjectionSession {
  target: AiLlmTarget;
  sessionId: string;
  state: InjectionState;
  history: AxisStep<InjectionState>[];
  detections: Array<{ kind: InjectionKind; confidence: number; excerpt: string }>;
}
```

#### `InjectionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L19) `packages/ai-llm/src/semantics/prompt-injection.ts`

```ts
export type InjectionState =
  | 'idle'
  | 'analyzed'
  | 'direct-detected'
  | 'indirect-detected'
  | 'jailbreak-blocked'
  | 'role-hijacking-blocked';
```

#### `JudgeVerdict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L23) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export interface JudgeVerdict {
  candidateId: string;
  score: number;
  reasoning: string;
}
```

#### `LangchainAIMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L48) `packages/ai-llm/src/langchain.ts`

```ts
export interface LangchainAIMessage {
  /** LangChain の `AIMessage.constructor.name` (mock では固定文字列)。 */
  _type: 'AIMessage';
  content: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  response_metadata: {
    finish_reason: 'stop' | 'tool_calls' | 'length';
    model: string;
  };
  usage_metadata: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}
```

#### `LangchainAIMessageChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L72) `packages/ai-llm/src/langchain.ts`

```ts
export interface LangchainAIMessageChunk {
  _type: 'AIMessageChunk';
  content: string;
  response_metadata?: LangchainAIMessage['response_metadata'];
  usage_metadata?: LangchainAIMessage['usage_metadata'];
  _kiwa?: LangchainAIMessage['_kiwa'];
}
```

#### `LangchainContentBlock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L28) `packages/ai-llm/src/langchain.ts`

LangChain content block (v0.2、 real

```ts
export type LangchainContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: string | { url: string; detail?: 'low' | 'high' | 'auto' };
    }
  | {
      type: 'media';
      /** base64 data。 */
      data: string;
      mimeType: string;
    };
```

#### `LangchainInputMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L41) `packages/ai-llm/src/langchain.ts`

```ts
export interface LangchainInputMessage {
  role: 'system' | 'human' | 'ai' | 'tool';
  content: string | LangchainContentBlock[];
  name?: string;
  tool_call_id?: string;
}
```

#### `LangchainMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L80) `packages/ai-llm/src/langchain.ts`

```ts
export interface LangchainMock extends AiLlmMock {
  readonly sdk: 'langchain';
  invoke(messages: LangchainInputMessage[]): Promise<LangchainAIMessage>;
  stream(messages: LangchainInputMessage[]): AsyncIterable<LangchainAIMessageChunk>;
  batch(batches: LangchainInputMessage[][]): Promise<LangchainAIMessage[]>;
  /** LangChain BaseChatModel は `_llmType()` を実装する。 */
  _llmType(): string;
}
```

#### `LatencySample`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L27) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export interface LatencySample {
  requestId: string;
  latencyMs: number;
}
```

#### `LlmBackend`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L13) `packages/ai-llm/src/semantics/real-driver.ts`

Real driver env-gate for ai-llm v0.4. Provides KIWA_MODE=real-based helpers for testing against actual LLM backends (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveLlmEndpoint()` + `resolveApiKey()` to fetch backend URLs / keys. When KIWA_MODE != 'real', tests should skip. Budget guard は必須。 KIWA_LLM_BUDGET_USD で $ 上限を強制する SSOT。

```ts
export type LlmBackend = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';
```

#### `MaoAgent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L19) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export interface MaoAgent {
  id: string;
  role: string;
  capabilities: string[];
}
```

#### `MaoDelegation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L25) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export interface MaoDelegation {
  round: number;
  supervisor: string;
  worker: string;
  task: string;
}
```

#### `MaoGraphEdge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L37) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export interface MaoGraphEdge {
  from: string;
  to: string;
}
```

#### `MaoGraphNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L32) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export interface MaoGraphNode {
  id: string;
  agentId: string;
}
```

#### `MaoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L42) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

```ts
export interface MaoSession {
  target: AiLlmTarget;
  sessionId: string;
  state: MaoState;
  history: AxisStep<MaoState>[];
  crew: MaoAgent[];
  delegations: MaoDelegation[];
  graphNodes: MaoGraphNode[];
  graphEdges: MaoGraphEdge[];
  currentNode: string | null;
  rounds: number;
}
```

#### `MaoState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L12) `packages/ai-llm/src/semantics/multi-agent-orchestration.ts`

Multi-agent orchestration axis — CrewAI + AutoGen + LangGraph + supervisor pattern state machine。 Deterministic mock で 4 signal 系統。 crew assembly is role list snapshot、 supervisor delegation is deterministic round-robin、 graph transition is edge follow、 round completion is delegation count check。

```ts
export type MaoState =
  | 'idle'
  | 'crew-assembled'
  | 'supervisor-delegated'
  | 'graph-transitioned'
  | 'round-completed';
```

#### `MediaSource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L49) `packages/ai-llm/src/multimodal.ts`

Image / Audio の source 表現統一。

```ts
export type MediaSource = Base64Data | UrlData;
```

#### `MessagePart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L80) `packages/ai-llm/src/multimodal.ts`

MessagePart union — chat message の 1 sub-block。

```ts
export type MessagePart = TextPart | ImagePart | AudioPart;
```

#### `MessageRole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L14) `packages/ai-llm/src/types.ts`

Chat message role — 4 SDK 全てで共通。

```ts
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
```

#### `MockConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L114) `packages/ai-llm/src/types.ts`

Mock 設定。 4 SDK adapter で共通に使う。 `responses` は user プロンプトを完全一致で index、 hit なしは `defaultResponse` を返す。 tool_calls / streaming も `responses` で 制御 (同じ user prompt に対し tool_use → 次 turn で最終応答、 等の multi-turn シナリオも表現可能)。 v0.2 (Issue #746) で multimodal 対応追加。 - `transcriptions` = audio → text の期待値 dict (Whisper mock)。 - `imageTokenCost` / `audioTokenCost` = multimodal token 計算 override。

```ts
export interface MockConfig {
  /** default response (dict miss 時のフォールバック)。 */
  defaultResponse?: string;
  /** user prompt → mock 応答 (順序 = 呼出順)。 */
  responses?: Record<string, MockResponse>;
  /** artificial latency in ms (default 10)。 */
  artificialLatencyMs?: number;
  /**
   * cost per 1k tokens ($US)。 default は Anthropic Haiku 相当の
   * `{ prompt: 0.00025, completion: 0.00125 }`。
   */
  costPer1kTokens?: { prompt: number; completion: number };
  /** provider / model 識別子 (report 用、 default 'mock-model')。 */
  model?: string;
  /**
   * Whisper transcription 期待値。 key は `toTranscriptionKey(source)` 形式
   * (`base64:{hash}` or `url:{url}`)。 hit なしは `defaultTranscription` へ。
   */
  transcriptions?: Record<string, import('./multimodal.js').MockTranscription>;
  /** transcription dict miss 時の fallback (未指定 = 'transcribed audio')。 */
  defaultTranscription?: string;
  /** image 1 件あたりの prompt token 換算 (default 1500)。 */
  imageTokenCost?: number;
  /** audio 1 件あたりの prompt token 換算 (default 500、 durationSeconds > 30 で比例増分)。 */
  audioTokenCost?: number;
}
```

#### `MockResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L142) `packages/ai-llm/src/types.ts`

MockConfig.responses の 1 entry。

```ts
export interface MockResponse {
  content: string;
  /** tool_use を返す場合の呼出定義。 */
  toolCalls?: ToolCall[];
  /** stream で送出する chunk 列 (未指定 = content を 1 chunk で送出)。 */
  chunks?: string[];
  /** token 使用量の override (未指定 = 文字数 / 4 で概算)。 */
  usage?: Partial<Usage>;
  /** finishReason の override (default 'stop'、 toolCalls 有りは 'tool_use')。 */
  finishReason?: ChatCompletion['finishReason'];
}
```

#### `MockTranscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L87) `packages/ai-llm/src/multimodal.ts`

1 audio 入力に対する transcription 期待値。 `MockConfig.transcriptions` の dict value 型。 audio id は Base64 source なら `base64:{hash}` / URL source なら `url:{url}` を lookup key とする。

```ts
export interface MockTranscription {
  /** 転写結果 text。 */
  text: string;
  /** 認識言語 (ISO-639-1、 未指定 = 'en')。 */
  language?: string;
  /** verbose_json mode 用 segments (mock は 1 segment fallback)。 */
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}
```

#### `ModelPrice`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L13) `packages/ai-llm/src/pricing.ts`

Model-priced token cost lookup, shared across dogfood real adapters so one place tracks vendor pricing rather than each adapter hardcoding a single-model rate. Prices are USD per 1M tokens (the unit vendors publish); `costForTokens` converts to per-request USD given raw `input_tokens` + `output_tokens`. Prices refreshed 2026-07; when Anthropic / OpenAI publish new rates, update the table here — real adapters look up by model name and stay accurate without file-level edits.

```ts
export interface ModelPrice {
  /** USD per 1M input tokens (also called "prompt tokens"). */
  inputPerMillion: number;
  /** USD per 1M output tokens (also called "completion tokens"). */
  outputPerMillion: number;
}
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L55) `packages/ai-llm/src/semantics/types.ts`

```ts
export type NeutralEventName =
  // prompt-injection
  | 'injection.direct_detected'
  | 'injection.indirect_detected'
  | 'injection.jailbreak_blocked'
  | 'injection.role_hijacking_blocked'
  | 'injection.xml_detected'
  // hallucination
  | 'hallucination.self_consistency_scored'
  | 'hallucination.factuality_checked'
  | 'hallucination.citation_verified'
  | 'hallucination.confidence_scored'
  // llm-eval
  | 'eval.judge_scored'
  | 'eval.rubric_applied'
  | 'eval.preference_ranked'
  | 'eval.elo_updated'
  // guardrails
  | 'guardrail.schema_validated'
  | 'guardrail.regex_matched'
  | 'guardrail.toxicity_blocked'
  | 'guardrail.pii_redacted'
  | 'guardrail.constitutional_checked'
  // rag-advanced
  | 'rag.chunked'
  | 'rag.hybrid_retrieved'
  | 'rag.reranked'
  | 'rag.compressed'
  // agent-orchestration
  | 'agent.react_stepped'
  | 'agent.tot_expanded'
  | 'agent.reflected'
  | 'agent.tool_selected'
  // fine-tuning-eval
  | 'ft.sft_evaluated'
  | 'ft.dpo_evaluated'
  | 'ft.catastrophic_forgetting_detected'
  | 'ft.benchmark_drift_detected'
  // cost-latency-sla
  | 'sla.budget_checked'
  | 'sla.latency_measured'
  | 'sla.model_routed'
  | 'sla.fallback_engaged'
  // multi-agent-orchestration (v0.5)
  | 'mao.crew_assembled'
  | 'mao.supervisor_delegated'
  | 'mao.graph_transitioned'
  | 'mao.round_completed'
  // agent-swarm (v0.5)
  | 'swarm.roles_assigned'
  | 'swarm.tasks_allocated'
  | 'swarm.consensus_reached'
  | 'swarm.byzantine_tolerated'
  // code-interpreter (v0.5)
  | 'ci.sandbox_started'
  | 'ci.code_executed'
  | 'ci.tool_used'
  | 'ci.rolled_back'
  // fine-tuning-pipeline (v0.5)
  | 'ftp.dataset_prepared'
  | 'ftp.rlhf_stepped'
  | 'ftp.eval_loop_ran'
  | 'ftp.drift_detected'
  // llm-ops (v0.5)
  | 'ops.registry_updated'
  | 'ops.rollout_advanced'
  | 'ops.ab_evaluated'
  | 'ops.canary_promoted'
  | 'ops.shadow_compared'
  // prompt-engineering-advanced (v0.5)
  | 'pea.chain_of_thought_expanded'
  | 'pea.few_shot_selected'
  | 'pea.cached'
  | 'pea.version_pinned'
  // rag-iii (v0.5)
  | 'rag3.graph_traversed'
  | 'rag3.agentic_stepped'
  | 'rag3.self_queried'
  | 'rag3.parent_expanded'
  // cost-optimization (v0.5)
  | 'co.batch_submitted'
  | 'co.prompt_compressed'
  | 'co.cascade_stepped'
  | 'co.semantic_cached';
```

#### `OpenAiChatCompletionsRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L46) `packages/ai-llm/src/openai.ts`

```ts
export interface OpenAiChatCompletionsRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | OpenAiContentPart[] | null;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
    name?: string;
  }>;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}
```

#### `OpenAiChatCompletionsResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L72) `packages/ai-llm/src/openai.ts`

```ts
export interface OpenAiChatCompletionsResponse {
  id: string;
  object: 'chat.completion';
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}
```

#### `OpenAiContentPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L26) `packages/ai-llm/src/openai.ts`

OpenAI vision / audio content part (v0.2、 real Chat Completions vision + gpt-4o audio input 準拠)。

```ts
export type OpenAiContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: {
        /** `data:image/jpeg;base64,{...}` or `https://...`。 */
        url: string;
        /** OpenAI vision resolution hint。 */
        detail?: 'low' | 'high' | 'auto';
      };
    }
  | {
      type: 'input_audio';
      input_audio: {
        data: string;
        /** `wav` / `mp3` 等。 */
        format: string;
      };
    };
```

#### `OpenAiMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L158) `packages/ai-llm/src/openai.ts`

```ts
export interface OpenAiMock extends AiLlmMock {
  readonly sdk: 'openai';
  chat: {
    completions: {
      create(
        req: OpenAiChatCompletionsRequest,
      ): Promise<OpenAiChatCompletionsResponse> | AsyncIterable<OpenAiStreamChunk>;
    };
  };
  /** Whisper audio transcription mock (v0.2)。 */
  audio: {
    transcriptions: {
      create(
        req: OpenAiTranscriptionRequest,
      ): Promise<OpenAiTranscriptionJson | OpenAiTranscriptionVerboseJson>;
    };
  };
  /**
   * kiwa 統一 API — audio → transcription を SDK 表面と別に露出。
   * fidelity harness / non-OpenAI 経路から呼びやすくする。
   */
  transcribeAudio(source: { kind: 'base64' | 'url'; data?: string; url?: string; mediaType?: string }): Promise<TranscriptionResult>;
}
```

#### `OpenAiStreamChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L100) `packages/ai-llm/src/openai.ts`

```ts
export interface OpenAiStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason: 'stop' | 'tool_calls' | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _kiwa?: { costUsd: number; latencyMs: number };
}
```

#### `OpenAiTranscriptionJson`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L140) `packages/ai-llm/src/openai.ts`

Whisper transcription response (`json` 相当)。

```ts
export interface OpenAiTranscriptionJson {
  text: string;
  /** kiwa 拡張。 */
  _kiwa: { costUsd: number; latencyMs: number };
}
```

#### `OpenAiTranscriptionRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L130) `packages/ai-llm/src/openai.ts`

Whisper transcription request (real `client.audio.transcriptions.create` の shape 準拠)。 file は base64 data URL or URL string で受ける。

```ts
export interface OpenAiTranscriptionRequest {
  /** base64 data (`data:audio/wav;base64,...`) or URL (`https://.../audio.wav`)。 */
  file: string;
  model?: string;
  /** `json` = text のみ、 `verbose_json` = segments 込。 default 'json'。 */
  response_format?: 'json' | 'verbose_json' | 'text';
  language?: string;
}
```

#### `OpenAiTranscriptionVerboseJson`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L147) `packages/ai-llm/src/openai.ts`

Whisper transcription response (`verbose_json` 相当)。

```ts
export interface OpenAiTranscriptionVerboseJson extends OpenAiTranscriptionJson {
  language: string;
  duration: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}
```

#### `OpsAbResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L27) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export interface OpsAbResult {
  variant: string;
  score: number;
  samples: number;
}
```

#### `OpsModelEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L21) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export interface OpsModelEntry {
  version: string;
  createdAtMs: number;
  active: boolean;
}
```

#### `OpsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L33) `packages/ai-llm/src/semantics/llm-ops.ts`

```ts
export interface OpsSession {
  target: AiLlmTarget;
  sessionId: string;
  state: OpsState;
  history: AxisStep<OpsState>[];
  registry: OpsModelEntry[];
  rolloutPercent: number;
  abWinner: string | null;
}
```

#### `OpsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L13) `packages/ai-llm/src/semantics/llm-ops.ts`

LLM ops axis — model registry + rollout + A/B + canary + shadow state machine。 Deterministic mock で 5 signal 系統。 registry updates append versioned entries、 rollout tracks percentage advancement、 A/B computes winner by mean score、 canary promotion is threshold check、 shadow comparison computes delta。

```ts
export type OpsState =
  | 'idle'
  | 'registry-updated'
  | 'rollout-advanced'
  | 'ab-evaluated'
  | 'canary-promoted'
  | 'shadow-compared';
```

#### `PeaCacheEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L31) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export interface PeaCacheEntry {
  key: string;
  value: string;
  hits: number;
}
```

#### `PeaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L37) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

```ts
export interface PeaSession {
  target: AiLlmTarget;
  sessionId: string;
  state: PeaState;
  history: AxisStep<PeaState>[];
  cot: CotStep[];
  fewShot: FewShotExample[];
  cache: Map<string, PeaCacheEntry>;
  currentVersion: string | null;
}
```

#### `PeaState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L12) `packages/ai-llm/src/semantics/prompt-engineering-advanced.ts`

Prompt engineering advanced axis — chain-of-thought + few-shot + caching + versioning state machine。 Deterministic mock で 4 signal 系統。 CoT expands stepwise reasoning、 few-shot picks k best by score、 caching uses deterministic key hash、 versioning pins semver + hash pair。

```ts
export type PeaState =
  | 'idle'
  | 'chain-of-thought-expanded'
  | 'few-shot-selected'
  | 'cached'
  | 'version-pinned';
```

#### `PriceLookupResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L54) `packages/ai-llm/src/pricing.ts`

```ts
export interface PriceLookupResult {
  price: ModelPrice;
  /** True when the caller passed a model not in the table — cost was still computed via fallback. */
  wasFallback: boolean;
  /** Model name the price was looked up under (post-alias resolution). */
  resolvedModel: string;
}
```

#### `Rag3Session`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L43) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export interface Rag3Session {
  target: AiLlmTarget;
  sessionId: string;
  state: Rag3State;
  history: AxisStep<Rag3State>[];
  graphNodes: RagGraphNode[];
  graphEdges: RagGraphEdge[];
  agenticTrace: RagAgenticStep[];
  parents: RagParentDoc[];
}
```

#### `Rag3State`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L13) `packages/ai-llm/src/semantics/rag-iii.ts`

RAG III axis — GraphRAG + agentic + self-querying + parent document state machine。 Deterministic mock で 4 signal 系統。 graph traversal follows entity edges with BFS、 agentic RAG step decides fetch vs answer via score gate、 self-querying converts NL to filter predicate deterministically、 parent document expansion returns full doc from chunk id lookup。

```ts
export type Rag3State =
  | 'idle'
  | 'graph-traversed'
  | 'agentic-stepped'
  | 'self-queried'
  | 'parent-expanded';
```

#### `RagAgenticStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L31) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export interface RagAgenticStep {
  index: number;
  action: 'fetch' | 'answer';
  reason: string;
}
```

#### `RagGraphEdge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L25) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export interface RagGraphEdge {
  from: string;
  to: string;
  weight: number;
}
```

#### `RagGraphNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L20) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export interface RagGraphNode {
  id: string;
  label: string;
}
```

#### `RagParentDoc`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L37) `packages/ai-llm/src/semantics/rag-iii.ts`

```ts
export interface RagParentDoc {
  id: string;
  content: string;
  chunkIds: string[];
}
```

#### `RagSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L15) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export interface RagSession {
  target: AiLlmTarget;
  sessionId: string;
  state: RagState;
  history: AxisStep<RagState>[];
  chunks: Array<{ id: string; text: string }>;
}
```

#### `RagState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L8) `packages/ai-llm/src/semantics/rag-advanced.ts`

RAG advanced axis — chunking + hybrid retrieval + reranking + citation + context compression state machine。 deterministic mock で 5 signal 系統。

```ts
export type RagState =
  | 'idle'
  | 'chunked'
  | 'hybrid-retrieved'
  | 'reranked'
  | 'compressed';
```

#### `ReactStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L24) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export interface ReactStep {
  index: number;
  thought: string;
  action: { tool: string; input: string };
  observation: string;
}
```

#### `RealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L112) `packages/ai-llm/src/semantics/real-driver.ts`

```ts
export interface RealDriverConfig {
  backend: LlmBackend;
  endpoint: string;
  apiKey: string | null;
  timeoutMs: number;
  budget: BudgetGuardConfig;
}
```

#### `Reflection`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L38) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export interface Reflection {
  cycle: number;
  critique: string;
  revised: string;
}
```

#### `RerankedHit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L30) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export interface RerankedHit extends RetrievalHit {
  rerankScore: number;
}
```

#### `RetrievalHit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L23) `packages/ai-llm/src/semantics/rag-advanced.ts`

```ts
export interface RetrievalHit {
  id: string;
  text: string;
  score: number;
  source: 'dense' | 'sparse';
}
```

#### `RoutingCandidate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L32) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export interface RoutingCandidate {
  model: string;
  costPerCall: number;
  latencyMs: number;
  qualityScore: number;
}
```

#### `RubricCriterion`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L29) `packages/ai-llm/src/semantics/llm-eval.ts`

```ts
export interface RubricCriterion {
  key: string;
  weight: number;
  score: number;
}
```

#### `SftSample`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L23) `packages/ai-llm/src/semantics/fine-tuning-eval.ts`

```ts
export interface SftSample {
  prompt: string;
  gold: string;
  candidate: string;
}
```

#### `SimpleSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L32) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export interface SimpleSchema {
  type: 'object';
  properties: Record<string, SimpleSchemaProperty>;
  required?: string[];
}
```

#### `SimpleSchemaProperty`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L23) `packages/ai-llm/src/semantics/guardrails.ts`

```ts
export interface SimpleSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: Array<string | number | boolean>;
}
```

#### `SlaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L18) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

```ts
export interface SlaSession {
  target: AiLlmTarget;
  sessionId: string;
  state: SlaState;
  history: AxisStep<SlaState>[];
  spent: number;
  budgetUsd: number;
}
```

#### `SlaState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L11) `packages/ai-llm/src/semantics/cost-latency-sla.ts`

Cost / latency SLA axis — budget + p50/p99 + model routing + fallback ladder state machine。 deterministic mock で 4 signal 系統。 Budget guard は real driver 経路 (KIWA_MODE=real) で $ 上限を強制する SSOT。 mock 経路でも 4 SDK 全部に同じ SLA API を提供する。

```ts
export type SlaState =
  | 'idle'
  | 'budget-checked'
  | 'latency-measured'
  | 'model-routed'
  | 'fallback-engaged';
```

#### `StreamEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L91) `packages/ai-llm/src/types.ts`

streaming で観測される 1 event (delta)。

```ts
export interface StreamEvent {
  /** 差分文字列 (finish 時は空文字列)。 */
  delta: string;
  /** stream 終了 event。 */
  done: boolean;
  /** stream 終了時のみ設定される最終 usage / cost。 */
  usage?: Usage;
  costUsd?: number;
  latencyMs?: number;
}
```

#### `SwarmAgent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L19) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export interface SwarmAgent {
  id: string;
  role: string;
  reliability: number;
}
```

#### `SwarmSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L36) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export interface SwarmSession {
  target: AiLlmTarget;
  sessionId: string;
  state: SwarmState;
  history: AxisStep<SwarmState>[];
  agents: SwarmAgent[];
  tasks: SwarmTask[];
  votes: SwarmVote[];
  faultThreshold: number;
}
```

#### `SwarmState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L12) `packages/ai-llm/src/semantics/agent-swarm.ts`

Agent swarm axis — role-based + task allocation + consensus + Byzantine fault tolerance state machine。 Deterministic mock で 4 signal 系統。 roles assign by index modulo、 tasks allocated by round robin、 consensus via majority vote、 Byzantine fault tolerance via &gt; 2/3 honest agreement (PBFT-lite invariant)。

```ts
export type SwarmState =
  | 'idle'
  | 'roles-assigned'
  | 'tasks-allocated'
  | 'consensus-reached'
  | 'byzantine-tolerated';
```

#### `SwarmTask`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L25) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export interface SwarmTask {
  id: string;
  assignee: string;
  priority: number;
}
```

#### `SwarmVote`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L31) `packages/ai-llm/src/semantics/agent-swarm.ts`

```ts
export interface SwarmVote {
  agentId: string;
  proposal: string;
}
```

#### `TextPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L52) `packages/ai-llm/src/multimodal.ts`

text-only 分岐 (parts 混在時の従来 text 表現)。

```ts
export interface TextPart {
  type: 'text';
  text: string;
}
```

#### `ToolCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L63) `packages/ai-llm/src/types.ts`

Assistant が生成する tool_use / function_call の統一表現。

```ts
export interface ToolCall {
  id: string;
  name: string;
  /** arguments は JSON.stringify 済の文字列で保持する。 */
  arguments: string;
}
```

#### `ToolCandidate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L44) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export interface ToolCandidate {
  name: string;
  description: string;
  score: number;
}
```

#### `ToolDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L51) `packages/ai-llm/src/types.ts`

Tool 定義 — 4 SDK で shape が違うため、 本 harness では JSON Schema ベースの共通形式で保持する。

```ts
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema (subset)。 */
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}
```

#### `ToTNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L31) `packages/ai-llm/src/semantics/agent-orchestration.ts`

```ts
export interface ToTNode {
  id: string;
  thought: string;
  score: number;
  children: ToTNode[];
}
```

#### `TranscriptionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L102) `packages/ai-llm/src/multimodal.ts`

Whisper 1 回分の transcription 結果 (real API shape 互換)。

```ts
export interface TranscriptionResult {
  text: string;
  language: string;
  durationSeconds: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  /** kiwa 拡張 — mock 実測 cost / latency。 */
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}
```

#### `UrlData`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L43) `packages/ai-llm/src/multimodal.ts`

URL 参照、 4 SDK 全部で fetch 経路がある。

```ts
export interface UrlData {
  kind: 'url';
  url: string;
}
```

#### `Usage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L71) `packages/ai-llm/src/types.ts`

LLM 呼出の token 使用量。

```ts
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

#### `VercelAiMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L91) `packages/ai-llm/src/vercel-ai.ts`

```ts
export interface VercelAiMock extends AiLlmMock {
  readonly sdk: 'vercel-ai';
  generateText(req: VercelAiRequest): Promise<VercelGenerateTextResult>;
  streamText(req: VercelAiRequest): VercelStreamTextResult;
}
```

#### `VercelAiRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L44) `packages/ai-llm/src/vercel-ai.ts`

```ts
export interface VercelAiRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | VercelContentPart[];
  }>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Record<
    string,
    {
      description: string;
      parameters: Record<string, unknown>;
    }
  >;
}
```

#### `VercelContentPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L28) `packages/ai-llm/src/vercel-ai.ts`

Vercel AI SDK v3+ multimodal content part (v0.2、 real SDK 準拠)。 SDK は `content: string` + `content: Array&lt;{type:'text'|'image', ...}&gt;` の 両方を受け入れる。 image は URL string or Uint8Array or base64 string。

```ts
export type VercelContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      /** URL string or base64 string or data URI。 mock は URL / base64 のみ扱う。 */
      image: string;
      /** mediaType hint。 */
      mimeType?: string;
    }
  | {
      type: 'file';
      /** audio / image / pdf 汎用 file (Vercel AI v4)、 mock は audio として扱う。 */
      data: string;
      mimeType: string;
    };
```

#### `VercelGenerateTextResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L61) `packages/ai-llm/src/vercel-ai.ts`

```ts
export interface VercelGenerateTextResult {
  text: string;
  toolCalls: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'tool-calls' | 'length' | 'content-filter';
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}
```

#### `VercelStreamTextResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L80) `packages/ai-llm/src/vercel-ai.ts`

```ts
export interface VercelStreamTextResult {
  /** 逐次 text chunk を送出する async iterable。 */
  textStream: AsyncIterable<string>;
  /** 全 stream 完了後の最終 text (resolve 順は SDK と同じで stream 後)。 */
  text: Promise<string>;
  /** stream 完了後 resolve される usage。 */
  usage: Promise<VercelGenerateTextResult['usage']>;
  finishReason: Promise<VercelGenerateTextResult['finishReason']>;
  _kiwa: Promise<{ costUsd: number; latencyMs: number }>;
}
```
<!-- kiwa-public-api:end -->
