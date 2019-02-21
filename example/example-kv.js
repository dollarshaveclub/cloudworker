addEventListener('fetch', async event => {
  await KeyValueStore.put('persisted', 'true')
  const value = await KeyValueStore.get('hello')
  event.respondWith(new Response(value))
})
