import { describe, expect, it } from 'vitest';
import {
  createWebRtcTrackMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('webrtc-track axis', () => {
  it('T-SEM-TRK-001 getUserMedia returns audio + video tracks by default', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const stream = await mock.getUserMedia();
    expect(stream.tracks).toHaveLength(2);
    expect(stream.tracks.map((t) => t.kind).sort()).toEqual(['audio', 'video']);
  });

  it('T-SEM-TRK-002 addTrack emits track-add with simulcast layer info for video', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.getUserMedia({ video: true });
    const videoTrack = stream.tracks[0]!;
    await mock.addTrack(videoTrack, stream);
    const addEv = events.find((e) => e.kind === 'track-add');
    expect(addEv).toBeDefined();
    const payload = addEv?.payload as { simulcastLayers: unknown[]; kind: string };
    expect(payload.kind).toBe('video');
    expect(payload.simulcastLayers).toHaveLength(3);
  });

  it('T-SEM-TRK-003 audio tracks have empty simulcast layers', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const stream = await mock.getUserMedia({ audio: true });
    const track = stream.tracks[0]!;
    expect(track.kind).toBe('audio');
    expect(track.simulcastLayers).toHaveLength(0);
  });

  it('T-SEM-TRK-004 removeTrack emits track-remove', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.getUserMedia();
    const track = stream.tracks[0]!;
    await mock.addTrack(track, stream);
    await mock.removeTrack(track.id);
    expect(events.some((e) => e.kind === 'track-remove')).toBe(true);
  });

  it('T-SEM-TRK-005 muteTrack / unmuteTrack emit corresponding events', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.getUserMedia();
    const track = stream.tracks[0]!;
    await mock.addTrack(track, stream);
    await mock.muteTrack(track.id);
    await mock.unmuteTrack(track.id);
    expect(events.some((e) => e.kind === 'track-mute')).toBe(true);
    expect(events.some((e) => e.kind === 'track-unmute')).toBe(true);
  });

  it('T-SEM-TRK-006 metrics track add / remove counts', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const stream = await mock.getUserMedia();
    for (const t of stream.tracks) await mock.addTrack(t, stream);
    for (const t of stream.tracks) await mock.removeTrack(t.id);
    const m = mock.getMetrics();
    expect(m.streamsOpened).toBe(2);
    expect(m.streamsClosed).toBe(2);
    expect(m.custom.tracksAdded).toBe(2);
    expect(m.custom.tracksRemoved).toBe(2);
  });
});
