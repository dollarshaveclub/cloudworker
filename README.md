<img src="https://i.imgur.com/e0Asgu3.jpg">

***

Cloudworker allows you to run Cloudflare Worker scripts locally. 

## Installing

Install via NPM:
```sh
npm install -g @dollarshaveclub/cloudworker
```
## Package Usage

```
const Cloudworker = require('@dollarshaveclub/cloudworker')

const simpleScript = `addEventListener('fetch', event => {
  event.respondWith(new Response('hello', {status: 200}))
})`

const req = new Cloudworker.Request('https://myfancywebsite.com/someurl')
const cw = new Cloudworker(simpleScript)
cw.dispatch(req).then((res) => {
  console.log("Response Status: ", res.status)
  res.text().then((body) =>{
    console.log("Response Body: ", body)
  })
})
```

## CLI Usage

```sh
Usage: cloudworker [options] <file>

Options:
  -p, --port <port>                   Port (default: 3000)
  -d, --debug                         Debug
  -s, --kv-set [variable.key=value]   Binds variable to a local implementation of Workers KV and sets key to value (default: [])
  -f, --kv-file [variable=path]       Set the filepath for value peristence for the local implementation of Workers KV (default: [])
  -w, --wasm [variable=path]          Binds variable to wasm located at path (default: [])
  -c, --enable-cache                  Enables cache <BETA>
  -r, --watch                         Watch the worker script and restart the worker when changes are detected
  -h, --help                          output usage information
```

### Simple
```sh
cloudworker example/example.js
curl localhost:3000/
```

```sh
cloudworker --debug example/example.js
curl localhost:3000/
```

### Workers KV
```sh
cloudworker --debug --kv-set KeyValueStore.key=value --kv-set KeyValueStore.hello=world example/example-kv.js
curl localhost:3000/
```

### Workers KV with Persistence
```sh
cloudworker --debug --kv-file KeyValueStore=kv.json --kv-set KeyValueStore.key=value --kv-set KeyValueStore.hello=world example/example-kv.js
curl localhost:3000/
```

### WebAssembly
#### Simple 

```sh
cloudworker --debug --wasm Wasm=example/simple.wasm example/example-wasm-simple.js
curl localhost:3000/
```
[WebAssembly Source](https://github.com/mdn/webassembly-examples/blob/master/js-api-examples/simple.wat)


#### Inverse Square Root
```sh
cloudworker --debug --wasm isqrt=example/isqrt.wasm example/example-wasm-isqrt.js
curl localhost:3000/?num=9
```
[WebAssembly Source](https://developers.cloudflare.com/workers/api/resource-bindings/webassembly-modules/)


#### Resizer 

```sh
cloudworker --debug --wasm RESIZER_WASM=example/resizer.wasm example/example-wasm-resizer.js
curl localhost:3000/wasm-demo/dogdrone.png?width=210 # or open in browser
```
[WebAssembly Source](https://github.com/cloudflare/cloudflare-workers-wasm-demo)

## Cloudflare Worker Compatibility 

Cloudworker strives to be as similar to the Cloudflare Worker runtime as possible. A script should behave the same when executed by Cloudworker and when run within Cloudflare Workers. Please file an issue for scenarios in which Cloudworker behaves differently. As behavior differences are found, this package will be updated to match the Cloudflare Worker runtime. This may result in breakage if scripts depended on those behavior differences. 

## Release Process

For beta releases:
- Create a new release branch named `v[version]-beta`. e.g. `v0.0.10-beta`
- Run `npm version [version]-beta.[beta number]`. e.g `npm version 0.0.10-beta.1`
- Push branch to origin.
- Run `npm publish --tag beta`.
- Create a new release in Github using tag created by `npm version`, write relevant release notes, and ensure "This is a pre-release" is checked.
- Bug fixes and changes should be made on feature branches, merged into master, and then merged into the release branch.
- Subsequent beta releases of the same beta version should be made off of the same release branch.

For production releases:
- Merge release branch (if one exists) into master.
- Run `npm version [version]`. e.g. `npm version 0.0.10`
- Push master to origin.
- Run `npm publish`.
- Create a new release in Github using tag created by `npm version` and copy release notes from beta.

## License
MIT
