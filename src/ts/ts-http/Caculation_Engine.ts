export class Calculation_Engine {
    private engine: string;
    constructor(engine: string) {
        this.engine = engine;
    }
    async run() {
        switch (this.engine) {
            case "wasm":
                this.wasm_engine();
                break;
            case "wasmWebGpu":
                this.wasm_webGPU_engine();
                break;
            case "ts":
                this.ts_engine();
                break;
            default:
                console.error("[Calculation_Engine] Unknown engine: " + this.engine);
                break;
        }
    }
    async wasm_engine() {}
    async wasm_webGPU_engine() {}
    async ts_engine() {}
}