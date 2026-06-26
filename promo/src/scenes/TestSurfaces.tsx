import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

type Surface = {
  title: string;
  color: string;
  tools: string[];
  delay: number;
  badge?: string;
};

const surfaces: Surface[] = [
  {
    title: "Contract",
    color: tokens.color.accentContract,
    tools: ["Foundry", "Hardhat", "forge", "Solidity"],
    delay: 0,
    badge: "dApp / smart contract",
  },
  {
    title: "API integration",
    color: tokens.color.accentApi,
    tools: ["msw", "supertest", "Vitest"],
    delay: 6,
  },
  {
    title: "Component",
    color: tokens.color.accentComponent,
    tools: ["React", "Vue 3", "Svelte", "Solid", "Lit", "Qwik", "Angular", "Chromium"],
    delay: 12,
    badge: "8 adapters",
  },
  {
    title: "E2E",
    color: tokens.color.accentE2e,
    tools: ["Playwright", "anvil", "viem", "EIP-6963"],
    delay: 18,
    badge: "dApp wallet inject",
  },
  {
    title: "A11y / Visual",
    color: tokens.color.accentA11y,
    tools: ["axe-core", "pixelmatch", "pngjs"],
    delay: 24,
  },
  {
    title: "Data / CLI / Obs.",
    color: tokens.color.accentData,
    tools: ["queue + clock", "shell IO", "flaky detect"],
    delay: 30,
  },
];

const TILE_W = 440;
const TILE_H = 230;
const GAP = 30;
const COLS = 3;
const ROWS = 2;
const GRID_W = COLS * TILE_W + (COLS - 1) * GAP;
const GRID_H = ROWS * TILE_H + (ROWS - 1) * GAP;

const SurfaceTile: React.FC<{ surface: Surface; index: number }> = ({ surface, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 20 - surface.delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 105 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [32, 0]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);

  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = col * (TILE_W + GAP);
  const top = row * (TILE_H + GAP);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: TILE_W,
        height: TILE_H,
        background: `linear-gradient(135deg, ${surface.color}18 0%, ${surface.color}03 100%)`,
        border: `2px solid ${surface.color}`,
        borderRadius: 16,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: `0 0 28px ${surface.color}30`,
        padding: "22px 28px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacing.xs,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 38,
            fontWeight: 800,
            color: surface.color,
            letterSpacing: -0.6,
          }}
        >
          {surface.title}
        </div>
        {surface.badge && (
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 14,
              fontWeight: 600,
              color: tokens.color.bg,
              background: surface.color,
              padding: "4px 10px",
              borderRadius: 999,
              letterSpacing: 0.4,
              whiteSpace: "nowrap",
            }}
          >
            {surface.badge}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 4,
        }}
      >
        {surface.tools.map((tool) => (
          <div
            key={tool}
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 18,
              fontWeight: 500,
              color: tokens.color.white,
              background: `${surface.color}25`,
              border: `1px solid ${surface.color}60`,
              padding: "5px 10px",
              borderRadius: 6,
              letterSpacing: 0.3,
            }}
          >
            {tool}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TestSurfaces: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().eyebrowSurfaces}
      headline={t().headlineSurfaces}
    >
      <div
        style={{
          position: "relative",
          width: GRID_W,
          height: GRID_H,
        }}
      >
        {surfaces.map((surface, i) => (
          <SurfaceTile key={surface.title} surface={surface} index={i} />
        ))}
      </div>
    </SceneLayout>
  );
};
