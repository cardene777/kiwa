import { tokens } from "../tokens";

type Panel = {
  label: string;
  badge?: string;
  content: React.ReactNode;
  accent?: string;
};

type Props = {
  panels: Panel[];
  gap?: number;
};

export const SplitScreen: React.FC<Props> = ({ panels, gap = 24 }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        gap,
        minHeight: 0,
      }}
    >
      {panels.map((panel, idx) => {
        const accent = panel.accent ?? tokens.color.primary;
        return (
          <div
            key={idx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: tokens.spacing.sm,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.spacing.sm,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: accent,
                  boxShadow: `0 0 14px ${accent}`,
                }}
              />
              <div
                style={{
                  fontFamily: tokens.font.sans,
                  fontWeight: 700,
                  fontSize: 30,
                  color: tokens.color.white,
                }}
              >
                {panel.label}
              </div>
              {panel.badge && (
                <div
                  style={{
                    marginLeft: "auto",
                    fontFamily: tokens.font.mono,
                    fontSize: 18,
                    color: accent,
                    border: `1px solid ${accent}`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontWeight: 600,
                  }}
                >
                  {panel.badge}
                </div>
              )}
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
              }}
            >
              {panel.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};
