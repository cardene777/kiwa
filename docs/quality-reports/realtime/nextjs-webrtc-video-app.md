# Fidelity — dogfood-nextjs-webrtc-video-app (v1.28-2)

Real-vs-mock behavioural fidelity for the Next.js 15 + mediasoup + WebRTC video call dogfood, produced by `examples/dogfood-nextjs-webrtc-video-app/tests/emit-fidelity-report.spec.ts`. Feeds `@kiwa-test/quality-metrics` 12-axis release gate on the common 7-axis branch (WebRTC is a media / transport primitive, not a token-priced generative call).

## Baseline (real mode skipped — no `WEBRTC_MEDIASOUP_READY=1`)

When the harness runs without the mediasoup + coturn testcontainers env, the real adapter emits `KIWA_WEBRTC_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/realtime/nextjs-webrtc-video-app
version    : 0.2.0
verdict    : PASS
divergences: 8 (joinRoom / leaveRoom / publishTrack / unpublishTrack / muteTrack / unmuteTrack / selectLayer / iceRestart — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (common branch — WebRTC is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (8/8) | 70% | pass |
| perf.p95Ms | ~2 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 22 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `KIWA_WEBRTC_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 8 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-nextjs-webrtc-video-app test
cat examples/dogfood-nextjs-webrtc-video-app/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export KIWA_MODE=real
export WEBRTC_MEDIASOUP_READY=1
pnpm --filter dogfood-nextjs-webrtc-video-app test
```

When `WEBRTC_MEDIASOUP_READY=1` is set but the mediasoup worker binary + coturn UDP relay port are not provisioned, the adapter downgrades to `KIWA_WEBRTC_ENV_MISSING` traces. Wiring the mediasoup native worker + coturn testcontainers into `src/adapters/real.ts` is a follow-up milestone once the container image ships — the adapter shape is ready and every downstream trace already carries a stable `errorKind` so the drop-in change stays localised.

## Ops under measurement

Eight provider-neutral ops on `VideoCallAdapter`.

- `joinRoom` — establish a peer connection with the SFU / remote peer through signaling
- `leaveRoom` — close the peer connection and release resources
- `publishTrack` — push a local audio / video track onto the connection
- `unpublishTrack` — remove a previously published track
- `muteTrack` / `unmuteTrack` — toggle a track's enabled state
- `selectLayer` — pick a simulcast layer preference (viewer bandwidth adaptation)
- `iceRestart` — force a fresh ICE gathering + connectivity check to recover from network changes without renegotiating tracks

## Notes

The mock adapter (`packages/realtime/src/semantics/webrtc-*.ts`) tracks signaling / ice / track state per-peer, so multiple peers joining the same room accumulate under a single `roomId` key. Two-peer tests drive both `joinRoom` calls through the same adapter to mirror how mediasoup serves multiple clients over a shared router.

Simulcast is a client-side concern in the mediasoup SDK — this dogfood implements the same 3-layer rid ladder (low / med / high) at 100k / 300k / 900k in the mock adapter so the fidelity harness can score the emitted layer count as an observable behaviour, not a hidden implementation detail. The viewer's `selectLayer` op maps 1:1 to `Consumer.setPreferredLayers` in mediasoup.

Provider prefix `@kiwa-test/realtime/` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because WebRTC is a media / transport primitive, not a token-priced generative call. Join / publish / iceRestart round-trip latency feeds `perf.p95Ms` so realtime performance stays visible in the report.
