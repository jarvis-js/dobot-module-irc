var irc = require('irc');

module.exports = function(bot) {

	var module = new bot.Module();

	module.load = function(options) {
		this.clients = [];

		if (options.connections) {
			for (var i = 0; i < options.connections.length; i++) {
				var current = options.connections[i];
				current.options.stripColors = true;
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
								var channel = module.getChannel(module.makeChannelIdentifier(client, to));
								if (regex.test(text)) {
									text = text.replace(regex, '');
									var messageData = {
										message: text,
										usernick: from,
										direct: true
									};
									channel.emit('message', messageData);
								}
								else {
									var messageData = {
										message: text,
										usernick: from,
										direct: false
									};
									channel.emit('message', messageData);
								}
							}
							// Private message to bot
							else if (to == client.nick) {
								var channel = module.addChannel(module.makeChannelIdentifier(client, from), function(response) {
									client.say(from, response.reply);
								});
								var messageData = {
									message: text,
									usernick: from,
									direct: true
								};
								channel.emit('message', messageData);
							}
							break;
					}
				});

				client.addListener('join', function(joinedChannel, nick) {
					if (nick === client.nick) {
						module.addChannel(module.makeChannelIdentifier(client, joinedChannel), function(response) {
							var reply = response.reply;
							if (response.direct) {
								reply = response.usernick + ': ' + reply;
							}
							client.say(joinedChannel, reply);
						});
					}
				});
			}
		}
	};

	module.unload = function() {
		for (var i = 0; i < this.clients.length; i++) {
			this.clients[i].disconnect();
		}
	};

	module.makeChannelIdentifier = function(client, channel) {
		return 'irc:' + client.opt.server + ':' + channel;
	}

	module.addChannel = function(channelID, say) {
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

	module.getChannel = function(channelID) {
		if (bot.channels[channelID]) {
			return bot.channels[channelID];
		}
		return false;
	}

	return module;

};
