# RedisRaw
``` 
    __      ___      ___   / ( )  ___            __      ___                 
  //  ) ) //___) ) //   ) / / / ((   ) ) ____  //  ) ) //   ) ) //  / /  / / 
 //      //       //   / / / /   \ \          //      //   / / //  / /  / /  
//      ((____   ((___/ / / / //   ) )       //      ((___( ( ((__( (__/ /   
```

##simple redis client

I wrote this because the other redis clients available for nodejs where not <em>correct</em> enough for me.  
basically, the way redis replys to pub/sub commands are a bit weird, and the other libraries handled them in a weird way.  

RedisRaw just tries to be as idiomatic node as possible, so that you can concentrate on learning redis,  
not learning bugs in the redis client.  

## create a new client

`redis-raw.Redis` takes the same arguments as [`net.createConnection`](http://nodejs.org/api/net.html#net.createConnection).  
returns a redis client, callback is optional.  


``` js
  var Redis = require('redis-raw').Redis
    , r = Redis(port, host, callback)
```

## make a request to redis

``` js
  r.req(['GET', key, value], function (err, reply) {
  })
```
pass arguments as an array of strings,  
commands are described in the [redis documentation](redis.io/commands)
callsback with redis reply,  

In the case where the reply is a single value, `reply` will be a primitive.
if when redis returns many values, `reply` will be an array.

 * RedisRaw does not stringify objects for you. you must <em>do your own json</em>

## Pub Sub

### SUBSCRIBE & PSUBSCRIBE

when redis gets a [SUBSCRIBE]((http://redis.io/commands/subscribe) or [PSUBSCRIBE](http://redis.io/commands/psubscribe) command,  
it goes into subscribe mode and non Pub/Sub commands will callback an error.

### UNSUBSCRIBE & PUNSUBSCRIBE

calls to [UNSUBSCRIBE]((http://redis.io/commands/unsubscribe)  
[PUNSUBSCRIBE]((http://redis.io/commands/punsubscribe) will callback `(error, events, subscriptionCount)`

where `events` is the list of events that you have unsubscribed to.  

> redis has strange behavior with the handling of these commands, and will return many results. 
> however, RedisRaw keeps it's own count of subscriptions, and will callback in a normal nodejs way.
> (it was my frustration with other redis clients on this matter that decided me to write this package)

## error, disconnect, and closing the connection.

directly access the underling [net.Socket](http://nodejs.org/api/net.html#net.Socket)  
add listeners and close connections there.  
(or, let the server close the connection `r.req(['QUIT'], callback)`)

``` js
var Redis = require('redis-raw').Redis
  , r = Redis(port, host, callback)

  //listen for connection closing
  r.socket.on('close', function () {...})

  //end connection
  r.socket.end()
  //this will half close the connection, 
  //redis will still write replys to any outstanding requests
  //and then close the connection.
```

