import { useCurrentFrame } from "remotion";
import { tokens } from "../tokens";

type Props = {
  color?: string;
  width?: number;
  height?: number;
};

export const Caret: React.FC<Props> = ({
  color = tokens.color.primary,
  width = 12,
  height = 26,
}) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 14) % 2 === 0 ? 1 : 0.25;
  return (
    <span
      style={{
        display: "inline-block",
        width,
        height,
        marginLeft: 4,
        marginBottom: -4,
        background: color,
        opacity: blink,
        verticalAlign: "middle",
      }}
    />
  );
};
