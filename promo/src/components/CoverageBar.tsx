import { useCurrentFrame, interpolate } from "remotion";
import { tokens } from "../tokens";

type Metric = {
  label: string;
  target: number;
  delayFrames?: number;
};

type Props = {
  metrics: Metric[];
  width?: number | string;
  duration?: number;
  fontSize?: number;
};

export const CoverageBar: React.FC<Props> = ({
  metrics,
  width = 960,
  duration = 30,
  fontSize = 32,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacing.md,
        fontFamily: tokens.font.mono,
      }}
    >
      {metrics.map((metric, idx) => {
        const start = metric.delayFrames ?? idx * 6;
        const localFrame = frame - start;
        const value = interpolate(localFrame, [0, duration], [0, metric.target], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const percent = Math.round(value * 10) / 10;
        const isComplete = percent >= metric.target;

        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                color: tokens.color.white,
                fontSize,
              }}
            >
              <span style={{ fontWeight: 500 }}>{metric.label}</span>
              <span
                style={{
                  fontWeight: 700,
                  color: isComplete ? tokens.color.accent : tokens.color.primary,
                  fontSize: fontSize * 1.1,
                  textShadow: isComplete ? `0 0 16px ${tokens.color.accent}` : "none",
                }}
              >
                {percent.toFixed(2)}%
              </span>
            </div>
            <div
              style={{
                height: 18,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 9,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                  boxShadow: isComplete
                    ? `0 0 16px ${tokens.color.primary}`
                    : "none",
                  transition: "background 0.3s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
