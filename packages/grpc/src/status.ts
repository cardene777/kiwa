export const STATUS_CODES = Object.freeze({
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
});

export type GrpcStatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];

export interface GrpcStatus {
  code: GrpcStatusCode;
  message: string;
  details?: unknown;
}

export function encodeStatus(status: GrpcStatus): { 'grpc-status': string; 'grpc-message': string } {
  return {
    'grpc-status': String(status.code),
    'grpc-message': encodeURIComponent(status.message),
  };
}

export function decodeStatus(headers: Record<string, string>): GrpcStatus {
  const code = Number(headers['grpc-status'] ?? '0') as GrpcStatusCode;
  const message = decodeURIComponent(headers['grpc-message'] ?? '');
  return { code, message };
}
