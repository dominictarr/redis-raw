var es = require('event-stream')
  , u  = require('ubelt')
  , raw = require('../')
  , ctrl = require('ctrlflow')
  , it = require('it-is')

var e = raw.Redis(6379)
  , r = raw.Redis(6379)
  , noop = console.error

u.delay(r.req, 10)(['PSUBSCRIBE', '*'], function (pattern, count) {
  console.error(pattern, count)
})

e.req(['PUBLISH', 'hello', 'rprk'], noop)
e.req(['PUBLISH', 'hello', 'rprk'], noop)
e.req(['PUBLISH', 'hello', 'rprk'], noop)
e.req(['PUBLISH', 'hello', 'rprk'], noop)
