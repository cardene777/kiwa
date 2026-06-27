import { SceneLayout } from "../components/SceneLayout";
import { Terminal, TerminalLine } from "../components/Terminal";
import { CodeBlock } from "../components/CodeBlock";
import { tokens } from "../tokens";

const passColor = "#4ADE80";
const warnColor = "#FFB74D";

export type DemoCategoryProps = {
  eyebrow: string;
  headline: string;
  designCmd: string;
  designLog: string;
  genCmd: string;
  genLog: string;
  runCmd: string;
  runOk1: string;
  runOk2: string;
  runOk3: string;
  runPass: string;
  reviewCmd: string;
  reviewMid: string;
  patchCmd: string;
  patchLog: string;
  coverageCmd: string;
  coverageLog: string;
  reviewFinal: string;
  codeTitle: string;
  codeLanguage: string;
  codeLines: { text: string }[];
};

export const V10DemoCategory: React.FC<DemoCategoryProps> = (props) => {
  const lines: TerminalLine[] = [
    // Step 1: design
    { prompt: "$", content: props.designCmd, delayFrames: 8, typeSpeed: 2.6 },
    { content: props.designLog, delayFrames: 60, color: tokens.color.primary, bold: true, typeSpeed: 3 },
    { content: "", delayFrames: 92, typeSpeed: 1 },
    // Step 2: gen
    { prompt: "$", content: props.genCmd, delayFrames: 100, typeSpeed: 2.6 },
    { content: props.genLog, delayFrames: 152, color: tokens.color.primary, bold: true, typeSpeed: 3 },
    { content: "", delayFrames: 184, typeSpeed: 1 },
    // Step 3: run
    { prompt: "$", content: props.runCmd, delayFrames: 192, typeSpeed: 2.4 },
    { content: props.runOk1, delayFrames: 224, color: passColor, typeSpeed: 2.6 },
    { content: props.runOk2, delayFrames: 244, color: passColor, typeSpeed: 2.6 },
    { content: props.runOk3, delayFrames: 264, color: passColor, typeSpeed: 2.6 },
    { content: props.runPass, delayFrames: 288, color: passColor, bold: true, typeSpeed: 2 },
    { content: "", delayFrames: 316, typeSpeed: 1 },
    // Step 4: review (1 回目) - 観点漏れ検出
    { prompt: "$", content: props.reviewCmd, delayFrames: 324, typeSpeed: 2.6 },
    { content: props.reviewMid, delayFrames: 380, color: warnColor, bold: true, typeSpeed: 3 },
    { content: "", delayFrames: 412, typeSpeed: 1 },
    // Step 5: patch - 修正
    { prompt: "$", content: props.patchCmd, delayFrames: 420, typeSpeed: 2.6 },
    { content: props.patchLog, delayFrames: 484, color: tokens.color.primary, bold: true, typeSpeed: 3 },
    { content: "", delayFrames: 516, typeSpeed: 1 },
    // Step 6: coverage 確認 + 最終 review
    { prompt: "$", content: props.coverageCmd, delayFrames: 524, typeSpeed: 2.6 },
    { content: props.coverageLog, delayFrames: 572, color: passColor, bold: true, typeSpeed: 3 },
    { content: props.reviewFinal, delayFrames: 612, color: tokens.color.primary, bold: true, typeSpeed: 2 },
  ];

  return (
    <SceneLayout eyebrow={props.eyebrow} headline={props.headline}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: 24,
          minHeight: 0,
        }}
      >
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <CodeBlock
            title={props.codeTitle}
            language={props.codeLanguage}
            lines={props.codeLines}
            width="100%"
            height="100%"
            fontSize={16}
            startFrame={110}
            lineRevealSpeed={3}
          />
        </div>
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <Terminal title="terminal" lines={lines} width="100%" height="100%" fontSize={17} />
        </div>
      </div>
    </SceneLayout>
  );
};
