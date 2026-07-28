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
| <code v-pre>Poisson lambda must be &gt;= 0, got $&#123;lambda&#125;</code> | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L44) |
| <code v-pre>Poisson lambda &gt; 30 unsupported by Knuth variant; use a larger-lambda algorithm or split into chunks (got $&#123;lambda&#125;)</code> | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L49) |
| <code v-pre>Zipf n must be &gt;= 1, got $&#123;n&#125;</code> | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L83) |
| <code v-pre>Zipf s must be &gt; 1 (Devroye rejection requires s &gt; 1), got $&#123;s&#125;</code> | [packages/ai-llm/src/sampling.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L84) |
| <code v-pre>reflectAndCorrect: run react or tot first</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L123) |
| <code v-pre>selectTool: run react or tot first</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L153) |
| <code v-pre>selectTool: candidates must not be empty</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L155) |
| <code v-pre>startAgentSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L55) |
| <code v-pre>reactStep: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L72) |
| <code v-pre>reactStep: tool must not be empty</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L74) |
| <code v-pre>expandToT: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L91) |
| <code v-pre>expandToT: depth must be positive</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L93) |
| <code v-pre>expandToT: branches must not be empty</code> | [packages/ai-llm/src/semantics/agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L94) |
| <code v-pre>reachConsensus: assign roles first</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L123) |
| <code v-pre>reachConsensus: votes must not be empty</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L124) |
| <code v-pre>tolerateByzantine: assign roles first</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L154) |
| <code v-pre>tolerateByzantine: no agents assigned</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L156) |
| <code v-pre>startSwarmSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L53) |
| <code v-pre>startSwarmSession: faultThreshold must be in &#91;0, 1)</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L56) |
| <code v-pre>assignRoles: agents must not be empty</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L73) |
| <code v-pre>assignRoles: roles must not be empty</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L74) |
| <code v-pre>assignRoles: reliability must be in &#91;0, 1&#93;</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L77) |
| <code v-pre>allocateTasks: assign roles first</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L98) |
| <code v-pre>allocateTasks: tasks must not be empty</code> | [packages/ai-llm/src/semantics/agent-swarm.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L99) |
| <code v-pre>useTool: start sandbox first</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L117) |
| <code v-pre>useTool: tool name must not be empty</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L118) |
| <code v-pre>rollback: start sandbox first</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L136) |
| <code v-pre>rollback: steps must be positive</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L137) |
| <code v-pre>startCiSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L49) |
| <code v-pre>startSandbox: sandboxId must not be empty</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L69) |
| <code v-pre>startSandbox: timeoutMs must be positive</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L70) |
| <code v-pre>executeCode: start sandbox first</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L84) |
| <code v-pre>executeCode: code must not be empty</code> | [packages/ai-llm/src/semantics/code-interpreter.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L85) |
| <code v-pre>routeModel: check budget or measure latency first</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L121) |
| <code v-pre>routeModel: candidates must not be empty</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L123) |
| <code v-pre>engageFallback: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L145) |
| <code v-pre>engageFallback: ladder must not be empty</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L147) |
| <code v-pre>startSlaSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L45) |
| <code v-pre>startSlaSession: budgetUsd must be non-negative</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L47) |
| <code v-pre>checkBudget: cost must be non-negative</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L62) |
| <code v-pre>measureLatency: samples must not be empty</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L90) |
| <code v-pre>measureLatency: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/cost-latency-sla.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L92) |
| <code v-pre>stepCascade: tiers must not be empty</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L100) |
| <code v-pre>lookupSemanticCache: queryHash must not be empty</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L128) |
| <code v-pre>startCoSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L32) |
| <code v-pre>submitBatch: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L48) |
| <code v-pre>submitBatch: requests must not be empty</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L51) |
| <code v-pre>compressPrompt: run submitBatch or startCoSession first</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L72) |
| <code v-pre>stepCascade: run submitBatch or compressPrompt first</code> | [packages/ai-llm/src/semantics/cost-optimization.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L97) |
| <code v-pre>detectCatastrophicForgetting: run sft/dpo eval first</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L122) |
| <code v-pre>detectCatastrophicForgetting: baseline / post length mismatch</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L125) |
| <code v-pre>detectBenchmarkDrift: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L154) |
| <code v-pre>detectBenchmarkDrift: baselineBenchmarks empty — run detectCatastrophicForgetting first to seed baseline</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L157) |
| <code v-pre>startFtSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L47) |
| <code v-pre>evaluateSft: samples must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L62) |
| <code v-pre>evaluateDpo: samples must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L91) |
| <code v-pre>evaluateDpo: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/fine-tuning-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L93) |
| <code v-pre>stepRlhf: prepare dataset first</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L102) |
| <code v-pre>stepRlhf: rewards must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L103) |
| <code v-pre>stepRlhf: learningRate must be positive</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L105) |
| <code v-pre>runEvalLoop: prepare dataset first</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L126) |
| <code v-pre>runEvalLoop: epochScores must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L128) |
| <code v-pre>detectDrift: prepare dataset first</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L154) |
| <code v-pre>detectDrift: run eval loop first</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L156) |
| <code v-pre>detectDrift: threshold must be non-negative</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L157) |
| <code v-pre>startFtpSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L53) |
| <code v-pre>prepareDataset: samples must not be empty</code> | [packages/ai-llm/src/semantics/fine-tuning-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L71) |
| <code v-pre>matchRegex: run schema validation first</code> | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L121) |
| <code v-pre>blockToxicity: run earlier checks first</code> | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L154) |
| <code v-pre>redactPii: run earlier checks first</code> | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L192) |
| <code v-pre>checkConstitutional: run earlier checks first</code> | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L217) |
| <code v-pre>startGuardrailSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L49) |
| <code v-pre>validateSchema: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/guardrails.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L64) |
| <code v-pre>verifyCitation: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L113) |
| <code v-pre>verifyCitation: citations must not be empty</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L116) |
| <code v-pre>scoreConfidence: run other checks first</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L141) |
| <code v-pre>startHallucinationSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L37) |
| <code v-pre>scoreSelfConsistency: need at least 2 samples</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L53) |
| <code v-pre>checkFactuality: run self-consistency first</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L81) |
| <code v-pre>checkFactuality: evidence must not be empty</code> | [packages/ai-llm/src/semantics/hallucination.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L84) |
| <code v-pre>rankPreference: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L109) |
| <code v-pre>rankPreference: pairs must not be empty</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L112) |
| <code v-pre>updateElo: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L153) |
| <code v-pre>updateElo: winner and loser must differ</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L156) |
| <code v-pre>startEvalSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L40) |
| <code v-pre>judgeCandidates: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L56) |
| <code v-pre>judgeCandidates: candidates must not be empty</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L59) |
| <code v-pre>applyRubric: session is $&#123;session.state&#125;, expected judged</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L86) |
| <code v-pre>applyRubric: criteria must not be empty</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L89) |
| <code v-pre>applyRubric: totalWeight must be positive</code> | [packages/ai-llm/src/semantics/llm-eval.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L92) |
| <code v-pre>evaluateAb: update registry first</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L114) |
| <code v-pre>evaluateAb: need at least 2 variants</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L115) |
| <code v-pre>promoteCanary: update registry first</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L146) |
| <code v-pre>promoteCanary: errorRate must be in &#91;0, 1&#93;</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L148) |
| <code v-pre>promoteCanary: threshold must be in &#91;0, 1&#93;</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L150) |
| <code v-pre>compareShadow: update registry first</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L172) |
| <code v-pre>compareShadow: scores must not be empty</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L174) |
| <code v-pre>startOpsSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L48) |
| <code v-pre>updateRegistry: version must not be empty</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L66) |
| <code v-pre>updateRegistry: version $&#123;input.version&#125; already registered</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L68) |
| <code v-pre>advanceRollout: update registry first</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L90) |
| <code v-pre>advanceRollout: targetPercent must be in &#91;0, 100&#93;</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L92) |
| <code v-pre>advanceRollout: incrementPercent must be positive</code> | [packages/ai-llm/src/semantics/llm-ops.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L94) |
| <code v-pre>delegateBySupervisor: assemble crew first</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L100) |
| <code v-pre>delegateBySupervisor: workerIds must not be empty</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L102) |
| <code v-pre>delegateBySupervisor: task must not be empty</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L103) |
| <code v-pre>delegateBySupervisor: supervisor $&#123;input.supervisorId&#125; not in crew</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L105) |
| <code v-pre>delegateBySupervisor: worker $&#123;worker&#125; not in crew</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L110) |
| <code v-pre>transitionGraph: assemble crew first</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L132) |
| <code v-pre>transitionGraph: nodes must not be empty</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L133) |
| <code v-pre>transitionGraph: entry $&#123;input.entryNodeId&#125; not in nodes</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L135) |
| <code v-pre>completeRound: assemble crew first</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L164) |
| <code v-pre>completeRound: minDelegations must be non-negative</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L166) |
| <code v-pre>startMaoSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L60) |
| <code v-pre>assembleCrew: agents must not be empty</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L80) |
| <code v-pre>assembleCrew: agent id must not be empty</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L83) |
| <code v-pre>assembleCrew: duplicate agent id $&#123;a.id&#125;</code> | [packages/ai-llm/src/semantics/multi-agent-orchestration.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L84) |
| <code v-pre>cachePrompt: expand CoT first</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L113) |
| <code v-pre>cachePrompt: key must not be empty</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L114) |
| <code v-pre>pinVersion: expand CoT first</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L140) |
| <code v-pre>pinVersion: semver must match N.N.N</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L142) |
| <code v-pre>pinVersion: hash must be at least 4 chars</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L143) |
| <code v-pre>startPeaSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L53) |
| <code v-pre>expandChainOfThought: thoughts must not be empty</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L72) |
| <code v-pre>expandChainOfThought: individual thought must not be empty</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L77) |
| <code v-pre>selectFewShot: expand CoT first</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L93) |
| <code v-pre>selectFewShot: pool must not be empty</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L94) |
| <code v-pre>selectFewShot: k must be positive</code> | [packages/ai-llm/src/semantics/prompt-engineering-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L95) |
| <code v-pre>classifyDirect: session is $&#123;session.state&#125;, expected analyzed</code> | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L133) |
| <code v-pre>classifyIndirect: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L150) |
| <code v-pre>blockJailbreak: analyze first</code> | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L167) |
| <code v-pre>blockRoleHijacking: analyze first</code> | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L184) |
| <code v-pre>startInjectionSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L47) |
| <code v-pre>detectInjection: session is $&#123;session.state&#125;, cannot analyze</code> | [packages/ai-llm/src/semantics/prompt-injection.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L96) |
| <code v-pre>rerank: session is $&#123;session.state&#125;, expected hybrid-retrieved</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L118) |
| <code v-pre>rerank: hits must not be empty</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L120) |
| <code v-pre>compressContext: session is $&#123;session.state&#125;, expected reranked</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L142) |
| <code v-pre>compressContext: maxTokens must be positive</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L144) |
| <code v-pre>startRagSession: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L39) |
| <code v-pre>chunkDocument: session is $&#123;session.state&#125;</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L55) |
| <code v-pre>chunkDocument: chunkSize must be positive</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L57) |
| <code v-pre>chunkDocument: overlap must be in &#91;0, chunkSize)</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L59) |
| <code v-pre>hybridRetrieve: session is $&#123;session.state&#125;, expected chunked</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L85) |
| <code v-pre>hybridRetrieve: topK must be positive</code> | [packages/ai-llm/src/semantics/rag-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L87) |
| <code v-pre>stepAgentic: traverse graph first</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L123) |
| <code v-pre>stepAgentic: confidence must be in &#91;0, 1&#93;</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L125) |
| <code v-pre>stepAgentic: threshold must be in &#91;0, 1&#93;</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L127) |
| <code v-pre>stepAgentic: reason must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L129) |
| <code v-pre>selfQuery: traverse graph first</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L148) |
| <code v-pre>selfQuery: question must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L150) |
| <code v-pre>selfQuery: schemaFields must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L152) |
| <code v-pre>expandParent: traverse graph first</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L175) |
| <code v-pre>expandParent: parents must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L177) |
| <code v-pre>expandParent: chunkId must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L179) |
| <code v-pre>startRag3Session: sessionId must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L59) |
| <code v-pre>traverseGraph: nodes must not be empty</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L82) |
| <code v-pre>traverseGraph: maxHops must be positive</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L83) |
| <code v-pre>traverseGraph: startNode $&#123;input.startNodeId&#125; not in nodes</code> | [packages/ai-llm/src/semantics/rag-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L85) |
| <code v-pre>resolveBudgetGuard: KIWA&#95;LLM&#95;BUDGET&#95;USD must be a non-negative number</code> | [packages/ai-llm/src/semantics/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L79) |
| <code v-pre>resolveBudgetGuard: KIWA&#95;LLM&#95;PER&#95;CALL&#95;CAP&#95;USD must be a non-negative number</code> | [packages/ai-llm/src/semantics/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L82) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>advanceRollout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L86) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function advanceRollout(session: OpsSession, input: {
    targetPercent: number;
    incrementPercent: number;
}): {
    step: AxisStep<OpsState>;
    currentPercent: number;
    reachedTarget: boolean;
};
```

#### <code v-pre>AI&#95;LLM&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L21) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export declare const AI_LLM_AXIS_TO_EVENTS: Record<AiLlmAxis, NeutralEventName[]>;
```

#### <code v-pre>allocateTasks</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L94) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function allocateTasks(session: SwarmSession, input: {
    tasks: Array<{
        id: string;
        priority: number;
    }>;
}): {
    step: AxisStep<SwarmState>;
    allocations: SwarmTask[];
};
```

#### <code v-pre>apiKeyEnvVar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L48) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function apiKeyEnvVar(backend: LlmBackend): string;
```

#### <code v-pre>applyRubric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L81) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function applyRubric(session: EvalSession, input: {
    candidateId: string;
    criteria: RubricCriterion[];
}): {
    step: AxisStep<EvalState>;
    weightedScore: number;
};
```

#### <code v-pre>assembleCrew</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L76) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function assembleCrew(session: MaoSession, input: {
    agents: MaoAgent[];
}): {
    step: AxisStep<MaoState>;
    agentCount: number;
};
```

#### <code v-pre>assignRoles</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L69) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function assignRoles(session: SwarmSession, input: {
    agents: Array<{
        id: string;
        reliability: number;
    }>;
    roles: string[];
}): {
    step: AxisStep<SwarmState>;
    assignments: SwarmAgent[];
};
```

#### <code v-pre>blockJailbreak</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L162) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function blockJailbreak(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>blockRoleHijacking</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L179) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function blockRoleHijacking(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>blockToxicity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L149) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function blockToxicity(session: GuardrailSession, input: {
    text: string;
    threshold?: number;
}): {
    step: AxisStep<GuardrailState>;
    blocked: boolean;
    score: number;
};
```

#### <code v-pre>buildAiLlmReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L59) <code v-pre>packages/ai-llm/src/report.ts</code>

実測 fidelity + coverage + test count + mutation + perf を `QualityReport` に統合する。 AI-LLM 4 軸は `fidelity.records` から 自動集計。

```ts
export declare function buildAiLlmReport(input: BuildAiLlmReportInput): QualityReport;
```

#### <code v-pre>buildAiLlmReportFromMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L106) <code v-pre>packages/ai-llm/src/report.ts</code>

mock adapter の `getMetrics()` から直接 `QualityReport` を組み立てる light path。 fidelity harness を回さず、 mock 単体の実測値だけを report 化する用途 (unit test 内で release gate 検証したいとき等)。

```ts
export declare function buildAiLlmReportFromMock(input: {
    provider: string;
    version: string;
    mock: AiLlmMock;
    /** accuracy は fidelity 経路が必要なので単体経路では固定値を渡す。 */
    accuracyScore: number;
    accuracyMethod: string;
    surfaceCoverage?: {
        mockCoveredMethods: number;
        realTotalMethods: number;
    };
    testCount?: {
        behavior: number;
        integration: number;
        e2e: number;
    };
    notes?: string;
}): QualityReport;
```

#### <code v-pre>buildRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L120) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function buildRealDriverConfig(backend: LlmBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### <code v-pre>cachePrompt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L109) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function cachePrompt(session: PeaSession, input: {
    key: string;
    value: string;
}): {
    step: AxisStep<PeaState>;
    entry: PeaCacheEntry;
    wasHit: boolean;
};
```

#### <code v-pre>chargeBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L87) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function chargeBudget(guard: BudgetGuardConfig, costUsd: number): {
    allowed: boolean;
    reason: string;
    remaining: number;
};
```

#### <code v-pre>checkBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L58) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function checkBudget(session: SlaSession, input: {
    cost: number;
}): {
    step: AxisStep<SlaState>;
    allowed: boolean;
    remaining: number;
};
```

#### <code v-pre>checkConstitutional</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L212) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function checkConstitutional(session: GuardrailSession, input: {
    text: string;
    principles: ConstitutionalPrinciple[];
}): {
    step: AxisStep<GuardrailState>;
    violations: Array<{
        id: string;
        word: string;
    }>;
};
```

#### <code v-pre>checkFactuality</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L76) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function checkFactuality(session: HallucinationSession, input: {
    claim: string;
    evidence: string[];
}): {
    step: AxisStep<HallucinationState>;
    score: number;
    matches: string[];
};
```

#### <code v-pre>chunkDocument</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L50) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function chunkDocument(session: RagSession, input: {
    doc: string;
    chunkSize: number;
    overlap: number;
}): {
    step: AxisStep<RagState>;
    chunks: Array<{
        id: string;
        text: string;
    }>;
};
```

#### <code v-pre>classifyDirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L128) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function classifyDirect(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>classifyIndirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L145) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function classifyIndirect(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L118) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: AiLlmTarget[]): FidelityCoverage;
```

#### <code v-pre>compareShadow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L168) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function compareShadow(session: OpsSession, input: {
    productionScores: number[];
    shadowScores: number[];
}): {
    step: AxisStep<OpsState>;
    delta: number;
    better: boolean;
};
```

#### <code v-pre>completeRound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L160) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function completeRound(session: MaoSession, input: {
    minDelegations: number;
}): {
    step: AxisStep<MaoState>;
    roundsCompleted: number;
    sufficient: boolean;
};
```

#### <code v-pre>compressContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L137) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function compressContext(session: RagSession, input: {
    hits: RerankedHit[];
    maxTokens: number;
}): {
    step: AxisStep<RagState>;
    compressed: string;
    keptCount: number;
    totalTokens: number;
};
```

#### <code v-pre>compressPrompt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L67) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function compressPrompt(session: CoSession, input: {
    prompt: string;
    maxChars?: number;
}): {
    step: AxisStep<CoState>;
    compressed: string;
    ratio: number;
};
```

#### <code v-pre>costForTokens</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L87) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Compute cost in USD for a request given raw `input_tokens` + `output_tokens`. The vendor SSE / JSON payload names are kept out of the signature — accepts plain numbers so both Anthropic-shaped (`input_tokens`) and OpenAI-shaped (`prompt_tokens`) callers wire in without a shim.

```ts
export declare function costForTokens(model: string, inputTokens: number, outputTokens: number): number;
```

#### <code v-pre>createAnthropicMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L126) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export declare function createAnthropicMock(config?: MockConfig): AnthropicMock;
```

#### <code v-pre>createLangchainMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L89) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export declare function createLangchainMock(config?: MockConfig): LangchainMock;
```

#### <code v-pre>createOpenAIMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L182) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export declare function createOpenAIMock(config?: MockConfig): OpenAiMock;
```

#### <code v-pre>createVercelAiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L97) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export declare function createVercelAiMock(config?: MockConfig): VercelAiMock;
```

#### <code v-pre>delegateBySupervisor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L96) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function delegateBySupervisor(session: MaoSession, input: {
    supervisorId: string;
    task: string;
    workerIds: string[];
}): {
    step: AxisStep<MaoState>;
    delegation: MaoDelegation;
};
```

#### <code v-pre>detectBenchmarkDrift</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L149) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function detectBenchmarkDrift(session: FtSession, input: {
    current: BenchmarkResult[];
    driftThreshold?: number;
}): {
    step: AxisStep<FtState>;
    drifted: Array<{
        name: string;
        delta: number;
    }>;
};
```

#### <code v-pre>detectCatastrophicForgetting</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L113) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function detectCatastrophicForgetting(session: FtSession, input: {
    baseline: BenchmarkResult[];
    postFineTune: BenchmarkResult[];
    threshold?: number;
}): {
    step: AxisStep<FtState>;
    forgotten: Array<{
        name: string;
        drop: number;
    }>;
    averageDrop: number;
};
```

#### <code v-pre>detectDrift</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L150) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function detectDrift(session: FtpSession, input: {
    threshold: number;
}): {
    step: AxisStep<FtpState>;
    drifted: boolean;
    delta: number;
};
```

#### <code v-pre>detectInjection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L91) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function detectInjection(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    detections: InjectionDetection[];
};
```

#### <code v-pre>endpointEnvKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L35) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function endpointEnvKey(backend: LlmBackend): string;
```

#### <code v-pre>engageFallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L140) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function engageFallback(session: SlaSession, input: {
    ladder: string[];
    failed: string[];
}): {
    step: AxisStep<SlaState>;
    nextModel: string | null;
    attemptedCount: number;
};
```

#### <code v-pre>estimateMultimodalTokens</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L141) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

parts に含まれる image / audio の token 換算量を返す。 token 見積の内訳は `imageTokenCost` (default 1500) × image 数 + `audioTokenCost` (default 500) × audio 数 (durationSeconds &gt; 30 の場合は比例増分)。 detail hint は OpenAI vision の課金モデルに寄せて low = 1/2、 high = 実額、 auto = 実額の 0.8 を掛ける。

```ts
export declare function estimateMultimodalTokens(parts: MessagePart[] | undefined, config?: {
    imageTokenCost?: number;
    audioTokenCost?: number;
}): number;
```

#### <code v-pre>evaluateAb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L110) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function evaluateAb(session: OpsSession, input: {
    results: OpsAbResult[];
    minSamples: number;
}): {
    step: AxisStep<OpsState>;
    winner: string | null;
    delta: number;
};
```

#### <code v-pre>evaluateDpo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L87) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function evaluateDpo(session: FtSession, samples: DpoSample[]): {
    step: AxisStep<FtState>;
    averageMargin: number;
    preferenceAccuracy: number;
};
```

#### <code v-pre>evaluateSft</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L58) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function evaluateSft(session: FtSession, samples: SftSample[]): {
    step: AxisStep<FtState>;
    averageF1: number;
    exactMatchRate: number;
};
```

#### <code v-pre>executeCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L80) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function executeCode(session: CiSession, input: {
    code: string;
    assigns?: Record<string, string>;
}): {
    step: AxisStep<CiState>;
    execution: CiExecution;
};
```

#### <code v-pre>expandChainOfThought</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L67) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function expandChainOfThought(session: PeaSession, input: {
    thoughts: string[];
}): {
    step: AxisStep<PeaState>;
    steps: CotStep[];
};
```

#### <code v-pre>expandParent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L171) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function expandParent(session: Rag3Session, input: {
    chunkId: string;
    parents: RagParentDoc[];
}): {
    step: AxisStep<Rag3State>;
    parent: RagParentDoc | null;
};
```

#### <code v-pre>expandToT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L86) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function expandToT(session: AgentSession, input: {
    root: {
        thought: string;
    };
    branches: Array<{
        thought: string;
        score: number;
    }>;
    depth: number;
}): {
    step: AxisStep<AgentState>;
    nodeCount: number;
};
```

#### <code v-pre>extractTextFromParts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L126) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

parts から text 部分だけを結合 (adapter が下位 engine に渡す用)。

```ts
export declare function extractTextFromParts(parts: MessagePart[]): string;
```

#### <code v-pre>hasAudioPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L181) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

「audio 1 件以上を含む parts」 の shape guard。

```ts
export declare function hasAudioPart(parts: MessagePart[] | undefined): boolean;
```

#### <code v-pre>hasImagePart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L175) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

「image 1 件以上を含む parts」 の shape guard。 adapter の分岐用。

```ts
export declare function hasImagePart(parts: MessagePart[] | undefined): boolean;
```

#### <code v-pre>hasMultimodalParts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L120) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

`parts` に image / audio が 1 件でも含まれるか。

```ts
export declare function hasMultimodalParts(parts: MessagePart[] | undefined): boolean;
```

#### <code v-pre>hybridRetrieve</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L80) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function hybridRetrieve(session: RagSession, input: {
    query: string;
    denseWeight: number;
    sparseWeight: number;
    topK: number;
}): {
    step: AxisStep<RagState>;
    hits: RetrievalHit[];
};
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L15) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>jaccardSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L103) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

Jaccard 単語 similarity — 実 LLM tokenizer なしで文字列近似を計算する 軽量 default。 embedding cosine と厳密には一致しないが、 mock 検証には 十分 (完全一致 = 1.0、 無関係 = 0.0)。

```ts
export declare function jaccardSimilarity(a: string, b: string): number;
```

#### <code v-pre>judgeCandidates</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L51) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function judgeCandidates(session: EvalSession, input: {
    prompt: string;
    candidates: Array<{
        id: string;
        text: string;
        groundTruth?: string;
    }>;
}): {
    step: AxisStep<EvalState>;
    verdicts: JudgeVerdict[];
};
```

#### <code v-pre>lookupModelPrice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L70) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Look up a model's price entry. Alias-resolves first, then reads `PRICE_TABLE`. Unknown models fall back to Anthropic Sonnet 3.5 rates with `wasFallback: true` so callers can log the drift instead of silently emitting zero-cost figures. `Object.hasOwn` guards against inherited property lookups (e.g. `toString` / `__proto__`) that would otherwise resolve to non-price built-ins.

```ts
export declare function lookupModelPrice(model: string): PriceLookupResult;
```

#### <code v-pre>lookupSemanticCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L123) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function lookupSemanticCache(session: CoSession, input: {
    queryHash: string;
    value?: string;
}): {
    step: AxisStep<CoState>;
    hit: boolean;
    cached: string | null;
};
```

#### <code v-pre>makeSeededRandom</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L20) <code v-pre>packages/ai-llm/src/sampling.ts</code>

mulberry32 seeded PRNG — 32-bit state, returns floats in [0, 1). Same seed always yields the same sequence, so a perf test with `seed=42` observes identical samples on every run and can gate on the resulting distribution shape.

```ts
export declare function makeSeededRandom(seed: number): () => number;
```

#### <code v-pre>matchRegex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L116) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function matchRegex(session: GuardrailSession, input: {
    text: string;
    patterns: RegExp[];
    mode: 'allow' | 'deny';
}): {
    step: AxisStep<GuardrailState>;
    passed: boolean;
    hits: string[];
};
```

#### <code v-pre>measureLatency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L80) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function measureLatency(session: SlaSession, samples: LatencySample[]): {
    step: AxisStep<SlaState>;
    p50: number;
    p95: number;
    p99: number;
    count: number;
};
```

#### <code v-pre>MockEngine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/engine.ts#L29) <code v-pre>packages/ai-llm/src/engine.ts</code>

```ts
export declare class MockEngine {
    readonly config: ResolvedConfig;
    constructor(config?: MockConfig);
    /** 1 request の完全な処理 (non-streaming)。 */
    runChat(input: ChatInput): Promise<ChatCompletion>;
    /** streaming — chunk 列を async generator で返す。 */
    runStream(input: ChatInput): AsyncGenerator<StreamEvent, void, unknown>;
    getMetrics(): ReturnType<AiLlmMock['getMetrics']>;
    reset(): void;
}
```

#### <code v-pre>pinVersion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L136) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function pinVersion(session: PeaSession, input: {
    semver: string;
    hash: string;
}): {
    step: AxisStep<PeaState>;
    version: string;
};
```

#### <code v-pre>prepareDataset</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L67) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function prepareDataset(session: FtpSession, input: {
    samples: FtpSample[];
    dedupe: boolean;
}): {
    step: AxisStep<FtpState>;
    sampleCount: number;
    deduped: number;
};
```

#### <code v-pre>PRICE&#95;ALIASES</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L40) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Alias → canonical model name. Vendors publish moving aliases like `-latest` that we resolve.

```ts
export declare const PRICE_ALIASES: Readonly<Record<string, string>>;
```

#### <code v-pre>PRICE&#95;TABLE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L27) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Prices per 1M tokens keyed by model identifier as the vendor names it. Aliases like `claude-3-5-sonnet-latest` route to the concrete versioned entry (`claude-3-5-sonnet-20241022`) via `PRICE_ALIASES` so a bump on the vendor side that renames the alias target does not silently break lookup.

```ts
export declare const PRICE_TABLE: Readonly<Record<string, ModelPrice>>;
```

#### <code v-pre>promoteCanary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L142) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function promoteCanary(session: OpsSession, input: {
    canaryVersion: string;
    errorRate: number;
    threshold: number;
}): {
    step: AxisStep<OpsState>;
    promoted: boolean;
};
```

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L427) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: AiLlmTarget, neutral: NeutralEventName): string;
```

#### <code v-pre>rankPreference</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L104) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function rankPreference(session: EvalSession, input: {
    pairs: Array<{
        a: string;
        b: string;
        preferred: 'a' | 'b' | 'tie';
    }>;
}): {
    step: AxisStep<EvalState>;
    ranking: Array<{
        id: string;
        wins: number;
        losses: number;
        ties: number;
    }>;
};
```

#### <code v-pre>reachConsensus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L119) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function reachConsensus(session: SwarmSession, input: {
    votes: SwarmVote[];
}): {
    step: AxisStep<SwarmState>;
    winner: string | null;
    agreementRatio: number;
};
```

#### <code v-pre>reactStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L67) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function reactStep(session: AgentSession, input: {
    thought: string;
    action: {
        tool: string;
        input: string;
    };
    observation: string;
}): {
    step: AxisStep<AgentState>;
    trace: ReactStep[];
};
```

#### <code v-pre>redactPii</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L187) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function redactPii(session: GuardrailSession, text: string): {
    step: AxisStep<GuardrailState>;
    redacted: string;
    hits: Array<{
        kind: string;
        count: number;
    }>;
};
```

#### <code v-pre>reflectAndCorrect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L118) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function reflectAndCorrect(session: AgentSession, input: {
    output: string;
    critiqueRules: string[];
}): {
    step: AxisStep<AgentState>;
    reflection: Reflection;
};
```

#### <code v-pre>rerank</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L113) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function rerank(session: RagSession, input: {
    query: string;
    hits: RetrievalHit[];
}): {
    step: AxisStep<RagState>;
    reranked: RerankedHit[];
};
```

#### <code v-pre>resolveApiKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L61) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function resolveApiKey(backend: LlmBackend, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveBudgetGuard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L75) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function resolveBudgetGuard(env?: NodeJS.ProcessEnv): BudgetGuardConfig;
```

#### <code v-pre>resolveLlmEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L26) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function resolveLlmEndpoint(backend: LlmBackend, env?: NodeJS.ProcessEnv): string;
```

#### <code v-pre>rollback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L132) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function rollback(session: CiSession, input: {
    steps: number;
}): {
    step: AxisStep<CiState>;
    poppedCount: number;
    remaining: number;
};
```

#### <code v-pre>routeModel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L112) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function routeModel(session: SlaSession, input: {
    candidates: RoutingCandidate[];
    slaLatencyMs: number;
    minQuality: number;
}): {
    step: AxisStep<SlaState>;
    chosen: RoutingCandidate | null;
    considered: RoutingCandidate[];
};
```

#### <code v-pre>runEvalLoop</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L122) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function runEvalLoop(session: FtpSession, input: {
    epochScores: number[];
}): {
    step: AxisStep<FtpState>;
    bestScore: number;
    averageScore: number;
};
```

#### <code v-pre>runFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L61) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

fidelity 実行 — 全 prompt を real / mock 両方に投げて diff を計測。

```ts
export declare function runFidelityCheck(input: FidelityInput): Promise<FidelityReport>;
```

#### <code v-pre>samplePoisson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L38) <code v-pre>packages/ai-llm/src/sampling.ts</code>

Poisson-distributed sample stream. Knuth's algorithm — simple, correct for the small lambdas (0.5–20) perf tests use for arrival-interval / request-count models. For lambda &gt; ~30 numerical underflow makes this variant unusable, but that regime is out of scope for the dogfood perf suite.

```ts
export declare function samplePoisson(count: number, lambda: number, rng: () => number): number[];
```

#### <code v-pre>sampleZipf</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L76) <code v-pre>packages/ai-llm/src/sampling.ts</code>

Zipf-distributed sample stream — heavy-tail integer draws from {1..n}. Rejection method with Devroye's shape parameter is used so larger `s` (skew) values still converge; perf tests use s ≈ 1.07 to approximate the observed prompt-length distribution in production chat traffic.

```ts
export declare function sampleZipf(count: number, n: number, s: number, rng: () => number): number[];
```

#### <code v-pre>scoreConfidence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L136) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function scoreConfidence(session: HallucinationSession, text: string): {
    step: AxisStep<HallucinationState>;
    score: number;
    hedgingRatio: number;
};
```

#### <code v-pre>scoreSelfConsistency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L48) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function scoreSelfConsistency(session: HallucinationSession, samples: string[]): {
    step: AxisStep<HallucinationState>;
    score: number;
};
```

#### <code v-pre>selectFewShot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L89) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function selectFewShot(session: PeaSession, input: {
    pool: FewShotExample[];
    k: number;
}): {
    step: AxisStep<PeaState>;
    selected: FewShotExample[];
};
```

#### <code v-pre>selectTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L148) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function selectTool(session: AgentSession, input: {
    intent: string;
    candidates: Array<{
        name: string;
        description: string;
    }>;
}): {
    step: AxisStep<AgentState>;
    selected: ToolCandidate | null;
    ranking: ToolCandidate[];
};
```

#### <code v-pre>selfQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L144) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function selfQuery(session: Rag3Session, input: {
    question: string;
    schemaFields: string[];
}): {
    step: AxisStep<Rag3State>;
    predicate: string;
    matchedFields: string[];
};
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L134) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### <code v-pre>startAgentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L50) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function startAgentSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): AgentSession;
```

#### <code v-pre>startCiSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L44) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function startCiSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): CiSession;
```

#### <code v-pre>startCoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L27) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function startCoSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): CoSession;
```

#### <code v-pre>startEvalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L35) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function startEvalSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): EvalSession;
```

#### <code v-pre>startFtpSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L48) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function startFtpSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): FtpSession;
```

#### <code v-pre>startFtSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L42) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function startFtSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): FtSession;
```

#### <code v-pre>startGuardrailSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L44) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function startGuardrailSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): GuardrailSession;
```

#### <code v-pre>startHallucinationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L32) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function startHallucinationSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): HallucinationSession;
```

#### <code v-pre>startInjectionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L42) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function startInjectionSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): InjectionSession;
```

#### <code v-pre>startMaoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L55) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function startMaoSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): MaoSession;
```

#### <code v-pre>startOpsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L43) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function startOpsSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): OpsSession;
```

#### <code v-pre>startPeaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L48) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function startPeaSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): PeaSession;
```

#### <code v-pre>startRag3Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L54) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function startRag3Session(input: {
    target: AiLlmTarget;
    sessionId: string;
}): Rag3Session;
```

#### <code v-pre>startRagSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L34) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function startRagSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): RagSession;
```

#### <code v-pre>startSandbox</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L64) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function startSandbox(session: CiSession, input: {
    sandboxId: string;
    timeoutMs: number;
}): {
    step: AxisStep<CiState>;
    sandboxId: string;
};
```

#### <code v-pre>startSlaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L39) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function startSlaSession(input: {
    target: AiLlmTarget;
    sessionId: string;
    budgetUsd: number;
}): SlaSession;
```

#### <code v-pre>startSwarmSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L47) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function startSwarmSession(input: {
    target: AiLlmTarget;
    sessionId: string;
    faultThreshold?: number;
}): SwarmSession;
```

#### <code v-pre>stepAgentic</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L119) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function stepAgentic(session: Rag3Session, input: {
    confidence: number;
    threshold: number;
    reason: string;
}): {
    step: AxisStep<Rag3State>;
    action: 'fetch' | 'answer';
    index: number;
};
```

#### <code v-pre>stepCascade</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L89) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function stepCascade(session: CoSession, input: {
    confidence: number;
    tiers: Array<{
        name: string;
        costPerToken: number;
        confidenceThreshold: number;
    }>;
}): {
    step: AxisStep<CoState>;
    selectedTier: string;
    escalated: boolean;
};
```

#### <code v-pre>stepRlhf</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L98) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function stepRlhf(session: FtpSession, input: {
    rewards: number[];
    learningRate: number;
}): {
    step: AxisStep<FtpState>;
    totalStep: FtpRlhfStep;
};
```

#### <code v-pre>submitBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L43) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function submitBatch(session: CoSession, input: {
    requests: Array<{
        id: string;
        tokens: number;
    }>;
    batchSizeLimit?: number;
}): {
    step: AxisStep<CoState>;
    batchCount: number;
    estimatedSavings: number;
};
```

#### <code v-pre>tolerateByzantine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L150) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function tolerateByzantine(session: SwarmSession, input: {
    faultyAgentIds: string[];
}): {
    step: AxisStep<SwarmState>;
    tolerated: boolean;
    honestRatio: number;
};
```

#### <code v-pre>toTranscriptionKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L167) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

audio part を transcription key に変換 (mock dict lookup 用)。 base64 は `base64:{先頭 32 文字}`、 url は `url:{url}` を使う。 先頭 32 文字 hash は 「同じ audio を渡せば同じ key」 を担保する軽量 fingerprint。

```ts
export declare function toTranscriptionKey(source: MediaSource): string;
```

#### <code v-pre>transitionGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L128) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function transitionGraph(session: MaoSession, input: {
    nodes: MaoGraphNode[];
    edges: MaoGraphEdge[];
    entryNodeId: string;
}): {
    step: AxisStep<MaoState>;
    visited: string[];
};
```

#### <code v-pre>traverseGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L73) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function traverseGraph(session: Rag3Session, input: {
    nodes: RagGraphNode[];
    edges: RagGraphEdge[];
    startNodeId: string;
    maxHops: number;
}): {
    step: AxisStep<Rag3State>;
    visited: string[];
    totalWeight: number;
};
```

#### <code v-pre>updateElo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L148) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function updateElo(session: EvalSession, input: {
    winner: string;
    loser: string;
    k?: number;
}): {
    step: AxisStep<EvalState>;
    winnerRating: number;
    loserRating: number;
};
```

#### <code v-pre>updateRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L61) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function updateRegistry(session: OpsSession, input: {
    version: string;
    activate: boolean;
}): {
    step: AxisStep<OpsState>;
    registrySize: number;
};
```

#### <code v-pre>useTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L113) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function useTool(session: CiSession, input: {
    name: string;
    args: Record<string, string | number | boolean>;
}): {
    step: AxisStep<CiState>;
    call: CiToolCall;
};
```

#### <code v-pre>validateSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L59) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function validateSchema(session: GuardrailSession, input: {
    value: unknown;
    schema: SimpleSchema;
}): {
    step: AxisStep<GuardrailState>;
    valid: boolean;
    errors: string[];
};
```

#### <code v-pre>verifyCitation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L108) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function verifyCitation(session: HallucinationSession, input: {
    citations: string[];
    corpus: string[];
}): {
    step: AxisStep<HallucinationState>;
    score: number;
    missing: string[];
};
```

### 型

#### <code v-pre>AgentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L15) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

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

#### <code v-pre>AgentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L8) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

Agent orchestration axis — ReAct + Tree-of-Thought + reflection + self-correction + planning + tool selection state machine。

```ts
export type AgentState = 'idle' | 'react-stepped' | 'tot-expanded' | 'reflected' | 'tool-selected';
```

#### <code v-pre>AiLlmAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L37) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export type AiLlmAxis = 'prompt-injection' | 'hallucination' | 'llm-eval' | 'guardrails' | 'rag-advanced' | 'agent-orchestration' | 'fine-tuning-eval' | 'cost-latency-sla' | 'multi-agent-orchestration' | 'agent-swarm' | 'code-interpreter' | 'fine-tuning-pipeline' | 'llm-ops' | 'prompt-engineering-advanced' | 'rag-iii' | 'cost-optimization';
```

#### <code v-pre>AiLlmMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L163) <code v-pre>packages/ai-llm/src/types.ts</code>

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

#### <code v-pre>AiLlmTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L35) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

Advanced AI-LLM semantics — provider-neutral axis SSOT (v0.4 + v0.5). Model 4 canonical LLM SDK targets as pure state machines so kiwa fixture tests can assert on a neutral event name while still observing a provider-specific dialect through providerEventName. Provider targets (SDK 別 4): - anthropic ... Anthropic Messages API (Claude Haiku / Sonnet / Opus) - openai ... OpenAI Chat Completions (gpt-4o / gpt-4o-mini) - vercel-ai ... Vercel AI SDK (streamText + generateText、 provider agnostic) - langchain ... LangChain (BaseChatModel + Runnable) v0.4 Axes (8): - prompt-injection ... direct + indirect + jailbreak + role hijacking + XML injection defense - hallucination ... self-consistency + factuality + citation + confidence + hedging - llm-eval ... LLM-as-judge + rubric + preference + Elo + human-in-the-loop - guardrails ... JSON schema + regex + toxicity + PII + Constitutional AI - rag-advanced ... chunking + hybrid retrieval + reranking + citation + context compression - agent-orchestration ... ReAct + ToT + reflection + self-correction + planning + tool selection - fine-tuning-eval ... SFT/DPO + catastrophic forgetting + benchmark drift - cost-latency-sla ... budget + p50/p99 + model routing + fallback ladder v0.5 Axes (advanced III、 8 new): - multi-agent-orchestration ... CrewAI + AutoGen + LangGraph + supervisor + swarm coordination - agent-swarm ... role-based + task allocation + consensus + Byzantine fault tolerance - code-interpreter ... sandboxed Python REPL + tool use + rollback state machine - fine-tuning-pipeline ... dataset prep + RLHF/DPO + eval loop + drift detection - llm-ops ... model registry + rollout + A/B + canary + shadow - prompt-engineering-advanced ... CoT + few-shot + caching + versioning - rag-iii ... GraphRAG + agentic + self-querying + parent document - cost-optimization ... batch API + prompt compression + model cascade + semantic cache

```ts
export type AiLlmTarget = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';
```

#### <code v-pre>AnthropicContentBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L32) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

Anthropic content block union (v0.2 で image 追加、 real API 準拠)。 text / image は well-typed、 tool_use / tool_result は real SDK の柔軟な shape を保つため field を optional にしてある。 dogfood app が段階的に request を組み立てる経路 (id / name を後で埋める) を許容する。

```ts
export type AnthropicContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    source: {
        type: 'base64';
        media_type: string;
        data: string;
    } | {
        type: 'url';
        url: string;
    };
} | {
    type: 'tool_use';
    id?: string;
    name?: string;
    input: Record<string, unknown>;
} | {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
} | {
    type: string;
    text?: string;
    tool_use_id?: string;
    content?: string;
    input?: unknown;
};
```

#### <code v-pre>AnthropicMessagesRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L60) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

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

#### <code v-pre>AnthropicMessagesResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L77) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export interface AnthropicMessagesResponse {
    id: string;
    type: 'message';
    role: 'assistant';
    model: string;
    content: Array<{
        type: 'text';
        text: string;
    } | {
        type: 'tool_use';
        id: string;
        name: string;
        input: Record<string, unknown>;
    }>;
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

#### <code v-pre>AnthropicMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L118) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

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

#### <code v-pre>AnthropicStreamEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L101) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export interface AnthropicStreamEvent {
    type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
    delta?: {
        type: 'text_delta';
        text: string;
    } | {
        stop_reason: string;
    };
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
    _kiwa?: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>AudioPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L66) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

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

#### <code v-pre>Base64Data</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L34) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

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

#### <code v-pre>BenchmarkResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L37) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface BenchmarkResult {
    name: string;
    score: number;
}
```

#### <code v-pre>BudgetGuardConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L69) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export interface BudgetGuardConfig {
    limitUsd: number;
    spentUsd: number;
    perCallCapUsd: number;
}
```

#### <code v-pre>BuildAiLlmReportInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts#L28) <code v-pre>packages/ai-llm/src/report.ts</code>

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
    surfaceCoverage?: {
        mockCoveredMethods: number;
        realTotalMethods: number;
    };
    /** vitest 由来の test count breakdown。 */
    testCount?: {
        behavior: number;
        integration: number;
        e2e: number;
    };
    /** v8 coverage summary (c8 `coverage-summary.json` の `total` block)。 */
    coverageV8Summary?: {
        lines: {
            pct: number;
        };
        branches: {
            pct: number;
        };
        functions: {
            pct: number;
        };
    };
    /** stryker / cargo-mutants mutation report。 */
    mutation?: {
        mutations: number;
        killed: number;
    };
    /** unit-scope adapter perf (100 回計測の p95 用)。 */
    perfSamplesMs?: number[];
    /** notes to embed in the emitted markdown report。 */
    notes?: string;
}
```

#### <code v-pre>ChatCompletion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L78) <code v-pre>packages/ai-llm/src/types.ts</code>

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

#### <code v-pre>ChatInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L180) <code v-pre>packages/ai-llm/src/types.ts</code>

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

#### <code v-pre>ChatMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L31) <code v-pre>packages/ai-llm/src/types.ts</code>

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

#### <code v-pre>CiExecution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L19) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export interface CiExecution {
    index: number;
    code: string;
    stdout: string;
    ok: boolean;
}
```

#### <code v-pre>CiSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L32) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

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

#### <code v-pre>CiState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L12) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

Code interpreter axis — sandboxed Python REPL + tool use + rollback state machine。 Deterministic mock で 4 signal 系統。 sandbox start binds an isolated cell、 code execution accumulates history and side-effects、 tool use is external effect record、 rollback pops N most-recent executions and restores state。

```ts
export type CiState = 'idle' | 'sandbox-started' | 'code-executed' | 'tool-used' | 'rolled-back';
```

#### <code v-pre>CiToolCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L26) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export interface CiToolCall {
    name: string;
    args: Record<string, string | number | boolean>;
    ok: boolean;
}
```

#### <code v-pre>ConstitutionalPrinciple</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L38) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface ConstitutionalPrinciple {
    id: string;
    ruleText: string;
    forbidden: string[];
}
```

#### <code v-pre>CoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L19) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export interface CoSession {
    target: AiLlmTarget;
    sessionId: string;
    state: CoState;
    history: AxisStep<CoState>[];
    cache: Map<string, string>;
}
```

#### <code v-pre>CoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L12) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

Cost optimization axis — batch API + prompt compression + model cascade + semantic cache state machine。 Deterministic mock で 4 signal 系統。 batch submit is size + estimate、 prompt compression is char delta、 model cascade is threshold + tier、 semantic cache is hash lookup。

```ts
export type CoState = 'idle' | 'batch-submitted' | 'prompt-compressed' | 'cascade-stepped' | 'semantic-cached';
```

#### <code v-pre>CotStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L19) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface CotStep {
    index: number;
    thought: string;
}
```

#### <code v-pre>DpoSample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L29) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface DpoSample {
    prompt: string;
    chosen: string;
    rejected: string;
    chosenLogp: number;
    rejectedLogp: number;
}
```

#### <code v-pre>EvalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L15) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export interface EvalSession {
    target: AiLlmTarget;
    sessionId: string;
    state: EvalState;
    history: AxisStep<EvalState>[];
    eloRatings: Map<string, number>;
}
```

#### <code v-pre>EvalState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L8) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

LLM eval axis — LLM-as-judge + rubric + preference + Elo + human-in-the-loop state machine。 deterministic mock で 4 signal 系統を提供。

```ts
export type EvalState = 'idle' | 'judged' | 'rubric-applied' | 'preference-ranked' | 'elo-updated';
```

#### <code v-pre>FewShotExample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L24) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface FewShotExample {
    id: string;
    input: string;
    output: string;
    score: number;
}
```

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L15) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: AiLlmTarget[];
    axes: AiLlmAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L14) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

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

#### <code v-pre>FidelityRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L32) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

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

#### <code v-pre>FidelityReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L45) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

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

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L8) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: AiLlmTarget;
    axis: AiLlmAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```

#### <code v-pre>FtpEvalRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L32) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpEvalRecord {
    epoch: number;
    score: number;
}
```

#### <code v-pre>FtpRlhfStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L26) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpRlhfStep {
    step: number;
    reward: number;
    policyDelta: number;
}
```

#### <code v-pre>FtpSample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L20) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpSample {
    prompt: string;
    chosen: string;
    rejected: string;
}
```

#### <code v-pre>FtpSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L37) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

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

#### <code v-pre>FtpState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L13) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

Fine-tuning pipeline axis — dataset prep + RLHF/DPO + eval loop + drift detection state machine。 Deterministic mock で 4 signal 系統。 dataset prep is dedup + shuffle by hash、 RLHF stepping is reward gradient sign + policy update、 eval loop accumulates score history、 drift detection compares latest eval vs baseline via absolute threshold。

```ts
export type FtpState = 'idle' | 'dataset-prepared' | 'rlhf-stepped' | 'eval-loop-ran' | 'drift-detected';
```

#### <code v-pre>FtSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L15) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface FtSession {
    target: AiLlmTarget;
    sessionId: string;
    state: FtState;
    history: AxisStep<FtState>[];
    baselineBenchmarks: Map<string, number>;
}
```

#### <code v-pre>FtState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L8) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

Fine-tuning eval axis — SFT/DPO + catastrophic forgetting + benchmark drift state machine。 deterministic mock で 4 signal 系統。

```ts
export type FtState = 'idle' | 'sft-evaluated' | 'dpo-evaluated' | 'forgetting-detected' | 'drift-detected';
```

#### <code v-pre>GuardrailSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L16) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface GuardrailSession {
    target: AiLlmTarget;
    sessionId: string;
    state: GuardrailState;
    history: AxisStep<GuardrailState>[];
}
```

#### <code v-pre>GuardrailState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L8) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

Guardrails axis — JSON schema + regex + toxicity + PII + Constitutional AI state machine。 deterministic mock で 5 signal 系統を提供。

```ts
export type GuardrailState = 'idle' | 'schema-validated' | 'regex-matched' | 'toxicity-blocked' | 'pii-redacted' | 'constitutional-checked';
```

#### <code v-pre>HallucinationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L19) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

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

#### <code v-pre>HallucinationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L12) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

Hallucination detection axis — self-consistency + factuality + citation + confidence + hedging state machine。 Deterministic mock で 5 signal 系統。 self-consistency は複数 sample 間の token-overlap 比率、 factuality は claim vs evidence の string match、 citation は引用先の存在 check、 confidence / hedging は modal 語彙密度。

```ts
export type HallucinationState = 'idle' | 'self-consistency-scored' | 'factuality-checked' | 'citation-verified' | 'confidence-scored';
```

#### <code v-pre>ImagePart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L58) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

Image 入力。 detail は OpenAI vision の resolution hint と互換。

```ts
export interface ImagePart {
    type: 'image';
    source: MediaSource;
    /** OpenAI vision detail hint (default 'auto')。 mock は token 計算に反映。 */
    detail?: 'low' | 'high' | 'auto';
}
```

#### <code v-pre>InjectionDetection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L35) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export interface InjectionDetection {
    kind: InjectionKind;
    confidence: number;
    excerpt: string;
    matchedPattern: string;
}
```

#### <code v-pre>InjectionKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L12) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

Prompt injection defense axis — direct + indirect + jailbreak + role hijacking + XML injection detection state machine。 Deterministic mock で 5 signal 系統を提供 (pattern-based classifier)。 real driver 経路では実 LLM に対し injection payload を投げて refusal を 観測する。

```ts
export type InjectionKind = 'direct' | 'indirect' | 'jailbreak' | 'role-hijacking' | 'xml-injection';
```

#### <code v-pre>InjectionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L27) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export interface InjectionSession {
    target: AiLlmTarget;
    sessionId: string;
    state: InjectionState;
    history: AxisStep<InjectionState>[];
    detections: Array<{
        kind: InjectionKind;
        confidence: number;
        excerpt: string;
    }>;
}
```

#### <code v-pre>InjectionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L19) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export type InjectionState = 'idle' | 'analyzed' | 'direct-detected' | 'indirect-detected' | 'jailbreak-blocked' | 'role-hijacking-blocked';
```

#### <code v-pre>JudgeVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L23) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export interface JudgeVerdict {
    candidateId: string;
    score: number;
    reasoning: string;
}
```

#### <code v-pre>LangchainAIMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L48) <code v-pre>packages/ai-llm/src/langchain.ts</code>

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

#### <code v-pre>LangchainAIMessageChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L72) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export interface LangchainAIMessageChunk {
    _type: 'AIMessageChunk';
    content: string;
    response_metadata?: LangchainAIMessage['response_metadata'];
    usage_metadata?: LangchainAIMessage['usage_metadata'];
    _kiwa?: LangchainAIMessage['_kiwa'];
}
```

#### <code v-pre>LangchainContentBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L28) <code v-pre>packages/ai-llm/src/langchain.ts</code>

LangChain content block (v0.2、 real

```ts
export type LangchainContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: string | {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
} | {
    type: 'media';
    /** base64 data。 */
    data: string;
    mimeType: string;
};
```

#### <code v-pre>LangchainInputMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L41) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export interface LangchainInputMessage {
    role: 'system' | 'human' | 'ai' | 'tool';
    content: string | LangchainContentBlock[];
    name?: string;
    tool_call_id?: string;
}
```

#### <code v-pre>LangchainMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L80) <code v-pre>packages/ai-llm/src/langchain.ts</code>

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

#### <code v-pre>LatencySample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L27) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export interface LatencySample {
    requestId: string;
    latencyMs: number;
}
```

#### <code v-pre>LlmBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L13) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

Real driver env-gate for ai-llm v0.4. Provides KIWA_MODE=real-based helpers for testing against actual LLM backends (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveLlmEndpoint()` + `resolveApiKey()` to fetch backend URLs / keys. When KIWA_MODE != 'real', tests should skip. Budget guard は必須。 KIWA_LLM_BUDGET_USD で $ 上限を強制する SSOT。

```ts
export type LlmBackend = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';
```

#### <code v-pre>MaoAgent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L19) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoAgent {
    id: string;
    role: string;
    capabilities: string[];
}
```

#### <code v-pre>MaoDelegation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L25) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoDelegation {
    round: number;
    supervisor: string;
    worker: string;
    task: string;
}
```

#### <code v-pre>MaoGraphEdge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L37) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoGraphEdge {
    from: string;
    to: string;
}
```

#### <code v-pre>MaoGraphNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L32) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoGraphNode {
    id: string;
    agentId: string;
}
```

#### <code v-pre>MaoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L42) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

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

#### <code v-pre>MaoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L12) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

Multi-agent orchestration axis — CrewAI + AutoGen + LangGraph + supervisor pattern state machine。 Deterministic mock で 4 signal 系統。 crew assembly is role list snapshot、 supervisor delegation is deterministic round-robin、 graph transition is edge follow、 round completion is delegation count check。

```ts
export type MaoState = 'idle' | 'crew-assembled' | 'supervisor-delegated' | 'graph-transitioned' | 'round-completed';
```

#### <code v-pre>MediaSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L49) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

Image / Audio の source 表現統一。

```ts
export type MediaSource = Base64Data | UrlData;
```

#### <code v-pre>MessagePart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L80) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

MessagePart union — chat message の 1 sub-block。

```ts
export type MessagePart = TextPart | ImagePart | AudioPart;
```

#### <code v-pre>MessageRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L14) <code v-pre>packages/ai-llm/src/types.ts</code>

Chat message role — 4 SDK 全てで共通。

```ts
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
```

#### <code v-pre>MockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L114) <code v-pre>packages/ai-llm/src/types.ts</code>

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
    costPer1kTokens?: {
        prompt: number;
        completion: number;
    };
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

#### <code v-pre>MockResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L142) <code v-pre>packages/ai-llm/src/types.ts</code>

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

#### <code v-pre>MockTranscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L87) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

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

#### <code v-pre>ModelPrice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L13) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Model-priced token cost lookup, shared across dogfood real adapters so one place tracks vendor pricing rather than each adapter hardcoding a single-model rate. Prices are USD per 1M tokens (the unit vendors publish); `costForTokens` converts to per-request USD given raw `input_tokens` + `output_tokens`. Prices refreshed 2026-07; when Anthropic / OpenAI publish new rates, update the table here — real adapters look up by model name and stay accurate without file-level edits.

```ts
export interface ModelPrice {
    /** USD per 1M input tokens (also called "prompt tokens"). */
    inputPerMillion: number;
    /** USD per 1M output tokens (also called "completion tokens"). */
    outputPerMillion: number;
}
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/types.ts#L55) <code v-pre>packages/ai-llm/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'injection.direct_detected' | 'injection.indirect_detected' | 'injection.jailbreak_blocked' | 'injection.role_hijacking_blocked' | 'injection.xml_detected' | 'hallucination.self_consistency_scored' | 'hallucination.factuality_checked' | 'hallucination.citation_verified' | 'hallucination.confidence_scored' | 'eval.judge_scored' | 'eval.rubric_applied' | 'eval.preference_ranked' | 'eval.elo_updated' | 'guardrail.schema_validated' | 'guardrail.regex_matched' | 'guardrail.toxicity_blocked' | 'guardrail.pii_redacted' | 'guardrail.constitutional_checked' | 'rag.chunked' | 'rag.hybrid_retrieved' | 'rag.reranked' | 'rag.compressed' | 'agent.react_stepped' | 'agent.tot_expanded' | 'agent.reflected' | 'agent.tool_selected' | 'ft.sft_evaluated' | 'ft.dpo_evaluated' | 'ft.catastrophic_forgetting_detected' | 'ft.benchmark_drift_detected' | 'sla.budget_checked' | 'sla.latency_measured' | 'sla.model_routed' | 'sla.fallback_engaged' | 'mao.crew_assembled' | 'mao.supervisor_delegated' | 'mao.graph_transitioned' | 'mao.round_completed' | 'swarm.roles_assigned' | 'swarm.tasks_allocated' | 'swarm.consensus_reached' | 'swarm.byzantine_tolerated' | 'ci.sandbox_started' | 'ci.code_executed' | 'ci.tool_used' | 'ci.rolled_back' | 'ftp.dataset_prepared' | 'ftp.rlhf_stepped' | 'ftp.eval_loop_ran' | 'ftp.drift_detected' | 'ops.registry_updated' | 'ops.rollout_advanced' | 'ops.ab_evaluated' | 'ops.canary_promoted' | 'ops.shadow_compared' | 'pea.chain_of_thought_expanded' | 'pea.few_shot_selected' | 'pea.cached' | 'pea.version_pinned' | 'rag3.graph_traversed' | 'rag3.agentic_stepped' | 'rag3.self_queried' | 'rag3.parent_expanded' | 'co.batch_submitted' | 'co.prompt_compressed' | 'co.cascade_stepped' | 'co.semantic_cached';
```

#### <code v-pre>OpenAiChatCompletionsRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L46) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export interface OpenAiChatCompletionsRequest {
    model?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: string | OpenAiContentPart[] | null;
        tool_calls?: Array<{
            id: string;
            type: 'function';
            function: {
                name: string;
                arguments: string;
            };
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

#### <code v-pre>OpenAiChatCompletionsResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L72) <code v-pre>packages/ai-llm/src/openai.ts</code>

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
                function: {
                    name: string;
                    arguments: string;
                };
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

#### <code v-pre>OpenAiContentPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L26) <code v-pre>packages/ai-llm/src/openai.ts</code>

OpenAI vision / audio content part (v0.2、 real Chat Completions vision + gpt-4o audio input 準拠)。

```ts
export type OpenAiContentPart = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        /** `data:image/jpeg;base64,{...}` or `https://...`。 */
        url: string;
        /** OpenAI vision resolution hint。 */
        detail?: 'low' | 'high' | 'auto';
    };
} | {
    type: 'input_audio';
    input_audio: {
        data: string;
        /** `wav` / `mp3` 等。 */
        format: string;
    };
};
```

#### <code v-pre>OpenAiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L158) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export interface OpenAiMock extends AiLlmMock {
    readonly sdk: 'openai';
    chat: {
        completions: {
            create(req: OpenAiChatCompletionsRequest): Promise<OpenAiChatCompletionsResponse> | AsyncIterable<OpenAiStreamChunk>;
        };
    };
    /** Whisper audio transcription mock (v0.2)。 */
    audio: {
        transcriptions: {
            create(req: OpenAiTranscriptionRequest): Promise<OpenAiTranscriptionJson | OpenAiTranscriptionVerboseJson>;
        };
    };
    /**
     * kiwa 統一 API — audio → transcription を SDK 表面と別に露出。
     * fidelity harness / non-OpenAI 経路から呼びやすくする。
     */
    transcribeAudio(source: {
        kind: 'base64' | 'url';
        data?: string;
        url?: string;
        mediaType?: string;
    }): Promise<TranscriptionResult>;
}
```

#### <code v-pre>OpenAiStreamChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L100) <code v-pre>packages/ai-llm/src/openai.ts</code>

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
                function?: {
                    name?: string;
                    arguments?: string;
                };
            }>;
        };
        finish_reason: 'stop' | 'tool_calls' | null;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    _kiwa?: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>OpenAiTranscriptionJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L140) <code v-pre>packages/ai-llm/src/openai.ts</code>

Whisper transcription response (`json` 相当)。

```ts
export interface OpenAiTranscriptionJson {
    text: string;
    /** kiwa 拡張。 */
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>OpenAiTranscriptionRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L130) <code v-pre>packages/ai-llm/src/openai.ts</code>

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

#### <code v-pre>OpenAiTranscriptionVerboseJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L147) <code v-pre>packages/ai-llm/src/openai.ts</code>

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

#### <code v-pre>OpsAbResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L27) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export interface OpsAbResult {
    variant: string;
    score: number;
    samples: number;
}
```

#### <code v-pre>OpsModelEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L21) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export interface OpsModelEntry {
    version: string;
    createdAtMs: number;
    active: boolean;
}
```

#### <code v-pre>OpsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L33) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

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

#### <code v-pre>OpsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L13) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

LLM ops axis — model registry + rollout + A/B + canary + shadow state machine。 Deterministic mock で 5 signal 系統。 registry updates append versioned entries、 rollout tracks percentage advancement、 A/B computes winner by mean score、 canary promotion is threshold check、 shadow comparison computes delta。

```ts
export type OpsState = 'idle' | 'registry-updated' | 'rollout-advanced' | 'ab-evaluated' | 'canary-promoted' | 'shadow-compared';
```

#### <code v-pre>PeaCacheEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L31) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface PeaCacheEntry {
    key: string;
    value: string;
    hits: number;
}
```

#### <code v-pre>PeaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L37) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

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

#### <code v-pre>PeaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L12) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

Prompt engineering advanced axis — chain-of-thought + few-shot + caching + versioning state machine。 Deterministic mock で 4 signal 系統。 CoT expands stepwise reasoning、 few-shot picks k best by score、 caching uses deterministic key hash、 versioning pins semver + hash pair。

```ts
export type PeaState = 'idle' | 'chain-of-thought-expanded' | 'few-shot-selected' | 'cached' | 'version-pinned';
```

#### <code v-pre>PriceLookupResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L54) <code v-pre>packages/ai-llm/src/pricing.ts</code>

```ts
export interface PriceLookupResult {
    price: ModelPrice;
    /** True when the caller passed a model not in the table — cost was still computed via fallback. */
    wasFallback: boolean;
    /** Model name the price was looked up under (post-alias resolution). */
    resolvedModel: string;
}
```

#### <code v-pre>Rag3Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L43) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

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

#### <code v-pre>Rag3State</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L13) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

RAG III axis — GraphRAG + agentic + self-querying + parent document state machine。 Deterministic mock で 4 signal 系統。 graph traversal follows entity edges with BFS、 agentic RAG step decides fetch vs answer via score gate、 self-querying converts NL to filter predicate deterministically、 parent document expansion returns full doc from chunk id lookup。

```ts
export type Rag3State = 'idle' | 'graph-traversed' | 'agentic-stepped' | 'self-queried' | 'parent-expanded';
```

#### <code v-pre>RagAgenticStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L31) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagAgenticStep {
    index: number;
    action: 'fetch' | 'answer';
    reason: string;
}
```

#### <code v-pre>RagGraphEdge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L25) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagGraphEdge {
    from: string;
    to: string;
    weight: number;
}
```

#### <code v-pre>RagGraphNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L20) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagGraphNode {
    id: string;
    label: string;
}
```

#### <code v-pre>RagParentDoc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L37) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagParentDoc {
    id: string;
    content: string;
    chunkIds: string[];
}
```

#### <code v-pre>RagSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L15) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export interface RagSession {
    target: AiLlmTarget;
    sessionId: string;
    state: RagState;
    history: AxisStep<RagState>[];
    chunks: Array<{
        id: string;
        text: string;
    }>;
}
```

#### <code v-pre>RagState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L8) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

RAG advanced axis — chunking + hybrid retrieval + reranking + citation + context compression state machine。 deterministic mock で 5 signal 系統。

```ts
export type RagState = 'idle' | 'chunked' | 'hybrid-retrieved' | 'reranked' | 'compressed';
```

#### <code v-pre>ReactStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L24) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface ReactStep {
    index: number;
    thought: string;
    action: {
        tool: string;
        input: string;
    };
    observation: string;
}
```

#### <code v-pre>RealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L112) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export interface RealDriverConfig {
    backend: LlmBackend;
    endpoint: string;
    apiKey: string | null;
    timeoutMs: number;
    budget: BudgetGuardConfig;
}
```

#### <code v-pre>Reflection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L38) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface Reflection {
    cycle: number;
    critique: string;
    revised: string;
}
```

#### <code v-pre>RerankedHit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L30) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export interface RerankedHit extends RetrievalHit {
    rerankScore: number;
}
```

#### <code v-pre>RetrievalHit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L23) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export interface RetrievalHit {
    id: string;
    text: string;
    score: number;
    source: 'dense' | 'sparse';
}
```

#### <code v-pre>RoutingCandidate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L32) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export interface RoutingCandidate {
    model: string;
    costPerCall: number;
    latencyMs: number;
    qualityScore: number;
}
```

#### <code v-pre>RubricCriterion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L29) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export interface RubricCriterion {
    key: string;
    weight: number;
    score: number;
}
```

#### <code v-pre>SftSample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L23) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface SftSample {
    prompt: string;
    gold: string;
    candidate: string;
}
```

#### <code v-pre>SimpleSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L32) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface SimpleSchema {
    type: 'object';
    properties: Record<string, SimpleSchemaProperty>;
    required?: string[];
}
```

#### <code v-pre>SimpleSchemaProperty</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L23) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

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

#### <code v-pre>SlaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L18) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

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

#### <code v-pre>SlaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L11) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

Cost / latency SLA axis — budget + p50/p99 + model routing + fallback ladder state machine。 deterministic mock で 4 signal 系統。 Budget guard は real driver 経路 (KIWA_MODE=real) で $ 上限を強制する SSOT。 mock 経路でも 4 SDK 全部に同じ SLA API を提供する。

```ts
export type SlaState = 'idle' | 'budget-checked' | 'latency-measured' | 'model-routed' | 'fallback-engaged';
```

#### <code v-pre>StreamEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L91) <code v-pre>packages/ai-llm/src/types.ts</code>

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

#### <code v-pre>SwarmAgent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L19) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmAgent {
    id: string;
    role: string;
    reliability: number;
}
```

#### <code v-pre>SwarmSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L36) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

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

#### <code v-pre>SwarmState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L12) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

Agent swarm axis — role-based + task allocation + consensus + Byzantine fault tolerance state machine。 Deterministic mock で 4 signal 系統。 roles assign by index modulo、 tasks allocated by round robin、 consensus via majority vote、 Byzantine fault tolerance via &gt; 2/3 honest agreement (PBFT-lite invariant)。

```ts
export type SwarmState = 'idle' | 'roles-assigned' | 'tasks-allocated' | 'consensus-reached' | 'byzantine-tolerated';
```

#### <code v-pre>SwarmTask</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L25) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmTask {
    id: string;
    assignee: string;
    priority: number;
}
```

#### <code v-pre>SwarmVote</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L31) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmVote {
    agentId: string;
    proposal: string;
}
```

#### <code v-pre>TextPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L52) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

text-only 分岐 (parts 混在時の従来 text 表現)。

```ts
export interface TextPart {
    type: 'text';
    text: string;
}
```

#### <code v-pre>ToolCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L63) <code v-pre>packages/ai-llm/src/types.ts</code>

Assistant が生成する tool_use / function_call の統一表現。

```ts
export interface ToolCall {
    id: string;
    name: string;
    /** arguments は JSON.stringify 済の文字列で保持する。 */
    arguments: string;
}
```

#### <code v-pre>ToolCandidate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L44) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface ToolCandidate {
    name: string;
    description: string;
    score: number;
}
```

#### <code v-pre>ToolDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L51) <code v-pre>packages/ai-llm/src/types.ts</code>

Tool 定義 — 4 SDK で shape が違うため、 本 harness では JSON Schema ベースの共通形式で保持する。

```ts
export interface ToolDefinition {
    name: string;
    description: string;
    /** JSON Schema (subset)。 */
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description?: string;
        }>;
        required?: string[];
    };
}
```

#### <code v-pre>ToTNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L31) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface ToTNode {
    id: string;
    thought: string;
    score: number;
    children: ToTNode[];
}
```

#### <code v-pre>TranscriptionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L102) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

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

#### <code v-pre>UrlData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L43) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

URL 参照、 4 SDK 全部で fetch 経路がある。

```ts
export interface UrlData {
    kind: 'url';
    url: string;
}
```

#### <code v-pre>Usage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L71) <code v-pre>packages/ai-llm/src/types.ts</code>

LLM 呼出の token 使用量。

```ts
export interface Usage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
```

#### <code v-pre>VercelAiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L91) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelAiMock extends AiLlmMock {
    readonly sdk: 'vercel-ai';
    generateText(req: VercelAiRequest): Promise<VercelGenerateTextResult>;
    streamText(req: VercelAiRequest): VercelStreamTextResult;
}
```

#### <code v-pre>VercelAiRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L44) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelAiRequest {
    messages: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: string | VercelContentPart[];
    }>;
    system?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: Record<string, {
        description: string;
        parameters: Record<string, unknown>;
    }>;
}
```

#### <code v-pre>VercelContentPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L28) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

Vercel AI SDK v3+ multimodal content part (v0.2、 real SDK 準拠)。 SDK は `content: string` + `content: Array&lt;{type:'text'|'image', ...}&gt;` の 両方を受け入れる。 image は URL string or Uint8Array or base64 string。

```ts
export type VercelContentPart = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    /** URL string or base64 string or data URI。 mock は URL / base64 のみ扱う。 */
    image: string;
    /** mediaType hint。 */
    mimeType?: string;
} | {
    type: 'file';
    /** audio / image / pdf 汎用 file (Vercel AI v4)、 mock は audio として扱う。 */
    data: string;
    mimeType: string;
};
```

#### <code v-pre>VercelGenerateTextResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L61) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

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

#### <code v-pre>VercelStreamTextResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L80) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelStreamTextResult {
    /** 逐次 text chunk を送出する async iterable。 */
    textStream: AsyncIterable<string>;
    /** 全 stream 完了後の最終 text (resolve 順は SDK と同じで stream 後)。 */
    text: Promise<string>;
    /** stream 完了後 resolve される usage。 */
    usage: Promise<VercelGenerateTextResult['usage']>;
    finishReason: Promise<VercelGenerateTextResult['finishReason']>;
    _kiwa: Promise<{
        costUsd: number;
        latencyMs: number;
    }>;
}
```
<!-- kiwa-public-api:end -->
