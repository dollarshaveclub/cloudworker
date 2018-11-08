const { EventDispatcher } = require('../dispatcher')

describe('EventDispatcher', () => {
  test('EventDispatcher calls callbacks of event with same type', () => {
    const dispatcher = new EventDispatcher()

    let cbInvoked = false
    const cb = (event) => { cbInvoked = true }
    dispatcher.addEventListener('fetch', cb)

    dispatcher.dispatch('fetch', {})
    expect(cbInvoked).toEqual(true)
  })

  test('EventDispatcher does not call callbacks of event with same type', () => {
    const dispatcher = new EventDispatcher()

    let cbInvoked = false
    const cb = (event) => { cbInvoked = true }
    dispatcher.addEventListener('fetch', cb)

    dispatcher.dispatch('other', {})
    expect(cbInvoked).toEqual(false)
  })
})
