var cq        = require('concurrent-queue'),
    assign    = require('object-assign'),
    through2  = require('through2'),
    objectify = require('through2-objectify'),
    filter    = require('through2-filter'),
    pipeline  = require('stream-combiner2'),
    split     = require('split2'),
    pattern   = require('argosy-pattern')

module.exports = function argosyService () {
    var implemented = [],
        input       = split(),
        parse       = objectify(function (chunk, enc, cb) { cb(null, JSON.parse(chunk)) }),
        output      = objectify.deobj(function (msg, enc, cb) { cb(null, JSON.stringify(msg) + '\n') }),
        requests    = filter.obj(function (msg) { return msg.type === 'request' })

    var processMessage = through2.obj(function parse(msg, enc, cb) {
        queue(msg.body, function done (err, result) {
            var reply = { type: 'response', headers: msg.headers, body: result }
            if (err) reply.error = { message: err.message, stack: err.stack }
            processMessage.push(reply)
        })
        cb()
    })

    var service = pipeline(input, parse, requests, processMessage, output)
    service.message = function message (rules) {
        var impl = { pattern: pattern(rules), queue: cq() }
        implemented.push(impl)
        output.write({type: 'notify-implemented', body: impl.pattern.encode() })
        return impl.queue
    }

    // default message pattern implementations
    service.message({argosy:'info'}).process(function onInfoRequest (msgBody, cb) {
        cb(null, {
            role: 'service',
            implemented: implemented.map(function implPatterns (impl) {
                return impl.pattern.encode()
            })
        })
    })

    function queue (message, cb) {
        var implementations = implemented.filter(function acceptsMessage (impl) {
            return impl.pattern.matches(message)
        })
        if (!implementations.length) return cb(new Error('not implemented: ' + JSON.stringify(message)))
        implementations[0].queue(message, cb)
    }

    return service
}
