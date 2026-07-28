# macos-app

`@kiwa-lab/macos-app` は、SwiftUI または AppKit のビュー木、操作、アクセシビリティ、通知を検証するハーネスです。Xcode や XCTest を起動せず、メモリ上の native app 環境を扱います。

<img src="/images/kiwa-docs/application/macos-app-overview.webp" alt="Macアプリ環境で操作と通知を観測する流れ" width="1200" height="675" loading="lazy" decoding="async">

## 検証する流れ

`MacAppEnv` は SwiftUI または AppKit の初期ビュー木を持ちます。click、keypress、gesture、focus を実行すると、target が見つかったか、enabled だったか、どの event が記録されたかを確認できます。アクセシビリティ木、決定的な PNG または JPEG の byte 列、通知の schedule と拒否も同じ環境で検証できます。

SwiftUI の state 更新、AppKit responder chain、XCTest、実 AX API、GPU capture、UserNotifications は実行しません。ボタンの有効状態、role、通知に付ける action を速く固定するテストに使い、実 macOS 上の振る舞いは統合テストで補ってください。まず [Quickstart](./quickstart) で既定の Start ボタンを操作し、[使い方](./how-to) で accessibility と通知を追加します。個々の API と mock の境界は [リファレンス](./reference) を参照してください。Web UI は [ui](../../foundation/ui/)、a11y の rule 検証は [a11y](../../quality/a11y/) を参照してください。
