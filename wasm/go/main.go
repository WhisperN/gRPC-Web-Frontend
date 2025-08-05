package main

import (
	"context"
	"io"
	"io/ioutil"
	"syscall/js"

	_ "google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc"
	"google.golang.org/grpc/grpclog"
	"google.golang.org/grpc/status"

	web "github.com/WhisperN/gRPC-Web-Frontend/proto"
)

var document js.Value

type DivWriter js.Value

func main() {

}
