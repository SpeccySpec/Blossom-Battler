commands.test = new Command({
	desc: "a",
	section: "misc",
	func: (message, args) => {
		message.reply("**[DEBUG]**\nThis is a test command.")
	}
})

commands.help = new Command({
	desc: "Lists all of Bloom Battler's commands.",
	section: "misc",
	func: (message, args) => {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of Commands')
			.setDescription('This is a list of commands!')

		if (args[0]) {
			switch(args[0].toLowerCase()) {
				default:
					for (const i in commands) {
						DiscordEmbed.fields.push({name: `${getPrefix(message.guild.id)}${i}`, value: commands[i].desc, inline: true})
					}
			}
		} else {
			for (const i in commands) DiscordEmbed.fields.push({name: `${getPrefix(message.guild.id)}${i}`, value: commands[i].desc, inline: true});
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})