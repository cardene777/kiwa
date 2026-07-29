/**
 * memory 軸が何を見て何を見ないかを測る probe。
 *
 * `docs/quality/perf-thresholds.md` § Memory delta target の 6 行表を生成する。
 * 数値を doc に書くだけだと第三者が再現できないため、手順そのものを置く。
 *
 *   node --expose-gc packages/perf-harness/scripts/memory-axis-probe.mjs
 *
 * kind ごとに子 process を立てて 1 種類だけ測る。 同一 process で連続して測ると、
 * 前の kind が保持していたものの解放が次の kind の測定区間に入り、heapUsed が
 * 負値になる (実測で `map` が 161,736 B から -23,328 B に化けた)。 arrayBuffers 側は
 * その影響を受けないが、表の 2 列を同じ条件で採るために分離する。
 */
const gc = globalThis.gc;
if (typeof gc !== 'function') {
  process.stderr.write('need --expose-gc\n');
  process.exit(1);
}

const BYTES_PER_ITERATION = 10 * 1024;
const ITERATIONS = 15;
const WARMUP = 3;

/**
 * 各 kind は「1 反復ごとに BYTES_PER_ITERATION 相当を到達可能なまま積む」 op を返す。
 * 保持先の配列は kind ごとに新規作成し、測定の外へは持ち出さない。
 */
const kinds = {
  nothing: () => () => {},
  buffer: () => {
    const held = [];
    return () => held.push(Buffer.allocUnsafe(BYTES_PER_ITERATION));
  },
  arraybuffer: () => {
    const held = [];
    return () => held.push(new ArrayBuffer(BYTES_PER_ITERATION));
  },
  uint8array: () => {
    const held = [];
    return () => held.push(new Uint8Array(BYTES_PER_ITERATION));
  },
  // 数値 1 要素あたり 8 byte として要素数を決める。 同じ値を並べると V8 が
  // 共有し得るので、要素ごとに違う値を入れる。
  jsarray: () => {
    const held = [];
    return () => {
      const arr = new Array(BYTES_PER_ITERATION / 8);
      for (let i = 0; i < arr.length; i += 1) arr[i] = held.length + i;
      held.push(arr);
    };
  },
  // entry 1 件あたり 64 byte として件数を決める。 key は毎回一意にする。
  map: () => {
    const held = new Map();
    return () => {
      for (let i = 0; i < BYTES_PER_ITERATION / 64; i += 1) {
        held.set(`${held.size}-${i}`, i);
      }
    };
  },
};

/** warmup のぶんも同じ op で回す = 1 回きりの確保を測定区間の外へ出す。 */
function measure(op) {
  for (let i = 0; i < WARMUP; i += 1) op();
  gc();
  const before = process.memoryUsage();
  for (let i = 0; i < ITERATIONS; i += 1) op();
  gc();
  const after = process.memoryUsage();
  return {
    heapUsed: after.heapUsed - before.heapUsed,
    arrayBuffers: after.arrayBuffers - before.arrayBuffers,
  };
}

// 子 process として起動された場合は 1 kind だけ測って JSON で返す。
const target = process.argv[2];
if (target) {
  const make = kinds[target];
  if (!make) {
    process.stderr.write(`unknown kind: ${target}\n`);
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify(measure(make()))}\n`);
} else {
  const { execFileSync } = await import('node:child_process');
  process.stdout.write(
    `node ${process.version} / ${ITERATIONS} iterations after ${WARMUP} warmup / ${BYTES_PER_ITERATION} B per iteration\n\n`,
  );
  process.stdout.write('| what is retained | heapUsed | arrayBuffers |\n|---|---|---|\n');
  for (const name of Object.keys(kinds)) {
    const out = execFileSync(
      process.execPath,
      ['--expose-gc', new URL(import.meta.url).pathname, name],
      { encoding: 'utf8' },
    );
    const { heapUsed, arrayBuffers } = JSON.parse(out);
    process.stdout.write(
      `| ${name} | ${heapUsed.toLocaleString('en-US')} B | ${arrayBuffers.toLocaleString('en-US')} B |\n`,
    );
  }
}
