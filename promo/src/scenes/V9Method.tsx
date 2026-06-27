import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V9Method: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chips = t().v9MethodChips;

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
          gap: 28,
        }}
      >
        <MaskRevealText
          text={t().v9MethodHeadline}
          startFrame={6}
          fontSize={tokens.locale === "ja" ? 96 : 92}
          fontWeight={800}
          color={tokens.color.primary}
          letterSpacing={-2}
          align="center"
        />
        <MaskRevealText
          text={t().v9MethodSub}
          startFrame={26}
          fontSize={32}
          fontWeight={500}
          color={tokens.color.textMuted}
          letterSpacing={3}
          fontFamily={tokens.font.mono}
          align="center"
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            maxWidth: 1500,
            marginTop: 40,
          }}
        >
          {chips.map((chip, idx) => {
            const enter = spring({
              frame: frame - 56 - idx * 7,
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
                  padding: "12px 24px",
                  opacity,
                  transform: `translateY(${ty}px)`,
                  letterSpacing: 0.5,
                }}
              >
                {chip}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
