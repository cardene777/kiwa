export type TestLayer = 'contract' | 'unit' | 'integration' | 'e2e' | 'api' | 'ui' | 'data' | 'cli';

export type TestMode = 'mock' | 'live' | 'hybrid';

export interface TestEnvBase<TMode extends TestMode = TestMode> {
  mode: TMode;
  stop: () => Promise<void>;
}

export interface SpecCase {
  id: string;
  observation: string;
  given: string;
  when: string;
  then: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  automation: 'yes' | 'no' | 'manual';
  mode?: TestMode;
  route?: string;
  notes?: string;
}

export interface SpecDoc {
  module: string;
  layer: TestLayer;
  cases: SpecCase[];
  raw: string;
  warnings: string[];
}

export interface Lease<T> {
  value: T;
  release: () => Promise<void>;
}

export interface Pool<T> {
  size: number;
  borrow: () => Promise<Lease<T>>;
  stopAll: () => Promise<void>;
}
