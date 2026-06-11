import { useCurrentFrame, interpolate, Sequence } from "remotion";
import { Background } from "../components/Background";
import { KiwaLogo } from "../components/KiwaLogo";
import { BoundaryEffect } from "../components/BoundaryEffect";
import { tokens, t } from "../tokens";

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();

  const taglineOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [40, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Background>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: tokens.spacing.md,
        }}
      >
        <KiwaLogo size={360} fadeInDuration={25} scaleFrom={0.5} />
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 96,
            fontWeight: 700,
            color: tokens.color.white,
            letterSpacing: -2,
            opacity: interpolate(frame, [20, 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [20, 50], [10, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          {t().productName}
        </div>
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 28,
            fontWeight: 400,
            color: tokens.color.textMuted,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            maxWidth: 800,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {t().tagline}
        </div>
      </div>
      <Sequence from={80}>
        <BoundaryEffect startFrame={0} duration={40} />
      </Sequence>
    </Background>
  );
};
