import {
  defineWorkflow,
  executeWorkflow as executeWorkflowSteps,
  type WorkflowDefinition,
  type WorkflowInput,
  type WorkflowOutput,
  type WorkflowStep,
} from './steps.js';

export type WorkflowProvider = 'temporal' | 'inngest' | 'trigger' | 'aws-sfn';

export interface WorkflowExecutionResult {
  id: string;
  provider: WorkflowProvider;
  workflow: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt: number;
  output?: WorkflowOutput;
  error?: string;
}

export interface WorkflowExecutionRecord extends WorkflowExecutionResult {
  input: WorkflowInput;
  stepOutputs: WorkflowOutput[];
}

export interface WorkflowClient {
  provider: WorkflowProvider;
  register: (workflow: WorkflowDefinition) => void;
  registered: () => WorkflowDefinition[];
  execute: (workflowName: string, input: WorkflowInput) => Promise<WorkflowExecutionResult>;
  listExecutions: () => WorkflowExecutionRecord[];
  clear: () => void;
  defineWorkflow: (name: string, steps: WorkflowStep[]) => WorkflowDefinition;
}

export interface CreateWorkflowClientOptions {
  provider?: WorkflowProvider;
  now?: () => number;
  idSeed?: number;
}

/**
 * provider 別のみ id prefix を差別化し、 execute pipeline は共通実装。 実 provider
 * (Temporal SDK / Inngest / Trigger.dev / AWS SFN) の差し替え可能 signature を再現。
 */
export function createWorkflowClient(options: CreateWorkflowClientOptions = {}): WorkflowClient {
  const provider = options.provider ?? 'temporal';
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  const idPrefix = { temporal: 'wf', inngest: 'ing', trigger: 'trg', 'aws-sfn': 'sfn' }[provider];
  const workflows = new Map<string, WorkflowDefinition>();
  const executions: WorkflowExecutionRecord[] = [];
  let counter = options.idSeed ?? 0;

  return {
    provider,
    register(workflow: WorkflowDefinition): void {
      workflows.set(workflow.name, workflow);
    },
    registered(): WorkflowDefinition[] {
      return [...workflows.values()];
    },
    async execute(workflowName: string, input: WorkflowInput): Promise<WorkflowExecutionResult> {
      counter += 1;
      const id = `${idPrefix}-${counter}`;
      const startedAt = now();
      const workflow = workflows.get(workflowName);
      if (!workflow) {
        const failed: WorkflowExecutionResult = {
          id,
          provider,
          workflow: workflowName,
          status: 'failed',
          startedAt,
          completedAt: startedAt,
          error: `workflow not registered: ${workflowName}`,
        };
        executions.push({ ...failed, input, stepOutputs: [] });
        return failed;
      }
      try {
        const { output, stepOutputs } = await executeWorkflowSteps(workflow, input);
        const completedAt = now();
        const result: WorkflowExecutionResult = {
          id,
          provider,
          workflow: workflowName,
          status: 'completed',
          startedAt,
          completedAt,
          output,
        };
        executions.push({ ...result, input, stepOutputs });
        return result;
      } catch (e) {
        const completedAt = now();
        const failed: WorkflowExecutionResult = {
          id,
          provider,
          workflow: workflowName,
          status: 'failed',
          startedAt,
          completedAt,
          error: (e as Error).message,
        };
        executions.push({ ...failed, input, stepOutputs: [] });
        return failed;
      }
    },
    listExecutions(): WorkflowExecutionRecord[] {
      return [...executions];
    },
    clear(): void {
      executions.length = 0;
      workflows.clear();
    },
    defineWorkflow,
  };
}
