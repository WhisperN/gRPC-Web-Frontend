// CommonJS: Webpack kann diese requires statisch analysieren
import {SharedArrayRingBuffer, createRing, dumpChunksToSAB, loadChunksFromSAB} from '@/ts/ts-only/SharedArrayRingBuffer';
import {Criteria, FlightData, Ticket} from "@/gen/Flight_pb";
import {FlightServiceClient} from "@/gen/FlightServiceClientPb";
import {type Schema, type Field, tableFromIPC} from "apache-arrow";
import { IPCCollector } from "@/ts/ts-only/IpcDecoder";
import {startGlobeScatter} from "@/ts/ts-wasm/GlobeScatter";

export interface arrowClient {
    clientService: any;
    criteria: any;
    ticket: any;
    sarb: SharedArrayRingBuffer;
}

/**
 * start the flight client to receive messages
 */
export async function startFlightClient(): Promise<arrowClient> {
    const ticketBytes = new TextEncoder().encode("sPlotPositions");
    const ticket = new Ticket();
    ticket.setTicket(ticketBytes);

    return {
        clientService: new FlightServiceClient('https://localhost:9090', null, null),
        criteria: new Criteria(),
        ticket: ticket,
        sarb: createRing(),
    }
}

/**
 * lists the implemented flights that the server has available
 * @param ac
 */
export async function getListFlights(ac: arrowClient) {
    let stream = ac.clientService.listFlights(ac.criteria);
    // ... implement ticketing system later.
}

/**
 * doGet using Typescript as the processing pipeline
 * @param ac
 */
export async function doGet(ac: arrowClient): Promise<SharedArrayRingBuffer> {
    return new Promise<SharedArrayRingBuffer>((resolve, reject) => {
        const stream = ac.clientService.doGet(ac.ticket, {});
        const collector = new IPCCollector();

        stream.on('data', (msg:any) => {
            const header = msg.getDataHeader_asU8?.() as Uint8Array | undefined;
            const body   = msg.getDataBody_asU8?.()   as Uint8Array | undefined;

            // Reassemble IPC correctly: frame *header*, append *raw* body (+pad)
            collector.add(header, body);
        });

        stream.on('end', () => {
            // save dataset to SAB
            if (!dumpChunksToSAB(ac.sarb, collector.parts)) console.warn("Failed to save the collector to memory.");
            resolve(ac.sarb);
        });

        stream.on('error', (err: any) => {
            console.error('DoGet stream error: ', err)
            reject(err);
        });
    });
}

/**
 */
export function startPlot(sb: SharedArrayRingBuffer) {
    const host = document.getElementById('spinningGlobe') as HTMLDivElement;
    const parts: Uint8Array[] = loadChunksFromSAB(sb);

    // Contract all IPC-Parts to one stream
    const total = parts.reduce((n, p) => n+p.byteLength, 0);
    const joined = new Uint8Array(total);
    let off = 0;
    for (const p of parts) { joined.set(p, off); off += p.byteLength; }

    let table;
    try {
        table = tableFromIPC(joined);
    } catch (e) {
        console.error('Failed to parse IPC / render globe:', e);
        return;
    }

    // now the regular processing as we know it
    // Felder typisiert lesen (TS7006 vermeiden)
    const fields = (table.schema as Schema).fields as unknown as Field[];

    // Here we allow a couple of variable with its deviations... We could clean up regex here...
    // TODO: Clean regex
    const lonField = fields.findIndex((f: Field) => /^(lon|longitude|x)$/i.test(f.name));
    const latField = fields.findIndex((f: Field) => /^(lat|latitude|y)$/i.test(f.name));

    if (lonField < 0 || latField < 0) {
        console.warn('Could not auto-detect lon/lat columns. Schema fields:', fields.map((f: Field) => f.name));
        return;
    }

    const lon = table.getChildAt(lonField)!.toArray() as Float64Array;
    const lat = table.getChildAt(latField)!.toArray() as Float64Array;

    startGlobeScatter({ container: host, lat: lat, lon: lon });
}