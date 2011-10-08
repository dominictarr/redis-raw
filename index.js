
var net = require('net')
  , Parser = require('redis/lib/parser/javascript').Parser
  , Stream = require('stream').Stream
  , es = require('event-stream')
  , u = require('ubelt')
const CLRF = '\r\n'

exports.Parser = Parser
exports.Redis = Redis
exports.requestify = requestify 

exports.ParseStream = ParseStream
exports.RedisStream = RedisStream

function requestify (cmd) {
    var l = cmd.length
    , i = 0
    , out = new Array(l*2 + 1)
  out[0] = '*'+l
  
  while(i < l) {
    var item = cmd[i]
    out[i*2 + 1] = '$'+item.length 
    out[i*2 + 2] = item
    i ++
  }
  out.push('')
  return out.join(CLRF)
}

function RedisStream () { //same args as net.createConnection  
  var stream  = net.createConnection.apply(null, arguments)
  var _write = stream.write
  stream.write = function (command) {
    return _write.call(stream, requestify(command))
  }
  return stream
}

function ParseStream () {
  var stream = new Stream()
    , parser = new Parser()

  stream.writable = stream.readable = true
  stream.destroy = function (){}
  stream.write = function (buf) { parser.execute(buf) }
  stream.end = function (buf) { 
    parser.reset()
    if(buf) parser.execute(buf); 
    stream.emit('end')
  }
  function emit (data) {
    stream.emit('data', data )
  }
  parser.on('reply', emit)
  parser.on('reply error', function (mess) { emit('-'+mess ) }) //errors should start with '-'
  return stream
}
 /*
es.connect(
  es.readArray([
    ['SUBSCRIBE', 'x', 'y', 'z'],
    ['PSUBSCRIBE', 'x', 'y', 'z'],
    ['UNSUBSCRIBE']
  ]),
  es.log('<<'),
  RedisStream (6379),
  ParseStream (),
  es.log('>>')
)*/


function Redis () {
  var r, p
    , client
    , queue = []
    , callback = arguments[arguments.length - 1]

  if('function' === typeof callback) {
    console.error('CALLBACJ', callback)
    arguments[arguments.length - 1] = 
      function (err, socket) {
        callback(err, client)
      }
  }

r = RedisStream.apply(null, arguments)
p = ParseStream ()

  r.pipe(p)

      /*
      there are some special cases here for unsubscribe
      SUBSCRIBE x y y
      responds with
      SUBSCRIBE x 1
      SUBSCRIBE x 2
      SUBSCRIBE x 3
      
      to get the correct callbacks need to calc how many callbacks are expected.
      */
  client = {
    expecting: function (args) {
      switch (args[0]) {
        case 'SUBSCRIBE':
        case 'PSUBSCRIBE':
          var ex = (args.length -1) || 1
          client.counts[args[0]] += ex
          return ex
          break
        //if we are not explicitly unsubscribing, we expect the number of responses to be the number of (P)SUBSCRIBES
        //also, reduce the number of messages that we expect
        case 'UNSUBSCRIBE':
        case 'PUNSUBSCRIBE':
          var counter = args[0].replace('UN', '')
          var ex = (args.length - 1) || client.counts[counter]
          client.counts[counter] -= ex
          return ex
          break
        default: return 1
      }
    },
    counts: {'SUBSCRIBE': 0, 'PSUBSCRIBE': 0},
    req: function (args, callback) {
      if(!r.writable)
        return callback(new Error('redis client is disconnected!'))
      var expect = client.expecting(args)

      //on disconnect or error, callback everything with an error, and reconnect.
      if(expect == 1)
        queue.push(function(err, args) {
            if(err) return callback(err)
            if(Array.isArray(args))
              args.shift()
            callback(null, args)              
          })
      else {
        var type
          , count
          , err
          , values = []
        function collect (_err, args) {
          if(!type) type = args[0]
          values.push(args[1])
          count = args[2]
          if(values.length == expect) {
            callback(null, [values, count])
          }
        }
        var i = expect 
        while(--i >= 0) queue.push(collect)
      }
      r.write(args)
      return client
    },
    onMessage: console.error,
    onPMessage: console.error,
    //users must not write data to the socket, that will confuse the parser.
    //but they should register listeners to it for close and error
    socket: r
   }
  p.on('data', function (reply) {
    switch (reply[0]) {
      case 'message':
        return client.onPMessage.apply(null, reply.slice(1))
      case 'pmessage':
        return client.onMessage.apply(null, reply.slice(1))
    }
    var cb = queue.shift()
    if(Array.isArray(reply)) {
      return cb(null, reply)
    }
    if (reply[0] === '-') //this means it's an error
      return cb (reply) 
    return cb (null, reply) 
  })
  
  return client
}

if(!module.parent) {
  var r = 
  Redis(6379)
    .req(['PING'], console.error)
    .req(['PSUBSCRIBE', 'hello*'], console.error)
    .req(['SUBSCRIBE', 'whatever'], console.error)
}