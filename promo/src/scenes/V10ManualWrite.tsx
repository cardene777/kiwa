import { SceneLayout } from "../components/SceneLayout";
import { CodeBlock } from "../components/CodeBlock";
import { t } from "../tokens";

const manualLines = [
  { text: "// tests/userLogin.test.ts" },
  { text: 'import { describe, it, expect } from "vitest";' },
  { text: 'import { login } from "../src/login";' },
  { text: "" },
  { text: 'describe("userLogin", () => {' },
  { text: '  it("正しい認証情報でログインできる", async () => {' },
  { text: '    const res = await login("alice@example.com", "valid");' },
  { text: "    expect(res.status).toBe(200);" },
  { text: "    expect(res.session).toBeDefined();" },
  { text: "  });" },
  { text: "" },
  { text: '  it("誤ったパスワードでエラー", async () => {' },
  { text: '    const res = await login("alice@example.com", "wrong");' },
  { text: "    expect(res.status).toBe(401);" },
  { text: '    expect(res.error).toMatch(/invalid/i);' },
  { text: "  });" },
  { text: "" },
  { text: '  it("連続失敗5回でロック", async () => {' },
  { text: "    for (let i = 0; i < 5; i++) {" },
  { text: '      await login("alice@example.com", "wrong");' },
  { text: "    }" },
  { text: '    const res = await login("alice@example.com", "valid");' },
  { text: "    expect(res.status).toBe(429);" },
  { text: "  });" },
  { text: "});" },
];

export const V10ManualWrite: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().v10ManualEyebrow}
      headline={t().v10ManualHeadline}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
          minHeight: 0,
        }}
      >
        <div style={{ width: 1200, display: "flex", minHeight: 0 }}>
          <CodeBlock
            title="tests/userLogin.test.ts"
            language="ts"
            lines={manualLines}
            width="100%"
            height="100%"
            fontSize={20}
            startFrame={20}
            lineRevealSpeed={5}
          />
        </div>
      </div>
    </SceneLayout>
  );
};
