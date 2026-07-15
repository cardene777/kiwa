import type { MetadataEntry } from './metadata.js';
import type { GrpcStatusCode } from './status.js';

export type GrpcProvider = 'grpc-js' | 'nice-grpc' | 'twirp' | 'connect';

export type MethodType = 'unary' | 'server-stream' | 'client-stream' | 'bidi';

export type GrpcMetadata = MetadataEntry[];

export type { GrpcStatusCode };

export interface MethodDefinition {
  name: string;
  type: MethodType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => any;
}

export interface ServiceDefinition {
  name: string;
  methods: Map<string, MethodDefinition>;
}

export interface GrpcServer {
  provider: GrpcProvider;
  services: Map<string, ServiceDefinition>;
  addService: (service: ServiceDefinition) => void;
  getMethod: (service: string, method: string) => MethodDefinition | undefined;
}

export interface CreateGrpcServerOptions {
  provider?: GrpcProvider;
}

export function createGrpcServer(options: CreateGrpcServerOptions = {}): GrpcServer {
  const provider = options.provider ?? 'grpc-js';
  const services = new Map<string, ServiceDefinition>();
  return {
    provider,
    services,
    addService(service: ServiceDefinition): void {
      services.set(service.name, service);
    },
    getMethod(serviceName: string, methodName: string): MethodDefinition | undefined {
      return services.get(serviceName)?.methods.get(methodName);
    },
  };
}

export function defineService(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methods: Array<{ name: string; type: MethodType; handler: (...args: any[]) => any }>,
): ServiceDefinition {
  const map = new Map<string, MethodDefinition>();
  for (const m of methods) {
    map.set(m.name, { name: m.name, type: m.type, handler: m.handler });
  }
  return { name, methods: map };
}
