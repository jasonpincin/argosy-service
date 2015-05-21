var test          = require('tape'),
    argosyService = require('..')

test('argosy info message', function (t) {
    t.plan(3)

    var service = argosyService()
    service.message({test: /\d+/})
    service.on('data', function (chunk) {
        var result = JSON.parse(chunk)
        if (result._.type !== 'response') return
        t.equal(result._.cid, 1, 'should produce a result with matching correlation id')
        t.equal(result.role, 'service', 'should identify itself as a service')
        t.deepEqual(result.implemented, [{argosy:'info'}, {test:'/\\d+/'}], 'should reveal argosy:info and test:regexpString as implemented')
    })
    service.write(JSON.stringify({ _: {cid: 1}, argosy: 'info' })+'\n')
})
