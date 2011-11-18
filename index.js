var irc = require('irc');

module.exports = function(bot, module) {

	module.load = function(options) {
		module.adaptors = [];
		if (options.connection) {
			if(!Array.isArray(options.connection)) {
				options.connection = [ options.connection ];
			}
			for (var i = 0; i < options.connection.length; i++) {
				module.adaptors.push(new IRCAdaptor(bot, options.connection[i]));
			}
		}
	};

	module.unload = function() {
		for (var i = 0; i < module.adaptors.length; i++) {
			module.adaptors[i].disconnect();
		}
	};

};

function IRCAdaptor(bot, options) {
	this.bot = bot;
	this.options = options;
	this.options.stripColors = true;
	this.client = new irc.Client(this.options.host, this.options.nick, this.options.options);
	var _this = this;
	this.client.on('message#', function(from, to, text, message) { _this.channelMessage(from, to, text, message); });
	this.client.on('pm', function(from, text, message) { _this.privateMessage(from, text, message); });
};

IRCAdaptor.prototype.channelMessage = function(from, to, text, message) {
	var _this = this;
	var channel = this.getChannel('irc:' + this.client.opt.server + ':' + to, function(response) {
		var reply = response.reply;
		if (response.type === 'command') {
			reply = response.usernick + ': ' + reply;
		}
		_this.client.say(to, reply);
	});
	var messageData = {
		message: text,
		usernick: from
	};
	channel.emit('message', messageData);
	var regex = new RegExp('^' + this.client.nick + ',? ', 'i');
	if (regex.test(messageData.message)) {
		messageData.message = messageData.message.replace(regex, '');
		channel.emit('command', messageData);
	}
};

IRCAdaptor.prototype.privateMessage = function(from, text, message) {
	var _this = this;
	var channel = this.getChannel('irc:' + this.client.opt.server + ':' + from, function(response) {
		_this.client.say(from, response.reply);
	});
	var messageData = {
		message: text,
		usernick: from
	};
	channel.emit('message', messageData);
	channel.emit('command', messageData);
};

IRCAdaptor.prototype.getChannel = function(channelID, say) {
	if (this.bot.channels[channelID]) {
		return this.bot.channels[channelID];
	}
	var channel = new this.bot.Channel();
	channel.module = module.name;
	channel.identifier = channelID;
	channel.say = say;
	this.bot.registerChannel(channel);
	return channel;
};

IRCAdaptor.prototype.disconnect = function() {
	this.client.disconnect();
};
