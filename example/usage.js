var argosyService = require('..')
var service = argosyService()

service.message({ greet: 'Jason' }).process(function (msg, cb) {
    cb(null, 'Hello ' + msg.greet)
})
