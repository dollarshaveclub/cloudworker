class EventDispatcher {
  constructor () {
    this.listeners = {}
  }

  addEventListener (type, cb) {
    this.listeners[type] = this.listeners[type] || []
    this.listeners[type].push(cb)
  }

  async dispatch (type, event) {
    const cbs = this.listeners[type] || []
    for (const cb of cbs) {
      await cb(event)
    }
  }
}

module.exports.EventDispatcher = EventDispatcher
