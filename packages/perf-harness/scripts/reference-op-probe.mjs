/**
 * 実行内正規化の基準 op 候補を実測する probe (#1737)。
 *
 * `docs/quality/perf-thresholds.md` § 基準 op の選び方 の表を生成する。
 * 数値を doc に書くだけでは第三者が再現できないため、手順そのものを置く。
 *
 *   node packages/perf-harness/scripts/reference-op-probe.mjs
 *
 * 測るのは 2 つ。 (1) 各候補が分母として使える安定性を持つか = 候補自身の
 * 実行間振れ幅、 (2) 対象 op をその候補で割った比の実行間振れ幅。
 *
 * pass ごとに子 process を立てる。 同一 process で連続して測ると JIT と page
 * cache が pass をまたいで温まり、 実行間の差そのものが消えて probe が
 * 成立しない。
 *
 * pass の半数は背景負荷 (CPU spin + fs churn の子 process 群) の下で測る。
 * 実行間のずれは「機械の状態が実行ごとに違う」 ことから来るので、 状態を
 * 意図的に振らないと probe が空振りする。 負荷の有無をまたいで比が動かず
 * 素の値が動くなら、 その候補は分母として働いている。
 */
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, tmpdir } from 'node:os';
import { join } from 'node:path';

const PASSES = 8;
const ITERATIONS = 100;
const WARMUP = 10;
/** 基準候補の 1 回あたりの費用を計時の粒度より十分上に置くための反復数。 */
const CPU_REFERENCE_ROUNDS = 20_000;
const SMALL_PAYLOAD = 'x'.repeat(64);

/** 表の列順。 build 関数の key と一致させる (親 process は temp dir を作らずに名前だけ要る)。 */
const REFERENCE_NAMES = ['noop', 'cpu', 'fsRead', 'fsWrite', 'fsRw'];
const TARGET_NAMES = [
  'cliTestReadFile',
  'cliTestWriteFile',
  'fileScaffold',
  'jsonRoundTrip',
  'heavyCpu',
  'propertyRead',
];

/**
 * 基準候補。 いずれも harness が自前で持てる = 呼出側が関数を書かなくて済む形にする。
 */
function buildReferences(dir) {
  const refFile = join(dir, 'reference.txt');
  writeFileSync(refFile, SMALL_PAYLOAD, 'utf8');
  const sinkFile = join(dir, 'reference-sink.txt');
  const empty = () => {};
  return {
    // 何もしない関数を同じ深さで await するだけ。 harness 自身の往復の費用
    // (`measureHarnessResolution` が測っているもの) がそのまま出る。
    noop: async () => {
      await empty();
    },
    // 純粋な演算。 fs にも allocator にも触れない。
    cpu: async () => {
      let acc = 0;
      for (let i = 0; i < CPU_REFERENCE_ROUNDS; i += 1) acc = (acc * 31 + i) % 1_000_003;
      if (acc === -1) throw new Error('unreachable');
    },
    // 既存 file の読み出し。 page cache に載った状態を測る。
    fsRead: async () => {
      await readFile(refFile, 'utf8');
    },
    // 同じ file の上書き。 file 数を増やさないので dir の状態に依存しない。
    fsWrite: async () => {
      await writeFile(sinkFile, SMALL_PAYLOAD, 'utf8');
    },
    // 書いて読む。 read だけ / write だけの対象の両方と負荷の種類を共有させる狙い。
    fsRw: async () => {
      await writeFile(sinkFile, SMALL_PAYLOAD, 'utf8');
      await readFile(sinkFile, 'utf8');
    },
  };
}

/**
 * 対象 op。 #1718 で振れ幅が大きいと実測された種類を代表させる。
 * `cliTestReadFile` / `cliTestWriteFile` は `packages/cli-test` の 2 op と同じ形、
 * `fileScaffold` は `cli-test-app-scenario` の 20 write を縮めたもの。
 */
function buildTargets(dir) {
  const seedFile = join(dir, 'seed.txt');
  writeFileSync(seedFile, 'hello', 'utf8');
  let counter = 0;
  let scaffoldRound = 0;
  const payload = { a: 1, b: 'two', c: [3, 4, 5], d: { e: true } };
  const record = { value: 42 };
  return {
    cliTestReadFile: async () => {
      await readFile(seedFile, 'utf8');
    },
    cliTestWriteFile: async () => {
      counter += 1;
      await writeFile(join(dir, `f-${counter}.txt`), `content-${counter}`, 'utf8');
    },
    fileScaffold: async () => {
      scaffoldRound += 1;
      for (let i = 0; i < 20; i += 1) {
        await writeFile(join(dir, `s-${scaffoldRound}-${i}.txt`), `c-${i}`, 'utf8');
      }
    },
    jsonRoundTrip: async () => {
      JSON.parse(JSON.stringify(payload));
    },
    // 数 ms 級の CPU 仕事。 waiver が付いている op の多くはこの規模にいる。
    heavyCpu: async () => {
      let acc = 0;
      for (let i = 0; i < 500_000; i += 1) acc = (acc * 31 + i) % 1_000_003;
      if (acc === -1) throw new Error('unreachable');
    },
    // 計時の粒度より速い op。 分母を入れても救えないはずの側を置いて境界を見る。
    propertyRead: async () => {
      if (record.value === -1) throw new Error('unreachable');
    },
  };
}

function percentileType7(sorted, ratio) {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const rank = ratio * (n - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const low = sorted[lower];
  const high = sorted[upper] ?? low;
  return low + (high - low) * (rank - lower);
}

/**
 * 対象と基準を 1 呼出ずつ交互に測る。 提案されている測り方そのもの。
 *
 * 比の作り方は 2 通りあるので両方返す。 `ratioOfP10` は「それぞれの p10 を出して
 * から割る」、 `p10OfRatios` は「対 (t_i / ref_i) を作ってから p10 を取る」。
 * 前者は実行全体に乗った差を、 後者は呼出ごとの差を打ち消す。 どちらが効くかは
 * 実測でしか決まらない。
 */
async function measureAlternating(targetFn, referenceFn) {
  const targetSamples = [];
  const referenceSamples = [];
  const pairRatios = [];
  for (let i = 0; i < WARMUP; i += 1) {
    await referenceFn();
    await targetFn();
  }
  for (let i = 0; i < ITERATIONS; i += 1) {
    const refStart = process.hrtime.bigint();
    await referenceFn();
    const refEnd = process.hrtime.bigint();
    await targetFn();
    const targetEnd = process.hrtime.bigint();
    const reference = Number(refEnd - refStart) / 1_000_000;
    const target = Number(targetEnd - refEnd) / 1_000_000;
    referenceSamples.push(reference);
    targetSamples.push(target);
    pairRatios.push(reference > 0 ? target / reference : 0);
  }
  const targetP10 = percentileType7([...targetSamples].sort((a, b) => a - b), 0.1);
  const referenceP10 = percentileType7([...referenceSamples].sort((a, b) => a - b), 0.1);
  return {
    targetP10,
    referenceP10,
    ratioOfP10: referenceP10 > 0 ? targetP10 / referenceP10 : 0,
    p10OfRatios: percentileType7([...pairRatios].sort((a, b) => a - b), 0.1),
  };
}

/** 1 pass = 全 (対象 × 基準) の組を順に交互測定する。 */
async function runPass(dir) {
  const references = buildReferences(dir);
  const targets = buildTargets(dir);
  const out = {};
  for (const targetName of TARGET_NAMES) {
    for (const referenceName of REFERENCE_NAMES) {
      out[`${targetName}|${referenceName}`] = await measureAlternating(
        targets[targetName],
        references[referenceName],
      );
    }
  }
  return out;
}

/** (max - min) / min を百分率で。 min が 0 なら比較できないので null。 */
function spreadPct(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!(min > 0)) return null;
  return ((max - min) / min) * 100;
}

function formatSpread(value) {
  if (value === null) return 'n/a';
  return `${value.toFixed(0)}%`;
}

const mode = process.argv[2];

if (mode === 'load') {
  // 背景負荷。 CPU を回しつつ fs も触る = 対象と基準の両方に影響する状態を作る。
  // signal handler は登録しない。 同期の無限 loop は event loop に戻らないため
  // handler が動かず、 SIGTERM を握り潰して loader が永久に残る。
  const file = join(process.argv[3], `churn-${process.pid}.txt`);
  const body = 'y'.repeat(4096);
  for (;;) {
    let acc = 0;
    for (let i = 0; i < 2_000_000; i += 1) acc = (acc * 31 + i) % 1_000_003;
    if (acc === -1) break;
    writeFileSync(file, body, 'utf8');
  }
} else if (mode === 'pass') {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-refprobe-'));
  try {
    process.stdout.write(`${JSON.stringify(await runPass(dir))}\n`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
} else {
  const scriptPath = new URL(import.meta.url).pathname;
  const loaderCount = Math.max(1, Math.floor(cpus().length / 2));
  const loadDir = mkdtempSync(join(tmpdir(), 'kiwa-refprobe-load-'));
  const passes = [];

  try {
    for (let pass = 0; pass < PASSES; pass += 1) {
      const loaded = pass % 2 === 1;
      const loaders = loaded
        ? Array.from({ length: loaderCount }, () =>
            spawn(process.execPath, [scriptPath, 'load', loadDir], { stdio: 'ignore' }),
          )
        : [];
      try {
        const out = execFileSync(process.execPath, [scriptPath, 'pass'], {
          encoding: 'utf8',
          maxBuffer: 16 * 1024 * 1024,
        });
        passes.push({ loaded, pairs: JSON.parse(out) });
      } finally {
        for (const loader of loaders) loader.kill('SIGKILL');
      }
      process.stderr.write(`pass ${pass + 1}/${PASSES} (${loaded ? 'loaded' : 'idle'}) done\n`);
    }
  } finally {
    rmSync(loadDir, { recursive: true, force: true });
  }

  const at = (pass, target, reference) => pass.pairs[`${target}|${reference}`];

  process.stdout.write(
    `node ${process.version} / ${PASSES} passes (半数は背景負荷 ${loaderCount} process 下) / ${ITERATIONS} iterations after ${WARMUP} warmup / 対象と基準を 1 呼出ずつ交互に測定\n\n`,
  );

  process.stdout.write('## 基準候補それ自身の実行間振れ幅\n\n');
  process.stdout.write(
    '| 基準候補 | p10 中央値 | 振れ幅 (全 pass) | 振れ幅 (無負荷のみ) |\n|---|---|---|---|\n',
  );
  for (const reference of REFERENCE_NAMES) {
    // 基準は対象ごとに測り直されるので、 pass 内の中央値を 1 pass の代表値にする。
    const perPass = passes.map((pass) => {
      const values = TARGET_NAMES.map((target) => at(pass, target, reference).referenceP10);
      return percentileType7([...values].sort((a, b) => a - b), 0.5);
    });
    const idle = perPass.filter((_, index) => !passes[index].loaded);
    const sorted = [...perPass].sort((a, b) => a - b);
    process.stdout.write(
      `| ${reference} | ${percentileType7(sorted, 0.5).toFixed(5)}ms | ${formatSpread(spreadPct(perPass))} | ${formatSpread(spreadPct(idle))} |\n`,
    );
  }

  process.stdout.write('\n## 対象 op を各基準で割った比の実行間振れ幅\n\n');
  process.stdout.write(
    '素の振れ幅は、 その基準と交互に測った時の対象自身の p10 の振れ幅 (組ごとに測り直すため組で違う)。\n\n',
  );
  process.stdout.write(
    '| 対象 op | 基準 | 対象 p10 中央値 | 素の振れ幅 | 比 (p10 同士) | 比 (対ごと) |\n|---|---|---|---|---|---|\n',
  );
  for (const target of TARGET_NAMES) {
    for (const reference of REFERENCE_NAMES) {
      const raw = passes.map((pass) => at(pass, target, reference).targetP10);
      const ratioOfP10 = passes.map((pass) => at(pass, target, reference).ratioOfP10);
      const p10OfRatios = passes.map((pass) => at(pass, target, reference).p10OfRatios);
      const sorted = [...raw].sort((a, b) => a - b);
      process.stdout.write(
        `| ${target} | ${reference} | ${percentileType7(sorted, 0.5).toFixed(5)}ms | ${formatSpread(spreadPct(raw))} | ${formatSpread(spreadPct(ratioOfP10))} | ${formatSpread(spreadPct(p10OfRatios))} |\n`,
      );
    }
  }

  process.stdout.write('\n## pass ごとの比 (p10 同士)\n\n');
  const columns = TARGET_NAMES.flatMap((target) =>
    REFERENCE_NAMES.map((reference) => `${target}÷${reference}`),
  );
  process.stdout.write(
    `| pass | 負荷 | ${columns.join(' | ')} |\n|---|---|${columns.map(() => '---').join('|')}|\n`,
  );
  passes.forEach((pass, index) => {
    const cells = TARGET_NAMES.flatMap((target) =>
      REFERENCE_NAMES.map((reference) => at(pass, target, reference).ratioOfP10.toFixed(3)),
    );
    process.stdout.write(`| ${index + 1} | ${pass.loaded ? 'あり' : 'なし'} | ${cells.join(' | ')} |\n`);
  });
}
