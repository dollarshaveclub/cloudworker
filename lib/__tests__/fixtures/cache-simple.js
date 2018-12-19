addEventListener('fetch', (event) => {
  event.respondWith(handle(event))
})

async function handle(event) {
  const cache = caches.default
  const req = new Request(event.request)

  let res = await cache.match(req)
  if (res) {
    return res
  }

  res = new Response('hello', {headers: {'cache-control': 'max-age=1'}})
  const cloned = res.clone()
  event.waitUntil(cache.put(event.request, cloned))
  
  return res
}