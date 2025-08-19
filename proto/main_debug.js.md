```javascript
// CommonJS: Webpack kann diese requires statisch analysieren
const {Criteria, Ticket} = require("./Flight_pb");
const {FlightServicePromiseClient} = require("./Flight_grpc_web_pb");
const {RecordBatchReader} = require("apache-arrow");

function concatU8(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

function asyncIteratorFromGrpcStream(stream, mapFn) {
    const queue = [];
    let pendingResolve = null;
    let ended = false;
    let error = null;

    function push(item) {
        if (pendingResolve) {
            const resolve = pendingResolve;
            pendingResolve = null;
            resolve({value: item, done: false});
        } else {
            queue.push(item);
        }
    }

    stream.on("data", (msg) => {
        try {
            const chunk = mapFn(msg);
            if (chunk && chunk.length) push(chunk);
        } catch (e) {
            error = e;
            if (pendingResolve) {
                const r = pendingResolve;
                pendingResolve = null;
                r(Promise.reject(e));
            }
            stream.cancel();
        }
    });
    stream.on("end", () => {
        ended = true;
        if (pendingResolve) {
            const r = pendingResolve;
            pendingResolve = null;
            r({value: undefined, done: true});
        }
    });
    stream.on("error", (err) => {
        error = err;
        if (pendingResolve) {
            const r = pendingResolve;
            pendingResolve = null;
            r(Promise.reject(err));
        }
    });

    return {
        [Symbol.asyncIterator]() {
            return this;
        },
        next() {
            if (error) return Promise.reject(error);
            if (queue.length) return Promise.resolve({value: queue.shift(), done: false});
            if (ended) return Promise.resolve({value: undefined, done: true});
            return new Promise((resolve) => {
                pendingResolve = resolve;
            });
        },
    };
}

async function arrowReaderFromDoGet(clientService, ticketBytes) {
    const ticket = new Ticket();
    ticket.setTicket(ticketBytes);
    const doGetStream = clientService.doGet(ticket, {});

    function padTo8(offset) {
        const m = offset % 8;
        return m === 0 ? 0 : 8 - m;
    }

    function u32le(n) {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setUint32(0, n >>> 0, true);
        return b;
    }

    function buildIpcFrame(headerU8, bodyU8) {
        const headerLen = headerU8?.length ?? 0;
        const bodyLen = bodyU8?.length ?? 0;
        const offAfterHeader = 4 + 4 + headerLen;
        const headerPad = padTo8(offAfterHeader);
        const total =
            4 +
            4 + headerLen +
            headerPad +
            4 +
            bodyLen;
        const out = new Uint8Array(total);
        let off = 0;
        out.set([0xFF, 0xFF, 0xFF, 0xFF], off);
        off += 4;
        out.set(u32le(headerLen), off);
        off += 4;
        if (headerLen) {
            out.set(headerU8, off);
            off += headerLen;
        }
        off += headerPad;
        out.set(u32le(bodyLen), off);
        off += 4;
        if (bodyLen) {
            out.set(bodyU8, off);
            off += bodyLen;
        }
        return out;
    }

    const chunkIter = asyncIteratorFromGrpcStream(doGetStream, (flightDataMsg) => {
        const header = flightDataMsg.getDataHeader_asU8();
        const body = flightDataMsg.getDataBody_asU8();
        return buildIpcFrame(header, body);
        ;
    });
    return await RecordBatchReader.from(chunkIter);
}

/**
 * Run the gRPC-Web → Arrow pipeline.
 * @param {Object} options
 * @param {string} [options.baseUrl="http://localhost:9090"]
 * @param {Uint8Array|string|null} [options.criteriaExpr=null]
 * @param {(fi:any)=>void} [options.onFlightInfo]
 * @param {(schema:any)=>void} [options.onSchema]
 * @param {(batch:any)=>void} [options.onBatch]
 * @param {(batch:any)=>void} [options.onGet]
 * @param {(err:any)=>void} [options.onError]
 * @param {(fi:any)=>Uint8Array|null} [options.pickTicket]
 * @returns {Promise<{reader:any}>}
 */
async function runFlightClient(options = {}) {
    const {
        baseUrl = "http://localhost:9090",
        criteriaExpr = null,
        onFlightInfo,
        onSchema,
        onBatch,
        onEnd,
        onError,
        pickTicket,
    } = options;

    const clientService = new FlightServicePromiseClient(baseUrl, null, null);

    const criteria = new Criteria();
    if (criteriaExpr != null) {
        if (typeof criteriaExpr === "string") {
            const enc = new TextEncoder();
            criteria.setExpression(enc.encode(criteriaExpr));
        } else if (criteriaExpr instanceof Uint8Array) {
            criteria.setExpression(criteriaExpr);
        } else {
            console.warn("criteriaExpr must be string or Uint8Array; ignoring.");
        }
    }

    const listStream = clientService.listFlights(criteria, {});
    let chosenTicket = null;

    listStream.on("data", (flightInfo) => {
        onFlightInfo && onFlightInfo(flightInfo);
        if (chosenTicket) return;

        if (typeof pickTicket === "function") {
            try {
                const maybe = pickTicket(flightInfo);
                if (maybe instanceof Uint8Array && maybe.length) chosenTicket = maybe;
            } catch {
            }
        }

        if (!chosenTicket) {
            const endpoints = flightInfo.getEndpointList?.() || [];
            if (endpoints.length) {
                const t = endpoints[0].getTicket?.();
                if (t) chosenTicket = t.getTicket_asU8();
            }
        }
    });

    return new Promise((resolve, reject) => {
        listStream.on("end", async () => {
            if (!chosenTicket) {
                const err = new Error("No ticket found in ListFlights");
                onError && onError(err);
                return reject(err);
            }
            try {
                const reader = await arrowReaderFromDoGet(clientService, chosenTicket);
                onSchema && onSchema(reader.schema);

                if (onBatch) {
                    (async () => {
                        try {
                            for await (const batch of reader) onBatch(batch);
                            onEnd && onEnd();
                        } catch (e) {
                            onError && onError(e);
                        }
                    })();
                }

                resolve({reader});
            } catch (e) {
                onError && onError(e);
                reject(e);
            }
        });

        listStream.on("error", (err) => {
            onError && onError(err);
            reject(err);
        });
    });
}

// Export für Bundler + Browser
module.exports = {runFlightClient};
if (typeof window !== "undefined") {
    window.runFlightClient = runFlightClient;
}
```

This script is called by:

```html
<script>
    runFlightClient({
        baseUrl: "http://localhost:9090",
        onFlightInfo: (fi) => console.log("FI:", fi),
        onBatch: (batch) => console.log("Batch (DoGet):", batch),
        onEnd: () => console.log("Done"),
        onError: (e) => console.error(e),
    });
</script>
```