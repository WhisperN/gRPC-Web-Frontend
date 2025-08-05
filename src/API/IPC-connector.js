import init, { ArrowFFI } from 'arrow-js-ffi';
await init();

const response = await fetch('/data/example.arrow');

// We load the data into a sharedMemoryBuffer
const buffer = await response.arrayBuffer();

const ffi = new ArrowFFI();
const view = ffi.copyIPCToMemory(new Uint8Array(buffer));

export default view;