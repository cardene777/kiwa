import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.52 codegen axis — React Native 0.76+ Codegen (typed bridge + schema-first + type generation)。
 */
export type CodegenState = 'idle' | 'schema-loaded' | 'spec-generated' | 'type-emitted' | 'build-completed';

export interface CodegenSession {
  target: MobileTarget;
  packageName: string;
  state: CodegenState;
  schemaHash: string | null;
  emittedFiles: string[];
  history: AxisStep<CodegenState>[];
}

function emit(
  session: CodegenSession,
  neutralEvent:
    | 'codegen.schema_loaded'
    | 'codegen.spec_generated'
    | 'codegen.type_emitted'
    | 'codegen.build_completed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<CodegenState> {
  const step: AxisStep<CodegenState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { packageName: session.packageName, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initCodegen(input: {
  target: MobileTarget;
  packageName: string;
}): CodegenSession {
  if (input.packageName.length === 0) throw new Error('initCodegen: packageName must not be empty');
  return {
    target: input.target,
    packageName: input.packageName,
    state: 'idle',
    schemaHash: null,
    emittedFiles: [],
    history: [],
  };
}

export function loadCodegenSchema(
  session: CodegenSession,
  schemaHash: string,
): AxisStep<CodegenState> {
  if (schemaHash.length === 0) throw new Error('loadCodegenSchema: schemaHash must not be empty');
  session.schemaHash = schemaHash;
  session.state = 'schema-loaded';
  return emit(session, 'codegen.schema_loaded', { schemaHash });
}

export function generateSpec(
  session: CodegenSession,
  input: { specCount: number },
): AxisStep<CodegenState> {
  if (session.state !== 'schema-loaded') {
    throw new Error(`generateSpec: session is ${session.state}`);
  }
  if (input.specCount <= 0) throw new Error('generateSpec: specCount must be > 0');
  session.state = 'spec-generated';
  return emit(session, 'codegen.spec_generated', { specCount: input.specCount });
}

export function emitCodegenType(
  session: CodegenSession,
  filePath: string,
): AxisStep<CodegenState> {
  if (filePath.length === 0) throw new Error('emitCodegenType: filePath must not be empty');
  session.emittedFiles.push(filePath);
  session.state = 'type-emitted';
  return emit(session, 'codegen.type_emitted', {
    filePath,
    fileCount: session.emittedFiles.length,
  });
}

export function completeCodegenBuild(session: CodegenSession): AxisStep<CodegenState> {
  if (session.state !== 'type-emitted' && session.state !== 'spec-generated') {
    throw new Error(`completeCodegenBuild: session is ${session.state}`);
  }
  session.state = 'build-completed';
  return emit(session, 'codegen.build_completed', {
    emittedFileCount: session.emittedFiles.length,
  });
}
