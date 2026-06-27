import { Composition, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { V9BrandIntro } from "./scenes/V9BrandIntro";
import { V9Explain } from "./scenes/V9Explain";
import { V9Method } from "./scenes/V9Method";
import { V9Coverage } from "./scenes/V9Coverage";
import { V9Flow } from "./scenes/V9Flow";
import { V9Paths } from "./scenes/V9Paths";
import { V9Cta } from "./scenes/V9Cta";
import { V9BrandOutro } from "./scenes/V9BrandOutro";
import { KiwaPromo } from "./scenes/KiwaPromo";
import { tokens } from "./tokens";

const baseProps = {
  fps: tokens.fps,
  width: 1920,
  height: 1080,
};

const useNotoSansJP = () => {
  const [handle] = useState(() => delayRender("Loading Noto Sans JP"));

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap";
    link.onload = () => continueRender(handle);
    link.onerror = () => continueRender(handle);
    document.head.appendChild(link);
  }, [handle]);
};

export const RemotionRoot: React.FC = () => {
  useNotoSansJP();
  return (
    <>
      <Composition
        id="KiwaPromo"
        component={KiwaPromo}
        durationInFrames={50 * tokens.fps}
        {...baseProps}
      />
      <Composition id="V9BrandIntro" component={V9BrandIntro} durationInFrames={2 * tokens.fps} {...baseProps} />
      <Composition id="V9Explain" component={V9Explain} durationInFrames={6 * tokens.fps} {...baseProps} />
      <Composition id="V9Method" component={V9Method} durationInFrames={8 * tokens.fps} {...baseProps} />
      <Composition id="V9Coverage" component={V9Coverage} durationInFrames={10 * tokens.fps} {...baseProps} />
      <Composition id="V9Flow" component={V9Flow} durationInFrames={12 * tokens.fps} {...baseProps} />
      <Composition id="V9Paths" component={V9Paths} durationInFrames={6 * tokens.fps} {...baseProps} />
      <Composition id="V9Cta" component={V9Cta} durationInFrames={4 * tokens.fps} {...baseProps} />
      <Composition id="V9BrandOutro" component={V9BrandOutro} durationInFrames={2 * tokens.fps} {...baseProps} />
    </>
  );
};
