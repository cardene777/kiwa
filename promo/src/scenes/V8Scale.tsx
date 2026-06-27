import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { CountUp } from "../components/CountUp";
import { tokens, t } from "../tokens";

type Stat = {
  num: string;
  label: string;
  startFrame: number;
  color: string;
};

export const V8Scale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowEnter = spring({
    frame: frame - 6,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const eyebrowOpacity = interpolate(eyebrowEnter, [0, 1], [0, 1]);

  const stats: Stat[] = [
    { num: t().v8ScaleNumA, label: t().v8ScaleLabelA, startFrame: 18, color: tokens.color.primary },
    { num: t().v8ScaleNumB, label: t().v8ScaleLabelB, startFrame: 70, color: tokens.color.primary },
    { num: t().v8ScaleNumC, label: t().v8ScaleLabelC, startFrame: 122, color: tokens.color.primary },
  ];

  const footerEnter = spring({
    frame: frame - 180,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 26,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const footerOpacity = interpolate(footerEnter, [0, 1], [0, 1]);
  const footerY = interpolate(footerEnter, [0, 1], [16, 0]);

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: 120,
          paddingRight: 120,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 28,
            fontWeight: 500,
            color: tokens.color.primary,
            letterSpacing: 8,
            textTransform: "uppercase",
            opacity: eyebrowOpacity,
            marginBottom: 80,
          }}
        >
          {t().v8ScaleEyebrow}
        </div>
        <div
          style={{
            display: "flex",
            gap: 160,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {stats.map((stat) => {
            const target = parseInt(stat.num, 10);
            const labelEnter = spring({
              frame: frame - stat.startFrame - 26,
              fps,
              from: 0,
              to: 1,
              durationInFrames: 22,
              config: { damping: 16, mass: 1, stiffness: 100 },
            });
            const labelOpacity = interpolate(labelEnter, [0, 1], [0, 1]);
            const labelY = interpolate(labelEnter, [0, 1], [12, 0]);
            return (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <CountUp
                  target={target}
                  startFrame={stat.startFrame}
                  durationFrames={36}
                  fontSize={260}
                  color={stat.color}
                />
                <div
                  style={{
                    fontFamily: tokens.font.sans,
                    fontSize: 32,
                    fontWeight: 500,
                    color: tokens.color.white,
                    letterSpacing: 0.5,
                    opacity: labelOpacity,
                    transform: `translateY(${labelY}px)`,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 100,
            fontFamily: tokens.font.mono,
            fontSize: 26,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 4,
            opacity: footerOpacity,
            transform: `translateY(${footerY}px)`,
          }}
        >
          {t().v8ScaleFooter}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
