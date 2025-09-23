import {
    AsyncDuckDB,
    AsyncDuckDBConnection,
    ConsoleLogger,
    createWorker,
    getJsDelivrBundles,
    selectBundle
} from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";

export class Duck_db_instance {
    public conn: AsyncDuckDBConnection | undefined;
    public duckdb: AsyncDuckDB | undefined;
    private httpfsReady = false;

    async init(): Promise<void> {
        const bundles = getJsDelivrBundles();
        const bundle = await selectBundle({ mvp: bundles.mvp }); // MVP reicht (dev)
        const worker = await createWorker(bundle.mainWorker!);
        const logger = new ConsoleLogger();
        const db = new AsyncDuckDB(logger, worker);

        try {
            await db.instantiate(bundle.mainModule);   // MVP: kein pthreadWorker
        } catch (e) {
            console.error("Failed to instantiate duckdb-wasm:", e);
            throw e;
        }

        console.info("[DuckDB] bundle=", bundle);
        this.duckdb = db;
        this.conn = await db.connect();
        await this.ensureHttpfs();
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    private async ensureHttpfs() {
        if (!this.conn || this.httpfsReady) return;
        try { await this.conn.query("INSTALL httpfs"); } catch {}
        try { await this.conn.query("LOAD httpfs"); } catch {}
        try { await this.conn.query("SET enable_http_metadata_cache=true"); } catch {}
        //try { await this.conn.query("SET http_max_threads=8"); } catch {}
        //try { await this.conn.query("SET s3_url_style='path'"); } catch {}
        this.httpfsReady = true;
    }

    public get_httpfs_status() {
        return this.httpfsReady;
    }

    public getConn() {
        return this.conn;
    }

    public getDuckDB() {
        return this.duckdb;
    }
}

