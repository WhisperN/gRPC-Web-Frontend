/* We implement this as a ring buffer.
 * Advantages: Memory cannot grow exponentially.
 * Disadvantage: When ring is full, memory will be overwritten.
 */

const DEFAULT_RING_SIZE = 1 << 28; // this should be 256 MiB

export interface SharedArrayRingBuffer {
    sab: SharedArrayBuffer;
    u8: Uint8Array;
    idxSab: SharedArrayBuffer;
    idx: Int32Array;
    size: number;
}

export function createRing(size: number = DEFAULT_RING_SIZE): SharedArrayRingBuffer {
    const sab = new SharedArrayBuffer(size);
    const u8 = new Uint8Array(sab);
    const idxSab = new SharedArrayBuffer(8); // two Uint32 indices: write and read
    const idx = new Int32Array(idxSab);
    idx[0] = 0; // Important so we dont do accidental operations on it.
    idx[1] = 0;
    return { sab, u8, idxSab, idx, size }
}


/** Function is deprecated and will be removed soon. */
export function ringWrite(sarb: SharedArrayRingBuffer, chunk: Uint8Array): boolean {
    const { u8, idx, size } = sarb;
    const write = Atomics.load(idx, 0);
    const read = Atomics.load(idx, 1);

    // memory safety
    const free = (read+size-write-1) % size;
    if (chunk.byteLength > free) return false;

    const end = (write + chunk.byteLength)%size;
    if (end<write) {
        u8.set(chunk.subarray(0, size-write), write);
        u8.set(chunk.subarray(size-write), 0);
    } else {
        u8.set(chunk, write);
    }
    Atomics.store(idx, 0, (write + chunk.byteLength)%size);
    Atomics.notify(idx, 0);
    return true;
}

/** Free bytes left in the ring (keeps one byte gap to distinguish full vs empty). */
export function freeBytes(sarb: SharedArrayRingBuffer): number {
    const write = Atomics.load(sarb.idx, 0);
    const read  = Atomics.load(sarb.idx, 1);
    return (read - write - 1 + sarb.size) % sarb.size;
}

/**
 * Dump an array of Uint8Array parts into the ring (non-blocking).
 * Returns false immediately if any chunk doesn't fit at the moment.
 */
export function dumpChunksToSAB(
    sarb: SharedArrayRingBuffer,
    parts: readonly Uint8Array[]
): boolean {
    for (const chunk of parts) {
        if (chunk.byteLength === 0) continue;
        if (!ringWrite(sarb, chunk)) {
            throw new Error(`SARB full: failed to write ${chunk.byteLength} (free=${freeBytes(sarb)})`);
        }
    }
    return true;
}

/**
 * We need a function to load data too...
 * We transform the
 */
export function loadChunksFromSAB(
    sarb: SharedArrayRingBuffer,
    maxBytes?: number
): Uint8Array[] {
    const { u8, idx, size } = sarb;

    // Snapshot indices atomically
    const write = Atomics.load(idx, 0);
    const read  = Atomics.load(idx, 1);

    // Compute available bytes (modulo arithmetic). Keep one byte gap invariant in writer.
    let available = (write - read + size) % size;
    if (available === 0) return [];

    if (typeof maxBytes === 'number' && maxBytes >= 0) {
        available = Math.min(available, maxBytes);
    }

    const chunks: Uint8Array[] = [];

    if (read + available <= size) {
        // contiguous region, single copy
        const copy = new Uint8Array(available);
        copy.set(u8.subarray(read, read + available));
        chunks.push(copy);
    } else {
        // wrapped region, split into two copies: tail then head
        const firstLen = size - read;
        const secondLen = available - firstLen;
        const copy1 = new Uint8Array(firstLen);
        copy1.set(u8.subarray(read, size));
        const copy2 = new Uint8Array(secondLen);
        copy2.set(u8.subarray(0, secondLen));
        chunks.push(copy1, copy2);
    }

    // Advance read index by the bytes we drained
    Atomics.store(idx, 1, (read + available) % size);
    Atomics.notify(idx, 1);

    return chunks;
}