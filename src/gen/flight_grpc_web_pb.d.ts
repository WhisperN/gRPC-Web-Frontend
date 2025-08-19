import * as grpcWeb from 'grpc-web';

import * as flight_pb from './flight_pb'; // proto import: "flight.proto"


export class FlightServiceClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listFlights(
    request: flight_pb.Criteria,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.FlightInfo>;

  getFlightInfo(
    request: flight_pb.FlightDescriptor,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: flight_pb.FlightInfo) => void
  ): grpcWeb.ClientReadableStream<flight_pb.FlightInfo>;

  pollFlightInfo(
    request: flight_pb.FlightDescriptor,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: flight_pb.PollInfo) => void
  ): grpcWeb.ClientReadableStream<flight_pb.PollInfo>;

  getSchema(
    request: flight_pb.FlightDescriptor,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: flight_pb.SchemaResult) => void
  ): grpcWeb.ClientReadableStream<flight_pb.SchemaResult>;

  doGet(
    request: flight_pb.Ticket,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.FlightData>;

  doAction(
    request: flight_pb.Action,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.Result>;

  listActions(
    request: flight_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.ActionType>;

}

export class FlightServicePromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  listFlights(
    request: flight_pb.Criteria,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.FlightInfo>;

  getFlightInfo(
    request: flight_pb.FlightDescriptor,
    metadata?: grpcWeb.Metadata
  ): Promise<flight_pb.FlightInfo>;

  pollFlightInfo(
    request: flight_pb.FlightDescriptor,
    metadata?: grpcWeb.Metadata
  ): Promise<flight_pb.PollInfo>;

  getSchema(
    request: flight_pb.FlightDescriptor,
    metadata?: grpcWeb.Metadata
  ): Promise<flight_pb.SchemaResult>;

  doGet(
    request: flight_pb.Ticket,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.FlightData>;

  doAction(
    request: flight_pb.Action,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.Result>;

  listActions(
    request: flight_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<flight_pb.ActionType>;

}

