# Choose render, interaction, or snapshot

> [日本語](/libraries/foundation/ui/guides/choose-a-mode)

Choose a `setupComponentEnv` mode that matches the UI contract you need to verify.

## Render mode

Use this mode to check the initial DOM, roles, labels, and test IDs. `env.kind` is `"render"`, `env.mode` is `"mock"`, and you can use `screen` and `result`. It suits display tests that do not require user interaction.

## Interaction mode

Use this mode to check the display after clicks, input, or keyboard actions. It requires `@testing-library/user-event`; `env.kind` is `"interaction"`, and `env.user` is available. Write assertions from the actions a user performs, rather than against internal implementation functions.

## Snapshot mode

Use `env.markup` to get rendered HTML. `env.kind` is `"snapshot"` and `env.mode` is `"mock"`. Treat it as a supplementary check for important markup changes; use render or interaction tests as well for interaction and accessibility verification.

In every mode, call `await env.stop()` when the test finishes.
