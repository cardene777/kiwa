# @kiwa-lab/macos-app

macOS native app test harness for kiwa — SwiftUI / AppKit / XCTest / accessibility / screencap / UserNotifications を in-process mock で invoke する test infra。

## API

- `createMacAppEnv({ mode })` = mock native app env (bundle info + window / view tree + accessibility descriptor)
- `simulateUserInteraction(env, event)` = click / keypress / gesture event dispatch mock
- `captureAccessibilityTree(env)` = macOS accessibility API 相当の tree snapshot
- `mockScreencap(env, options)` = CGDisplayCreateImage 相当の mock PNG bytes
- `emitUserNotification(env, notification)` = UserNotifications framework mock

## mode

- `swiftui` = declarative SwiftUI 相当 (View tree、 @State トリガー)
- `appkit` = imperative AppKit 相当 (NSWindow / NSView / responder chain)
