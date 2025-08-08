const {Criteria} = require("./generated/Flight_pb");
const {FlightServicePromiseClient} = require("./generated/Flight_grpc_web_pb");

let clientService = new FlightServicePromiseClient('http://localhost:9090', null, null);

let criteria = new Criteria();

let stream = clientService.listFlights(criteria);

console.log("The response: ", stream);
