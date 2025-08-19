// src/ts/ipc-decoder.ts
import { tableFromIPC, type Table } from "apache-arrow";
import { frameMessageMeta, pad8, concatChunks } from "./IpcFraming";

/**
 * Reassembles Flight DoGet messages (header + body) into a valid Arrow IPC stream.
 * - Header: framed (continuation + length + padded)
 * - Body: raw bytes + padded to 8 bytes (NO framing!)
 */
export class IPCCollector {
    private parts: Uint8Array[] = [];

    add(header?: Uint8Array, body?: Uint8Array) {
        if (header && header.byteLength) {
            this.parts.push(frameMessageMeta(header));
        }
        if (body && body.byteLength) {
            this.parts.push(body);
            const pad = pad8(body.byteLength);
            if (pad) this.parts.push(new Uint8Array(pad)); // zero padding
        }
    }

    toTable(): Table {
        const bytes = concatChunks(this.parts);
        return tableFromIPC(bytes);
    }

    reset() { this.parts = []; }
}