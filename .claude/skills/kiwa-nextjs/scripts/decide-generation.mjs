/**
 * 選択 3 (module ごと差し替え) を採った時に、 spec の TC を生成するかどうかを決める。
 *
 * 規則を散文で書くと、 適用したかどうかを誰も確かめられない。 実際 #1859 の Round 1 は
 * 観点名で切る規則を、 Round 2 は「判定不能」 に落ちすぎる規則を、 どちらも文面から
 * 見つけている。 判定を関数にすると skill と release-smoke が同じ実装を使う。
 *
 * skill (`SKILL.md` § 差し替えた module に答えを預けた TC は生成しない) はこの script を
 * 呼び、 出力の `generate` に従う。 判断が要るのは入力を作るところまで = TC ごとに
 * 「何に依存するか」 と「答えを出すのは誰か」 を決める部分で、 そこから先は機械的。
 *
 *   node decide-generation.mjs '<json>'
 *
 * 入力 JSON:
 *   {
 *     "mockedExports":      ["findUserByEmail", "createUser"],  // factory が差し替えた export
 *     "passthroughExports": ["formatEmail"],                    // importOriginal で素通しした export
 *     "cases": [
 *       { "id": "T-001", "dependsOn": ["createUser"], "answeredBy": "action-branch" }
 *     ]
 *   }
 *
 * `answeredBy` の 4 値:
 *   mocked-export-logic ... 差し替えた export の実装そのものが期待値を決める
 *   action-branch       ... action 自身の分岐が決める (差し替えた export は入力を供給するだけ)
 *   seeded-env          ... helper が seed した cookies / headers / formData / args が決める
 *   unknown             ... 決められない
 */

/** @typedef {'mocked-export-logic' | 'action-branch' | 'seeded-env' | 'unknown'} AnsweredBy */

const ANSWERED_BY = new Set([
  'mocked-export-logic',
  'action-branch',
  'seeded-env',
  'unknown',
]);

/**
 * 1 件の TC について生成可否を決める。
 *
 * 判定の順序に意味がある。 差し替えに届かない TC は `answeredBy` を問わず生成してよい
 * (部分 mock で素通しした export しか触らない TC がこれに当たる)。 届く場合だけ、
 * 答えを出すのが誰かで分ける。
 */
export function decideCase(tc, mockedExports) {
  const mocked = new Set(mockedExports);
  const dependsOn = tc.dependsOn ?? [];

  if (!ANSWERED_BY.has(tc.answeredBy)) {
    return {
      id: tc.id,
      generate: false,
      reason: `answeredBy が未知の値 (${String(tc.answeredBy)})`,
    };
  }

  const reached = dependsOn.filter((name) => mocked.has(name));

  // 差し替えた export に 1 つも届かないなら、 mock は結果に関与しない。
  // 部分 mock で素通しした export だけを触る TC がここに入る。
  if (reached.length === 0) {
    return { id: tc.id, generate: true, reason: '差し替えた export に依存しない' };
  }

  if (tc.answeredBy === 'unknown') {
    // 迷ったら生成しない。 落ちない test が緑で残るより、 未生成として報告される方がよい。
    return { id: tc.id, generate: false, reason: '答えを出すのが誰か決められない' };
  }

  if (tc.answeredBy === 'mocked-export-logic') {
    return {
      id: tc.id,
      generate: false,
      reason: `差し替えた export の実装が期待値を決める (${reached.join(', ')})`,
    };
  }

  // action の分岐 / seed した env が答えを出す場合、 差し替えた export は入力を供給する
  // だけなので、 test は action 側の振る舞いを測れる。 module 自身の正しさ (大文字小文字の
  // 扱い等) は測れないので、 その旨を理由に残す。
  return {
    id: tc.id,
    generate: true,
    reason: `答えは ${tc.answeredBy}、 差し替えた export は入力のみ (${reached.join(', ')})`,
  };
}

/** spec 全体に適用して、 生成する / しない の 2 群に分ける。 */
export function decide(input) {
  const mockedExports = input.mockedExports ?? [];
  const passthroughExports = input.passthroughExports ?? [];

  // 同じ export を両方に書いた入力は解釈が割れる。 どちらとも決められないので止める。
  const both = mockedExports.filter((name) => passthroughExports.includes(name));
  if (both.length > 0) {
    throw new Error(
      `mockedExports と passthroughExports に同じ export がある: ${both.join(', ')}`,
    );
  }

  const decided = (input.cases ?? []).map((tc) => decideCase(tc, mockedExports));
  return {
    generated: decided.filter((d) => d.generate),
    omitted: decided.filter((d) => !d.generate),
  };
}

/** CLI。 skill から `node decide-generation.mjs '<json>'` で呼ぶ。 */
function main(argv) {
  const raw = argv[2];
  if (raw === undefined || raw === '') {
    process.stderr.write('usage: node decide-generation.mjs <json>\n');
    process.exit(64);
  }
  let input;
  try {
    input = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`入力が JSON として読めない: ${String(err)}\n`);
    process.exit(65);
  }
  try {
    process.stdout.write(`${JSON.stringify(decide(input), null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${String(err instanceof Error ? err.message : err)}\n`);
    process.exit(66);
  }
}

if (process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  main(process.argv);
}
