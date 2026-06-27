import { Series } from "remotion";
import { V9BrandIntro } from "./V9BrandIntro";
import { V9Explain } from "./V9Explain";
import { V9Method } from "./V9Method";
import { V9Coverage } from "./V9Coverage";
import { V9Flow } from "./V9Flow";
import { V9Paths } from "./V9Paths";
import { V9Cta } from "./V9Cta";
import { V9BrandOutro } from "./V9BrandOutro";
import { tokens } from "../tokens";

export const KiwaPromo: React.FC = () => {
  const f = tokens.fps;
  return (
    <Series>
      <Series.Sequence durationInFrames={2 * f}>
        <V9BrandIntro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <V9Explain />
      </Series.Sequence>
      <Series.Sequence durationInFrames={8 * f}>
        <V9Method />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <V9Coverage />
      </Series.Sequence>
      <Series.Sequence durationInFrames={12 * f}>
        <V9Flow />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <V9Paths />
      </Series.Sequence>
      <Series.Sequence durationInFrames={4 * f}>
        <V9Cta />
      </Series.Sequence>
      <Series.Sequence durationInFrames={2 * f}>
        <V9BrandOutro />
      </Series.Sequence>
    </Series>
  );
};
