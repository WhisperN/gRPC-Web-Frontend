// src/ts/ipc-framing.ts

/** Round up to next multiple of 8 */
export function pad8(n: number): number {
    const r = n & 7;
    return r === 0 ? 0 : 8 - r;
}

/** Frame Arrow IPC *metadata* (header) with continuation + length + padding */
export function frameMessageMeta(header: Uint8Array): Uint8Array {
    const len = header.byteLength;
    const pad = pad8(len);
    const out = new Uint8Array(8 + len + pad);

    // 0xFFFFFFFF continuation token
    out[0] = 0xFF; out[1] = 0xFF; out[2] = 0xFF; out[3] = 0xFF;

    // 32-bit little-endian length (metadata length)
    out[4] =  len         & 0xFF;
    out[5] = (len >>> 8)  & 0xFF;
    out[6] = (len >>> 16) & 0xFF;
    out[7] = (len >>> 24) & 0xFF;

    out.set(header, 8); // metadata bytes
    // trailing zeros are the padding
    return out;
}

/** Concatenate chunks */
export function concatChunks(chunks: Uint8Array[]): Uint8Array {
    let total = 0;
    for (const c of chunks) total += c.byteLength;
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.byteLength; }
    return out;
}