import { Composition, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { Opening } from "./scenes/Opening";
import { Problem } from "./scenes/Problem";
import { Solution } from "./scenes/Solution";
import { DemoSpec } from "./scenes/DemoSpec";
import { DemoSpecResult } from "./scenes/DemoSpecResult";
import { DemoTest } from "./scenes/DemoTest";
import { Coverage } from "./scenes/Coverage";
import { Install } from "./scenes/Install";
import { Outro } from "./scenes/Outro";
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
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap";
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
        durationInFrames={65 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Opening"
        component={Opening}
        durationInFrames={4 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Problem"
        component={Problem}
        durationInFrames={7 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Solution"
        component={Solution}
        durationInFrames={8 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="DemoSpec"
        component={DemoSpec}
        durationInFrames={10 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="DemoSpecResult"
        component={DemoSpecResult}
        durationInFrames={8 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="DemoTest"
        component={DemoTest}
        durationInFrames={9 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Coverage"
        component={Coverage}
        durationInFrames={6 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Install"
        component={Install}
        durationInFrames={10 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={3 * tokens.fps}
        {...baseProps}
      />
    </>
  );
};
