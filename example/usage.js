var service = require('..')(),
    match   = require('argosy-pattern/match')

service.message({ greet: match.string }).process(function (msg, cb) {
    cb(null, 'Hello ' + msg.greet)
})
