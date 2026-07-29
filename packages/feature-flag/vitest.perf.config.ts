import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 測定は 1 file ずつ走らせる。 vitest の既定は file 並列で、
    // 同じ package の perf file 同士が CPU を奪い合うと p95 が実装ではなく
    // 機械の負荷で動く。 file ごとの隔離は保ったまま同時実行だけを止める。
    fileParallelism: false,
    // 測定の中断は「遅い」 ではなく「測れていない」。 既定の 5s では
    // 3 層測定が終わらない package があり、 判定そのものが出なくなる。
    testTimeout: 120_000,

    // メモリ保持量の測定は計測前後に GC を走らせて一時使用を除く。
    // 渡さないと GC のタイミング次第で判定が入れ替わる。
    // worker_threads は execArgv を受け付けないため forks に固定する。
    pool: 'forks',
    poolOptions: {
      forks: { execArgv: ['--expose-gc'] },
    },
    include: ['tests/perf/**/*.perf.ts'],
  },
});
