# test-spec-basic-connect.md

## 対象 example

`examples/basic-connect/` — `dappE2eTest` fixture を使った最小 wallet connect / sign 動作確認 dApp。 14 件の既存 test で window.ethereum inject / eth_requestAccounts / personal_sign / eth_signTypedData_v4 / eth_sendTransaction / accountsChanged / reject mode / EIP-6963 multi-wallet を網羅。

## 既存 test (現状)

| test 名 | 検証内容 | 状態 |
|---|---|---|
| T-E2E-001 | fixture 経由で window.ethereum が定義される | EXISTING |
| T-E2E-002 | #connect クリックでアドレスが #result に表示される | EXISTING |
| T-E2E-003 | #sign signature が verifyMessage true | EXISTING |
| T-E2E-004 | #sign-typed signature が verifyTypedData true | EXISTING |
| T-E2E-005 | #send-tx で tx hash 返却 | EXISTING |
| T-E2E-006 | accountsChanged event 発火 | EXISTING |
| T-E2E-007 | eth_subscribe で err.code === 4200 | EXISTING |
| T-E2E-008 | dappE2e.waitForRpcIdle() で chained RPC 待機 | EXISTING |
| T-E2E-009 | reject mode で personal_sign が code 4001 で reject | EXISTING |
| T-E2E-010 | reject mode で wallet_switchEthereumChain が code 4001 で reject、 chainId 維持 | EXISTING |
| T-E6E-001 | 2 wallet 並走 announce を requestProvider で再取得 | EXISTING |
| T-E6E-002 | 各 wallet provider で eth_requestAccounts 異なる address | EXISTING |
| T-E6E-003 | window.ethereum は最初の wallet のみを指す | EXISTING |
| T-E6E-004 | dappE2e.wallets の unknown rdns access が throw | EXISTING |

## 新規追加 test (本作業)

| test 名 | 検証内容 | AC (受入条件) | 偽陽性リスク |
|---|---|---|---|
| T-E2E-011 | reject mode で personal_sign を 1 度 reject 後、 dappE2e.setApprovalMode('accept') で次回 personal_sign が成功する | reject → setApprovalMode('accept') → personal_sign 成功 (verifyMessage true)、 chained transition で page handler が正常動作 | 4 (mode 切替の副作用が次 test に残らないか) |

### T-E2E-011 詳細

- AC step 1: `setApprovalMode('reject')` 状態で personal_sign を試行 → code 4001 reject (既存 T-E2E-009 と同等の挙動)
- AC step 2: `setApprovalMode('accept')` を呼び mode を切替
- AC step 3: 再度 personal_sign を試行 → 正常に signature が返り `verifyMessage` で true 判定
- AC step 4: page DOM `#sign-error` が消えて `#sign-result` に signature 表示
- AC step 5: test 終了時 anvil state がリセット (snapshot/revert 不要、 anvil 自体は別 test で新規起動)

## contract 改変

なし (basic-connect は contract を持たない wallet inject 用 example)。

## scope 境界 (やらないこと明示)

- 別 mode (`auto-accept-once`) や複数 mode 連続切替は対象外
- EIP-6963 wallet 経由の mode 切替は対象外 (主 wallet `dappE2e` API のみ)
- gas 推定 / chain id 切替などの secondary RPC は対象外

## 影響範囲

- 既存 test 14 件への regression 可能性: 低 (新 test 追加のみ、 既存 helper API の追加呼び出し)
- 他 example への影響: なし
- core helper への影響: `setApprovalMode` API が既存仕様通り動くことの確認 (新 API は追加しない)
