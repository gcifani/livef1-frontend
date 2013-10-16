var livef1  = require('./lib/livef1')
  , connect = require('connect')
  ;

var app = connect()
  . use(connect.static('public', { maxAge: 31557600000 }))
  . use(connect.compress())
  . use(connect.favicon(__dirname + '/public/favicon.ico'))
  . listen(3000)
  ;

var io = require('socket.io').listen(app);
    io.set('log level', 2);
    io.enable('browser client gzip');
    io.enable('browser client minification');

var F1_USER = "a6042332@drdrb.com"
  , F1_PASS = "zb2MDAqYBwYPNbg9"
  , F1_KEYFRAME = false ? __dirname + "/fixtures/2013-japan-suzuka/keyframe_00005.bin" : "live"
  ;

io.sockets.on('connection', function (socket) {

    livef1(F1_USER, F1_PASS, function(packet){
        socket.emit('packet', packet);
    }, F1_KEYFRAME).then(function(result){
        console.log('   \033[33mf1lt  -\033[39m', result);
    }, function(err){
        console.error('   \033[31mf1lt  -\033[39m', err);
    });

});