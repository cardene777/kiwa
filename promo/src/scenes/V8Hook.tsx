import { AbsoluteFill } from "remotion";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V8Hook: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: 180,
          paddingRight: 180,
          gap: 8,
        }}
      >
        <MaskRevealText
          text={t().v8HookLine1}
          startFrame={6}
          fontSize={148}
          fontWeight={700}
          color={tokens.color.white}
          letterSpacing={-4}
        />
        <MaskRevealText
          text={t().v8HookLine2}
          startFrame={22}
          fontSize={148}
          fontWeight={700}
          color={tokens.color.primary}
          letterSpacing={-4}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
