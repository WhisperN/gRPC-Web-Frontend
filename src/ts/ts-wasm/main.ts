import {Criteria, Ticket} from "@/gen/Flight_pb";
import {FlightServiceClient} from "@/gen/FlightServiceClientPb";

export interface arrowClient {
    clientService: FlightServiceClient;
    criteria: Criteria;
    ticket: Ticket;
}

/**
 * start the flight client to receive message
 * Modifications:
 * content-type: application/grpc-web+proto
 */
export async function startFlightClientBinary(): Promise<arrowClient> {
    const ticketBytes = new TextEncoder().encode("sPlotPositions");
    const ticket = new Ticket();
    ticket.setTicket(ticketBytes);

    return {
        clientService: new FlightServiceClient('https://localhost:9090', null, null),
        criteria: new Criteria(),
        ticket: ticket,
    }
}

export async function collectDataset(ac: arrowClient) {
    const chunks: Uint8Array[] = [];
    let stream = ac.clientService.doGet(ac.ticket);
    await new Promise<void>((resolve, reject) => {
        stream.on('data', (fd) => {
            const body = fd.getDataBody_asU8();
        });
        stream.on('end', resolve);
        stream.on('error', reject);
    });
    return chunks;
}

/**
 * Collects Arrow Flight frames and reconstructs a valid Arrow IPC STREAM buffer
 * (Schema/Dictionary/RecordBatch messages), suitable for DuckDB's
 * insertArrowFromIPCStream(...).
 *
 * Arrow IPC STREAM framing:
 * - Each message is preceded by a 4-byte continuation marker 0xFFFFFFFF
 *   and a 4-byte little-endian length of the flatbuffers header.
 * - The header bytes follow.
 * - Then a 4-byte little-endian body length (sum of buffers) and the body bytes.
 * - Body is padded to 8-byte alignment.
 */
export async function collectDatasetFramed(ac: arrowClient): Promise<Uint8Array> {
    const frames: { header: Uint8Array; body: Uint8Array }[] = [];

    const stream = ac.clientService.doGet(ac.ticket);
    console.log("got the dataset frame");
    await new Promise<void>((resolve, reject) => {
        stream.on('data', (fd) => {
            const header = fd.getDataHeader_asU8?.() ?? fd.getDataHeader();
            const body = fd.getDataBody_asU8?.() ?? fd.getDataBody();
            const h = header instanceof Uint8Array ? header : new Uint8Array(header || []);
            const b = body instanceof Uint8Array ? body : new Uint8Array(body || []);
            frames.push({header: h, body: b});
        });
        stream.on('end', resolve);
        stream.on('error', reject);
    });

    console.log("now the processing");
    // Helper: write 32-bit little-endian int
    const writeI32LE = (view: DataView, offset: number, value: number) => {
        view.setInt32(offset, value, true);
    };
    // Helper: round up to 8-byte alignment
    const pad8 = (n: number) => (n + 7) & ~7;

    // Compute total size
    let total = 0;
    for (const {header, body} of frames) {
        const headerLen = header.byteLength;
        const bodyLen = body.byteLength;
        const paddedBodyLen = pad8(bodyLen);
        // 4 (cont) + 4 (headerLen) + header + 4 (bodyLen) + body + padding
        total += 4 + 4 + headerLen + 4 + paddedBodyLen;
    }

    const out = new Uint8Array(total);
    const dv = new DataView(out.buffer);
    let off = 0;

    for (const {header, body} of frames) {
        // continuation marker 0xFFFFFFFF
        dv.setUint32(off, 0xFFFFFFFF, true);
        off += 4;
        // header length
        writeI32LE(dv, off, header.byteLength);
        off += 4;
        // header bytes
        out.set(header, off);
        off += header.byteLength;
        // body length
        writeI32LE(dv, off, body.byteLength);
        off += 4;
        // body bytes
        out.set(body, off);
        off += body.byteLength;
        // 8-byte padding for body
        const pad = pad8(body.byteLength) - body.byteLength;
        if (pad) {
            out.fill(0, off, off + pad);
            off += pad;
        }
    }
    console.log("end of function");

    return out;
}

import type { ClientReadableStream } from 'grpc-web';

export function grpcWebToAsyncIterable<T>(s: ClientReadableStream<T>): AsyncIterable<T> {
    const q: (T | null)[] = [];
    let wake: (() => void) | null = null;

    s.on('data', (msg) => { q.push(msg); if (wake) { wake(); wake = null; } });
    s.on('end',  () => { q.push(null); if (wake) { wake(); wake = null; } });
    s.on('error',() => { q.push(null); if (wake) { wake(); wake = null; } });

    return {
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    while (!q.length) await new Promise<void>(r => (wake = r));
                    const v = q.shift();
                    return v === null ? { done: true, value: undefined } : { done: false, value: v! };
                }
            };
        }
    };
}
