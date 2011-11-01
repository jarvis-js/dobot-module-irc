var irc = require('irc');

module.exports = function(bot) {

	ircModule = new bot.Module();

	ircModule.load = function(options) {
		this.clients = [];
		if (options.connections) {
			for (var i = 0; i < options.connections.length; i++) {
				var current = options.connections[i];
				var client = new irc.Client(current.host, current.nick, current.options);
				this.clients.push(client);

				client.addListener('raw', function(raw) {
					switch (raw.command) {
						case "PRIVMSG":
							var from = raw.nick;
							var to = raw.args[0];
							var text = raw.args[1];

							var request = {
								user: from
							}

							// Channel message
							// 'to' is the channel name
							if (to.match(/^[&#]/)) {
								var regex = /^dobot,? /i;
								if (regex.test(text)) {
									text = text.replace(regex, '');
									request.command = text;
									bot.exec(request, function(response) {
										client.say(to, response);
									});
								}
							}
							// Private message to bot
							else if (to == client.nick) {
								request.command = text;
								bot.exec(request, function(response) {
									client.say(from, response);
								})
							}
							break;
					}
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
