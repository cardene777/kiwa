# test-spec-queue-flow (job-queue layer)

`src/email-worker.ts` が組む署名確認メールの送信 worker と、
`@kiwa-lab/queue` の sandbox が回す投入 → 処理 → 検証の一巡を対象にする。

実 queue を起動せずに retry / 遅延 / 打ち切りまで通せる。

- module: queue-flow
- layer: job-queue
- provider: bullmq

## 対象機能

| 関数 | 引数 | 返り値 |
|---|---|---|
| `createEmailSink(opts?)` | `failFirst` (先頭 N 回を失敗させる) | `{ sent, send }` |
| `registerEmailProcessor(env, sink)` | env と sink | 登録した processor をそのまま返す |

## 仕様の要約

### 送信先の記録

`send` は呼ばれるたびに数え、`failFirst` 回目までは失敗する。
**失敗した回は `sent` に積まれない**。

返す id は `email-<成功件数>` で、**呼出回数ではなく成功件数から作る**。
2 回失敗して 3 回目に成功した場合の id は `email-1` になる。

`failFirst` の既定は 0 で、`undefined` を渡した場合も 0 として扱う。

### processor の登録

`registerEmailProcessor` は env へ登録すると同時に **同じ関数を返す**。
返り値を直接呼べば queue を経由せず sink を叩ける。

### 投入と処理

| 場面 | 挙動 |
|---|---|
| processor 登録済 | 投入した job が処理され `completed` になる |
| processor 未登録 | 処理されず、待機は `timeout waiting for job` を送出 |
| `attempts` 未指定 | 試行は 1 回。 1 度失敗すると `failed` で終わる |
| `attempts: N` | 失敗するたびに再試行し、N 回で打ち切る |
| `delay: N` | N ミリ秒後に処理する |

`attempts` を使い切って失敗した job は `state=failed` /
`attemptsMade=N` / `failedReason` に最後の送出内容を持つ。

### 同じ `jobId` を 2 度投入する (sandbox の現状挙動)

**後から投入した data で置き換わる**。 job は 1 件のままで、送信も 1 回。
先に投入した data は処理されない。

これは T-QUEUE-POC-011 で固定する sandbox の characterization であり、
実 BullMQ を含む provider 共通の契約ではない。

### 投入時の引数の検証

| 入力 | 挙動 |
|---|---|
| `attempts` が 1 未満 | `addJob: attempts must be at least 1` を送出 |
| `delay` が負 | `addJob: delay must be non-negative` を送出 |

### 一覧

`listJobs()` は処理後の snapshot を返す。
`id` / `name` / `data` / `state` / `attemptsMade` / `returnValue` を持つ。

### 停止後

`env.stop()` の後に投入すると `after stop` を含む送出になる。

## 主な品質リスク

- **id が成功件数から作られる**。 呼出回数と一致しないため、
  retry を挟むと送信 id と試行回数がずれる
- **同じ `jobId` が置き換えになる**。 実 BullMQ は重複を無視して先勝ちにするため、
  sandbox と本番で結果が変わりうる
- **`attempts` の既定が 1**。 明示しないと 1 度の失敗で打ち切られる
- **processor 未登録が待機の timeout として現れる**。 登録漏れと job 未投入が
  同じ形で失敗するため区別が付かない

## 推奨テスト構成

`setupBullMQEnv()` の既定は sandbox で、実 Redis も testcontainers も起動しない。
遅延は実時間で待つが 30 ミリ秒に収める。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 正常処理 | 投入 → 処理 → 返り値 |
| 2 | retry | 途中で成功する / 打ち切る |
| 3 | drain | 複数投入の完了待ち |
| 4 | 遅延 | `delay` を待ってから処理 |
| 5 | `jobId` | 指定した id、同じ id の二重投入 |
| 6 | 停止 | 停止後の投入 |
| 7 | 待機の失敗 | 未投入 / processor 未登録 |
| 8 | sink 単体 | 成功件数からの id、失敗回の非蓄積 |
| 9 | 引数の検証 | `attempts` が 1 未満、`delay` が負 |

## テストケース一覧

| ID | Observation | Given | Job | Then | Priority | Automation | Provider | Mode |
|---|---|---|---|---|---|---|---|---|
| T-QUEUE-POC-001 | 投入した job が処理される | processor 登録済 | `send-email` / `{ to, subject, body }` | `state==='completed'`、返り値が `{ id: 'email-1', to }`、`sent.length===1` | P0 | yes | bullmq | sandbox |
| T-QUEUE-POC-002 | 2 回失敗しても 3 回目で成功する | `failFirst: 2` の sink | `send-email` / `attempts: 3` | `attemptsMade===3`、`sent.length===1` | P0 | yes | bullmq | sandbox |
| T-QUEUE-POC-003 | 試行を使い切ると失敗で終わる | `failFirst: 5` の sink | `send-email` / `attempts: 2` | `state==='failed'`、`attemptsMade===2`、理由が `/transient SMTP/`、`sent` が空 | P0 | yes | bullmq | sandbox |
| T-QUEUE-POC-004 | 複数投入を待ち切れる | processor 登録済 | `send-email` を 3 件 | 待機が解決し、`sent` の宛先集合が投入した 3 件と一致 (順序は保証しない) | P0 | yes | bullmq | sandbox |
| T-QUEUE-POC-005 | 遅延してから処理する | processor 登録済 | `send-email` / `delay: 30` | 投入から 25ms 以上経過、`sent.length===1` | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-006 | 指定した `jobId` がそのまま付く | processor 登録済 | `send-email` / `jobId: 'welcome-dave'` | `snap.id==='welcome-dave'`、処理が完了する | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-007 | 停止後は投入できない | 1 件処理済で `stop()` 済 | `send-email` | `/after stop/` を送出 | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-008 | 投入していない job の待機は timeout する | processor 未登録、投入なし | `nothing-here` / `timeoutMs: 20` | `/timeout waiting/` を送出 | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-009 | 登録した processor をそのまま返す | processor 登録済 | 返り値を snapshot で直接呼ぶ | 返り値が `{ id: 'email-1', to }`、`sent.length===1` | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-010 | id は成功件数から作る | `failFirst: 2` の sink | `send` を 3 回直接呼ぶ | 3 回目が `id==='email-1'`、`sent.length===1` | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-011 | sandbox では同じ `jobId` が後の data で置き換わる | processor 登録済 | 同じ `jobId: 'dup'` で宛先違いを 2 回投入 | job は 1 件、`sent` が後の宛先だけ | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-012 | `attempts` 未指定は 1 回で打ち切る | `failFirst: 1` の sink | `send-email` / option なし | `state==='failed'`、`attemptsMade===1`、`sent` が空 | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-013 | processor 未登録なら処理されない | processor 未登録 | `send-email` を投入して待機 | `/timeout waiting/` を送出 | P1 | yes | bullmq | sandbox |
| T-QUEUE-POC-014 | 一覧が処理後の snapshot を返す | processor 登録済、1 件処理済 | `listJobs()` | 1 件で `state==='completed'`、`returnValue` と `data` を持つ | P2 | yes | bullmq | sandbox |
| T-QUEUE-POC-015 | 試行回数が 1 未満なら投入を拒む | sandbox env 作成済 (processor は不要) | `send-email` / `attempts: 0` | `addJob: attempts must be at least 1` を送出 | P2 | yes | bullmq | sandbox |
| T-QUEUE-POC-016 | 遅延が負なら投入を拒む | sandbox env 作成済 (processor は不要) | `send-email` / `delay: -1` | `addJob: delay must be non-negative` を送出 | P2 | yes | bullmq | sandbox |

## 自動化方針

`setupBullMQEnv()` の既定は sandbox で、実 Redis も testcontainers も起動しない。
`afterEach` で `env.stop()` を呼び、env を跨いだ state の持ち越しを断つ。

T-QUEUE-POC-007 は `env.stop()` を明示的に呼ぶため `afterEach` の掃除対象に載せない
(二重に停止すると別の経路に入る)。

**T-QUEUE-POC-013 と T-QUEUE-POC-008 は別のことを見る。**
008 は投入していない job 名を待つ形、013 は投入したが processor が無い形。
どちらも同じ timeout で失敗するため、**両方を置いて初めて
「登録漏れ」 と「投入漏れ」 が同じ症状になることを固定できる**。

T-QUEUE-POC-010 は sink を直接呼ぶ。queue を経由すると retry の実装が
呼出回数に関与するため、id の作られ方だけを切り出せない。

## 自動化すべきテスト

- T-QUEUE-POC-001 〜 T-QUEUE-POC-016 全件自動化推奨
- 実時間を待つのは 005 (30ms) と 008 / 013 (待機の timeout) のみ

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- 同じ `jobId` の二度目が **置き換え** になる。 実 BullMQ は重複を無視して
  先に投入した job を残すため、sandbox と本番で結果が変わる。
  どちらを正とするかが未定義
- 送信 id を成功件数から作るため、retry を挟むと試行回数と id がずれる。
  id が何を指すべきか (試行 / 成功 / メッセージ) が未定義
- processor 未登録と job 未投入が同じ timeout で失敗する。
  区別する必要があるかが未定義
- `attempts` の既定が 1 であることが呼出側に見えない。
  既定値を明示するか、指定を必須にするかが未定義
- job の処理順序が未定義。sandbox は同時に実行可能になった job を id の辞書順で
  逐次処理するが、FIFO や優先度を provider 共通では保証していない
- sandbox は processor を常に 1 件ずつ実行し、並行度を指定できない。
  並行処理時の上限、競合、完了順は未定義
- retry は sandbox では即時実行され、backoff / jitter を指定できない。
  再試行間隔と backoff 戦略は未定義
- 打ち切った job は `failed` に残るだけで、dead-letter queue への移送を表現できない。
  dead-letter の条件、保存内容、再投入方法は未定義
