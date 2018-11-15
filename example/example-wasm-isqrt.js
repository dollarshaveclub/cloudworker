let instance = new WebAssembly.Instance(isqrt, {})
  
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url)
  const num = url.searchParams.get('num') || 1
  let squareroot = instance.exports._Z7Q_rsqrtf(num)
  return new Response(squareroot, {status: 200})
}