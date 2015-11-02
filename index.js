/**
 * SportsChirp!
 * 
 * Emits an event to connected clients when score is updated.
 *
**/
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('request-promise');
var _ = require('lodash');
var config = require('./config.js');

var currentScores;
var openSockets;

app.use("/media", express.static(__dirname + '/media'));
app.use("/dist", express.static(__dirname + '/dist'));
app.use("/dist/css", express.static(__dirname + '/dist/css'));
app.use("/dist/js", express.static(__dirname + '/dist/js'));
app.use("/dist/fonts", express.static(__dirname + '/dist/fonts'));

app.set('view engine', 'ejs')

app.get('/:team', function(req, res) {

	var gameIndex = getIndex(req.params.team);

	if(gameIndex == -1){
		res.send("Game Not Found");
	}else {
		var game = currentScores[gameIndex];
		//res.send(game.h + ": " + game.hs + " - " + game.v + ": "+game.vs);
		//res.sendFile(__dirname + "/index.html");
		res.render('index', {
			'homeName':game.hnn,
			'homeScore':game.hs,
			'homeSound':config[game.h.toLowerCase()].sound,
			'homeLogo': config[game.h.toLowerCase()].logo,
			'awayName':game.vnn,
			'awayScore':game.vs,
			'awaySound':config[game.v.toLowerCase()].sound,
			'awayLogo': config[game.v.toLowerCase()].logo
		});
	}
});

io.on('connection', function(socket) {
	var referer = socket.handshake.headers.referer.split("/");
	var team = referer[referer.length - 1];
	var gameIndex = getIndex(team);

	var lastGameState = currentScores[gameIndex];
	    
	console.log('a user connected to ' + team);
	
	setInterval(function(){
		console.log('checking scores');
		    var emitFlag = null;
		    if(lastGameState.hs < currentScores[gameIndex].hs){
		   		emitFlag = 'homeScore';
		   	} else if(lastGameState.vs < currentScores[gameIndex].vs){
		   		emitFlag = 'awayScore';
		   	}
	    	if(emitFlag != null){
	    		io.emit(emitFlag,{
	    			'home': currentScores[gameIndex].hs,
	    			'away': currentScores[gameIndex].vs
	    		});
	    	}
    }, 15000);
	
	socket.on('disconnect', function() {
		console.log('user connected to '+team+' disconnected');
	});
});
/**
* Makes a request to the url and does some janky things to the data...
*/
function updateScore() {
	var score;
	request({ 
		method: 'get',
		uri:'http://www.nfl.com/liveupdate/scorestrip/ss.json'
		},
		function(error,response,body) {
			currentScores = JSON.parse(body).gms;
			console.log('Scores Updated');
		}
	);
}
function getIndex(teamName){
	return _.findIndex(currentScores, function(score){
		if(score.h == teamName || score.v == teamName){
			return true;
		}else {
			return false;
		}
	});
}

server.listen(3000, function() {
    request({ 
		method: 'get',
		uri:'http://www.nfl.com/liveupdate/scorestrip/ss.json'
		}
	).then(function(body){
		var json = JSON.parse(body);
		currentScores = json.gms;
		console.log("Scores Set");
		setInterval(function(){
			updateScore();	
		},30000);
	});
	console.log('listening on *:3000');
});

