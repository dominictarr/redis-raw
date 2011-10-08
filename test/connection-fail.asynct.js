
var es = require('event-stream')
  , u  = require('ubelt')
  , raw = require('../')
  , ctrl = require('ctrlflow')
  , it = require('it-is')

//if a connection breaks unexpectedly, all active commands should callback with an error.

var input = u.times(100, function () {return ['PING']})

exports ['connect fails correctly'] = function (test) {
  raw.Redis(6379, function (err, r) {
 
    u.timeout(ctrl.parallel.map(r.req), 1000)
    (input, function (err, result) {
      if(/timeout/.test(err.message))
        test.ifError(err)
      it(err).has({
        errors: it.every(it.has({
          message: it.matches(/connection closed unexpectedly/)
        }))
      })
      test.done()
    })
    process.nextTick(function () { r.socket.destroy() })
  })
}
