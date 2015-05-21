var cq       = require('concurrent-queue'),
    assign   = require('object-assign'),
    through2 = require('through2'),
    pipeline = require('stream-combiner2'),
    split    = require('split2'),
    join     = require('join-stream2'),
    pattern  = require('argosy-pattern')

module.exports = function argosyService () {
    var implemented = [],
        input       = split(),
        output      = join('\n')

    var processMessage = through2(function parse(chunk, enc, cb) {
        var msg = JSON.parse(chunk)
        queue(msg, function done (err, result) {
            var headers = { type: 'response', cid: msg._.cid }
            if (err) headers.error = { message: err.message }
            cb(null, JSON.stringify(assign({}, result, { _: headers })))
        })
    })

    var service = pipeline(input, processMessage, output)
    service.message = function message (rules) {
        var impl = { pattern: pattern(rules), queue: cq() }
        implemented.push(impl)
        output.push(JSON.stringify({ _: {type: 'notify-implemented'}, implemented: impl.pattern.encode() }))
        return impl.queue
    }

    // default message pattern implementations
    service.message({argosy:'info'}).process(function onInfoRequest (msg, cb) {
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
