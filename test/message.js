var test          = require('tape'),
    argosyService = require('..'),
    match         = require('argosy-pattern/match')

test('message(pattern)', function (t) {
    t.plan(4)

    var service = argosyService()

    var helloWorld = service.message({hello:'world'})
    t.ok(helloWorld.process, 'should return a queue')

    var msg = { type: 'request', headers: {client: {id:1, request:10}}, body: { hello: 'world' } }
    service.write(JSON.stringify(msg)+'\n')
    service.on('data', function (chunk) {
        var msg = JSON.parse(chunk)
        if (msg.type !== 'response') return
        t.deepEqual(msg.headers.client, {id:1, request:10}, 'should produce a msg with matching client header')
        t.equal(msg.body.hello, 'WORLD', 'msg should be streamed after process calls callback')
    })
    helloWorld.process(function (_msg, cb) {
        t.deepEqual(_msg, msg.body, 'queue processor should be called with message')
        cb(null, { hello: _msg.hello.toUpperCase() })
    })
})

test('message(nested pattern)', function (t) {
    t.plan(1)

    var service = argosyService()

    var nested = service.message({'nested.message': match.string})
    var msg = { type: 'request', headers: {client: {id:1, request:10}}, body: { nested: {message: 'go'} } }
    nested.process(function (_msg, cb) {
        t.deepEqual(_msg, msg.body, 'queue processor should be called for nested message')
    })
    service.write(JSON.stringify({ type: 'request', headers: {client: {id:1, request:10}}, body: { nested: {message: 42} } })+'\n')
    service.write(JSON.stringify(msg)+'\n')
})
