export type WSOpcode = 'continuation' | 'text' | 'binary' | 'close' | 'ping' | 'pong' | 'reserved';

export interface WSBinaryFrame {
  opcode: WSOpcode;
  fin: boolean;
  masked: boolean;
  payloadLength: number;
  payload: Uint8Array;
}

const OPCODE_MAP: Record<number, WSOpcode> = {
  0x0: 'continuation',
  0x1: 'text',
  0x2: 'binary',
  0x8: 'close',
  0x9: 'ping',
  0xa: 'pong',
};

/**
 * RFC 6455 binary frame parse mock。 real ws.parser の subset (fin + opcode + mask + payload)。
 * mask key + extended payload length は簡易対応。
 */
export function captureBinaryFrame(frame: Uint8Array): WSBinaryFrame {
  if (frame.length < 2) throw new Error('frame too short');
  const b0 = frame[0] ?? 0;
  const b1 = frame[1] ?? 0;
  const fin = (b0 & 0x80) !== 0;
  const opcodeRaw = b0 & 0x0f;
  const opcode = OPCODE_MAP[opcodeRaw] ?? 'reserved';
  const masked = (b1 & 0x80) !== 0;
  let payloadLength = b1 & 0x7f;
  let offset = 2;
  if (payloadLength === 126) {
    payloadLength = ((frame[2] ?? 0) << 8) | (frame[3] ?? 0);
    offset = 4;
  } else if (payloadLength === 127) {
    // 簡易 = 上位 4 byte は 0 前提、 下位 4 byte のみ読む
    payloadLength =
      ((frame[6] ?? 0) << 24) | ((frame[7] ?? 0) << 16) | ((frame[8] ?? 0) << 8) | (frame[9] ?? 0);
    offset = 10;
  }
  let maskKey: Uint8Array | undefined;
  if (masked) {
    maskKey = frame.slice(offset, offset + 4);
    offset += 4;
  }
  let payload = frame.slice(offset, offset + payloadLength);
  if (masked && maskKey) {
    payload = new Uint8Array(payload);
    for (let i = 0; i < payload.length; i += 1) {
      const p = payload[i] ?? 0;
      const k = maskKey[i % 4] ?? 0;
      payload[i] = p ^ k;
    }
  }
  return { opcode, fin, masked, payloadLength, payload };
}

/**
 * text / binary payload を simple frame にエンコード (unmasked、 server → client 経路想定)。
 */
export function encodeBinaryFrame(opcode: WSOpcode, payload: Uint8Array): Uint8Array {
  const opcodeMap: Partial<Record<WSOpcode, number>> = {
    continuation: 0x0,
    text: 0x1,
    binary: 0x2,
    close: 0x8,
    ping: 0x9,
    pong: 0xa,
  };
  const opRaw = opcodeMap[opcode] ?? 0x2;
  const b0 = 0x80 | opRaw;
  let header: Uint8Array;
  if (payload.length < 126) {
    header = new Uint8Array([b0, payload.length]);
  } else if (payload.length < 0x10000) {
    header = new Uint8Array([b0, 126, (payload.length >> 8) & 0xff, payload.length & 0xff]);
  } else {
    header = new Uint8Array([
      b0,
      127,
      0,
      0,
      0,
      0,
      (payload.length >> 24) & 0xff,
      (payload.length >> 16) & 0xff,
      (payload.length >> 8) & 0xff,
      payload.length & 0xff,
    ]);
  }
  const frame = new Uint8Array(header.length + payload.length);
  frame.set(header, 0);
  frame.set(payload, header.length);
  return frame;
}
