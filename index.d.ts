
/// <reference lib="webworker" />
/// <reference types="node" />
import * as http from 'http'

export = Cloudworker

declare interface CloudworkerInit {
  debug?: boolean
  enableCache?: boolean
  bindings?: { [key: string]: any }
}

declare class Cloudworker {
  constructor (script: string, opts?: CloudworkerInit)
  dispatch (request: Request): void
  listen (...args: any[]): http.Server
}

type ValidType = 'text' | 'json' | 'arrayBuffer' | 'stream'
declare class KeyValueStore {
  constructor ()

  get (key: string, type?: ValidType): Promise<string | ArrayBuffer | Object | ReadableStream>
  put (key: string, value: string | ReadableStream | ArrayBuffer | FormData): Promise<undefined>
  delete (key: string): Promise<undefined>
}

declare namespace Cloudworker {

  export function fetch (input: RequestInfo, init?: RequestInit): Promise<Response>

  export const FetchEvent: {
    prototype: FetchEvent
    new(type: string, eventInitDict: FetchEventInit): FetchEvent,
  }

  export const URL: {
    prototype: URL;
    new(url: string, base?: string | URL): URL
  }

  export const Headers: {
    prototype: Headers
    new(init?: HeadersInit): Headers,
  }

  type RequestInfo = Request | string | URL
  export const Request: {
    prototype: Request
    new(input: RequestInfo, init?: RequestInit): Request,
  }

  export const Response: {
    prototype: Response
    new(body?: BodyInit | null, init?: ResponseInit): Response
    redirect (url: string, status?: number): Response,
  }

  export const ReadableStream: {
    prototype: ReadableStream
    new(underlyingSource: UnderlyingByteSource, strategy?: { highWaterMark?: number, size?: undefined }): ReadableStream<Uint8Array>
    new<R = any>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>,
  }

  export const WritableStream: {
    prototype: WritableStream
    new<W = any>(underlyingSink?: UnderlyingSink<W>, strategy?: QueuingStrategy<W>): WritableStream<W>,
  }

  export const TransformStream: {
    prototype: TransformStream
    new<I = any, O = any>(transformer?: Transformer<I, O>, writableStrategy?: QueuingStrategy<I>, readableStrategy?: QueuingStrategy<O>): TransformStream<I, O>,
  }

  export const TextEncoder: {
    prototype: TextEncoder
    new(): TextEncoder,
  }

  export const TextDecoder: {
    prototype: TextDecoder
    new(label?: string, options?: TextDecoderOptions): TextDecoder,
  }

  export function atob (encodedString: string): string
  export function btoa (rawString: string): string
}
