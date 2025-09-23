import * as jspb from 'google-protobuf'



export class ListFilesRequest extends jspb.Message {
  getDirectory(): string;
  setDirectory(value: string): ListFilesRequest;

  getOnlyParquet(): boolean;
  setOnlyParquet(value: boolean): ListFilesRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFilesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListFilesRequest): ListFilesRequest.AsObject;
  static serializeBinaryToWriter(message: ListFilesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFilesRequest;
  static deserializeBinaryFromReader(message: ListFilesRequest, reader: jspb.BinaryReader): ListFilesRequest;
}

export namespace ListFilesRequest {
  export type AsObject = {
    directory: string,
    onlyParquet: boolean,
  }
}

export class ListFilesResponse extends jspb.Message {
  getFilesList(): Array<string>;
  setFilesList(value: Array<string>): ListFilesResponse;
  clearFilesList(): ListFilesResponse;
  addFiles(value: string, index?: number): ListFilesResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFilesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListFilesResponse): ListFilesResponse.AsObject;
  static serializeBinaryToWriter(message: ListFilesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFilesResponse;
  static deserializeBinaryFromReader(message: ListFilesResponse, reader: jspb.BinaryReader): ListFilesResponse;
}

export namespace ListFilesResponse {
  export type AsObject = {
    filesList: Array<string>,
  }
}

export class StatFileRequest extends jspb.Message {
  getPath(): string;
  setPath(value: string): StatFileRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatFileRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StatFileRequest): StatFileRequest.AsObject;
  static serializeBinaryToWriter(message: StatFileRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatFileRequest;
  static deserializeBinaryFromReader(message: StatFileRequest, reader: jspb.BinaryReader): StatFileRequest;
}

export namespace StatFileRequest {
  export type AsObject = {
    path: string,
  }
}

export class StatFileResponse extends jspb.Message {
  getPath(): string;
  setPath(value: string): StatFileResponse;

  getSizeBytes(): number;
  setSizeBytes(value: number): StatFileResponse;

  getNumRows(): number;
  setNumRows(value: number): StatFileResponse;

  getSchema(): string;
  setSchema(value: string): StatFileResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatFileResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StatFileResponse): StatFileResponse.AsObject;
  static serializeBinaryToWriter(message: StatFileResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatFileResponse;
  static deserializeBinaryFromReader(message: StatFileResponse, reader: jspb.BinaryReader): StatFileResponse;
}

export namespace StatFileResponse {
  export type AsObject = {
    path: string,
    sizeBytes: number,
    numRows: number,
    schema: string,
  }
}

export class GetFileRequest extends jspb.Message {
  getPath(): string;
  setPath(value: string): GetFileRequest;

  getChunkSize(): number;
  setChunkSize(value: number): GetFileRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFileRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetFileRequest): GetFileRequest.AsObject;
  static serializeBinaryToWriter(message: GetFileRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFileRequest;
  static deserializeBinaryFromReader(message: GetFileRequest, reader: jspb.BinaryReader): GetFileRequest;
}

export namespace GetFileRequest {
  export type AsObject = {
    path: string,
    chunkSize: number,
  }
}

export class FileChunk extends jspb.Message {
  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): FileChunk;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FileChunk.AsObject;
  static toObject(includeInstance: boolean, msg: FileChunk): FileChunk.AsObject;
  static serializeBinaryToWriter(message: FileChunk, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FileChunk;
  static deserializeBinaryFromReader(message: FileChunk, reader: jspb.BinaryReader): FileChunk;
}

export namespace FileChunk {
  export type AsObject = {
    data: Uint8Array | string,
  }
}

