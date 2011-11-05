var irc = require('irc');

module.exports = function(bot) {

	ircModule = new bot.Module();

	ircModule.load = function(options) {
		var module = this;

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
								var regex = new RegExp('^' + client.nick + ',? ', 'i');
								if (regex.test(text)) {
									text = text.replace(regex, '');
									request.command = text;
									request.channel = module.makeChannelIdentifier(client, to);
									bot.execCommand(request);
								}
							}
							// Private message to bot
							else if (to == client.nick) {
								var pmChannel = new bot.Channel();
								pmChannel.module = module.name;
								pmChannel.identifier = module.makeChannelIdentifier(client, from);
								pmChannel.say = function(message) {
									client.say(from, message);
								};
								bot.registerChannel(pmChannel);

								request.command = text;
								request.channel = module.makeChannelIdentifier(client, from);
								bot.execCommand(request);
							}
							break;
					}
				});

				client.addListener('join', function(channel, nick) {
					if (nick === client.nick) {
						var ircChannel = new bot.Channel();
						ircChannel.module = module.name;
						ircChannel.identifier = module.makeChannelIdentifier(client, channel);
						ircChannel.say = function(message) {
							client.say(channel, message);
						};
						bot.registerChannel(ircChannel);
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

	ircModule.makeChannelIdentifier = function(client, channel) {
		return 'irc:' + client.opt.server + ':' + channel;
	}

	return ircModule;

};
