````html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Go WASM Test</title>
</head>
<body>
<script src="wasm_exec.js"></script>
<script>
    const go = new Go();

    let wasm;
    let WASM_URL="main.wasm";

    (async () =>{
        if ('instantiateStreaming' in WebAssembly) {
            WebAssembly.instantiateStreaming(fetch(WASM_URL), go.importObject).then(function (obj) {
                wasm = obj.instance;
                go.run(wasm);
                console.log(window.hello());
            })
        } else {
            fetch(WASM_URL).then(resp =>
                resp.arrayBuffer()
            ).then(bytes =>
                WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
                    wasm = obj.instance;
                    go.run(wasm);
                })
            )
        }
    })();
</script>
<script src="bundle.js"></script>
<script >
    (async () => {
        const ac = await startFlightClient();
        await doGet(ac);
    })();
</script>
</body>
</html>
````