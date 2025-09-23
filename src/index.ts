import {ParquetServiceClient} from "@/gen/Parquet_serviceServiceClientPb";
import {
    FileChunk,
    GetFileRequest,
    ListFilesRequest,
    ListFilesResponse,
    StatFileRequest,
    StatFileResponse
} from "@/gen/parquet_service_pb";
import * as grpcWeb from 'grpc-web';
import '@/style/main.css';
import '@/style/animate';
import {Duck_db_instance} from "@/ts/ts-http/Duck_db_instance";
import {ParquetService} from "@/ts/ts-http/gRPC";
import {HTTP_Loader} from "@/ts/ts-http/HTTP_loader";
import {fetchLatLonAsTypedArrays} from "@/ts/ts-http/GlobeScatter_V2"
import {tableFromIPC} from "apache-arrow";
import {startGlobeScatter} from "@/ts/ts-wasm/GlobeScatter";
//import {HTTP_Loader} from "@/ts/ts-http/HTTP_Loader";
//import * as http from "node:http";

let db: Duck_db_instance = new Duck_db_instance();
await db.init()
console.info(`Initializing database, (httpfs is set to ${db.get_httpfs_status()})`);
/*
console.info("Launching the ParquetService (gRPC)");
let grpc_server: ParquetService = new ParquetService();
console.info("Collecting data ParquetService (gRPC)");
grpc_server.loadParquetViaGrpcToDuckDB("sPlotPositions.parquet", "sPlotPositions", db.db, 4);
console.log("Done! Lets Check.")
db.db?.query("SELECT * FROM sPlotPositions LIMIT 5;");
*/

console.info("Launching the HTTP_Loader (HTTP plain)")
let http_client: HTTP_Loader = new HTTP_Loader(db);
console.info("Loaded HTTP_Loader (HTTP plain)");

if (!db.get_httpfs_status()) {
    console.info("httpfs is not ready yet...")
}
/*
console.info("Lets try the IPC from the HTTP server");
await http_client.ArrowIPCFromURL(db, "http://localhost:8083/arrow?file=sPlotPositionsUncompressed.arrow", "sPlotPositions");
*/
console.info("Lets try the parquet shit");
await http_client.ParquetFromURL(db,"http://localhost:8083/parquet?file=sPlotPositions.parquet", "sPlotPositions")

/*
let ac: arrowClient = await startFlightClientBinary();
console.info("Flight client done");

const http_client = new ParquetClient();
await http_client.initialize();
console.info("Http client done");

const tableName = "sPlotPositions";

console.info("Going to load the dataset from URL");
await http_client.loadParquetFromURL("http://localhost:8083/parquet?file=sPlotPositions.parquet", tableName);
console.info("Collecting the data");

const result = await http_client.queryData(tableName);
console.info("Query result called");

console.table(result);*/
/*
console.info("Calling database");
const result = await http_client.queryData(db, "sPlotPositions");
console.table(result);*/

console.log("Starting GlobeScatter");
const {lat, lon} = await fetchLatLonAsTypedArrays(
    db.conn,
    "sPlotPositions",
    "Latitude",
    "Longitude",
    "Latitude BETWEEN -85 AND 85"
)

console.info("[GlobeScatter] " + lat.length);

const container = document.getElementById("spinningGlobe") as HTMLDivElement;
console.info(container.getAttribute("class"));
startGlobeScatter({container, lat, lon})
console.info("[GlobeScatter] Code done");