import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { tokens } from "../tokens";

type Props = {
  startFrame?: number;
  duration?: number;
};

export const BoundaryEffect: React.FC<Props> = ({
  startFrame = 0,
  duration = 30,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const lineX = interpolate(
    localFrame,
    [0, duration],
    [-100, 100],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const opacity = interpolate(
    localFrame,
    [0, duration / 4, (duration * 3) / 4, duration],
    [0, 0.6, 0.6, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${lineX}%`,
          width: 4,
          background: `linear-gradient(180deg, transparent 0%, ${tokens.color.boundaryLine} 50%, transparent 100%)`,
          opacity,
          boxShadow: `0 0 24px ${tokens.color.boundaryLine}`,
        }}
      />
    </AbsoluteFill>
  );
};
