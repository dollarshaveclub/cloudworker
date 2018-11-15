addEventListener('fetch', event => {
  const importObject = {
    imports: {
      imported_func: function(arg) {
        event.respondWith(new Response(arg))
      }
    }
  }

  const instance = new WebAssembly.Instance(Wasm, importObject)
  instance.exports.exported_func()
})
