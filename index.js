var cq       = require('concurrent-queue'),
    assign   = require('object-assign'),
    through2 = require('through2'),
    filter   = require('through2-filter'),
    pipeline = require('stream-combiner2'),
    split    = require('split2'),
    pattern  = require('argosy-pattern')

module.exports = function argosyService () {
    var implemented = [],
        input       = split(),
        requests    = filter(function (chunk) { return JSON.parse(chunk).type === 'request' })
        output      = through2(function (chunk, enc, cb) { cb(null, chunk+'\n') })

    var processMessage = through2(function parse(chunk, enc, cb) {
        var msg = JSON.parse(chunk)
        queue(msg.body, function done (err, result) {
            var reply = { type: 'response', headers: msg.headers, body: result }
            if (err) reply.error = { message: err.message, stack: err.stack }
            cb(null, JSON.stringify(reply))
        })
    })

    var service = pipeline(input, requests, processMessage, output)
    service.message = function message (rules) {
        var impl = { pattern: pattern(rules), queue: cq() }
        implemented.push(impl)
        output.write(JSON.stringify({type: 'notify-implemented', body: impl.pattern.encode() }))
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
