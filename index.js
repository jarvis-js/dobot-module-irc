var irc = require('irc');

module.exports = function(bot) {

	var module = new bot.Module();

	module.load = function(options) {
		module.clients = [];

		if (options.connections) {
			for (var i = 0; i < options.connections.length; i++) {
				var current = options.connections[i];
				current.options.stripColors = true;
				var client = new irc.Client(current.host, current.nick, current.options);
				module.clients.push(client);

				client.addListener('message', function(from, to, message) {
					var channel = module.getChannel(module.makeChannelIdentifier(client, to));
					if (channel !== false) {
						var messageData = {
							message: message,
							usernick: from
						};
						channel.emit('message', messageData);
						var regex = new RegExp('^' + client.nick + ',? ', 'i');
						if (regex.test(message)) {
							messageData.message = messageData.message.replace(regex, '');
							channel.emit('command', messageData);
						}
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
					channel.emit('command', messageData);
				});

				client.addListener('join', function(joinedChannel, nick) {
					if (nick === client.nick) {
						module.addChannel(module.makeChannelIdentifier(client, joinedChannel), function(response) {
							var message = response.reply;
							if (response.type === 'command') {
								message = response.usernick + ': ' + message;
							}
							client.say(joinedChannel, message);
						});
					}
				});
			}
		}
	};

	module.unload = function() {
		for (var i = 0; i < module.clients.length; i++) {
			module.clients[i].disconnect();
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
