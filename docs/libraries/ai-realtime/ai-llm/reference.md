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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [anthropic.ts](./api/anthropic) | 1 | 5 |
| [engine.ts](./api/engine) | 1 | 0 |
| [fidelity.ts](./api/fidelity) | 2 | 3 |
| [langchain.ts](./api/langchain) | 1 | 5 |
| [multimodal.ts](./api/multimodal) | 6 | 9 |
| [openai.ts](./api/openai) | 1 | 8 |
| [pricing.ts](./api/pricing) | 4 | 2 |
| [report.ts](./api/report) | 2 | 1 |
| [sampling.ts](./api/sampling) | 3 | 0 |
| [semantics/agent-orchestration.ts](./api/semantics__agent-orchestration) | 5 | 6 |
| [semantics/agent-swarm.ts](./api/semantics__agent-swarm) | 5 | 5 |
| [semantics/code-interpreter.ts](./api/semantics__code-interpreter) | 5 | 4 |
| [semantics/cost-latency-sla.ts](./api/semantics__cost-latency-sla) | 5 | 4 |
| [semantics/cost-optimization.ts](./api/semantics__cost-optimization) | 5 | 2 |
| [semantics/fidelity.ts](./api/semantics__fidelity) | 2 | 2 |
| [semantics/fine-tuning-eval.ts](./api/semantics__fine-tuning-eval) | 5 | 5 |
| [semantics/fine-tuning-pipeline.ts](./api/semantics__fine-tuning-pipeline) | 5 | 5 |
| [semantics/guardrails.ts](./api/semantics__guardrails) | 6 | 5 |
| [semantics/hallucination.ts](./api/semantics__hallucination) | 5 | 2 |
| [semantics/llm-eval.ts](./api/semantics__llm-eval) | 5 | 4 |
| [semantics/llm-ops.ts](./api/semantics__llm-ops) | 6 | 4 |
| [semantics/multi-agent-orchestration.ts](./api/semantics__multi-agent-orchestration) | 5 | 6 |
| [semantics/prompt-engineering-advanced.ts](./api/semantics__prompt-engineering-advanced) | 5 | 5 |
| [semantics/prompt-injection.ts](./api/semantics__prompt-injection) | 6 | 4 |
| [semantics/rag-advanced.ts](./api/semantics__rag-advanced) | 5 | 4 |
| [semantics/rag-iii.ts](./api/semantics__rag-iii) | 5 | 6 |
| [semantics/real-driver.ts](./api/semantics__real-driver) | 9 | 3 |
| [semantics/types.ts](./api/semantics__types) | 1 | 4 |
| [types.ts](./api/types) | 0 | 11 |
| [vercel-ai.ts](./api/vercel-ai) | 1 | 5 |

<!-- kiwa-public-api:end -->
