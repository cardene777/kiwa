import { AbsoluteFill } from "remotion";
import { tokens } from "../tokens";

export const Background: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${tokens.color.bg} 0%, ${tokens.color.bgGradientEnd} 100%)`,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
