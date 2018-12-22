addEventListener("fetch", event => {
  event.respondWith(fetchAndStream(event.request))
})

async function fetchAndStream(request) {

  let req = new Request('http://localhost:8081', request)

  // Fetch from origin server.
  let response = await fetch(req)
  let { readable, writable } = new TransformStream()
  streamBody(response.body, writable)

  return new Response(readable, response)
}

async function streamBody(readable, writable) {
  let reader = readable.getReader()
  let writer = writable.getWriter()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    // Optionally transform value's bytes here.
    await writer.write(value)
  }

  await writer.close()
}