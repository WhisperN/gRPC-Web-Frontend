import {add} from "@/wasm/pipeline/pipeline"
import init from "@/wasm/pipeline/pipeline"

export async function WASM_add(x: number, y: number) {
    await init();
    console.log("add(2, 10) = ", add(x, y));
}