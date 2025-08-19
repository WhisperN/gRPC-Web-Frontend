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