var Promise = require("bluebird");
var rest = require('restler');
var util = require('util');
var moment = require('moment');

var Podio = function(apiKey, appName, callbackUrl, code) {
	this.apiKey = apiKey;
	this.appName = appName;
	this.callbackUrl = callbackUrl;
	this.code = code;
};

Podio.prototype = {
	authorize: function(access_token) {
		var def = Promise.defer();

		if (access_token) {
			this.access_token = access_token;
			def.resolve(this.access_token);
			return def.promise;
		}

		var self = this;
		rest.post('https://podio.com/oauth/token', {
	  		data: {
	  			grant_type: 'authorization_code',
	  			client_id: this.appName,
	  			redirect_uri: this.callbackUrl,
	  			client_secret: this.apiKey,
	  			code: this.code
  			}
  		}).on('complete', (result) => {
  			self.authSettings = result;
  			self.access_token = result.access_token;
  			def.resolve(self.access_token);
  		}).on('error', () => {
  			def.reject();
  		});

  		return def.promise;
  	},

  	getResource: function (resource) {
  		var def = Promise.defer();

  		rest.get('https://api.podio.com' + resource, {
  			headers: {
  				Authorization: util.format('OAuth2 %s', this.access_token)
  			}
  		}).on('complete', (result) => {
  			def.resolve(result);
  		}).on('error', () => def.reject());

  		return def.promise;	
  	},

  	getCalendar: function(fromDate, toDate) {
  		return this.getResource(
  			util.format('/calendar?date_from=%s&date_to=%s&priority=%s&tasks=%s',
  			moment(fromDate).format('YYYY-MM-DD'),
  			moment(toDate).format('YYYY-MM-DD'),
  			'5',
  			'false'
  		));

  		return def.promise;
  	},

  	getLinkedCalendar: function(linked_account_id, fromDate, toDate) {
  		return this.getResource(util.format('/calendar/linked_account/%s?date_from=%s&date_to=%s',
  			linked_account_id,
  			moment(fromDate).format('YYYY-MM-DD'),
  			moment(toDate).format('YYYY-MM-DD')
  		));
  	},

  	getAllCalendars: function(fromDate, toDate) {
  		var self = this;
  		
  		return this.getLinkedAccounts().then((linkedAccounts) => {
  			if (linkedAccounts.error) { return; }
  			return Promise.all(
  				linkedAccounts.map(
  					(link) => self.getLinkedCalendar( link.linked_account_id, fromDate, toDate )
  				).concat([self.getCalendar(fromDate, toDate)])
  			).then((cResult) => cResult.reduce((a,b) => a.concat(b)));
  		});
  	},

  	getLinkedAccounts: function() {
  		return this.getResource('/linked_account?capability=calendar');
  	},

  	getOrganizations: function () {
  		return this.getResource('/org/');
  	},

  	getWorkspaces: function (org, user_id) {
  		return this.getResource('/org/' + org.org_id +  '/member/' + user_id + '/space_member/');
  	},

  	getWorkspacesForallOrgs: function (user_id) {
  		var self = this;
  		return this.getOrganizations().then((orgs) => {
  			if (orgs.error) { return; }
  			var allSpaces = [];
  			orgs.forEach((org) => { allSpaces = allSpaces.concat(
  				org.spaces.map((s) => {return { name: s.name, space_id: s.space_id } } )
  			) });
  			return allSpaces;
  		});
  	},

  	getApps: function(space_id) {
  		return this.getResource('/app/space/' + space_id + '/');
  	},

  	getRoomApp: function(space_id) {
  		return this.getApps(space_id).then((apps) => {
  			var roomApps = apps.filter((a) => a.config.name === "Rooms");
  			return roomApps.length ? roomApps[0] : [];
  		});
  	},

  	mapRoomItem: function(roomItem) {
  		var newRoom = {};
  		roomItem.fields.forEach(field => {
  			newRoom[field.label] = field.values[0].value;
  		});
		  return newRoom;
  	},

  	getRooms: function (space_id) {
  		var self = this;
  		return this.getRoomApp(space_id).then((roomApp) => {
  			return self.getResource('/item/app/' + roomApp.app_id).then((roomItems) => {
  				return roomItems.items.map(self.mapRoomItem);
  			});
  		});
  	},

  	getUserInfo: function(user_id) {
  		return this.getResource('/user/status');
  	},
 };

 module.exports = Podio;