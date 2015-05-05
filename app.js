var config = require('./config.js');
var Podio = require('./podio.js');
var express = require('express');
var util = require('util');
var Promise = require('bluebird');
var MeetingParser = require('./meetingparser.js');

var app = express();


app.get('/auth', function (req, res) {
  if (req.query.error) {
  	res.send(util.format('Access denied: %s %s %s', req.query.error_reason, req.query.error, error_description));
  } else {
  	var podio = new Podio(config.apiKey, config.appName, config.callbackUrl, req.query.code);
  	var start = Date.UTC(2015, 4, 5, 8, 0);
  	var end = Date.UTC(2015, 4, 5, 9, 1);

  	podio.authorize().then( (access_token) => {
		podio.getAllCalendars(start, end).then( (calendarResult) => {
			res.send(MeetingParser.getAllMeetingUrls(calendarResult, start, end));
		});
  	});
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
				res.json(MeetingParser.getAllMeetingUrls(calendarResult, start, end));
			});
	  	});
	} else {
		res.json([]);
	}

});

app.get('/', function (req, res) {
  var loginUrl = util.format('https://podio.com/oauth/authorize?client_id=%s&redirect_uri=%s', config.appName, config.callbackUrl);
  res.redirect(loginUrl);
});

var server = app.listen(3000, function () {

  var host = 'localhost';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});