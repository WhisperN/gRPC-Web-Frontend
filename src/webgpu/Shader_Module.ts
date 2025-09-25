export class Shader_Module {
    private device: GPUDevice;
    constructor(device: GPUDevice) {
        this.device = device;
    }
    _first_shader() {
        const module = this.device.createShaderModule({
            label: 'doubling compute module',
            code: `
              @group(0) @binding(0) var<storage, read_write> data: array<f32>;
         
              @compute @workgroup_size(1) fn computeSomething(
                @builtin(global_invocation_id) id: vec3u
              ) {
                let i = id.x;
                data[i] = data[i] * 2.0;
              }
            `,
        });
    }
}

export async function getDevice(): Promise<GPUDevice> {
    const adapter: GPUAdapter | null = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error("Your device is does not support WebGPU");
    }
    const device = await adapter?.requestDevice();
    if (!device) {
        throw new Error('need a browser that supports WebGPU');
    }
    return device;
}