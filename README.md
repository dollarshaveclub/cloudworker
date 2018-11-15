<img src="https://i.imgur.com/e0Asgu3.jpg">

***

Cloudworker allows you to run Cloudflare Worker scripts locally. 

## Installing

Install via NPM:
```sh
npm install -g @dollarshaveclub/cloudworker
```

## Usage

```sh
cloudworker worker.js
curl localhost:3000/
```

```sh
cloudworker --debug worker.js
curl localhost:3000/
```

```sh
cloudworker --set KeyValueStore.key=value --set KeyValueStore.hello=world worker.js
curl localhost:3000/
```

## Cloudflare Worker Compatibility 

Cloudworker strives to be as similar to the Cloudflare Worker runtime as possible. A script should behave the same when executed by Cloudworker and when run within Cloudflare Workers. Please file an issue for scenarios in which Cloudworker behaves differently. As behavior differences are found, this package will be updated to match the Cloudflare Worker runtime. This may result in breakage if scripts depended on those behavior differences. 

## License
MIT