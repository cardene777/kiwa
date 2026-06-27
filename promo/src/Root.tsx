import { Composition, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { V10BrandIntro } from "./scenes/V10BrandIntro";
import { V10Problem } from "./scenes/V10Problem";
import { V10Explain } from "./scenes/V10Explain";
import { V10Solution } from "./scenes/V10Solution";
import { V10Method } from "./scenes/V10Method";
import { V10Coverage } from "./scenes/V10Coverage";
import { V10Loop } from "./scenes/V10Loop";
import { V10DemoWeb } from "./scenes/V10DemoWeb";
import { V10DemoContract } from "./scenes/V10DemoContract";
import { V10DemoDapp } from "./scenes/V10DemoDapp";
import { V10ManualWrite } from "./scenes/V10ManualWrite";
import { V10Cta } from "./scenes/V10Cta";
import { V10BrandOutro } from "./scenes/V10BrandOutro";
import { KiwaPromo } from "./scenes/KiwaPromo";
import { tokens } from "./tokens";

const baseProps = { fps: tokens.fps, width: 1920, height: 1080 };

const useNotoSansJP = () => {
  const [handle] = useState(() => delayRender("Loading Noto Sans JP"));
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap";
    link.onload = () => continueRender(handle);
    link.onerror = () => continueRender(handle);
    document.head.appendChild(link);
  }, [handle]);
};

export const RemotionRoot: React.FC = () => {
  useNotoSansJP();
  return (
    <>
      <Composition id="KiwaPromo" component={KiwaPromo} durationInFrames={127 * tokens.fps} {...baseProps} />
      <Composition id="V10BrandIntro" component={V10BrandIntro} durationInFrames={5 * tokens.fps} {...baseProps} />
      <Composition id="V10Problem" component={V10Problem} durationInFrames={6 * tokens.fps} {...baseProps} />
      <Composition id="V10Explain" component={V10Explain} durationInFrames={5 * tokens.fps} {...baseProps} />
      <Composition id="V10Solution" component={V10Solution} durationInFrames={8 * tokens.fps} {...baseProps} />
      <Composition id="V10Method" component={V10Method} durationInFrames={5 * tokens.fps} {...baseProps} />
      <Composition id="V10Coverage" component={V10Coverage} durationInFrames={6 * tokens.fps} {...baseProps} />
      <Composition id="V10Loop" component={V10Loop} durationInFrames={7 * tokens.fps} {...baseProps} />
      <Composition id="V10DemoWeb" component={V10DemoWeb} durationInFrames={22 * tokens.fps} {...baseProps} />
      <Composition id="V10DemoContract" component={V10DemoContract} durationInFrames={22 * tokens.fps} {...baseProps} />
      <Composition id="V10DemoDapp" component={V10DemoDapp} durationInFrames={22 * tokens.fps} {...baseProps} />
      <Composition id="V10ManualWrite" component={V10ManualWrite} durationInFrames={10 * tokens.fps} {...baseProps} />
      <Composition id="V10Cta" component={V10Cta} durationInFrames={4 * tokens.fps} {...baseProps} />
      <Composition id="V10BrandOutro" component={V10BrandOutro} durationInFrames={5 * tokens.fps} {...baseProps} />
    </>
  );
};
