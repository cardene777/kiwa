# kiwa migration guides

Per-milestone migration guides that walk you through the code changes needed to consume a new kiwa release. Every guide covers what changed, why, and the exact patches to apply.

## Milestone index

| Milestone | Guide | Breaking? | Focus |
|---|---|---|---|
| [v1.9 → v1.10](./v1.9-to-v1.10.md) | ✅ | Additive-only | Supabase Auth + RabbitMQ + Rust contract layer |
| [v1.10 → v1.11](./v1.10-to-v1.11.md) | ✅ | Additive-only | Quality metrics harness + dogfood app pattern + GitHub Pages |
| [v1.11 → v1.12](./v1.11-to-v1.12.md) | ✅ | Additive-only | AI-LLM 4 SDK mocks + 11-axis release gate + fidelity harness |
| [v1.12 → v1.13](./v1.12-to-v1.13.md) | ✅ | Additive-only | Realtime 4 provider mocks + time-axis SSOT + perf-harness |
| [v1.13 → v1.14](./v1.13-to-v1.14.md) | ✅ | Additive-only | Payment + Search + Telemetry + Go Iris/Chi |
| [v1.14 → v1.15](./v1.14-to-v1.15.md) | ✅ | Additive-only | AI-LLM multimodal + MCP + agent orchestration |

## Style

- **Additive-only** migrations still get a guide — telling users *what to add* is often more useful than telling them *what to change*.
- Every code change is shown as a diff or full replacement, never as a description ("update your imports").
- Each guide ends with a `## Verification` section covering how to check the migration succeeded — usually a single `pnpm test` or `cargo test` command.

## Legacy migration content

The pre-v1.9 migration steps are in the repo-root [`docs/MIGRATION.md`](../MIGRATION.md) (English) / [`docs/MIGRATION.ja.md`](../MIGRATION.ja.md) (Japanese). From v1.10 forward every milestone has its own file in this directory.
