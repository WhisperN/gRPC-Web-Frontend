// CommonJS: Webpack kann diese requires statisch analysieren
import { SharedArrayRingBuffer, createRing, ringWrite } from '@/ts/SharedArrayRingBuffer';
const { Criteria, Ticket,  } = require("@/gen/flight_pb");
const { FlightServicePromiseClient } = require("@/gen/flight_grpc_web_pb");
import { type Schema, type Field } from "apache-arrow";
import { IPCCollector } from "@/ts/IpcDecoder";
import {startGlobeScatter} from "@/ts/GlobeScatter";

export interface arrowClient {
    clientService: any;
    criteria: any;
    ticket: any;
    sarb: SharedArrayRingBuffer;
}

// initiation function
export async function startFlightClient(): Promise<arrowClient> {
    const ticketBytes = new TextEncoder().encode("sPlot");
    const ticket = new Ticket();
    ticket.setTicket(ticketBytes);

    return {
        clientService: new FlightServicePromiseClient('https://localhost:9090', null, null),
        criteria: new Criteria(),
        ticket: ticket,
        sarb: createRing(),
    }
}

// Pick a ticket from the list of flights
export async function getListFlights(ac: arrowClient) {
    let stream = ac.clientService.listFlights(ac.criteria);
    // ... implement ticketing system later.
}

export async function doGet(ac: arrowClient) {
    const stream = ac.clientService.doGet(ac.ticket, {});
    const collector = new IPCCollector();

    stream.on('data', (msg:any) => {
        const header = msg.getDataHeader_asU8?.() as Uint8Array | undefined;
        const body   = msg.getDataBody_asU8?.()   as Uint8Array | undefined;

        // Reassemble IPC correctly: frame *header*, append *raw* body (+pad)
        collector.add(header, body);

        // optional: dein Ringbuffer bleibt wie gehabt
        if (body?.byteLength && !ringWrite(ac.sarb, body)) {
            queueMicrotask(() => {
                if (!ringWrite(ac.sarb, body)) {
                    console.warn('SARB is full; dropping or implement a wait/retry strategy.')
                }
            });
        }
    });

    stream.on('end', () => {
        try {
            const table = collector.toTable();

            // Felder typisiert lesen (TS7006 vermeiden)
            const fields = (table.schema as Schema).fields as unknown as Field[];
            console.log('schema fields:', fields.map((f: Field) => f.name));

            const lonField = fields.findIndex((f: Field) => /^(lon|longitude|x)$/i.test(f.name));
            const latField = fields.findIndex((f: Field) => /^(lat|latitude|y)$/i.test(f.name));

            if (lonField < 0 || latField < 0) {
                console.warn('Could not auto-detect lon/lat columns. Schema fields:', fields.map((f: Field) => f.name));
                return;
            }

            const lon = table.getChildAt(lonField)!.toArray() as Float64Array;
            const lat = table.getChildAt(latField)!.toArray() as Float64Array;

            const host = document.createElement('div') as HTMLDivElement;
            host.style.cssText = 'width:100%;height:720px;position:relative;background:#111';
            document.getElementById('root')!.appendChild(host);

            startGlobeScatter({ container: host, lon, lat });
        } catch (e) {
            console.error('Failed to parse IPC / render globe:', e);
        } finally {
            console.log("Stream has ended");
        }
    });

    stream.on('error', (err: any) => {
        console.error('DoGet stream error: ', err)
    });
}