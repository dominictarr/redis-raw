```

    __      ___      ___   / ( )  ___            __      ___
  //  ) ) //___) ) //   ) / / / ((   ) ) ____  //  ) ) //   ) ) //  / /  / /
 //      //       //   / / / /   \ \          //      //   / / //  / /  / /
//      ((____   ((___/ / / / //   ) )       //      ((___( ( ((__( (__/ /

```
# RedisRaw

##A simple redis client

I wrote this because the other available nodejs redis clients were not <em>correct</em> enough for me.

RedisRaw handles all commands, (including P?UNSUBSCRIBE) with callbacks consistant to the _nodejs way_.

## create a new client

`redis-raw.Redis` takes the same arguments as [`net.createConnection`](http://nodejs.org/api/net.html#net.createConnection).
returns a redis client, callback is optional.


``` js
  var Redis = require('redis-raw').Redis
    , r = Redis(port, host, callback)
```

## .req(command, callback)

``` js
  r.req(['GET', key, value], function (err, reply) {...})
```
`command` _must_ be an array of strings.
commands are described in the [redis documentation](redis.io/commands)

`reply` may be a primitive or an array.
if `err` is from redis, `err` will be a `string`.

If there is a unexpected disconnection,
all callbacks that have not been answered will get an error.

 * RedisRaw does not stringify objects for you. <em>do your own json</em>

## Pub Sub

### SUBSCRIBE & PSUBSCRIBE

when redis gets a [SUBSCRIBE]((http://redis.io/commands/subscribe) or [PSUBSCRIBE](http://redis.io/commands/psubscribe) command,
it goes into subscribe mode and non Pub/Sub commands will callback an error.

### UNSUBSCRIBE & PUNSUBSCRIBE

calls to [UNSUBSCRIBE]((http://redis.io/commands/unsubscribe) [PUNSUBSCRIBE]((http://redis.io/commands/punsubscribe) will callback `(error, [events, subscriptionCount])`

where `events` is the list of events that you have unsubscribed to.

> redis has strange behavior with the handling of these commands, and may reply many times.
> however, RedisRaw keeps it's own count of subscriptions, and will callback only once, in the normal nodejs way.
> (it was my frustration with other redis clients on this matter that decided me to write this package)
> i've opened an issue about this here: https://github.com/antirez/redis/issues/123

### .onMessage & .onPMessage

capture messages that you are subscribed to by overwriting `redis.onMessage` and `redis.onPMessage`
see [http://redis.io/topics/pubsub](http://redis.io/topics/pubsub)

``` js

var Redis = require('redis-raw').Redis
  , r = Redis(port, host, callback)

r.req(['PSUBSCRIBE', '*'], function () {...})

r.onMessage = function (event, message) {...}
r.onPMessage = function (event, pattern, message) {...}

```

[PSUBSCRIBE](http://redis.io/commands/psubscribe) supports all standard [glob patterns](http://en.wikipedia.org/wiki/Glob_(programming\)).

## 'error', 'close', .end() and .destroy()

redis raw does not manage the connection for you,
Users should directly access the underlieing [net.Socket](http://nodejs.org/api/net.html#net.Socket)
and add listeners and end or destroy the connection there.

``` js
var Redis = require('redis-raw').Redis
  , r = Redis(port, host, callback)

r.socket.on('close',function () {...})
r.socket.destroy()
```

(also, you can let the server close the connection `r.req(['QUIT'], callback)`)
