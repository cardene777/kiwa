import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 測定は 1 file ずつ走らせる。 vitest の既定は file 並列で、
    // 同じ package の perf file 同士が CPU を奪い合うと p95 が実装ではなく
    // 機械の負荷で動く。 file ごとの隔離は保ったまま同時実行だけを止める。
    fileParallelism: false,

    include: ['tests/perf/**/*.perf.ts'],
    testTimeout: 120_000,
  },
});
