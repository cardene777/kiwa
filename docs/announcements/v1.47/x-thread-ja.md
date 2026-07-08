# kiwa v1.47 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.47 リリース — security-devsecops v0.2 adapter 統合 Phase 2 完成の単軸 milestone。

v0.1 semantics に加えて 6 axis × mock/real adapter pair (12 adapter) を追加、 実 CLI (semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype) 呼出隠蔽の interface + env-gate + fidelity harness を確立。

## Tweet 2 — adapter interface + env-gate

6 adapter interface = SastAdapter + ScaAdapter + SecretAdapter + IacAdapter + DastAdapter + ContainerAdapter。 default 経路 = mock (test 常時実行可能)、 real 経路 = KIWA_SECURITY_MODE=real + 各 CLI URL env 設定時のみ opt-in、 未設定時 explicit throw で fail-closed。

## Tweet 3 — fidelity harness + skill 4 種 SSOT

dogfood-security-devsecops-adapter-app で mock/real 一致検証 harness (runAdapterWorkflow + diffFidelity)、 v0.3 で real adapter が spawn 実装に置換されても継続使用可能。 security-audit / supply-chain / specialty / threat-model 4 skill × mock/real 経路 map を concept doc に SSOT 化。

## Tweet 4 — 25 milestone snippet streak + backward compat

**25 milestone 連続 snippet validation streak** (v1.23-v1.47) 達成、 kiwa 史上最長記録更新継続。 backward compat 絶対維持 = v0.1 semantics function API 変更 0、 v0.2 adapter は新規 optional path。

`pnpm add -D @kiwa-test/security-devsecops@^0.2`。 migration: https://cardene777.github.io/kiwa/migrations/v1.46-to-v1.47

7 sub 完遂 (v1.47-1 adapter interface + 6 mock / v1.47-2 6 real adapter + env-gate / v1.47-3 dogfood adapter app / v1.47-4 skill 4 種 SSOT / v1.47-5 tutorial 105 + snippet 25 streak / v1.47-6 publish / v1.47-7 retrospective)。

#kiwa #devsecops #adapter #security #testing #vitest
