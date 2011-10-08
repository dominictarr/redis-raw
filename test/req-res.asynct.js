
var es = require('event-stream')
  , u  = require('ubelt')
  , raw = require('../')
  , ctrl = require('ctrlflow')
  , it = require('it-is')
  , examples = {
    '1k PING PONG': {
      input: u.times(100, function () {return ['PING']}),
      expected: u.times(100, function () {return 'PONG'}),
    },
    'SET GET': {
      input: [
        ['SET', 'name', 'Jim'],
        ['GET', 'name']
      ],
      expected: [
        'OK',
        'Jim'
      ],
    },
    'SUB PING': {
      input: [
        ['SUBSCRIBE', 'event1'],
        ['PING']
      ],
      expected: 
        '-ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context',
    },
    'SUB SUB': {
      input: [
        ['SUBSCRIBE', 'event1', 'event2'],
      ],
      expected: [
        [['event1', 'event2'], 2]
      ],
    },
    'SUB SUB 2': {
      input: [
        ['SUBSCRIBE', 'event1'],
        ['SUBSCRIBE', 'event2'],
      ],
      expected: [
        ['event1', 1],
        ['event2', 2]
      ],
    },
    'SUB SUB UNSUB': {
      input: [
        ['SUBSCRIBE', 'event1'],
        ['SUBSCRIBE', 'event2'],
        ['UNSUBSCRIBE']
      ],
      expected: [
        ['event1', 1],
        ['event2', 2],
        [['event1', 'event2'], 0]
      ],
    },
    'PSUB PSUB PUNSUB': {
      input: [
        ['PSUBSCRIBE', 'event1'],
        ['PSUBSCRIBE', 'event2'],
        ['PUNSUBSCRIBE']
      ],
      expected: [
        ['event1', 1],
        ['event2', 2],
        [['event1', 'event2'], 0]
      ],
    },
    'mixed PSUB SUB PUNSUB UNSUB': {
      input: [
        ['PSUBSCRIBE', 'event1'],
        ['SUBSCRIBE', 'event2'],
        ['UNSUBSCRIBE'],
        ['PUNSUBSCRIBE']
      ],
      expected: [
        ['event1', 1],
        ['event2', 2],
        ['event2', 1], //the number that unsubscribe returns is the SUB + PSUB
        ['event1', 0]
      ],
    },
    'mixed SUB x y UNSUB x UNSUB': {
      input: [
        ['SUBSCRIBE', 'x', 'y'],
        ['UNSUBSCRIBE', 'x'],
        ['UNSUBSCRIBE']
      ],
      expected: [
        [['x', 'y'], 2],  //SUB x y
        ['x', 1],         //UNSUB x
        ['y', 0]          //UNSUB
      ],
    },
    //this test will fail without stringify. 
    //do your own json.
    'stringify?': {
      input: [
        ['SET', 'x', JSON.stringify({hello: true})],
        ['GET', 'x']
      ],
      expected: [
        'OK',  
        JSON.stringify({hello: true})
      ],
    },
  }

    function map2Json (ary) {
      return ary.map(u.curry(JSON.stringify, 0))
    }
    function mapFromJson (ary) {
      return ary.map(function (j) {
          try { return JSON.parse(j) } catch (_) { return j }
        })
    }

u.each(examples, function (example, name) {
  exports[name] = function (test) {
    var r = raw.Redis (6379)

    //there is a bug in parallel.map if there is only one iteration and it errors...
    ctrl.parallel.map(r.req)
    (example.input, function (err, actual) {
      r.socket.end()
      r.socket.once('end', test.done)

      if(!Array.isArray(example.expected))
        it(err).equal(example.expected)
      else {
        if(err)
          throw err    
        it(actual).deepEqual(example.expected)
      }
    })
  }
})

