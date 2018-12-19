const {Request, Response} = require('../../fetch')
const CFCachePolicy = require('../cloudflareCachePolicy')

describe('cloudflare cache policy', () => {
  test('cache policy storable only for GET requests', () => {
    const getReq = new Request('https://dollarshaveclub.com/', {method: 'GET'})
    const postReq = new Request('https://dollarshaveclub.com/', {method: 'POST'})
    const res = new Response('test')

    expect(new CFCachePolicy(getReq, res).storable()).toBe(true)
    expect(new CFCachePolicy(postReq, res).storable()).toBe(false)
  })

  test('cache policy storable for any request method with ignoreMethod option', () => {
    const getReq = new Request('https://dollarshaveclub.com/', {method: 'GET'})
    const postReq = new Request('https://dollarshaveclub.com/', {method: 'GET'})
    const res = new Response('test')

    expect(new CFCachePolicy(getReq, res, {ignoreMethod: true}).storable()).toBe(true)
    expect(new CFCachePolicy(postReq, res, {ignoreMethod: true}).storable()).toBe(true)
  })

  test('cache policy not storable for response with set-cookie', () => {
    const req = new Request('https://dollarshaveclub.com/')
    const res = new Response('test', {headers: {'set-cookie': 'yes'}})

    expect(new CFCachePolicy(req, res).storable()).toBe(false)
  })

  test('cache policy storable for response with set-cookie and private=set-header cache-control', () => {
    const req = new Request('https://dollarshaveclub.com/')
    const res = new Response('test', {headers: {'set-cookie': 'yes', 'cache-control': 'max-age=200, private=set-cookie'}})

    expect(new CFCachePolicy(req, res).storable()).toBe(true)
  })
})
