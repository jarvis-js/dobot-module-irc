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

				client.addListener('message', function(from, to, message) {
					var regex = new RegExp('^' + client.nick + ',? ', 'i');
					if (regex.test(message)) {
						var channel = module.getChannel(module.makeChannelIdentifier(client, to));
						var messageData = {
							message: message.replace(regex, ''),
							usernick: from
						};
						channel.emit('message', messageData);
					}
				});

				client.addListener('pm', function(from, message) {
					var channel = module.addChannel(module.makeChannelIdentifier(client, from), function(response) {
						client.say(from, response.reply);
					});
					var messageData = {
						message: message,
						usernick: from
					};
					channel.emit('message', messageData);
				});

				client.addListener('join', function(joinedChannel, nick) {
					if (nick === client.nick) {
						module.addChannel(module.makeChannelIdentifier(client, joinedChannel), function(response) {
							client.say(joinedChannel, response.usernick + ': ' + response.reply);
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
