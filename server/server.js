var concepts = ['saltar', 'computador', 'auto', 'planeta', 'sol'];

var players = {};
var concept;
var currentRound = 0;
var MAX_ROUNDS = 5;

var app = require('http').createServer(),
    io  = require('socket.io').listen(app);

app.listen(3001);
console.log("Listening on port 3001");

var nsp = io.of('/room');
var room = nsp.on('connection', function(socket){

	var nick;

	socket.on('newPlayer', function(data){
		nick = data.nick;
		console.log("new player: " + nick);
		socket.broadcast.emit('newPlayer', {'nick': nick});
		players[nick] = socket.id;
	});

	socket.on('start', function(){
		console.log("start event received");
		room.emit('start', {'nick': nick});

		nextRound();
	});

	socket.on('coordinates', function(data){
		socket.broadcast.emit('coordinates', data);
	});

	socket.on('position', function(data){
		socket.broadcast.emit('position', data);
	});

	socket.on('message', function(data){
		if (data.text == concept){
			console.log("+1 " + nick);
			room.emit('message', {'nick': 'Server', 'text': '+1 <' + nick+'>'});
			nextRound();
		}
		else 
			socket.broadcast.emit('message', data);
	});

	socket.on('clear', function(data){
		socket.broadcast.emit('clear', data);
	});

	socket.on('disconnect', function(){
		console.log("disconnected: " + nick);
		delete players[nick];
		socket.broadcast.emit('message', {'nick': 'Server', 'text': nick + ' abandona partida'});
	});
});


/* utilities functions */

function choosePainter() {
	return Object.keys(players)[Math.floor((Math.random() * Object.keys(players).length) + 0)];
}

function nextRound() {
	if (currentRound < MAX_ROUNDS) {
		console.log("Round number " +  currentRound);
		var painter = choosePainter();
		concept = concepts[Math.floor(Math.random() * 5)];
		console.log("Painter: " + painter + " concept: " + concept);
		room.emit('newRound', {'nick': painter, 'concept': concept});
		currentRound++;	
	} else {
		room.emit('message', {'nick': 'Server', 'text': 'Juego terminado.'});
	}
}

/* end utilities functions */