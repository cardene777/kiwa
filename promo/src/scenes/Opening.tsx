import { useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill } from "remotion";
import { KiwaLogo } from "../components/KiwaLogo";
import { BoundaryEffect } from "../components/BoundaryEffect";
import { tokens, t } from "../tokens";

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameEnter = spring({
    frame: frame - 18,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 110 },
  });
  const nameOpacity = interpolate(nameEnter, [0, 1], [0, 1]);
  const nameY = interpolate(nameEnter, [0, 1], [12, 0]);

  const taglineEnter = spring({
    frame: frame - 40,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, mass: 0.9, stiffness: 100 },
  });
  const taglineOpacity = interpolate(taglineEnter, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineEnter, [0, 1], [16, 0]);

  const boundaryStart = 30;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${tokens.color.primary}18 0%, ${tokens.color.bgGradientEnd} 35%, ${tokens.color.bg} 100%)`,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <KiwaLogo size={280} fadeInDuration={22} scaleFrom={0.55} />
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 128,
            fontWeight: 800,
            color: tokens.color.white,
            letterSpacing: -4,
            lineHeight: 1,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            textShadow: `0 0 40px ${tokens.color.primary}40`,
          }}
        >
          {t().productName}
        </div>
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 34,
            fontWeight: 500,
            color: tokens.color.white,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            maxWidth: 1100,
            textAlign: "center",
            lineHeight: 1.4,
            letterSpacing: 0.4,
            marginTop: 12,
          }}
        >
          {t().tagline}
        </div>
      </div>
      {frame >= boundaryStart && (
        <BoundaryEffect startFrame={0} duration={Math.max(0, frame - boundaryStart + 60)} />
      )}
    </AbsoluteFill>
  );
};
