addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  event.respondWith(respondWithHelloAsMD5())
})

function byteStringToUint8Array(byteString) {
  const ui = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; ++i) {
      ui[i] = byteString.charCodeAt(i)
  }
  return ui
}

function toHexString(buffer) {
  var s = '', h = '0123456789abcdef';
  (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; })
  return s;
}

async function respondWithHelloAsMD5() {
  const sha = await toMD5("hello")
  return new Response(sha, {status: 200})
}

async function toMD5(message) {
  let hash = await crypto.subtle.digest('MD5', byteStringToUint8Array(message))
  return toHexString(hash)
}
