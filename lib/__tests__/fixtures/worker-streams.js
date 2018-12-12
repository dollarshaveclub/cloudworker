addEventListener('fetch', async event => {
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    writer.write(new Uint16Array([10, 20])).then(() => writer.close())
    event.respondWith(new Response(readable))
})