var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('request');
var _ = require('lodash');
var currentScore;

app.use("/media", express.static(__dirname + '/media'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

function findString(searchArray){
	var return_val = false;
	_.each(searchArray, function(value){
		if(value != undefined){
			if(value.indexOf('Bay') != -1 && value.indexOf('Green') != -1){
				return_val = value;
			}
		}
	});
	return return_val;
}

function getScore() {
	var score;
	request({ 
		method: 'get',
		uri:'http://sports.espn.go.com/nfl/bottomline/scores'
		},
		function(error,response,body) {
			var data = body.replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
			var dataVals = _.values(data);
			var game = findString(dataVals);
			var gameArr = game.split("%20");
			currentScore = gameArr[gameArr.indexOf('Bay')+1];
		}
	);
}

setInterval(function(){
	console.log(currentScore);
	getScore();	
},15000);

io.on('connection', function(socket) {
    console.log('a user connected');
    var lastScore = currentScore;
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    setInterval(function(){
    	if(lastScore < currentScore || lastScore == undefined){
    		var emitNum;
    		if(lastScore == undefined){
    			emitNum = 0;
    		}else {
    			emitNum = (currentScore-lastScore);
    		}
    		io.emit('score', emitNum);
    		console.log('Emitted Chirps');
    		lastScore = currentScore;
    	}
    }, 5000);
});

server.listen(3000, function() {
    console.log('listening on *:3000');
});

