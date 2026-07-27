import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // メモリ保持量の測定は計測前後に GC を走らせて一時使用を除く。
    // 渡さないと GC のタイミング次第で判定が入れ替わる。
    // worker_threads は execArgv を受け付けないため forks に固定する。
    pool: 'forks',
    poolOptions: {
      forks: { execArgv: ['--expose-gc'] },
    },
    include: ['tests/perf/**/*.perf.ts'],
    environment: 'jsdom',
  },
});
