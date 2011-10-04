module.exports = function(bot) {

	var irc = require('irc');
	
	var client = new irc.Client('irc.freenode.net', 'dobot', {
	    channels: [ '#dobot' ],
		userName: 'dobot',
		realName: 'dobot'
	});
	
	client.addListener('message', function (from, channel, message) {
		var regex = /^dobot,? /i;
		if (regex.test(message)) {
			message = message.replace(regex, '');
			var request = {
				user: from,
				command: message
			};
			bot.exec(request, function(response) {
				client.say(channel, response);
			});
		}
	});
	
	client.addListener('pm', function(from, message) {
		var request = {
			user: from,
			command: message
		};
		bot.exec(request, function(response) {
			client.say(from, response);
		})
	});

}
