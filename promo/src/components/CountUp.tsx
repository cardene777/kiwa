import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { tokens } from "../tokens";

type Props = {
  target: number;
  startFrame?: number;
  durationFrames?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  fontFamily?: string;
  letterSpacing?: number;
  suffix?: string;
};

export const CountUp: React.FC<Props> = ({
  target,
  startFrame = 0,
  durationFrames = 36,
  fontSize = 220,
  fontWeight = 800,
  color = tokens.color.primary,
  fontFamily = tokens.font.mono,
  letterSpacing = -4,
  suffix,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 20, mass: 0.9, stiffness: 110 },
  });

  const value = interpolate(frame, [0, durationFrames], [0, target], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shown = Math.round(value);

  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        transform: `scale(${scale})`,
        opacity,
        textShadow: `0 0 32px ${color}40`,
        lineHeight: 1,
      }}
    >
      {shown}
      {suffix && <span style={{ fontSize: fontSize * 0.4 }}>{suffix}</span>}
    </div>
  );
};
