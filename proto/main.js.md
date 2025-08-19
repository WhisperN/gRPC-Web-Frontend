```javascript
const {Criteria} = require("./Flight_pb");
const {FlightServicePromiseClient} = require("./Flight_grpc_web_pb");

let clientService = new FlightServicePromiseClient('http://localhost:9090', null, null);

let criteria = new Criteria();

let stream = clientService.listFlights(criteria);

console.log("The response: ", stream);

```