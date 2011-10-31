var irc = require('irc');

module.exports = function(bot) {

	ircModule = new bot.Module();

	ircModule.load = function() {

		var self = this;

		this.client = new irc.Client('irc.freenode.net', 'dobot', {
			channels: [ '#dobot' ],
			userName: 'dobot',
			realName: 'dobot'
		});

		this.client.addListener('message', function (from, channel, message) {
			var regex = /^dobot,? /i;
			if (regex.test(message)) {
				message = message.replace(regex, '');
				var request = {
					user: from,
					command: message
				};
				bot.exec(request, function(response) {
					self.client.say(channel, response);
				});
			}
		});

		this.client.addListener('pm', function(from, message) {
			var request = {
				user: from,
				command: message
			};
			bot.exec(request, function(response) {
				self.client.say(from, response);
			})
		});

	}

	ircModule.unload = function() {
		this.client.disconnect();
	}

	return ircModule;

}
