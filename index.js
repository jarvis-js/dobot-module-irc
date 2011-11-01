var irc = require('irc');

module.exports = function(bot) {

	ircModule = new bot.Module();

	ircModule.load = function(options) {
		this.clients = [];
		var self = this;
		if (options.connections) {
			for (var i = 0; i < options.connections.length; i++) {
				var current = options.connections[i];
				var client = new irc.Client(current.host, current.nick, current.options);
				this.clients.push(client);

				client.addListener('message', function (from, channel, message) {
					var client = this;
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
					var client = this;
					var request = {
						user: from,
						command: message
					};
					bot.exec(request, function(response) {
						client.say(from, response);
					})
				});
			}
		}
	};

	ircModule.unload = function() {
		for (var i = 0; i < this.clients.length; i++) {
			this.clients[i].disconnect();
		}
	};

	return ircModule;

}
