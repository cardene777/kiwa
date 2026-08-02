/**
 * measureMemory — capture heap deltas around a target function.
 *
 * Real production concerns include memory growth per call. A p95 of 5ms is
 * useless if every call leaks 100KB of retained heap. This helper wraps a
 * target function with a global.gc() + process.memoryUsage() bracket so
 * tests can assert on `heapUsedDelta` / `rssUsedDelta` per call.
 *
 * Requires Node to be launched with `--expose-gc` for stable readings.
 * When GC is not exposed we fall back to a delta without forced GC — the
 * numbers are noisier but the trend still catches egregious leaks.
 */
export interface MemorySample {
  iterationCount: number;
  /**
   * 測定区間の前に空回しした回数。
   *
   * 空回しは測定区間の外で `fn` を呼ぶ。 副作用や件数依存を持つ op では、
   * その呼出も store の件数や cache の状態を進めるため、 同じ `iterations` でも
   * 空回しの有無で測っているものが変わる (#1730)。
   */
  warmupCount: number;
  /**
   * `fn` を呼んだ総回数 (`warmupCount + iterationCount * windowCount`)。
   *
   * 「N 反復」 とだけ報告すると、 空回しや窓を入れた実行が実際には
   * それ以上呼んでいることが読み手に伝わらない。 副作用を持つ op ではこの差が
   * そのまま測定対象の違いになるので、 実際に呼んだ回数を残す。
   */
  totalCallCount: number;
  /**
   * 測定区間を何回に分けたか (#1719)。
   *
   * 1 なら従来どおりの 1 区間。 2 以上なら最後の区間の値を代表値として返し、
   * 手前の区間は飽和させるためだけに使う。
   */
  windowCount: number;
  /**
   * 区間ごとの `arrayBuffers` 増分 (#1719)。
   *
   * 代表値 (`arrayBuffersDeltaBytes`) は最後の要素と一致する。
   * 手前の区間との差が、 その op の増分が飽和したかどうかの証跡になる。
   * 飽和していれば後ろの区間ほど 0 に近づき、 実装が反復ごとに保持していれば
   * どの区間でも同じ量が出る。
   */
  arrayBuffersDeltaByWindowBytes: number[];
  heapUsedDeltaBytes: number;
  heapUsedDeltaPerIterationBytes: number;
  rssDeltaBytes: number;
  externalDeltaBytes: number;
  arrayBuffersDeltaBytes: number;
  gcExposed: boolean;
}

export interface MemoryInput {
  fn: () => Promise<unknown> | unknown;
  iterations: number;
  /**
   * 計測区間の前に空回しする回数 (default 0)。
   *
   * 初回の呼出には 1 回きりの確保が混ざる。 Node の Buffer は 8KB の pool 単位で
   * 伸びるため、 fs を触る対象では最初の数回で pool がまとめて確保され、
   * それを反復数で割った値が「1 回あたりの保持」 として報告される。
   * 実測では暖機 3 回で 15 反復の arrayBuffers 増分が 24576B から 0B になった。
   *
   * 既定を 0 にしているのは、 published API の直接の呼出で挙動を変えないため。
   * kiwa 内部の 3 層測定は `memoryWarmup` で明示的に渡す。
   */
  warmup?: number;
  /**
   * 測定区間を何回に分けるか (default 1、 #1719)。
   *
   * 2 以上を渡すと `iterations` 回の区間をその数だけ続けて回し、
   * **最後の区間の増分だけ** を代表値として返す。 手前の区間は捨てる。
   *
   * fs を触る op では Node の Buffer pool が反復数に応じて段階的に伸びる。
   * 空回し (`warmup`) は固定回数なので、 反復数が増えるとその先で pool が
   * また伸び、 1 区間しか測らないと伸びた分が「1 回あたりの保持」 として載る。
   * 実測では `file_scaffold_workflow` の増分が同じ実装のまま
   * 118,387 から 198,899 B まで動き、 上限 102,400 B を跨いでいた (#1719)。
   *
   * 区間を分けると、 手前の区間が反復数ぶんの pool の伸びを引き受け、
   * 最後の区間には飽和後の増分だけが残る。 反復ごとに実際に保持している op は
   * どの区間でも同じ量を出すため、 検知は落ちない。
   *
   * 既定を 1 にしているのは、 published API の直接の呼出で挙動を変えないため。
   * `fn` の呼出回数が倍になるので、 副作用を持つ op では既定のまま変えない方が安全である。
   * kiwa 内部の 3 層測定は `memoryWindows` で明示的に渡す。
   */
  windows?: number;
}

export async function measureMemory(input: MemoryInput): Promise<MemorySample> {
  if (input.iterations < 1) {
    throw new Error(`measureMemory: iterations must be >= 1, got ${input.iterations}`);
  }
  // `Infinity` は空回しが終わらず、`NaN` は 0 回に潰れ、少数は暗黙に切り上がる。
  // published API の入口なので、解釈が分かれる値は受け取らずに落とす。
  const warmup = input.warmup ?? 0;
  if (!Number.isSafeInteger(warmup) || warmup < 0) {
    throw new Error(`measureMemory: warmup must be a non-negative integer, got ${warmup}`);
  }
  // 0 と少数は区間の数として意味を持たず、`Infinity` は終わらない。
  // `warmup` と同じ理由で、解釈が分かれる値は受け取らずに落とす。
  const windows = input.windows ?? 1;
  if (!Number.isSafeInteger(windows) || windows < 1) {
    throw new Error(`measureMemory: windows must be an integer >= 1, got ${windows}`);
  }

  const gcRef = (globalThis as { gc?: () => void }).gc;
  const gcExposed = typeof gcRef === 'function';

  for (let index = 0; index < warmup; index += 1) {
    await input.fn();
  }

  const arrayBuffersDeltaByWindow: number[] = [];
  // 最後の区間の値だけを代表値にする。 手前の区間は pool を飽和させるためだけに回す。
  //
  // ここの初期値は測定値ではない。 `windows >= 1` は上で確かめてあるので loop は
  // 必ず 1 周し、 この 2 つは初回の周回でどちらも上書きされる。 型の定義済み検査を
  // 通すためだけに置いてある。
  let before = process.memoryUsage();
  let after = before;

  for (let window = 0; window < windows; window += 1) {
    if (gcExposed) gcRef!();
    before = process.memoryUsage();

    for (let index = 0; index < input.iterations; index += 1) {
      await input.fn();
    }

    if (gcExposed) gcRef!();
    after = process.memoryUsage();

    arrayBuffersDeltaByWindow.push(after.arrayBuffers - before.arrayBuffers);
  }

  const heapUsedDelta = after.heapUsed - before.heapUsed;
  return {
    iterationCount: input.iterations,
    warmupCount: warmup,
    totalCallCount: warmup + input.iterations * windows,
    windowCount: windows,
    arrayBuffersDeltaByWindowBytes: arrayBuffersDeltaByWindow,
    heapUsedDeltaBytes: heapUsedDelta,
    heapUsedDeltaPerIterationBytes: heapUsedDelta / input.iterations,
    rssDeltaBytes: after.rss - before.rss,
    externalDeltaBytes: after.external - before.external,
    arrayBuffersDeltaBytes: after.arrayBuffers - before.arrayBuffers,
    gcExposed,
  };
}
