import {FlightServiceClient} from "@/gen/FlightServiceClientPb";
import {Criteria, FlightData, Ticket} from "@/gen/Flight_pb";
import * as duckdb from '@duckdb/duckdb-wasm';
import {DuckDBConnection} from "@duckdb/duckdb-wasm/blocking";
import {AsyncDuckDBConnection} from "@duckdb/duckdb-wasm";
import {RecordBatchReader} from "apache-arrow";

export interface arrowClient {
    clientService: FlightServiceClient;
    criteria: Criteria;
    ticket: Ticket;
}

type DoGetResponse = { getDataHeader_asU8: () => Uint8Array; getDataBody_asU8: () => Uint8Array };

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

export class ParquetClient {
    private db: AsyncDuckDBConnection | null = null;
    private httpfsReady = false;

    private async ensureHttpfs() {
        if (!this.db || this.httpfsReady) return;
        await this.db.query("INSTALL httpfs");
        await this.db.query("LOAD httpfs");
        // Optional but helpful for remote parquet performance
        await this.db.query("SET enable_http_metadata_cache=true");
        this.httpfsReady = true;
    }

    async initialize(): Promise<void> {
        const bundle = await duckdb.selectBundle({
            mvp: duckdb.getJsDelivrBundles().mvp,
        });
        const worker = await duckdb.createWorker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        try {
            // Use the MVP bundle without pthreads to avoid cross-origin isolation/pthread issues
            await db.instantiate(bundle.mainModule);
        } catch (e) {
            console.error("Failed to instantiate duckdb-wasm:", e);
            throw e;
        }
        console.info("Finished instantiate bundle client");

        this.db = await db.connect();
    }

    // Load Parquet from HTTP endpoint
    async loadParquetFromURL(url: string, tableName: string){
        console.log(`Loading parquet from URL: ${url}`);
        if (!this.db) {
            throw new Error("ParquetClient not initialized. Call initialize() first.");
        }
        await this.ensureHttpfs();
        const query = `
            CREATE OR REPLACE TABLE "${tableName}" AS 
            SELECT * FROM read_parquet('${url}');
        `;

        console.info("A");
        await this.db.query(query);
        console.info("B");

        console.log(`Loaded parquet from ${url} into table ${tableName}`);
    }

    async queryData(tableName: string): Promise<any> {
        if (!this.db) {
            throw new Error("ParquetClient not initialized. Call initialize() first.");
        }
        const query = `SELECT * FROM sPlotPositions LIMIT 10;`;
        console.info(query);
        const result = await this.db.query(query);
        if (!result || result.numRows === 0) {
            console.warn(`Query returned no rows for table ${tableName}`);
            return [];
        }
        console.info(toPlain(result));
        // @ts-ignore
        return result.toArray();
    }
}

export function toPlain(result: any): any[] {
    // Spaltennamen aus dem DuckDB-Result ziehen
    const cols = result?.schema?.fields?.map((f: any) => f.name) ?? [];
    const rows = result.toArray();

    if (cols.length === 0) {
        // Fallback: flaches Spread der Proxy-Objekte (für einfache Typen ok)
        // @ts-ignore
        return rows.map((r: any) => ({ ...r }));
    }
    // Sauber: pro Zeile ein Plain-Object mit allen Spalten
    return rows.map((r: any) => Object.fromEntries(cols.map((c: string) => [c, r[c]])));
}