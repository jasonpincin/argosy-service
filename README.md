# argosy-service

[![NPM version](https://badge.fury.io/js/argosy-service.png)](http://badge.fury.io/js/argosy-service)
[![Build Status](https://travis-ci.org/jasonpincin/argosy-service.svg?branch=master)](https://travis-ci.org/jasonpincin/argosy-service)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/argosy-service/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/argosy-service?branch=master)
[![Davis Dependency Status](https://david-dm.org/jasonpincin/argosy-service.png)](https://david-dm.org/jasonpincin/argosy-service)

Easily create micro-services.

## example

```javascript
var service = require('argosy-service')(),
    match   = require('argosy-pattern/match'),
    client  = require('argosy-client')
client.pipe(service).pipe(client)

// create the service
service.message({ greet: match.string }).process(function (msg, cb) {
    cb(null, 'Hello ' + msg.greet)
})

// use the service
client.invoke({ greet: 'Jason' }, function (err, result) {
    console.log(result)
})
```

of with promises...

```javascript
// create the service
service.message({ greet: match.string }).process(function (msg) {
    return Promise.resolve('Hello ' + msg.greet)
})

// use the service
client.invoke({ greet: 'Jason' }).then(console.log)
```

## api

```javascript
var argosyService = require('argosy-service')
```

### service = argosyService()

Create a new service object. The `service` object is a stream intended to be connected (piped) to Argosy clients 
through any number of intermediary streams. 

### queue = service.message(pattern)

Create a [concurrent-queue](https://github.com/jasonpincin/concurrent-queue) that will be pushed messages that 
match the `pattern` object provided (see [argosy-pattern](https://github.com/jasonpincin/argosy-pattern) for details on 
defining patterns). These messages should be processed and responded to using the `process` function of the `queue`. 
Responses will be sent to the connected/requesting client.

It is advised not to match the key `argosy` as this is reserved for internal use. 


## default message handlers

### {argosy: 'info'}

All services created will respond to messages that match `{argosy: 'info'}`. The response payload will be:

```
{
    role: 'service',
    implemented: [
        'encoded argosy pattern 1',
        'encoded argosy pattern 2',
        '...'
    ]
}
```

The implemented array will contain encoded [argosy-pattern](https://github.com/jasonpincin/argosy-pattern)'s for which 
the service will respond.


## service stream messages

### service response

Outbound responses are structured like this:

```
{
    type: 'response',
    headers: { client: { id: 'uuid', seq: 0 } },
    body: {},
    error: { message: '', stack: '' }
}
```

Where:
* headers matches whatever headers object was supplied by the client to allow the client to correlate responses with requests on it's end
* body contains the response from the service message implementation
* error will be undefined unless an error occured in which case it will contain an object with the error message and stack

### new service message implementation

When a new message pattern for the service is defined, a `notify-implemented` message object will be emitted from the `service` 
stream. This allows connected listers to be made aware of new message implementations. The structure of this message is:

```
{
    type: 'notify-implemented',
    body: 'encoded argosy pattern'
}
```

## testing

`npm test [--dot | --spec] [--grep=pattern]`

Specifying `--dot` or `--spec` will change the output from the default TAP style. 
Specifying `--grep` will only run the test files that match the given pattern.

## coverage

`npm run coverage [--html]`

This will output a textual coverage report. Including `--html` will also open 
an HTML coverage report in the default browser.
