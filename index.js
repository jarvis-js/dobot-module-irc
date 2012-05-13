var irc = require('irc');

module.exports = function(bot, module) {

	module.adaptors = [];
	if (module.options.connection) {
		if (!Array.isArray(module.options.connection)) {
			module.options.connection = [ module.options.connection ];
		}
		for (var i = 0; i < module.options.connection.length; i++) {
			module.adaptors.push(new IRCAdaptor(bot, module.options.connection[i]));
		}
	}

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
}

IRCAdaptor.prototype.channelMessage = function(from, to, text, message) {
	var _this = this;
	var channel = this.getChannel(this.client.opt.server + ':' + to, true, function(response) {
		_this.client.say(to, response.reply);
	}, function(response) {
		var reply = response.user.usernick + ': ' + response.reply;
		_this.client.say(to, reply);
	}, function(response) {
		_this.client.action(to, response.reply);
	});
	var messageData = {
		message: text,
		usernick: from,
		userID: message.user + '@' + message.host
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
	var channel = this.getChannel(this.client.opt.server + ':' + from, false, function(response) {
		_this.client.say(from, response.reply);
	}, function(response) {
		_this.client.say(from, response.reply);
	}, function(response) {
		_this.client.action(from, response.reply);
	});
	var messageData = {
		message: text,
		usernick: from,
		userID: message.user + '@' + message.host
	};
	channel.emit('message', messageData);
	channel.emit('command', messageData);
};

IRCAdaptor.prototype.getChannel = function(channelID, multiuser, say, reply, action) {
	channelID = 'irc:' + channelID;
	if (this.bot.channels[channelID]) {
		return this.bot.channels[channelID];
	}
	var channel = this.bot.createChannel(channelID);
	channel.multiuser = multiuser;
	channel.say = say;
	channel.reply = reply;
	channel.action = action;
	return channel;
};

IRCAdaptor.prototype.disconnect = function() {
	this.client.disconnect();
};
