# Flight Client
## Concept
A basic connection to the backend server works as follows:
```javascript
// 1:
const {Criteria} = require("./Flight_pb");
const {FlightServicePromiseClient} = require("./Flight_grpc_web_pb");

let clientService = new FlightServicePromiseClient('http://localhost:9090', null, null);

let criteria = new Criteria();

let stream = clientService.listFlights(criteria);

console.log("The response: ", stream);
```
1:
We use the compiled proto files from the Go backend and convert them automatically to JS code.
You find these files in the ```/src/gen``` folder.
## Installation
**Compiling from source**<br>
Unfortunately we cannot compile .protoc files to js with the original
protoc command from google. Thats why we use the official protobuf-javascript
library.

**Prerequisites**
- npm
- (bazel) -> If you want to play around with yourself compiling

**Installation**
```bash
npm install -g grpc-tools
npm install -g protoc-gen-grpc-web
```

**Compile the Protobuf file**<br>
Run this from the /proto directory of the Project
```bash
grpc_tools_node_protoc \
   --js_out=import_style=commonjs:. \
   --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. \
   Flight.proto
```
_Optional: If you hate yourself then use the flag closure instead of commonjs_<br>
**If you want modern and with TS**
```bash
grpc_tools_node_protoc \
    --js_out=import_style=es6:. \
    --grpc-web_out=import_style=es6,mode=grpcwebtext:. \
    Flight.proto
```
This generates the Flight_grpc_web client file and the regular protobuf to js compilation.<br>
Done.

This code generated the Proto files
```bash
protoc \
  -I ./proto ./proto/Flight.proto \
  --js_out=import_style=commonjs,binary:./src/gen \
  --grpc-web_out=import_style=typescript,mode=grpcweb:./src/gen
```

# Approach 1: TypeScript Only parsing
problem: very, very slow
(30s to 60s)

# Approach 2: Wasm supported parsing
Is still extremely slow
(20s+)

# Approach 3: Direct import of parquet/arrow
Extremely efficient and loads in seconds!

*Installed WebGPU*

```
npm install --save-dev @webgpu/types
```


## Computations

- Heatmap of data distribution
- KL for distribution comparison