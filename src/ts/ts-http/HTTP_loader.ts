import {AsyncDuckDB, AsyncDuckDBConnection} from "@duckdb/duckdb-wasm";
import {toPlain} from "@/ts/ts-http/HTTP";
import {Duck_db_instance} from "./Duck_db_instance";
import {tableFromIPC} from "apache-arrow";

export class HTTP_Loader {
    private __httpfs: boolean;
    constructor(db: Duck_db_instance) {
        this.__httpfs = db.get_httpfs_status();
    }

    async ArrowIPCFromURL(db: Duck_db_instance, url: string, tableName: string): Promise<void> {
        if (!this.__httpfs) console.log("[ArrowIPCFromURL] httpfs is set to false...");
        console.info("[ArrowIPCFromURL] continue with the process.");
        // 1) Fast-Path: direkt von URL (benötigt CORS & meist Range-Support)
        try {
            const resp = await fetch(url);
            const buf = new Uint8Array(await resp.arrayBuffer());
            const arrowTable = tableFromIPC(buf);

            // @ts-ignore
            await db.conn?.insertArrowTable(arrowTable, { name: "sPlotPositions" });
            console.log("[ArrowIPCFromURL] Success. Done here.")
            return;
        } catch (e) {
            console.warn("[ArrowIPCFromURL] Fast-Path read_ipc(url) fehlgeschlagen, fallback auf Fetch:", e);
        }
    }
    async ParquetFromURL(db: Duck_db_instance, url: string, tableName: string): Promise<void> {
        if (!this.__httpfs) console.log("[ParquetFromURL] httpfs is set to false...");
        console.log(`Loading parquet from URL: ${url}`);
        if (!db) {
            throw new Error("ParquetClient not initialized. Call initialize() first.");
        }
        const query = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_parquet('${url}');`;

        // @ts-ignore
        await db.conn.query(query);

        console.log(`Loaded parquet from ${url} into table ${tableName}`);
    }

    async queryData(db: Duck_db_instance, tableName: string): Promise<any> {
        if (!db) {
            throw new Error("ParquetClient not initialized. Call initialize() first.");
        }
        const query = `SELECT * FROM sPlotPositions LIMIT 10;`;
        console.info(query);
        // @ts-ignore
        const result = await db.conn.query(query);
        if (!result || result.numRows === 0) {
            console.warn(`Query returned no rows for table ${tableName}`);
            return [];
        }
        console.info(toPlain(result));
        // @ts-ignore
        return result.toArray();
    }
}