var test          = require('tape'),
    argosyService = require('..')

test('invalid message', function (t) {
    t.plan(3)

    var service = argosyService()
    service.on('data', function (chunk) {
        var result = JSON.parse(chunk)
        if (result._.type !== 'response') return
        t.deepEqual(result._.client, {id:1, request:10}, 'should produce a result with matching client header')
        t.ok(result._.error && result._.error.message, 'should have an error property')
        t.ok(result._.error.message.match(/^not implemented/), 'should produce an error message containing "not implemented"')
    })
    service.write(JSON.stringify({ _: {client: {id:1, request:10}}, argosy: 'bad' })+'\n')
})
