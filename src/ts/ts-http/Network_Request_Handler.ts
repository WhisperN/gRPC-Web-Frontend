import {Duck_db_instance} from "@/ts/ts-http/Duck_db_instance";

export class Network_Request_Handler {
    private protocol: string;

    constructor(protocol: string) {
        this.protocol = protocol;
    }
    async run(resource: string, db: Duck_db_instance) {
        switch (this.protocol) {
            case 'h1':
                this.h1(resource);
                break;
            case 'h2':
                this.h2(resource);
                break;
            case 'gRPC':
                this.gRPC(resource);
                break;
            default:
                console.error('[Network_Request_Handler] Unknown Protocol: ', this.protocol);
                break;
        }
    }
    async h1(resource: string){}
    async h2(resource: string) {}
    async gRPC(resource: string) {}
}