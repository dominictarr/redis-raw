var es = require('event-stream')
  , u  = require('ubelt')
  , raw = require('../')
  , ctrl = require('ctrlflow')
  , it = require('it-is')

var noop = function () {}


exports ['PubSub'] = function (test) {
  var l = raw.Redis(6379, function (err) {
    var e = raw.Redis(6379)
    l.onMessage = function (hello, you) {
      it(hello).equal('hello')
      it(you).equal('you')
      test.done()
      e.socket.end()
      l.socket.end()
    }
    l.onPMessage = function (hello, you) {
      e.socket.end()
      l.socket.end()
      it(false).ok('should call onMessage')
    }
    l.req(['SUBSCRIBE', 'hello'], function (err, reply) {
      if(err)
        throw err
      e.req(['PUBLISH', 'hello', 'you'], noop)
    })

  })
}

exports ['Pub*Sub'] = function (test) {
  raw.Redis(6379, function (err, l) {
    var e = raw.Redis(6379)
    l.req(['PSUBSCRIBE', '*hat?'], function () {
      e.req(['PUBLISH', 'whatQ', 'you'], noop)
      l.onPMessage = function (what, pattern, you) {
        it(pattern).equal('whatQ')
        it(what).equal('*hat?')
        it(you).equal('you')
        test.done()
        e.socket.end()
        l.socket.end()
      }
    })
  })
}
