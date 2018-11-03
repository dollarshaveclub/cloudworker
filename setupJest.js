const fetchMock = require('jest-fetch-mock')
const fetch = require('node-fetch')

// Make fetch.Request, fetch.Response, etc etc available
// on the mock. There's probably a better way.
Object.keys(fetch).forEach(key => {
  fetchMock[key] = fetch[key]
})

jest.setMock('node-fetch', fetchMock)
