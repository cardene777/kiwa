/**
 * `@kiwa-lab/skill-test` — Skill 発火 assertion primitive。
 *
 * # 用途
 *
 * kiwa の agent / mcp / cli / assistant 系 lib が実装する skill / tool 呼出 logic に対して、
 * 「想定 tool が実際に呼ばれたか」 「順序」 「回数」 「引数」 を behavior test で検証する
 * 経路 SSOT。 test-taxonomy.md § skill 準拠。
 *
 * # 使い方 (基本 flow)
 *
 * ```ts
 * import { createToolSpy, assertToolCalled, assertToolCallOrder } from '@kiwa-lab/skill-test';
 *
 * const spy = createToolSpy();
 *
 * // 対象 lib の tool 呼出 interceptor に spy を注入する経路
 * const agent = createAgent({ onToolCall: (name, args) => spy.record(name, args) });
 * await agent.run('do the thing');
 *
 * assertToolCalled(spy, 'Read');
 * assertToolCallOrder(spy, ['Read', 'Bash']);
 * ```
 *
 * # 設計方針
 *
 * - **spy = 蓄積のみ**、 assertion は別 primitive 経由。 test 側で自由に組合せる。
 * - **assertion は throw**、 vitest の `expect` と同じ contract (test body で自然に fail する)。
 * - **順序 / 回数 / 引数 は独立**。 「呼ばれたか」 だけの緩い test も、 「順序まで」 の厳密 test も
 *   同じ spy に対して重ねられる。
 * - **agent / tool 型に非依存**。 tool 名 + 引数 JSON string の 2 要素だけで抽象化、 OpenAI 形式
 *   の tool_calls / MCP tools / CLI arg parser など任意 skill 実装に配線できる。
 */

export interface ToolCallRecord {
  /** 呼ばれた tool 名 (例 'Read' / 'Bash' / 'search_docs')。 */
  name: string;
  /**
   * 引数の JSON string。 OpenAI 形式の `tool_calls[].function.arguments` に整合。
   * 型付き引数は caller 側で `JSON.parse(rec.arguments)` してから assertion する。
   */
  arguments: string;
  /**
   * insertion order を保持する連番 (0 起点)。 Date.now() を使わない理由 = test 実行内で
   * 同 ms に複数 tool が呼ばれると順序 assertion が壊れるため、 spy 内 counter で単調保証する。
   */
  order: number;
}

export interface ToolSpy {
  /** 呼出を記録する。 skill/agent 実装の tool 呼出 interceptor から呼ぶ。 */
  record(name: string, argumentsJson: string): void;
  /** これまでの全 tool 呼出。 */
  getCalls(): ToolCallRecord[];
  /** 指定 tool 名に一致する呼出のみ。 */
  getCallsFor(toolName: string): ToolCallRecord[];
  /** 呼出 counter を 0 に戻す (test 間で spy を使い回す時)。 */
  reset(): void;
}

/** 新規 tool spy を作成する。 各 test で fresh spy を使うのが基本。 */
export function createToolSpy(): ToolSpy {
  const calls: ToolCallRecord[] = [];
  return {
    record(name, argumentsJson) {
      calls.push({ name, arguments: argumentsJson, order: calls.length });
    },
    getCalls() {
      return [...calls];
    },
    getCallsFor(toolName) {
      return calls.filter((call) => call.name === toolName);
    },
    reset() {
      calls.length = 0;
    },
  };
}

/**
 * 指定 tool が **少なくとも 1 回** 呼ばれたことを assertion する。 `opts.times` を渡した
 * 場合はその回数と厳密一致を要求する。
 *
 * @throws 呼ばれてないとき、 or `times` 指定時に回数不一致のとき
 */
export function assertToolCalled(
  spy: ToolSpy,
  toolName: string,
  opts?: { times?: number },
): void {
  const matches = spy.getCallsFor(toolName);
  if (opts?.times !== undefined) {
    if (matches.length !== opts.times) {
      throw new Error(
        `assertToolCalled: expected tool "${toolName}" to be called ${opts.times} time(s), observed ${matches.length}. actual calls = [${describeCalls(spy)}]`,
      );
    }
    return;
  }
  if (matches.length === 0) {
    throw new Error(
      `assertToolCalled: expected tool "${toolName}" to be called at least once, but it was never invoked. actual calls = [${describeCalls(spy)}]`,
    );
  }
}

/**
 * 指定 tool が **一度も呼ばれてない** ことを assertion する。 negative test 用。
 *
 * @throws 1 回でも呼ばれているとき
 */
export function assertToolNotCalled(spy: ToolSpy, toolName: string): void {
  const matches = spy.getCallsFor(toolName);
  if (matches.length > 0) {
    throw new Error(
      `assertToolNotCalled: expected tool "${toolName}" to be never called, but it was invoked ${matches.length} time(s). actual calls = [${describeCalls(spy)}]`,
    );
  }
}

/**
 * 指定 tool が **想定引数で呼ばれたか** を assertion する。 引数一致は
 * `JSON.parse(record.arguments)` と `expectedArgs` を deepStrictEqual で比較する。
 *
 * 「呼ばれた + そのうち 1 回でも引数一致」 で pass、 全呼出の引数一致は要求しない。
 * 「全呼出で同引数」 を要求したければ caller 側で loop する。
 *
 * @throws tool 未呼出、 or 全呼出で引数不一致
 */
export function assertToolCalledWith(
  spy: ToolSpy,
  toolName: string,
  expectedArgs: unknown,
): void {
  const matches = spy.getCallsFor(toolName);
  if (matches.length === 0) {
    throw new Error(
      `assertToolCalledWith: tool "${toolName}" was never called (expected args ${JSON.stringify(expectedArgs)}). actual calls = [${describeCalls(spy)}]`,
    );
  }
  for (const match of matches) {
    const parsed = safeParse(match.arguments);
    if (deepEquals(parsed, expectedArgs)) return;
  }
  const observed = matches
    .map((match) => match.arguments)
    .join(' | ');
  throw new Error(
    `assertToolCalledWith: tool "${toolName}" was called ${matches.length} time(s) but no call matched expected args ${JSON.stringify(expectedArgs)}. observed args = [${observed}]`,
  );
}

/**
 * tool 呼出の **順序** を assertion する。 `expectedOrder` に列挙した tool 名が、
 * spy に記録された順序と subsequence として一致することを要求する (間に他 tool 挟むのは可)。
 *
 * 「厳密同順」 (間に他 tool 混入も許さない) を要求したい場合は
 * `spy.getCalls().map(c => c.name)` を直接 assert する。
 *
 * @throws expectedOrder が subsequence として現れないとき
 */
export function assertToolCallOrder(spy: ToolSpy, expectedOrder: string[]): void {
  const actualNames = spy.getCalls().map((call) => call.name);
  let cursor = 0;
  for (const name of actualNames) {
    if (name === expectedOrder[cursor]) cursor += 1;
    if (cursor === expectedOrder.length) return;
  }
  if (cursor < expectedOrder.length) {
    throw new Error(
      `assertToolCallOrder: expected order ${JSON.stringify(expectedOrder)} not found as subsequence in actual calls ${JSON.stringify(actualNames)}. matched up to index ${cursor}.`,
    );
  }
}

// === 内部 helper ===

function describeCalls(spy: ToolSpy): string {
  return spy
    .getCalls()
    .map((call) => `${call.name}(${call.arguments})`)
    .join(', ');
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    // JSON でない場合 (CLI arg 等) は raw string として返す。
    return json;
  }
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!deepEquals(aObj[key], bObj[key])) return false;
  }
  return true;
}
