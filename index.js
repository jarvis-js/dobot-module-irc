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

							// Channel message
							// 'to' is the channel name
							if (to.match(/^[&#]/)) {
								var regex = new RegExp('^' + client.nick + ',? ', 'i');
								if (regex.test(text)) {
									text = text.replace(regex, '');
									var channel = module.getChannel(module.makeChannelIdentifier(client, to));
									channel.emit('message', text, from);
								}
							}
							// Private message to bot
							else if (to == client.nick) {
								var channel = module.addChannel(module.makeChannelIdentifier(client, from), function(message) {
									client.say(from, message);
								});
								channel.emit('message', text, from);
							}
							break;
					}
				});

				client.addListener('join', function(joinedChannel, nick) {
					if (nick === client.nick) {
						module.addChannel(module.makeChannelIdentifier(client, joinedChannel), function(message) {
							client.say(joinedChannel, message);
						});
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

	ircModule.addChannel = function(channelID, say) {
		if (bot.channels[channelID]) {
			return bot.channels[channelID];
		}
		var channel = new bot.Channel();
		channel.module = module.name;
		channel.identifier = channelID;
		channel.say = say;
		bot.registerChannel(channel);
		return channel;
	}

	ircModule.getChannel = function(channelID) {
		if (bot.channels[channelID]) {
			return bot.channels[channelID];
		}
		return false;
	}

	return ircModule;

};
