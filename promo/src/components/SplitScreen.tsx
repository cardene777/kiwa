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

export const SplitScreen: React.FC<Props> = ({ panels, gap = 32 }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        gap,
        padding: tokens.spacing.lg,
        boxSizing: "border-box",
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
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: tokens.spacing.sm,
                padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: accent,
                  boxShadow: `0 0 12px ${accent}`,
                }}
              />
              <div
                style={{
                  fontFamily: tokens.font.sans,
                  fontWeight: 600,
                  fontSize: 22,
                  color: tokens.color.white,
                }}
              >
                {panel.label}
              </div>
              {panel.badge && (
                <div
                  style={{
                    fontFamily: tokens.font.mono,
                    fontSize: 16,
                    color: accent,
                    border: `1px solid ${accent}`,
                    borderRadius: 6,
                    padding: "2px 8px",
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
