class ScheduleEvent {
  constructor (type, init) {
    this.scheduledTime = init.scheduledTime
  }

  waitUntil (promise) {
    
  }

  passThroughOnException () {

  }
}

module.exports.ScheduleEvent = ScheduleEvent
