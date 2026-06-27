import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { tokens } from "../tokens";

type Props = {
  text: string;
  startFrame?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  letterSpacing?: number;
  fontFamily?: string;
  durationFrames?: number;
  align?: "left" | "center" | "right";
  lineHeight?: number;
};

export const MaskRevealText: React.FC<Props> = ({
  text,
  startFrame = 0,
  fontSize = 120,
  fontWeight = 800,
  color = tokens.color.white,
  letterSpacing = -3,
  fontFamily = tokens.font.sans,
  durationFrames = 28,
  align = "left",
  lineHeight = 1.05,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: durationFrames,
    config: { damping: 18, mass: 1, stiffness: 90 },
  });

  const clipPercent = interpolate(enter, [0, 1], [100, 0]);
  const translateY = interpolate(enter, [0, 1], [fontSize * 0.18, 0]);

  return (
    <div
      style={{
        overflow: "hidden",
        display: "inline-block",
        textAlign: align,
        lineHeight,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          color,
          letterSpacing,
          lineHeight,
          clipPath: `inset(${clipPercent}% 0 0 0)`,
          transform: `translateY(${translateY}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};
