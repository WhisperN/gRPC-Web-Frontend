import {Duck_db_instance} from "@/ts/ts-http/Duck_db_instance";
import {Network_Request_Handler} from "@/ts/ts-http/Network_Request_Handler";
import {Calculation_Engine} from "@/ts/ts-http/Caculation_Engine";

export class Loader {
    private protocol: string;
    private engine: string;
    private format: string;
    constructor(protocol: string, engine: string, format: string) {
        this.protocol = protocol;
        this.engine = engine;
        this.format = format;
    }
    async run_globe_scatter(db: Duck_db_instance) {
        let en: Calculation_Engine = new Calculation_Engine(this.engine);
        let net: Network_Request_Handler = new Network_Request_Handler(this.protocol);
        await net.run(this.format, db);
        await en.run()

        // return format...
        // UInt8Array();
    }
}