addEventListener('fetch', event => {
    const url = new URL(event.request.url)
    event.respondWith(respondWithHelloAsSHA256())
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

async function respondWithHelloAsSHA256() {
    const sha = await toSHA256("hello")
    return new Response(sha, {status: 200})
}

async function toSHA256(message) {
    let hash = await crypto.subtle.digest('SHA-256', byteStringToUint8Array(message))
    return toHexString(hash)
}
