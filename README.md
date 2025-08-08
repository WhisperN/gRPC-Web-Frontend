# gRPC performance frontend

I took quite some substancial inspiration from this [REPO](https://github.com/johanbrandhorst/grpcweb-wasm-example/blob/master/proto/web.proto).

## Setup

```bash
npm install arrow-js-ffi
```

## Protocol Buffer
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