/**
 * #1719 — memory 軸に実行内正規化が効くかを測る。
 *
 * `docs/quality/perf-thresholds.md` § Memory delta target が記録しているのは 2 点。
 * `arrayBuffers` は JS heap 側の保持を見ない。 `heapUsed` は sweep 内で 41/492 op が
 * 上限を超える幅で動き、 18 op が上限の左右を跨ぐ。
 *
 * 未検証なのは、 #1737 が時間軸で効かせた「同じ実行の中で基準 op と交互に測り、
 * 差を取る」 経路。 doc は「軸は他に何が走っているかで動く」 と書いており、 これは
 * 実行全体に乗る外乱なので、 同じ実行の中で測った基準を引けば相殺できる可能性がある。
 *
 * 時間軸との違いは、 外乱の乗り方。 CPU 速度は比で効くので #1737 は比を取ったが、
 * 保持量は確保器の振舞いが加算で乗ると考えられるので差を取る。 両方を測って比べる。
 *
 * 実行 = node packages/perf-harness/scripts/memory-inrun-probe.mjs
 *        PROBE_LOAD=1 を付けると負荷を掛けながら測る
 */
import { execFileSync, spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ITERATIONS = 15;
const WARMUP = 3;
const PASSES = 6;

// ---- 子 process 側 ------------------------------------------------------

if (process.env['PROBE_CHILD'] === '1') {
  const { setupCliEnv } = await import('../../cli-test/dist/index.js');

  const settle = async () => {
    for (let i = 0; i < 3; i += 1) {
      globalThis.gc();
      await new Promise((r) => setImmediate(r));
    }
  };

  /** 測る対象。 fs を多く触る。 */
  const target = async () => {
    const env = await setupCliEnv();
    for (let i = 0; i < 20; i += 1) await env.writeFile(`f-${i}.txt`, `c-${i}`);
    await env.listFiles();
    await env.stop();
  };

  /**
   * harness が持つ基準。 対象と同じ邪魔 (確保器の pool の伸び) を受けるように
   * fs を触るが、 何も保持しない。
   */
  const reference = async () => {
    const env = await setupCliEnv();
    for (let i = 0; i < 20; i += 1) await env.writeFile(`r-${i}.txt`, `c-${i}`);
    await env.stop();
  };

  async function bracket(fn) {
    await settle();
    const before = process.memoryUsage();
    for (let i = 0; i < ITERATIONS; i += 1) await fn();
    await settle();
    const after = process.memoryUsage();
    return {
      arrayBuffers: after.arrayBuffers - before.arrayBuffers,
      heapUsed: after.heapUsed - before.heapUsed,
    };
  }

  for (let i = 0; i < WARMUP; i += 1) await target();
  for (let i = 0; i < WARMUP; i += 1) await reference();

  // 交互に測る。 片方を先にまとめて測ると、 実行の前半と後半で条件が変わる。
  const t1 = await bracket(target);
  const r1 = await bracket(reference);
  const r2 = await bracket(reference);
  const t2 = await bracket(target);

  const avg = (a, b, key) => (a[key] + b[key]) / 2;
  process.stdout.write(JSON.stringify({
    targetArrayBuffers: avg(t1, t2, 'arrayBuffers'),
    referenceArrayBuffers: avg(r1, r2, 'arrayBuffers'),
    targetHeapUsed: avg(t1, t2, 'heapUsed'),
    referenceHeapUsed: avg(r1, r2, 'heapUsed'),
  }));
  process.exit(0);
}

// ---- 親 process 側 ------------------------------------------------------

function measureOnce() {
  const out = execFileSync(process.execPath, ['--expose-gc', SELF], {
    env: { ...process.env, PROBE_CHILD: '1' },
    encoding: 'utf8',
  });
  return JSON.parse(out);
}

/** 機械を埋める。 doc が言う「他に何が走っているか」 を作る。 */
function startLoad() {
  const workers = [];
  for (let i = 0; i < Math.max(1, cpus().length - 1); i += 1) {
    workers.push(spawn(process.execPath, ['-e', `
      const t = Date.now();
      const buffers = [];
      while (Date.now() - t < 600000) {
        buffers.push(Buffer.alloc(1024 * 64));
        if (buffers.length > 200) buffers.length = 0;
      }
    `], { stdio: 'ignore' }));
  }
  return () => workers.forEach((w) => w.kill('SIGKILL'));
}

function spread(values) {
  return Math.max(...values) - Math.min(...values);
}

const stopLoad = process.env['PROBE_LOAD'] === '1' ? startLoad() : null;
if (stopLoad) await new Promise((r) => setTimeout(r, 2000));

const samples = [];
for (let pass = 0; pass < PASSES; pass += 1) samples.push(measureOnce());
if (stopLoad) stopLoad();

const columns = [
  ['arrayBuffers 生', (s) => s.targetArrayBuffers],
  ['arrayBuffers 差', (s) => s.targetArrayBuffers - s.referenceArrayBuffers],
  ['heapUsed 生', (s) => s.targetHeapUsed],
  ['heapUsed 差', (s) => s.targetHeapUsed - s.referenceHeapUsed],
  ['合算 生', (s) => s.targetArrayBuffers + s.targetHeapUsed],
  ['合算 差', (s) => (s.targetArrayBuffers + s.targetHeapUsed)
    - (s.referenceArrayBuffers + s.referenceHeapUsed)],
];

console.log(`\n## ${stopLoad ? '負荷あり' : '負荷なし'} (別 process ${PASSES} 回、 iterations ${ITERATIONS})\n`);
console.log('| 軸 | ' + samples.map((_, i) => `${i + 1} 回目`).join(' | ') + ' | 幅 |');
console.log('|---|' + samples.map(() => '---').join('|') + '|---|');
for (const [label, pick] of columns) {
  const values = samples.map((s) => Math.round(pick(s)));
  console.log(`| ${label} | ${values.join(' | ')} | ${spread(values)} |`);
}
