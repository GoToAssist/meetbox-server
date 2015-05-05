var moment = require('moment');

module.exports = {
	getAllMeetingUrls: function (allMeetings, startTimeUTC, endTimeUTC) {
		var start = moment(startTimeUTC);
		var end = moment(endTimeUTC);
		
		var meetings = allMeetings.reduce((a,b) => a.concat(b));

		//console.log(meetings);
		var filteredMeetings = meetings.filter((m) => {
			console.log('MOMENT', m.start_utc, moment(m.start_utc + ' +0000', 'YYYY-MM-DD hh:mm:ss ZZ').format('hh:mm ZZ'), start.format('hh:mm ZZ'), end.format('hh:mm ZZ'))
			return moment(m.start_utc + ' +0000', 'YYYY-MM-DD hh:mm:ss ZZ').isBetween(start, end);
		});

		console.log(filteredMeetings);

		return JSON.stringify(filteredMeetings).match(/https?:\/\/(gotomeet.me|g2m.me|free.gotomeeting.com|global.gotomeeting.com\/join)\/[a-z]+/gi);
	}
};