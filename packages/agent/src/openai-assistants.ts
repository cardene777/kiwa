import type {
  Assistant,
  AssistantHandler,
  AssistantHandlerResult,
  Run,
  RunStatus,
  Thread,
  ThreadMessage,
  ThreadMessageRole,
  ToolCall,
  ToolOutput,
} from './types.js';

/**
 * OpenAI Assistants v2 mock — real Assistants v2 API (openai.beta.assistants /
 * openai.beta.threads / openai.beta.threads.runs) の client 表面を kiwa test で
 * 再現するための in-process mock。 real API と同じ SSOT 用語 (Assistant / Thread /
 * Message / Run) を採用、 run status transition (queued → in_progress →
 * completed / failed / requires_action) を deterministic に model する。
 *
 * ### 対応 op (v0.1 対象)
 *
 * | op | 対応 |
 * |---|---|
 * | createAssistant | Assistant resource + id を発行 |
 * | createThread | Thread resource + id を発行、 初期 messages 受入れ可 |
 * | addMessage | 既存 Thread に user role message を append |
 * | createRun | Thread + Assistant を紐付けて Run resource (queued) を発行 |
 * | run.poll (retrieveRun) | 1 tick 進行、 status を deterministic に遷移 |
 * | submitToolOutputs | requires_action 中の Run に tool 実行結果を差し込む |
 * | cancel | in_progress / queued の Run を強制 cancelled 相当 (failed) にする |
 *
 * ### run status transition
 *
 * 1. `createRun()` → status = **queued**
 * 2. 1 回目の `poll()` → assistant handler を呼び、 結果が
 *    - `{ kind: 'message' }` → status = **completed**、 message を thread に append
 *    - `{ kind: 'tool_calls' }` → status = **requires_action**、 pending tool_calls を保持
 *    - handler が throw → status = **failed**、 lastError を set
 * 3. **requires_action** 中に `submitToolOutputs()` → status = **queued** に戻り、
 *    次の `poll()` で handler が再度呼ばれる (context.toolOutputs で結果参照可能)。
 *
 * ### 未対応 (v0.2 以降)
 *
 * - Vector store / file_search / code_interpreter tool
 * - streaming (SSE) run event
 * - `assistant_message` の中間 tool_calls (real API では 1 run で複数 message が append される)、
 *   v0.1 は 1 run = 1 assistant message として単純化
 */

/** AssistantsClient config。 handler は必須 (registerHandler で後付けも可)。 */
export interface AssistantsClientConfig {
  /** id 生成の deterministic 化用 seed prefix (test の snapshot 用)、 default random。 */
  idSeed?: string;
}

/**
 * Assistants v2 client mock — real openai.beta.assistants の thin wrapper API。
 * assistant / thread / run resource を in-memory Map で保持、 id は seed 付き
 * incrementing で generate する。
 */
export class AssistantsClient {
  private readonly assistants = new Map<string, Assistant>();
  private readonly threads = new Map<string, Thread>();
  private readonly runs = new Map<string, Run>();
  private readonly handlers = new Map<string, AssistantHandler>();
  private nextId = 1;
  private readonly idSeed: string;

  constructor(config: AssistantsClientConfig = {}) {
    this.idSeed = config.idSeed ?? 'kiwa';
  }

  // ---- Assistant CRUD ------------------------------------------------

  /**
   * Assistant resource を発行。 real API と同じく id + name + instructions を持つ。
   * handler は必須ではないが、 createRun() までに registerHandler() で紐付け必要。
   */
  createAssistant(params: { name: string; instructions: string; handler?: AssistantHandler }): Assistant {
    const id = this.mintId('asst');
    const assistant: Assistant = {
      id,
      name: params.name,
      instructions: params.instructions,
      createdAt: Date.now(),
    };
    this.assistants.set(id, assistant);
    if (params.handler) {
      this.handlers.set(id, params.handler);
    }
    return assistant;
  }

  /**
   * assistant に handler を後付け登録。 test で「先に assistant を作って後で handler
   * を差し替える」 シナリオ (behavior injection) 用。
   */
  registerHandler(assistantId: string, handler: AssistantHandler): void {
    if (!this.assistants.has(assistantId)) {
      throw new Error(`unknown assistant id: ${assistantId}`);
    }
    this.handlers.set(assistantId, handler);
  }

  /** assistant 参照 (test / debug 用)。 */
  getAssistant(id: string): Assistant | undefined {
    return this.assistants.get(id);
  }

  // ---- Thread CRUD ---------------------------------------------------

  /**
   * Thread resource を発行。 初期 messages を渡すと user message として append される
   * (real API と同じ挙動)。
   */
  createThread(params: { messages?: Array<{ role: ThreadMessageRole; content: string }> } = {}): Thread {
    const id = this.mintId('thread');
    const thread: Thread = {
      id,
      createdAt: Date.now(),
      messages: [],
    };
    this.threads.set(id, thread);
    if (params.messages) {
      for (const m of params.messages) {
        this.addMessage(id, { role: m.role, content: m.content });
      }
    }
    return thread;
  }

  /**
   * Thread に message を append。 real API と同じく role は user / assistant、
   * v0.1 は tool role 未対応 (Assistants v2 の tool message は submitToolOutputs
   * 経路に統一)。
   */
  addMessage(threadId: string, params: { role: ThreadMessageRole; content: string }): ThreadMessage {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`unknown thread id: ${threadId}`);
    }
    const message: ThreadMessage = {
      id: this.mintId('msg'),
      role: params.role,
      content: params.content,
      createdAt: Date.now(),
    };
    thread.messages.push(message);
    return message;
  }

  /** thread 参照 (test / debug 用、 messages は readonly view として返す)。 */
  getThread(id: string): Thread | undefined {
    return this.threads.get(id);
  }

  // ---- Run lifecycle -------------------------------------------------

  /**
   * Run 発行 — thread + assistant を紐付けた Run resource (queued) を返す。 実際の
   * assistant 実行は `poll(runId)` を呼び出した時に走る (real API の polling model と
   * 同構造、 real でも create 直後は queued で 1 tick 後に進行する)。
   */
  createRun(params: { threadId: string; assistantId: string }): Run {
    if (!this.threads.has(params.threadId)) {
      throw new Error(`unknown thread id: ${params.threadId}`);
    }
    if (!this.assistants.has(params.assistantId)) {
      throw new Error(`unknown assistant id: ${params.assistantId}`);
    }
    if (!this.handlers.has(params.assistantId)) {
      throw new Error(
        `assistant ${params.assistantId} has no handler registered — call registerHandler() first`,
      );
    }
    const id = this.mintId('run');
    const run: Run = {
      id,
      threadId: params.threadId,
      assistantId: params.assistantId,
      status: 'queued',
      createdAt: Date.now(),
    };
    this.runs.set(id, run);
    return run;
  }

  /**
   * poll — Run の 1 tick を進める。 real API polling は同じ retrieveRun で status
   * を確認する model、 mock は「poll 呼出 = 1 tick 進行」 と扱う。 呼出後の Run
   * (copy) を返す。 呼出前 status に応じて next status が deterministic に決まる。
   *
   * 1. queued → poll 1 回目で handler 呼出、 result に応じて completed / requires_action / failed
   * 2. in_progress → poll 呼出でも遷移しない (v0.1 は 1 tick = 1 handler 呼出 model、
   *    in_progress は queued → completed の間の transient state として使用しない)、
   *    そのまま返す。 実質 queued と completed / requires_action / failed の 3 状態が
   *    caller に見える。
   * 3. requires_action → poll でも遷移しない (submitToolOutputs 待ち)
   * 4. completed / failed → 変化なし、 そのまま返す
   */
  async poll(runId: string): Promise<Run> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`unknown run id: ${runId}`);
    }
    if (run.status !== 'queued') {
      return { ...run };
    }
    return this.executeRun(run);
  }

  /**
   * pollUntilFinal — completed / failed / requires_action に到達するまで poll を
   * 繰り返す utility。 requires_action は「final ではない」 が「client 側 action 待ち」
   * なので、 これも終端扱いで返す (client 側で submitToolOutputs → 再度 pollUntilFinal
   * を呼ぶ想定)。 real API では intervalMs で backoff するが、 mock は同期実行のため
   * poll = 1 tick 進行 model で maxAttempts のみ意味を持つ。
   */
  async pollUntilFinal(runId: string, options: { maxAttempts?: number } = {}): Promise<Run> {
    const maxAttempts = options.maxAttempts ?? 20;
    let attempts = 0;
    let run = await this.poll(runId);
    while (run.status === 'queued' || run.status === 'in_progress') {
      attempts += 1;
      if (attempts > maxAttempts) {
        throw new Error(`pollUntilFinal exceeded ${maxAttempts} attempts for run ${runId}`);
      }
      run = await this.poll(runId);
    }
    return run;
  }

  /**
   * submitToolOutputs — requires_action 中の Run に tool 実行結果を差し込む。 status
   * を queued に戻し、 次 poll で handler が再度呼び出される (context.toolOutputs
   * で結果参照可能)。 real API と同じ semantic。
   */
  submitToolOutputs(runId: string, params: { toolOutputs: ToolOutput[] }): Run {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`unknown run id: ${runId}`);
    }
    if (run.status !== 'requires_action') {
      throw new Error(
        `run ${runId} is not requires_action (current: ${run.status}), cannot submit tool outputs`,
      );
    }
    // 次 poll 時に context.toolOutputs で参照するため run 内に一時保持する。
    // requiredAction を消し queued に戻す (exactOptionalPropertyTypes 準拠のため
    // property 自体を落とす)。
    const { requiredAction: _dropped, ...rest } = run;
    void _dropped;
    const updated: Run = {
      ...rest,
      status: 'queued',
    };
    this.runs.set(runId, updated);
    this.pendingToolOutputs.set(runId, params.toolOutputs);
    return { ...updated };
  }

  /**
   * cancel — queued / in_progress の Run を強制終了させる。 status は failed に倒す
   * (real API は cancelled status を持つが v0.1 は failed に統合、 lastError.code =
   * 'cancelled' で識別可能)。
   */
  cancel(runId: string): Run {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`unknown run id: ${runId}`);
    }
    if (run.status === 'completed' || run.status === 'failed') {
      return { ...run };
    }
    const { requiredAction: _dropped, ...rest } = run;
    void _dropped;
    const updated: Run = {
      ...rest,
      status: 'failed',
      failedAt: Date.now(),
      lastError: { code: 'cancelled', message: 'run cancelled by client' },
    };
    this.runs.set(runId, updated);
    return { ...updated };
  }

  /** run 参照 (test / debug 用)。 */
  getRun(id: string): Run | undefined {
    const run = this.runs.get(id);
    return run ? { ...run } : undefined;
  }

  // ---- internal helpers ----------------------------------------------

  private readonly pendingToolOutputs = new Map<string, readonly ToolOutput[]>();

  private async executeRun(run: Run): Promise<Run> {
    const thread = this.threads.get(run.threadId);
    const handler = this.handlers.get(run.assistantId);
    if (!thread || !handler) {
      // registerHandler / createThread validate 済なので defensive。
      throw new Error(`run ${run.id} references missing thread or handler`);
    }
    const toolOutputs = this.pendingToolOutputs.get(run.id);
    let result: AssistantHandlerResult;
    try {
      const ctx =
        toolOutputs !== undefined
          ? {
              thread: [...thread.messages],
              runId: run.id,
              assistantId: run.assistantId,
              toolOutputs,
            }
          : {
              thread: [...thread.messages],
              runId: run.id,
              assistantId: run.assistantId,
            };
      result = await handler(ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const updated: Run = {
        ...run,
        status: 'failed',
        failedAt: Date.now(),
        lastError: { code: 'handler_error', message },
      };
      this.runs.set(run.id, updated);
      this.pendingToolOutputs.delete(run.id);
      return { ...updated };
    }
    this.pendingToolOutputs.delete(run.id);
    if (result.kind === 'message') {
      // assistant message を thread に append。
      this.addMessage(run.threadId, { role: 'assistant', content: result.content });
      const updated: Run = {
        ...run,
        status: 'completed',
        completedAt: Date.now(),
      };
      this.runs.set(run.id, updated);
      return { ...updated };
    }
    // tool_calls 分岐 = requires_action
    const updated: Run = {
      ...run,
      status: 'requires_action',
      requiredAction: { type: 'submit_tool_outputs', toolCalls: result.toolCalls },
    };
    this.runs.set(run.id, updated);
    return { ...updated };
  }

  private mintId(kind: string): string {
    const id = `${this.idSeed}_${kind}_${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

/**
 * ToolCall builder shortcut — test で `{ id, type: 'function', function: { name, arguments: JSON } }`
 * を書くのは冗長なので helper を出す。
 */
export function toolCall(params: {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}): ToolCall {
  return {
    id: params.id,
    type: 'function',
    function: {
      name: params.name,
      arguments: JSON.stringify(params.arguments),
    },
  };
}

/** RunStatus SSOT re-export (client 側で 1 import で status literal を扱える)。 */
export type { RunStatus };
