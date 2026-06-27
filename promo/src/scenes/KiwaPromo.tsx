import { Series } from "remotion";
import { V10BrandIntro } from "./V10BrandIntro";
import { V10Problem } from "./V10Problem";
import { V10Explain } from "./V10Explain";
import { V10Solution } from "./V10Solution";
import { V10Method } from "./V10Method";
import { V10Coverage } from "./V10Coverage";
import { V10Loop } from "./V10Loop";
import { V10DemoWeb } from "./V10DemoWeb";
import { V10DemoContract } from "./V10DemoContract";
import { V10DemoDapp } from "./V10DemoDapp";
import { V10ManualWrite } from "./V10ManualWrite";
import { V10Cta } from "./V10Cta";
import { V10BrandOutro } from "./V10BrandOutro";
import { tokens } from "../tokens";

export const KiwaPromo: React.FC = () => {
  const f = tokens.fps;
  return (
    <Series>
      <Series.Sequence durationInFrames={5 * f}>
        <V10BrandIntro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <V10Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={5 * f}>
        <V10Explain />
      </Series.Sequence>
      <Series.Sequence durationInFrames={8 * f}>
        <V10Solution />
      </Series.Sequence>
      <Series.Sequence durationInFrames={5 * f}>
        <V10Method />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <V10Coverage />
      </Series.Sequence>
      <Series.Sequence durationInFrames={7 * f}>
        <V10Loop />
      </Series.Sequence>
      <Series.Sequence durationInFrames={22 * f}>
        <V10DemoWeb />
      </Series.Sequence>
      <Series.Sequence durationInFrames={22 * f}>
        <V10DemoContract />
      </Series.Sequence>
      <Series.Sequence durationInFrames={22 * f}>
        <V10DemoDapp />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <V10ManualWrite />
      </Series.Sequence>
      <Series.Sequence durationInFrames={4 * f}>
        <V10Cta />
      </Series.Sequence>
      <Series.Sequence durationInFrames={5 * f}>
        <V10BrandOutro />
      </Series.Sequence>
    </Series>
  );
};
