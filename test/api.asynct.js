var es = require('event-stream')
  , u  = require('ubelt')
  , raw = require('../')
  , ctrl = require('ctrlflow')
  , it = require('it-is').style('colour')
  ;

exports ['connect'] = function (test) {
  var redis = raw.Redis(6379, function (err, _redis) {
    it(_redis).equal(redis)
    redis.socket.end()
    test.done()
  })
}
