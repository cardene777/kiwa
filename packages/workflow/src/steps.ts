export type WorkflowInput = Record<string, unknown>;
export type WorkflowOutput = Record<string, unknown>;

export interface WorkflowStepContext {
  workflowName: string;
  stepIndex: number;
  attempt: number;
  input: WorkflowInput;
  previous: WorkflowOutput;
}

export interface WorkflowStep {
  name: string;
  run: (ctx: WorkflowStepContext) => Promise<WorkflowOutput> | WorkflowOutput;
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
}

export function defineWorkflow(name: string, steps: WorkflowStep[]): WorkflowDefinition {
  if (steps.length === 0) throw new Error(`workflow "${name}" requires at least one step`);
  return { name, steps };
}

/**
 * 内部 helper — step 群を順次実行して各 step の output を次 step の previous に渡す。
 * 実 provider (Temporal activity / Inngest step) が step 単位で durable state を保持する挙動を再現。
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  input: WorkflowInput,
): Promise<{ output: WorkflowOutput; stepOutputs: WorkflowOutput[] }> {
  const stepOutputs: WorkflowOutput[] = [];
  let previous: WorkflowOutput = {};
  for (let i = 0; i < workflow.steps.length; i += 1) {
    const step = workflow.steps[i]!;
    const ctx: WorkflowStepContext = {
      workflowName: workflow.name,
      stepIndex: i,
      attempt: 1,
      input,
      previous,
    };
    const output = await step.run(ctx);
    stepOutputs.push(output);
    previous = output;
  }
  return { output: previous, stepOutputs };
}
