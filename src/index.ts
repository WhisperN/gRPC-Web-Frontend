import { arrowClient, startFlightClient, getListFlights, doGet } from './ts/main';
import init, { add } from '@/wasm/pipeline/pipeline';

let ac: Promise<arrowClient> = startFlightClient();

console.log("arrowClient instantiated!");

doGet(await ac).then();

console.log("TS script done!");

console.log("Instantiate WASM");

async function main_wasm() {
    await init();
    console.log("add(2, 10) = ", add(2, 10));
}

main_wasm().catch(console.error);