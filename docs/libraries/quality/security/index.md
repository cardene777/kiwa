# Security

`@kiwa-lab/security` は、アプリケーションの security policy を外部基盤なしで検証する test harness です。CSP、authorization、rate limit、WAF、secret scan、SBOM、security header の判断を、入力と verdict が明確な test にします。reverse proxy や browser を起動する前に、どの request を許可し、どの request を拒否し、どの warning を運用へ渡すかを固定したいときに使います。

![request へ CSP と認可と rate limit と WAF を適用して verdict を返す流れ](/images/kiwa-docs/quality/security-overview.png)

## 制御を一つの pass 判定に混ぜない

security control は互いに代替しません。CSP header が正しくても authorization が誤れば保護にはならず、WAF が warn を返してもアプリケーションの input validation を省略できません。この library では control ごとに event と verdict を作るので、CSP の source expression、RBAC と ABAC の permission、rate limiter の残量、WAF rule の action を別の assertion として書けます。失敗したときに policy、identity、request volume、input pattern のどこを直すべきかが分かります。

`buildCspHeader` は browser に渡す header を組み立て、nonce や hash と `strict-dynamic` の組み合わせを検証します。`createRbacPolicy` と `rbacAllows` は role の継承を展開して permission を判断します。`TokenBucket`、`SlidingWindow`、`DistributedRateLimiter` は容量と時刻を明示した rate-limit の分岐を再現します。`createWafPolicy` と `evaluateWaf` は rule に一致した request を allow、warn、block のどれにするかを返します。

## 供給経路と運用の判断も test にする

secret scan、SBOM、license、security header、threat model の API は、deploy 前の設定や依存を決められた入力として評価します。たとえば repository に残った token の検出、SBOM の advisory 照合、HSTS と Permissions-Policy の妥当性を、CI の外部 provider が失敗しても再現できる unit test にできます。fidelity check は mock と real driver が出す event と verdict を比較するものです。production traffic への侵入試験ではありません。

advanced semantics には mTLS、zero trust、SIEM audit、incident response、crypto、Kubernetes、supply chain、web vitals の状態遷移があります。これらも実サービスへ接続せず、許された操作順と拒否条件を test する目的です。real driver を選ぶのは `KIWA_MODE=real` と provider ごとの接続設定がそろった場合だけにし、秘密情報を通常の unit test へ持ち込まないでください。

## 実環境で別に確認すること

この library は gateway、WAF appliance、identity provider、browser、scanner、Kubernetes cluster を起動しません。CSP が実 browser で script を block すること、reverse proxy が request を正規化すること、distributed rate limit が複数 process 間で共有されること、scanner が本物の repository と advisory feed を読むことは、実 provider を使う integration test と CI で確認します。ここでは policy の意図と結果をまず決定的に固定します。

## 読み進める

[Quickstart](./quickstart) では nonce 付き CSP header を作って検証します。[使い方](./how-to) では CSP、RBAC、rate limit、WAF を別々の test として実行します。全 axis と real driver の前提は [リファレンス](./reference) にあります。
