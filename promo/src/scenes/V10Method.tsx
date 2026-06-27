import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

export const V10Method: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subEnter = spring({
    frame: frame - 26,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1]);

  const chips = t().v10MethodChips;
  const row1 = chips.slice(0, 6);
  const row2 = chips.slice(6, 11);

  const renderChip = (chip: string, idx: number, baseStart: number) => {
    const enter = spring({
      frame: frame - baseStart - idx * 7,
      fps,
      from: 0,
      to: 1,
      durationInFrames: 18,
      config: { damping: 14, mass: 0.7, stiffness: 120 },
    });
    const opacity = interpolate(enter, [0, 1], [0, 1]);
    const ty = interpolate(enter, [0, 1], [12, 0]);
    return (
      <div
        key={chip}
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 28,
          fontWeight: 600,
          color: tokens.color.white,
          background: `${tokens.color.primary}1A`,
          border: `1.5px solid ${tokens.color.primary}`,
          borderRadius: 999,
          padding: "14px 28px",
          opacity,
          transform: `translateY(${ty}px)`,
          letterSpacing: 0.5,
        }}
      >
        {chip}
      </div>
    );
  };

  return (
    <SceneLayout
      eyebrow={t().v10MethodEyebrow}
      headline={t().v10MethodHeadline}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 30,
            fontWeight: 500,
            color: tokens.color.primary,
            letterSpacing: 3,
            opacity: subOpacity,
          }}
        >
          {t().v10MethodSub}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            {row1.map((chip, idx) => renderChip(chip, idx, 60))}
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            {row2.map((chip, idx) => renderChip(chip, idx + 6, 60))}
          </div>
        </div>
      </div>
    </SceneLayout>
  );
};
