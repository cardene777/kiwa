import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

type ColumnProps = {
  title: string;
  lines: string[];
  startFrame: number;
};

const PathColumn: React.FC<ColumnProps> = ({ title, lines, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const ty = interpolate(enter, [0, 1], [22, 0]);

  return (
    <div
      style={{
        flex: 1,
        background: "#0B0F18",
        border: `2px solid ${tokens.color.primary}`,
        borderRadius: 16,
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        opacity,
        transform: `translateY(${ty}px)`,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 36,
          fontWeight: 700,
          color: tokens.color.white,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {lines.map((line, idx) => {
          const lineEnter = spring({
            frame: frame - startFrame - 20 - idx * 8,
            fps,
            from: 0,
            to: 1,
            durationInFrames: 18,
            config: { damping: 14, mass: 0.7, stiffness: 110 },
          });
          const lo = interpolate(lineEnter, [0, 1], [0, 1]);
          const lty = interpolate(lineEnter, [0, 1], [10, 0]);
          return (
            <div
              key={idx}
              style={{
                fontFamily: tokens.font.mono,
                fontSize: 22,
                fontWeight: 500,
                color: tokens.color.textMuted,
                letterSpacing: 0.5,
                opacity: lo,
                transform: `translateY(${lty}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  color: tokens.color.primary,
                  fontWeight: 700,
                  width: 18,
                  display: "inline-block",
                }}
              >
                ✓
              </span>
              <span>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const V9Paths: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowEnter = spring({
    frame: frame - 6,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const eyebrowOpacity = interpolate(eyebrowEnter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 70,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 24,
              fontWeight: 500,
              color: tokens.color.primary,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: eyebrowOpacity,
            }}
          >
            {t().v9PathsEyebrow}
          </div>
          <MaskRevealText
            text={t().v9PathsHeadline}
            startFrame={16}
            fontSize={tokens.locale === "ja" ? 52 : 50}
            fontWeight={700}
            color={tokens.color.white}
            letterSpacing={-1}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: 32,
            minHeight: 0,
          }}
        >
          <PathColumn
            title={t().v9PathsAiTitle}
            lines={[t().v9PathsAiLine1, t().v9PathsAiLine2, t().v9PathsAiLine3]}
            startFrame={60}
          />
          <PathColumn
            title={t().v9PathsManualTitle}
            lines={[t().v9PathsManualLine1, t().v9PathsManualLine2, t().v9PathsManualLine3]}
            startFrame={90}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
