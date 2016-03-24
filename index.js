// variables

var socket = io.connect("http://localhost:3001/room"),
	send = document.getElementById('send'),
	start = document.getElementById('start'),
  canvas = document.getElementById('canvas'),
  context = canvas.getContext('2d'),
  input = document.getElementById('input'),
  clear = document.getElementById('clear'),
  enter = document.getElementById('enter'),
  textArea = document.getElementById('textArea'),
  word = document.getElementById('word'),
  painter = false,
  paint = false;
  nick;

/* controls events */

enter.addEventListener('click', function(){
	nick = document.getElementById('nick').value;
	socket.emit('newPlayer', {'nick': nick});
	console.log("create room with owner " + nick);
	document.getElementById('content').style.display = 'block';
	document.getElementById('login').style.display = 'none';
});

send.addEventListener('click', function(){
	var text = document.getElementById('input').value;
	var data = {'nick': nick, 'text': text};
    socket.emit('message', data);
    document.getElementById('input').value = "";
    append(textArea, data);
});

start.addEventListener('click', function(){
	socket.emit('start', null);
});

clear.addEventListener('click', function(){
	clearCanvas();
	socket.emit('clear', null);
});

input.addEventListener('keypress', function (e){
	if (e.code == 'Enter') send.click();
});

/* end controls events */


/* socket.io events */

socket.on('message', function(data){
	append(textArea, data);
});

socket.on('newPlayer', function(data){
	append(textArea, {'nick': 'Server', 'text': 'nuevo jugador <'+data.nick+'>'});
});

socket.on('newRound', function(data){
	console.log("turno de " + data.nick);
	clearCanvas();
	append(textArea, {'nick': 'Server', 'text': 'pintor <'+data.nick+'>'});
	if (data.nick == nick){
		painter = true
		word.innerHTML = data.concept;
		setControlsVisibility(true);
	} else {
		setControlsVisibility(false);
		painter = false;
	}
});

socket.on('start', function(data){
	start.style.display = 'none';
	append(textArea, {'nick': 'Server', 'text': 'Partida iniciada por <' + data.nick+'>'});
});

socket.on('coordinates', function(data){
	console.log("recibidas coordenadas: " + data.x + " " + data.y);
	last_mouse.x = mouse.x;
	last_mouse.y = mouse.y;

	mouse.x = data.x;
	mouse.y = data.y;

	onPaint();
});

socket.on('position', function(data){
	console.log("reposicionando en " + data.x + " " + data.y);
	mouse.x = data.x;
	mouse.y = data.y;
});

socket.on('clear', function(data){
	clearCanvas();
});

/* end socket.io events */


/* canvas freehand (http://codetheory.in/html5-canvas-drawing-lines-with-smooth-edges) */
	
var mouse = {x: 0, y: 0};
var last_mouse = {x: 0, y: 0};

canvas.addEventListener('mousemove', function(e) {
	last_mouse.x = mouse.x;
	last_mouse.y = mouse.y;
	
	mouse.x = e.pageX - this.offsetLeft;
	mouse.y = e.pageY - this.offsetTop;

	if (painter && paint) socket.emit('coordinates', {'x': mouse.x, 'y': mouse.y});
}, false);

context.lineWidth = 3;
context.lineJoin = 'round';
context.lineCap = 'round';
context.strokeStyle = 'black';

canvas.addEventListener('mousedown', function(e) {
	console.log("mouse down");
	var x = e.pageX - this.offsetLeft;
	var y = e.pageY - this.offsetTop;
	socket.emit("position", {'x': x, 'y': y});
	paint = true;
	if (painter) canvas.addEventListener('mousemove', onPaint, false);
}, false);

canvas.addEventListener('mouseup', function() {
	paint = false;
	canvas.removeEventListener('mousemove', onPaint, false);
}, false);

canvas.addEventListener('mouseleave', function(){
	paint = false;
	canvas.removeEventListener('mousemove', onPaint, false);
});

var onPaint = function() {
	context.beginPath();
	context.moveTo(last_mouse.x, last_mouse.y);
	context.lineTo(mouse.x, mouse.y);
	context.closePath();
	context.stroke();
};

/* end canvas freehand */


/* utilities functions */

function append (textArea, data) {
	textArea.value = textArea.value + "\n" + data.nick +": "+data.text;
	textArea.scrollTop = textArea.scrollHeight;
}

function clearCanvas () {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function setControlsVisibility (b) {
	if (b) {
		document.getElementById('concept').style.display = 'block';
		clear.style.display = 'block'
	} else {
		document.getElementById('concept').style.display = 'none';
		clear.style.display = 'none'
	}
}

/* end utilities functions */