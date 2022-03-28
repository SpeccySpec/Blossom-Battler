commands.help = new Command({
	desc: "*Args: <?Category>*\nLists all of Bloom Battler's commands.",
	section: "misc",
	func: (message, args) => {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of Commands')

		if (args[0]) {
			switch(args[0].toLowerCase()) {
				case 'miscellaneous':
					DiscordEmbed.setDescription('There is nothing much lol')
					for (const i in commands) {
						if (commands[i].section == 'misc') {
							DiscordEmbed.fields.push({name: `${getPrefix(message.guild.id)}${i}`, value: commands[i].desc, inline: true})
						}
					}
					break;
				case 'fun':
					DiscordEmbed.setDescription('Fun things to use, come try them out!')
					for (const i in commands) {
						if (commands[i].section == 'fun') {
							DiscordEmbed.fields.push({name: `${getPrefix(message.guild.id)}${i}`, value: commands[i].desc, inline: true})
						}
					}
					break;
				default:
					DiscordEmbed.setDescription('This is a list of commands!')
					for (const i in commands) {
						DiscordEmbed.fields.push({name: `${getPrefix(message.guild.id)}${i}`, value: commands[i].desc, inline: true})
					}
					break;
			}
		} else {
			const file = new Discord.MessageAttachment(`${dataPath}/images/Help.png`);
			DiscordEmbed.setDescription(`If you want to check commands in which categories, we have a list of them below!\n\nIf you want to see all commands at once, type ${getPrefix(message.guild.id)}help all.`)
			DiscordEmbed.fields.push({name: `Miscellaneous`, value: 'There is nothing much lol', inline: true});
			DiscordEmbed.fields.push({name: `Fun`, value: 'Fun things to use, come try them out!', inline: true});
			DiscordEmbed.setThumbnail('attachment://Help.png')

			return message.channel.send({embeds: [DiscordEmbed], files: [file]})
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})