export const tokens = {
  color: {
    bg: "#0F1419",
    bgGradientEnd: "#1A1F2E",
    primary: "#7CB342",
    primaryDark: "#5A8A2E",
    accent: "#A0E060",
    white: "#FFFFFF",
    textMuted: "#8B95A8",
    boundaryLine: "#7CB342",
  },
  font: {
    sans: '"Inter", -apple-system, "Segoe UI", "Helvetica Neue", sans-serif',
    mono: '"JetBrains Mono", "Menlo", "Courier New", monospace',
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 64,
    xl: 128,
  },
  text: {
    tagline: "Test every layer of your dApp — from one spec.",
    taglineJa: "1 つの仕様書から、 dApp の全テスト layer を。",
    productName: "kiwa",
    npmUrl: "npm install @kiwa-test/core",
    repoUrl: "github.com/cardene777/kiwa",
  },
  fps: 30,
} as const;
