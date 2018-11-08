addEventListener('fetch', event => {
  event.respondWith(fetch('https://google.com'))
})
