/**
 * `scripts/perf-prune-stale.mjs` の検査。
 *
 * この script は baseline から key を削除する。 誤って削ると測定の履歴が失われ、
 * 回帰判定が次の完走まで成立しなくなるため、 削る条件と削らない条件を固定する。
 */
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'perf-prune-stale.mjs');

function withTempDir(fn) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-prune-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** script を走らせる。 終了 code と出力を返す (非 0 でも throw しない)。 */
function run(mode, manifestPath, baselineRoot) {
  // 警告は stderr に出る。 `spawnSync` なら終了 code に関わらず両方を取れるので、
  // 「落とさなかった理由」 も検査できる。
  //
  // 掃除の範囲は既定で repo の `.perf-baseline` 配下。 test は一時 dir を使うので
  // 明示的に差し替える (差し替えないと全 record が範囲外で見送られる)。
  const args = [SCRIPT, mode];
  if (baselineRoot !== undefined) args.push('--baseline-root', baselineRoot);
  const result = spawnSync(process.execPath, args, {
    env: { ...process.env, KIWA_PERF_PRUNE_MANIFEST: manifestPath },
    encoding: 'utf8',
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  return { code: result.status ?? 1, stdout, stderr, output: stdout + stderr };
}

function writeBaseline(dir, name, keys) {
  const target = path.join(dir, name);
  const results = {};
  for (const key of keys) results[key] = { name: key };
  writeFileSync(target, JSON.stringify({ schema: 2, env: {}, results }), 'utf8');
  return target;
}

function readKeys(target) {
  return Object.keys(JSON.parse(readFileSync(target, 'utf8')).results).sort();
}

function writeManifest(dir, records) {
  const target = path.join(dir, 'manifest.jsonl');
  writeFileSync(target, records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  return target;
}

/**
 * 完走した周期を再現する。 `--reset` で周期を開き、 manifest を置き、 `--seal` で
 * 完走の印を付ける。 `--apply` はこの印が無いと掃除しない。
 */
function sealedRun(dir, records) {
  const manifest = path.join(dir, 'manifest.jsonl');
  run('--reset', manifest);
  if (records !== undefined) writeManifest(dir, records);
  run('--seal', manifest);
  return manifest;
}

test('測っていない op を落とす', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = sealedRun(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);

    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 0);
    assert.deepEqual(readKeys(baseline), ['alpha.serial']);
  });
});

test('複数の実行が同じ baseline に書いた時は和を取る', () => {
  withTempDir((dir) => {
    // 同じ module を 2 file が測る形。 片方だけを見て掃除すると、
    // もう片方が測った op が落ちる。
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'beta.serial', 'gone.serial']);
    const manifest = sealedRun(dir, [
      { baselinePath: baseline, keys: ['alpha.serial'] },
      { baselinePath: baseline, keys: ['beta.serial'] },
    ]);

    run('--apply', manifest, dir);
    assert.deepEqual(readKeys(baseline), ['alpha.serial', 'beta.serial']);
  });
});

test('manifest に読めない行があれば 1 件も落とさない', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = path.join(dir, 'manifest.jsonl');
    run('--reset', manifest);
    // 追記の途中で process が落ちると末尾が欠けた行が残る。
    writeFileSync(
      manifest,
      `${JSON.stringify({ baselinePath: baseline, keys: ['alpha.serial'] })}\n{"baselinePath":"/x`,
      'utf8',
    );
    run('--seal', manifest);

    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 1, '掃除を行わなかったことが終了 code から判る');
    assert.deepEqual(readKeys(baseline), ['alpha.serial', 'gone.serial']);
  });
});

test('全 key が対象になる時は落とさない', () => {
  withTempDir((dir) => {
    // manifest 側が壊れているか、 baseline が別の測定条件で書かれている可能性の
    // ほうが高い。 落とすと記録を丸ごと失う。
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'beta.serial']);
    const manifest = sealedRun(dir, [{ baselinePath: baseline, keys: ['unrelated.serial'] }]);

    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 0);
    assert.deepEqual(readKeys(baseline), ['alpha.serial', 'beta.serial']);
    assert.match(result.output, /skip \(全 key が対象になる\)/);
  });
});

test('manifest が無い実行では何もしない', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial']);
    const manifest = path.join(dir, 'absent.jsonl');
    run('--reset', manifest);
    run('--seal', manifest);
    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 0);
    assert.deepEqual(readKeys(baseline), ['alpha.serial']);
  });
});

test('掃除の後は manifest を消す', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = sealedRun(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);

    run('--apply', manifest, dir);
    // 残すと次の完走が前回の一覧を混ぜて読む。
    assert.equal(existsSync(manifest), false);
  });
});

test('--reset は manifest を消す', () => {
  withTempDir((dir) => {
    const manifest = writeManifest(dir, [{ baselinePath: 'x', keys: [] }]);
    const result = run('--reset', manifest);
    assert.equal(result.code, 0);
    assert.equal(existsSync(manifest), false);
  });
});

test('読めない baseline は触らない', () => {
  withTempDir((dir) => {
    const baseline = path.join(dir, 'broken.json');
    writeFileSync(baseline, '{ not json', 'utf8');
    const manifest = sealedRun(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);

    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 0);
    assert.equal(readFileSync(baseline, 'utf8'), '{ not json');
  });
});

test('掃除の範囲外を指す record は触らない', () => {
  withTempDir((dir) => {
    // manifest は書き換え可能な file なので、 その中の path を信じて任意の JSON を
    // 書き換えない。 範囲は `--baseline-root` (既定は repo の `.perf-baseline`)。
    const outside = writeBaseline(dir, 'outside.json', ['alpha.serial', 'gone.serial']);
    const scope = path.join(dir, 'scope');
    mkdirSync(scope, { recursive: true });
    const manifest = sealedRun(dir, [{ baselinePath: outside, keys: ['alpha.serial'] }]);

    const result = run('--apply', manifest, scope);
    assert.equal(result.code, 0);
    assert.deepEqual(readKeys(outside), ['alpha.serial', 'gone.serial']);
    assert.match(result.output, /掃除の範囲外/);
  });
});

test('`..` で範囲の外へ出る path も触らない', () => {
  withTempDir((dir) => {
    const outside = writeBaseline(dir, 'outside.json', ['alpha.serial', 'gone.serial']);
    const scope = path.join(dir, 'scope');
    mkdirSync(scope, { recursive: true });
    const manifest = sealedRun(dir, [
      { baselinePath: path.join(scope, '..', 'outside.json'), keys: ['alpha.serial'] },
    ]);

    const result = run('--apply', manifest, scope);
    assert.deepEqual(readKeys(outside), ['alpha.serial', 'gone.serial']);
    assert.match(result.output, /掃除の範囲外/);
  });
});

test('相対の manifest 指定は受け取らない', () => {
  // 書く側は package ごとの cwd で解決するため、 相対値だと読む側と別 file を指す。
  const result = run('--apply', 'relative/manifest.jsonl');
  assert.equal(result.code, 64);
  assert.match(result.output, /絶対 path/);
});

test('書き戻しの途中で壊れた file を残さない', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = sealedRun(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);

    run('--apply', manifest, dir);
    // 一時 file を残すと次の実行が拾い、 掃除の対象を誤る。
    const leftovers = readdirSync(dir).filter((name) => name.includes('.tmp-'));
    assert.deepEqual(leftovers, []);
    // 置き換え後の中身が読める JSON である。
    assert.deepEqual(readKeys(baseline), ['alpha.serial']);
  });
});

test('完走の印が無ければ掃除しない', () => {
  withTempDir((dir) => {
    // 途中で落ちた周期が残した manifest を、 後から直接 `--apply` する形。
    // 一部だけの一覧で掃除すると、 測っていない op が消える。
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = path.join(dir, 'manifest.jsonl');
    run('--reset', manifest);
    writeManifest(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);

    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 1);
    assert.deepEqual(readKeys(baseline), ['alpha.serial', 'gone.serial']);
    assert.match(result.output, /完走の印が無い/);
  });
});

test('前の周期の印では掃除しない', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = path.join(dir, 'manifest.jsonl');
    // 周期 1 = 完走して印が付く。
    run('--reset', manifest);
    run('--seal', manifest);
    const staleSeal = readFileSync(`${manifest}.seal`, 'utf8');

    // 周期 2 = 開いたが完走していない。 印だけ前の周期のものを残す。
    run('--reset', manifest);
    writeManifest(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);
    writeFileSync(`${manifest}.seal`, staleSeal, 'utf8');

    const result = run('--apply', manifest, dir);
    assert.equal(result.code, 1);
    assert.deepEqual(readKeys(baseline), ['alpha.serial', 'gone.serial']);
    assert.match(result.output, /この周期のものでない/);
  });
});

test('同じ manifest を 2 度適用できない', () => {
  withTempDir((dir) => {
    const baseline = writeBaseline(dir, 'b.json', ['alpha.serial', 'gone.serial']);
    const manifest = sealedRun(dir, [{ baselinePath: baseline, keys: ['alpha.serial'] }]);

    assert.equal(run('--apply', manifest, dir).code, 0);
    // 印を消費しているので 2 度目は通らない。
    assert.equal(run('--apply', manifest, dir).code, 1);
  });
});

test('--reset を経ずに印を付けられない', () => {
  withTempDir((dir) => {
    const result = run('--seal', path.join(dir, 'manifest.jsonl'));
    assert.equal(result.code, 1);
    assert.match(result.output, /--reset を経ていない/);
  });
});

test('範囲内の symlink 経由で範囲外へ書き戻さない', () => {
  withTempDir((dir) => {
    // 文字列だけで範囲を見ると、 範囲内に外を指す symlink を置くだけで抜けられる。
    const outsideDir = path.join(dir, 'outside');
    const scope = path.join(dir, 'scope');
    mkdirSync(outsideDir, { recursive: true });
    mkdirSync(scope, { recursive: true });
    const outside = writeBaseline(outsideDir, 'b.json', ['alpha.serial', 'gone.serial']);
    symlinkSync(outsideDir, path.join(scope, 'link'));

    const manifest = sealedRun(dir, [
      { baselinePath: path.join(scope, 'link', 'b.json'), keys: ['alpha.serial'] },
    ]);

    const result = run('--apply', manifest, scope);
    assert.deepEqual(readKeys(outside), ['alpha.serial', 'gone.serial']);
    assert.match(result.output, /掃除の範囲外/);
  });
});

test('baseline 自身が symlink なら追随しない', () => {
  withTempDir((dir) => {
    const outsideDir = path.join(dir, 'outside');
    const scope = path.join(dir, 'scope');
    mkdirSync(outsideDir, { recursive: true });
    mkdirSync(scope, { recursive: true });
    const outside = writeBaseline(outsideDir, 'b.json', ['alpha.serial', 'gone.serial']);
    const link = path.join(scope, 'b.json');
    symlinkSync(outside, link);

    const manifest = sealedRun(dir, [{ baselinePath: link, keys: ['alpha.serial'] }]);

    const result = run('--apply', manifest, scope);
    assert.deepEqual(readKeys(outside), ['alpha.serial', 'gone.serial']);
    assert.match(result.output, /掃除の範囲外/);
  });
});

test('mode を渡さなければ usage を出して落ちる', () => {
  withTempDir((dir) => {
    const result = run('--nope', path.join(dir, 'm.jsonl'));
    assert.equal(result.code, 64);
  });
});
