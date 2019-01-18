addEventListener('fetch', event => {
    const url = new URL(event.request.url)
    event.respondWith(generateSignedUrl(url))
})

function toHexString(buffer) {
    var s = '', h = '0123456789abcdef';
    (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; })
    return s;
}

async function generateSignedUrl(url) {
    // We'll need some super-secret data to use as a symmetric key.
    const secretKeyData = byteStringToUint8Array("my secret symmetric key")
    const key = await crypto.subtle.importKey(
      "raw", secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false, [ "sign" ]
    )

    // Signed requests expire after one minute. Note that you could choose
    // expiration durations dynamically, depending on, e.g. the path or a query
    // parameter.
    const expirationMs = 60000
    const expiry = new Date('Feb 28 2013 19:00:00 UTC').getTime()
    const dataToAuthenticate = '/verify/bob1362078000000'

    const mac = await crypto.subtle.sign(
      "HMAC", key,
      byteStringToUint8Array(dataToAuthenticate)
    )

    // mac is an ArrayBuffer, so make it hex
    const hex64Mac = toHexString(mac)

    url.searchParams.set("mac", hex64Mac)
    url.searchParams.set("expiry", expiry)

    return new Response(url)
}

function byteStringToUint8Array(byteString) {
    const ui = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; ++i) {
      ui[i] = byteString.charCodeAt(i)
    }
    return ui
}