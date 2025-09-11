import {arrowClient, startFlightClient, doGet, startPlot} from './ts/main';
import init, { add } from '@/wasm/pipeline/pipeline';
import {SharedArrayRingBuffer} from "@/ts/SharedArrayRingBuffer";

let ac: arrowClient = await startFlightClient();

console.log("arrowClient instantiated!");

let SARB: SharedArrayRingBuffer = await doGet(ac);
console.log("Pulled the data from the flight server.");

startPlot(SARB);
console.log("called the data from memory.");

console.log("TS script done!");

console.log("Instantiate WASM");

/*async function main_wasm() {
    await init();
    console.log("add(2, 10) = ", add(2, 10));
}

main_wasm().catch(console.error);*/

console.log("skipped WASM");