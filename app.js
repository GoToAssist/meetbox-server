var config = require('./config.js');
var Podio = require('./podio.js');
var express = require('express');
var util = require('util');
var Promise = require('bluebird');
var MeetingParser = require('./meetingparser.js');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(require('body-parser').json());
app.use(express.static(__dirname + '/public'));

app.get('/auth', function (req, res) {
  if (req.query.error) {
  	res.send(util.format('Access denied: %s %s %s', req.query.error_reason, req.query.error, error_description));
  } else {
  	var podio = new Podio(config.apiKey, config.appName, config.callbackUrl, req.query.code);
  	var start = Date.UTC(2015, 4, 5, 8, 0);
  	var end = Date.UTC(2015, 4, 5, 9, 1);

  	podio.authorize().then( (access_token) => {
		podio.getAllCalendars(start, end).then( (calendarResult) => {
			MeetingParser.getAllMeetingUrls(calendarResult, start, end).then((urls) => res.send(urls))
		});
  	});
  }
});

app.get('/user/:user_id', function (req, res) {
	if (req.headers.authorization) {
		var auth_token = req.headers.authorization.match(/OAuth2 (.*)/i)[1];
		
		var podio = new Podio(config.apiKey, config.appName, config.callbackUrl, req.query.code);
	  	
	  	podio.authorize(auth_token).then( () => {
			podio.getUserInfo().then( (userInfo) => {
				res.json(userInfo);
			});
	  	});
	} else {
		res.json([]);
	}
});

app.get('/spaces/:user_id', function (req, res) {
	console.log("Get spaces", req.params.user_id);
	if (req.headers.authorization) {
		var auth_token = req.headers.authorization.match(/OAuth2 (.*)/i)[1];
		
		var podio = new Podio(config.apiKey, config.appName, config.callbackUrl, req.query.code);
	  	
	  	podio.authorize(auth_token).then( () => {
			podio.getWorkspacesForallOrgs(req.params.user_id).then( (allWorkspaces) => {
				res.json(allWorkspaces);
			});
	  	});
	} else {
		res.json([]);
	}
});

app.get('/rooms/:space_id', function (req, res) {
	console.log("Get rooms", req.params.space_id);
	if (req.headers.authorization) {
		var auth_token = req.headers.authorization.match(/OAuth2 (.*)/i)[1];
		
		var podio = new Podio(config.apiKey, config.appName, config.callbackUrl, req.query.code);
	  	
	  	podio.authorize(auth_token).then( () => {
			podio.getRooms(req.params.space_id).then( (rooms) => {
				console.log(rooms);
				res.json(rooms);
			});
	  	});
	} else {
		res.json([]);
	}
});

app.get('/meetings', function (req, res) {
	console.log("Get meetings", req.headers);
	if (req.headers.authorization) {
		var auth_token = req.headers.authorization.match(/OAuth2 (.*)/i)[1];
		
		var podio = new Podio(config.apiKey, config.appName, config.callbackUrl, req.query.code);
	  	
	  	var start = Date.UTC(2015, 4, 5, 8, 0);
	  	var end = Date.UTC(2015, 4, 5, 9, 1);

	  	podio.authorize(auth_token).then( (access_token) => {
			podio.getAllCalendars(start, end).then( (calendarResult) => {
				//console.log(calendarResult);
				MeetingParser.getAllMeetingUrls(calendarResult, start, end).then((allUrls) => res.json(allUrls));
			});
	  	});
	} else {
		res.json([]);
	}

});

app.post('/presence', function(req, res){
	var topic = 'presence/' + req.body.room.Identifier;
	io.emit(topic, req.body.meeting);
	console.log("Presence sent", req.body);
	res.send("OK");
});


app.post('/join', function(req, res){
	var topic = 'join/' + req.body.room.Identifier;
	io.emit(topic, req.body.meeting);
	console.log("Joining Room", req.body);
	res.send("OK");
});

app.get('/login', function (req, res) {
  var loginUrl = util.format('https://podio.com/oauth/authorize?client_id=%s&redirect_uri=%s', config.appName, config.callbackUrl);
  res.redirect(loginUrl);
});


io.on('connection', function (socket) {
});

var server = server.listen(process.env.PORT || 3000, function () {

  var host = 'localhost';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});