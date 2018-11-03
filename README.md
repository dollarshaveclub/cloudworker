<img src="https://i.imgur.com/eUsisfp.jpg">

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
cloudworker --debug worker.js
cloudworker --port 8080 --debug worker.js
```

## Cloudflare Worker Compatibility 

Cloudworker strives to be as similar to the Cloudflare Worker runtime as possible. A script should behave the same when executed by Cloudworker and when run within Cloudflare Workers. Please file an issue for scenarios in which Cloudworker behaves differently. As behavior differences are found, this package will be updated to match the Cloudflare Worker runtime. This may result in breakage if scripts depended on those behavior differences. 

# License
MIT