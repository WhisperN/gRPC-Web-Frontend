import {
    arrowClient,
    collectDataset, collectDatasetFramed, grpcWebToAsyncIterable,
    startFlightClientBinary,
} from './ts/ts-wasm/main';
import '@/style/main.css';
import '@/style/animate';
import {RecordBatchReader, Table, tableFromIPC} from "apache-arrow";
// src https://www.npmjs.com/package/@duckdb/duckdb-wasm
import * as duckdb from '@duckdb/duckdb-wasm';
import {getConfigFilePathFromCompilerOptions} from "fork-ts-checker-webpack-plugin/lib/typescript/worker/lib/config";

// Select a bundle based on browser checks
const bundle = await duckdb.selectBundle({
    mvp: duckdb.getJsDelivrBundles().mvp,
});

// Instantiate the asynchronous version of DuckDB-wasm
const worker = await duckdb.createWorker(bundle.mainWorker!);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);


let ac: arrowClient = await startFlightClientBinary();
console.log("arrowClient instantiated!");

const flightStream = ac.clientService.doGet(ac.ticket);
console.log("doGet collected!");

const chunks: Uint8Array[] = [];

await new Promise<void>((resolve, reject) => {
    flightStream.on('data', (fd) => {
        chunks.push(fd.getDataBody_asU8());
    });
    flightStream.on('end', resolve);
    flightStream.on('error', reject);
});
console.log("Reading the data");
const reader = await RecordBatchReader.from(chunks);
const table = await reader.readAll();

console.log("done.");

console.log("connecting to database...");
const conn = await db.connect();
console.log("connection instantiated!");
console.log("trying to insert data");

// @ts-ignore
await conn.insertArrowTable(table, {name:"sPlotPositions"});

/*
console.log("Verifiziere Insert mit Preview...");
const result = await conn.query(`SELECT * FROM sPlotPositions LIMIT 20`);
console.table(result.toArray());*/