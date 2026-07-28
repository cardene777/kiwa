# Release Invariants

`@kiwa-lab/release-invariants` は、monorepo の release script が守るべき文字列ベースの契約を test する library です。publishable package が build、publish、mutation gate のすべてに含まれること、script に許可しない `--provenance` が入っていないことを、publish を始める前に確認します。release workflow の一部を静かに取りこぼす変更を CI で止める用途です。

<img src="/images/kiwa-docs/quality/release-invariants-overview.webp" alt="release script と provenance と coverage を検査して summary または violations を返す流れ" width="1672" height="941" loading="lazy" decoding="async">

## package ごとの release 経路を照合する

`buildReleaseInvariantsSummary` に release script、mutation gate script、publishable package を渡すと、三つの検査をまとめた summary を返します。release script の build filter と publish filter が対になっているか、mutation gate がすべての publishable package を対象にしているか、provenance flag が混入していないかを、個別の結果と `ok` で確認できます。CI では `ok` だけでなく、漏れた package 名を assertion して修正箇所を明らかにします。

`checkReleaseScriptFilter` は build と publish の対象を、`checkGateScriptPackageCoverage` は mutation gate の `-F <package>` を、`checkProvenanceFlagAbsence` は script 中の flag を確認します。三つを分けて呼べば、release policy のどの契約だけを変更したかを限定して test できます。

## 文字列検査の限界を理解する

この library は shell を parse も実行もしません。検出するのは `-F <package>`、`--filter <package>`、`--provenance` という文字列です。変数展開、別 script の呼び出し、引用符、package manager の実行結果、registry に publish できるかは確認できません。script の構造を変える場合は対象形式を Reference で確認し、実際の release は別の CI integration test で検証してください。

## 読み進める

[Quickstart](./quickstart) では正常な release script と mutation gate の漏れを test にします。[使い方](./how-to) では provenance と package coverage を個別に診断します。検査対象の形式と summary の shape は [リファレンス](./reference) にあります。
