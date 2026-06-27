import { V10DemoCategory } from "./V10DemoCategory";
import { t } from "../tokens";

const codeLines = [
  { text: "// tests/UserProfile.test.tsx" },
  { text: 'import { describe, it, expect } from "vitest";' },
  { text: 'import { render, screen } from "@testing-library/react";' },
  { text: 'import { UserProfile } from "../UserProfile";' },
  { text: "" },
  { text: 'describe("UserProfile", () => {' },
  { text: '  it("renders user name and email", () => {' },
  { text: "    render(<UserProfile user={alice} />);" },
  { text: '    expect(screen.getByText("Alice")).toBeInTheDocument();' },
  { text: "  });" },
  { text: '  it("shows skeleton while fetching", () => {' },
  { text: "    render(<UserProfile loading />);" },
  { text: '    expect(screen.getByTestId("skeleton")).toBeInTheDocument();' },
  { text: "  });" },
  { text: '  it("falls back on API error", () => {' },
  { text: "    render(<UserProfile error={new Error()} />);" },
  { text: '    expect(screen.getByText(/error/i)).toBeInTheDocument();' },
  { text: "  });" },
  { text: "});" },
];

export const V10DemoWeb: React.FC = () => (
  <V10DemoCategory
    eyebrow={t().v10DemoWebEyebrow}
    headline={t().v10DemoWebHeadline}
    designCmd={t().v10DemoWebDesignCmd}
    designLog={t().v10DemoWebDesignLog}
    genCmd={t().v10DemoWebGenCmd}
    genLog={t().v10DemoWebGenLog}
    runCmd={t().v10DemoWebRunCmd}
    runOk1={t().v10DemoWebRunOk1}
    runOk2={t().v10DemoWebRunOk2}
    runOk3={t().v10DemoWebRunOk3}
    runPass={t().v10DemoWebRunPass}
    reviewCmd={t().v10DemoWebReviewCmd}
    reviewMid={t().v10DemoWebReviewMid}
    patchCmd={t().v10DemoWebPatchCmd}
    patchLog={t().v10DemoWebPatchLog}
    coverageCmd={t().v10DemoWebCoverageCmd}
    coverageLog={t().v10DemoWebCoverageLog}
    reviewFinal={t().v10DemoWebReviewFinal}
    codeTitle="tests/UserProfile.test.tsx"
    codeLanguage="tsx"
    codeLines={codeLines}
  />
);
