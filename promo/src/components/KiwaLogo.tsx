import { Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

type Props = {
  size: number;
  fadeInDuration?: number;
  scaleFrom?: number;
};

export const KiwaLogo: React.FC<Props> = ({
  size,
  fadeInDuration = 20,
  scaleFrom = 0.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    from: scaleFrom,
    to: 1,
    config: {
      damping: 12,
      mass: 0.8,
      stiffness: 100,
    },
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile("kiwa-logo.png")}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
    </div>
  );
};
