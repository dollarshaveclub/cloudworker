// slightly modified version of https://github.com/cloudflare/cloudflare-workers-wasm-demo/blob/master/worker.js

// Instantiate the WebAssembly module with 32MB of memory.
const wasmMemory = new WebAssembly.Memory({initial: 512});
const wasmInstance = new WebAssembly.Instance(
    // RESIZER_WASM is a global variable created through the Resource Bindings UI (or API).
    RESIZER_WASM,

    // This second parameter is the imports object. Our module imports its memory object (so that
    // we can allocate it ourselves), but doesn't require any other imports.
    {env: {memory: wasmMemory}})

// Define some shortcuts.
const resizer = wasmInstance.exports
const memoryBytes = new Uint8Array(wasmMemory.buffer)

// Now we can write our worker script.
addEventListener("fetch", event => {
  event.respondWith(handle(event.request))
});

async function handle(request) {
  let url = new URL(request.url)
  url.protocol = 'https'
  url.port = "443"
  url.hostname = request.headers.get('X-Forwarded-Host') || 'cloudflareworkers.com'

  let response = await fetch(url, request)

  // Check if the response is an image. If not, we'll just return it.
  let type = response.headers.get("Content-Type") || ""
  if (!type.startsWith("image/")) return response

  // Check if the `width` query parameter was specified in the URL. If not,
  // don't resize -- just return the response directly.
  let width = new URL(request.url).searchParams.get("width")
  if (!width) return response

  // OK, we're going to resize. First, read the image data into memory.
  let bytes = new Uint8Array(await response.arrayBuffer())

  // Call our WebAssembly module's init() function to allocate space for
  // the image.
  let ptr = resizer.init(bytes.length)

  // Copy the image into WebAssembly memory.
  memoryBytes.set(bytes, ptr)

  // Call our WebAssembly module's resize() function to perform the resize.
  let newSize = resizer.resize(bytes.length, parseInt(width))

  if (newSize == 0) {
    // Resizer didn't want to process this image, so just return it. Since
    // we already read the response body, we need to reconstruct the
    // response here from the bytes we read.
    return new Response(bytes, response);
  }

  // Extract the result bytes from WebAssembly memory.
  let resultBytes = memoryBytes.slice(ptr, ptr + newSize)

  // Create a new response with the image bytes. Our resizer module always
  // outputs JPEG regardless of input type, so change the header.
  let newResponse = new Response(resultBytes, response)
  newResponse.headers.set("Content-Type", "image/jpeg")

  // Return the response.
  return newResponse
}
