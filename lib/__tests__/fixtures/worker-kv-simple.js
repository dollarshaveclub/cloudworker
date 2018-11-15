addEventListener('fetch', async event => {
  const value = await TestNamespace.get('hello')
  event.respondWith(new Response(value))
})
