var moment = require('moment');
var rest = require('restler');
var Promise = require('bluebird');
var util = require('util');

var hasMeetingExpr = /https?:\/\/(gotomeet.me|g2m.me|next.g2m.me|free.gotomeeting.com|next.free.gotomeeting.com|global.gotomeeting.com\/join)\/[a-z0-9]+/gi;

var Parser = {
	getAllMeetingUrls: function (allMeetings, startTimeUTC, endTimeUTC) {
		var start = moment.utc(startTimeUTC);
		var end = moment.utc(endTimeUTC);

		var filteredMeetings = allMeetings.filter((m) => {
			var startTime = moment.utc(m.start_utc, 'YYYY-MM-DD hh:mm:ss ZZ');
			var endTime = moment.utc(m.end_utc, 'YYYY-MM-DD hh:mm:ss ZZ');
			var now = moment.utc();

			console.log(endTime.isAfter(now), startTime.isBetween(start, end), endTime.isBetween(start, end), now.calendar(), start.calendar(), end.calendar(), startTime.calendar(), endTime.calendar());

			return endTime.isAfter(now) && // Meeting has not ended
				(startTime.isBetween(start, end) || // And Meeting starts in the interval
				endTime.isBetween(start, end)); // Or meeting ends in the interval
		});

		console.log(filteredMeetings);

		filteredMeetings = filteredMeetings.filter((m) => {
			return JSON.stringify(m).match(hasMeetingExpr);
		});

		//var allUrls = JSON.stringify(filteredMeetings).match(hasMeetingExpr);
		return Promise.all(filteredMeetings.map(Parser.mapMeeting));
	},

	mapMeeting: function(meeting) {
		var url = JSON.stringify(meeting).match(hasMeetingExpr);
		console.log("url[0]", url[0]);
		return Parser.convertToInstantJoin(url[0]).then((convertedUrl) => {
			var mapped = {
				url: convertedUrl,
				title: meeting.title,
				startTimeUTC: meeting.start_utc,
				endTimeUTC: meeting.end_utc
			};
			console.log(mapped);
			return mapped;
		});
	},

	convertToInstantJoin: function (url) {
		var def = Promise.defer();
		console.log('URL', url);

		if (url.indexOf("free.gotomeeting") >= 0 || url.indexOf("g2m.me") >= 0) {
			if (!url.match(/https?:\/\/next/i)) {
				url = url.replace(/:\/\//i, '://next.');
			}
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

module.exports = Parser;