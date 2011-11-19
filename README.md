# IRC

Make the bot available on one or more IRC servers.

## Configuration

An example configuration can be seen below.

	irc: {
		connection: {
			host: 'irc.freenode.org',
			nick: 'botnick',
			options: {
				channels: [ '#channel' ],
				userName: 'do-bot',
				realName: 'do-bot'
			}
		}
	}

### connection

Can be a single server definition or an array or server definitions.

#### host

Host name of the server to connect to.

#### nick

Preferred nickname of the bot on the server.  If the nickname has already been taken the server can assign a new one.

#### options

This module uses [node-irc](https://github.com/martynsmith/node-irc) and uses the same [options](http://readthedocs.org/docs/node-irc/en/latest/API.html#irc.Client).  The option `stripColors` is always set to true, regardless of the value assigned in the module config.
