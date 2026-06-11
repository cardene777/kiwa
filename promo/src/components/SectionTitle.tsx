import { useCurrentFrame, interpolate } from "remotion";
import { tokens } from "../tokens";

type Props = {
  eyebrow: string;
  headline: string;
  startFrame?: number;
};

export const SectionTitle: React.FC<Props> = ({
  eyebrow,
  headline,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame() - startFrame;

  const eyebrowOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(frame, [6, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [6, 20], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacing.sm,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 22,
          fontWeight: 500,
          color: tokens.color.primary,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: eyebrowOpacity,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 64,
          fontWeight: 700,
          color: tokens.color.white,
          letterSpacing: -1.5,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          lineHeight: 1.1,
        }}
      >
        {headline}
      </div>
    </div>
  );
};
