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

export class ParquetService {
    private client: ParquetServiceClient;
    private metadata: grpcWeb.Metadata;

    constructor() {
        this.client = new ParquetServiceClient("https://localhost:9090", null, null);
        this.metadata = this.createMetadata();
    }

    private createMetadata(): grpcWeb.Metadata {
        return {
            "content-type": "application/grpc-web+proto",
        };
    }

    // ListFiles mit Promise für einfachere Handhabung
    async listFiles(directory: string = "."): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const request = new ListFilesRequest();
            request.setDirectory(directory);

            this.client.listFiles(
                request,
                this.metadata,
                (err: any | null, response: ListFilesResponse | null) => {
                    if (err) {
                        console.error("ListFiles error:", err.message);
                        reject(new Error(`gRPC Error: ${err.message}`));
                        return;
                    }
                    if (!response) {
                        reject(new Error("Empty response received"));
                        return;
                    }
                    resolve(response.getFilesList());
                }
            );
        });
    }

    // StatFile Methode
    async statFile(filename: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = new StatFileRequest();
            request.setPath(filename);

            this.client.statFile(
                request,
                this.metadata,
                (err: any | null, response: StatFileResponse | null) => {
                    if (err) {
                        console.error("StatFile error:", err.message);
                        reject(err);
                        return;
                    }
                    if (!response) {
                        reject(new Error("Empty response received"));
                        return;
                    }
                    resolve(response.toObject());
                }
            );
        });
    }

    // GetFile Methode (Streaming example)
    async getFile(filename: string, onChunk: (chunk: FileChunk) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = new GetFileRequest();
            request.setPath(filename);

            const stream = this.client.getFile(request, this.metadata);

            stream.on("data", (chunk: FileChunk) => {
                onChunk(chunk);
            });

            stream.on("end", () => {
                resolve();
            });

            stream.on("error", (err: any) => {
                console.error("GetFile stream error:", err.message);
                reject(err);
            });
        });
    }

    async loadParquetViaGrpcToDuckDB(
        serverPath: string,     // z.B. "flights.parquet" (relativ zum Server base_dir)
        tableName: string,      // z.B. "flights"
        db: any,                // AsyncDuckDB
        chunkSize = 1 << 20     // 1 MiB
    ) {
        // 1) Stream vom gRPC-Web Endpoint holen
        const req = new GetFileRequest();
        req.setPath(serverPath);
        req.setChunkSize(chunkSize);

        const chunks: Uint8Array[] = [];
        let received = 0;

        await new Promise<void>((resolve, reject) => {
            const stream = this.client.getFile(req, {});
            stream.on("data", (msg: FileChunk) => {
                const part = msg.getData_asU8();
                chunks.push(part);
                received += part.byteLength;
            });
            stream.on("error", (e) => reject(e));
            stream.on("end", () => resolve());
        });

        // 2) Zu einem einzigen Buffer zusammenbauen
        const total = received;
        const buf = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { buf.set(c, offset); offset += c.byteLength; }

        // 3) Bei DuckDB als "Datei" registrieren
        const fileName = `${tableName}.parquet`;  // rein virtueller Name
        await db.registerFileBuffer(fileName, buf);

        // 4) Tabelle materialisieren
        const conn = await db.connect();
        try {
            await conn.query(`
      CREATE OR REPLACE TABLE "${tableName}" AS
      SELECT * FROM read_parquet('${fileName}');
    `);
        } finally {
            await conn.close();
        }

        // Optional: Buffer wieder freigeben (falls API vorhanden)
        // await db.dropFile(fileName);

        return { bytes: total, fileName };
    }
    // Hilfsfunktion: OPFS-Datei anlegen & schreiben
    async writeToOPFS(pathInOpfs: string, chunks: Uint8Array[]) {
        // OPFS Wurzel
        // @ts-ignore - types können je nach TS lib variieren
        const root = await navigator.storage.getDirectory();
        // Pfad rekursiv anlegen
        const parts = pathInOpfs.split("/").filter(Boolean);
        let dir = root;
        for (let i = 0; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i], { create: true });
        }
        const fileHandle = await dir.getFileHandle(parts[parts.length - 1], { create: true });
        const w = await fileHandle.createWritable({ keepExistingData: false });
        try {
            for (const c of chunks) {
                //@ts-ignore
                await w.write(c);
            }
        } finally {
            await w.close();
        }
    }

    async loadParquetViaGrpcToDuckDB_OPFS(
        serverPath: string,
        tableName: string,
        db: any,
        chunkSize = 1 << 20
    ) {
        // 1) gRPC-Web stream -> Chunks (wir könnten auch chunkweise sofort schreiben)
        const req = new GetFileRequest();
        req.setPath(serverPath);
        req.setChunkSize(chunkSize);

        const chunks: Uint8Array[] = [];
        let received = 0;

        await new Promise<void>((resolve, reject) => {
            const stream = this.client.getFile(req, {});
            stream.on("data", (msg: FileChunk) => {
                const part = msg.getData_asU8();
                chunks.push(part);
                received += part.byteLength;
            });
            stream.on("error", reject);
            stream.on("end", resolve);
        });

        // 2) In OPFS schreiben (z. B. unter /parquets/table.parquet)
        const opfsPath = `/parquets/${tableName}.parquet`;
        this.writeToOPFS(opfsPath, chunks);

        // 3) DuckDB kann OPFS-Pfade direkt lesen (je nach Bundle-Config oft ohne Präfix)
        const conn = await db.connect();
        try {
            await conn.query(`
      CREATE OR REPLACE TABLE "${tableName}" AS
      SELECT * FROM read_parquet('${opfsPath}');
    `);
        } finally {
            await conn.close();
        }

        return { bytes: received, fileName: opfsPath };
    }
}