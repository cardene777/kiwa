import { SceneLayout } from "../components/SceneLayout";
import { SplitScreen } from "../components/SplitScreen";
import { CodeBlock } from "../components/CodeBlock";
import { t } from "../tokens";

const contractSpecLines = [
  { text: "# test-spec-token-gating.md  (contract)" },
  { text: "" },
  { text: "## Target feature" },
  { text: "GateNFT (ERC721) + GatedContent" },
  { text: "" },
  { text: "## Test cases (26 cases, 11 axes)" },
  { text: "" },
  { text: "### TC-001  mint happy path  (high)" },
  { text: "level    : unit" },
  { text: "input    : (none)" },
  { text: "expected : owner == msg.sender" },
  { text: "" },
  { text: "### TC-013  expiry boundary  (high)" },
  { text: "level    : unit" },
  { text: "input    : ttl = 1, warp +2" },
  { text: "expected : hasAccess == false" },
  { text: "" },
  { text: "### TC-021  grantor escape  (critical)" },
  { text: "level    : security" },
  { text: "expected : reverts NotGated" },
];

const e2eSpecLines = [
  { text: "# test-spec-token-gating.md  (e2e)" },
  { text: "" },
  { text: "## Target feature" },
  { text: "app/page.tsx + wagmi/viem hooks" },
  { text: "" },
  { text: "## Test cases (14 cases, 11 axes)" },
  { text: "" },
  { text: "### TC-002  mint -> balance == 1  (high)" },
  { text: "level    : e2e" },
  { text: "input    : connect alice, click mint" },
  { text: "expected : data-testid=balance == 1" },
  { text: "" },
  { text: "### TC-009  5-state transition  (high)" },
  { text: "level    : e2e" },
  { text: "expected : idle -> minting -> minted" },
  { text: "" },
  { text: "### TC-015  DOM tampering blocked  (critical)" },
  { text: "level    : security" },
  { text: "expected : access denied" },
];

export const DemoSpecResult: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().eyebrowDemoSpecResult}
      headline={t().headlineDemoSpecResult}
    >
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <SplitScreen
          gap={32}
          panels={[
            {
              label: "tests/spec/contract/test-spec-token-gating.md",
              accent: "#FF8A65",
              content: (
                <CodeBlock
                  title="tests/spec/contract/test-spec-token-gating.md"
                  language="markdown"
                  lines={contractSpecLines}
                  width="100%"
                  height="100%"
                  fontSize={22}
                  startFrame={10}
                  lineRevealSpeed={4}
                />
              ),
            },
            {
              label: "tests/spec/e2e/test-spec-token-gating.md",
              accent: "#42A5F5",
              content: (
                <CodeBlock
                  title="tests/spec/e2e/test-spec-token-gating.md"
                  language="markdown"
                  lines={e2eSpecLines}
                  width="100%"
                  height="100%"
                  fontSize={22}
                  startFrame={40}
                  lineRevealSpeed={4}
                />
              ),
            },
          ]}
        />
      </div>
    </SceneLayout>
  );
};
