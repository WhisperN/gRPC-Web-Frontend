package main

import (
	"context"
	"fmt"
	"github.com/apache/arrow/go/v18/arrow"
	"github.com/apache/arrow/go/v18/arrow/array"
	"github.com/apache/arrow/go/v18/arrow/flight"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"syscall/js"
)

func fetchData(this js.Value, args []js.Value) interface{} {
	// IPC parsing...
}

func main() {
	js.Global().Set("fetchData", js.FuncOf(fetchData))
	select {}
}
