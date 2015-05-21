var test          = require('tape'),
    argosyService = require('..'),
    match         = require('argosy-pattern/match')

test('message(pattern)', function (t) {
    t.plan(4)

    var service = argosyService()

    var helloWorld = service.message({hello:'world'})
    t.ok(helloWorld.process, 'should return a queue')

    var msg = { _: {cid:5}, hello:'world' }
    service.write(JSON.stringify(msg)+'\n')
    service.on('data', function (chunk) {
        var result = JSON.parse(chunk)
        if (result._.type !== 'response') return
        t.equal(result._.cid, 5, 'should produce a result with matching correlation id')
        t.equal(result.hello, 'WORLD', 'result should be streamed after process calls callback')
    })
    helloWorld.process(function (_msg, cb) {
        t.deepEqual(_msg, msg, 'queue processor should be called with message')
        cb(null, { hello: _msg.hello.toUpperCase() })
    })
})

test('message(nested pattern)', function (t) {
    t.plan(1)

    var service = argosyService()

    var nested = service.message({'nested.message': match.string})
    var msg = { _: {cid: 10}, nested: {message: 'go'}}
    nested.process(function (_msg, cb) {
        t.deepEqual(_msg, msg, 'queue processor should be called for nested message')
    })
    service.write(JSON.stringify({ _: {cid: 11}, nested: {message: 42}})+'\n')
    service.write(JSON.stringify(msg)+'\n')
})
