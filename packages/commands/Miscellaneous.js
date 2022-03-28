const categories = {
	misc: "There is nothing much lol",
	fun: "Fun things to use, come try them out!",
	all: "All of the existing commands"
}

const aliases = {
	miscellaneous: "misc"	
}

commands.help = new Command({
	desc: "*Args: {?Word: Category}*\nLists all of Bloom Battler's commands.",
	section: "misc",
	func: (message, args) => {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of Commands')
		let category = args[0]
		if (category) {
			category = category.toLowerCase()
			let pogname = aliases[category]
			if (pogname)
				category = pogname
			let description = categories[category]
			if (!description)
				return void commands.help.call(message, [])
			DiscordEmbed.setDescription(description)
			for (const i in commands) {
				if (commands[i].section == category || category == 'all') {
					DiscordEmbed.fields.push({name: `${getPrefix(message.guild.id)}${i}`, value: commands[i].desc, inline: true})
				}
			}
		} else {
			const file = new Discord.MessageAttachment(`${dataPath}/images/Help.png`);
			DiscordEmbed.setDescription(`If you want to check commands in which categories, we have a list of them below!\n\nIf you want to see all commands at once, type ${getPrefix(message.guild.id)}help all.\n\nArguments in <> or {} should be substituted in with other values. If they're in {}, and have a "?" within them, then they're optional.`)
			DiscordEmbed.fields.push({name: `Miscellaneous`, value: 'There is nothing much lol', inline: true});
			DiscordEmbed.fields.push({name: `Fun`, value: 'Fun things to use, come try them out!', inline: true});
			DiscordEmbed.setThumbnail('attachment://Help.png')

			return message.channel.send({embeds: [DiscordEmbed], files: [file]})
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})
