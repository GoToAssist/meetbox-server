var moment = require('moment');
var rest = require('restler');
var Promise = require('bluebird');
var util = require('util');

module.exports = {
	getAllMeetingUrls: function (allMeetings, startTimeUTC, endTimeUTC) {
		var start = moment(startTimeUTC);
		var end = moment(endTimeUTC);
		
		var meetings = allMeetings.reduce((a,b) => a.concat(b));

		var filteredMeetings = meetings.filter((m) => {
			return moment(m.start_utc + ' +0000', 'YYYY-MM-DD hh:mm:ss ZZ').isBetween(start, end);
		});

		var allUrls = JSON.stringify(filteredMeetings).match(/https?:\/\/(gotomeet.me|g2m.me|free.gotomeeting.com|global.gotomeeting.com\/join)\/[a-z0-9]+/gi);
		return Promise.all(allUrls.map(this.convertToInstantJoin));
		//return JSON.stringify(filteredMeetings).match(/https?:\/\/(gotomeet.me|g2m.me|free.gotomeeting.com|global.gotomeeting.com\/join)\/[a-z0-9]+/gi);
	},

	convertToInstantJoin: function (url) {
		var def = Promise.defer();
		console.log('URL', url);

		if (url.indexOf("free.gotomeeting") >= 0 || url.indexOf("g2m.me") >= 0) {
			console.log('URL is free');
			def.resolve(url);
		} else if (url.match(/[0-9]+$/)) {
			var meetingId = url.match(/[0-9]+$/);
			def.resolve(util.format('https://app.gotomeeting.com/video/index.html?meetingid=%s', meetingId));
		} else {
			var profileId = url.match(/\w+$/);
			console.log('URL Must Convert', profileId);
			rest.get('https://apiglobal.gotomeeting.com/rest/2/profiles/' + profileId).on('complete', (data) => {
				var newUrl = util.format('https://app.gotomeeting.com/video/index.html?meetingid=%s', data.meetingId);
				console.log("Resolved URL", newUrl, data);
				def.resolve(newUrl);
			}).on('error', () => {
  				def.reject();
  			});
		}

		return def.promise;
	}
};