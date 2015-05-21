var test          = require('tape'),
    argosyService = require('..')

test('argosy-service', function (t) {
    t.plan(2)

    var service = argosyService()

    t.equals(typeof service, 'object', 'should be an object')
    t.equals(typeof service.pipe, 'function', 'should be a stream')
})
