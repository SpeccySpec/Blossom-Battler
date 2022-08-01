const categories = {
	misc: "Other things that don't fit into the other sections.",
	moderation: "Every bot needs something to moderate the server.",
	fun: "Fun things to use, come try them out!",
	food: "Tasty, tasty food! All for you to try out!",
	items: "Items that you can use to do things!",
	loot: "Loot that you can get from killing or pacifying enemies!",
	chests: "Chests for storing whatever item, weapon or armor you want! Or to get some goodies.",
	shops: "Need Items? Open shops and sell them!",
	skills: "Can't fight without the various attacks now, can ya?",
	characters: "Characters! The ones who will feel evil and succeed in their quests! I hope.",
	enemies: "Enemies! The ones that you will fight to the death! I hope you don't get killed!",
	parties: "Can't battle without parties now, can ya?",
	battle: "The main part of Blossom Battler is well... the battles of course!",
	trials: "Trials! Where you test yourself against waves of enemies!",
	roll: "Random and Daily things! Dailies reroll every day! Roll away!",
	all: "All of the existing commands"
}

const aliases = {
	miscellaneous: "misc",
	mod: "moderation",
	chars: "characters"
}

async function sendHelp(message, commandsInCategories) {
	let index = 0
	let category = Object.keys(commandsInCategories)[index]
	let description = categories[category]
	let categoryCommands = commandsInCategories[category]
	let categoryCommandsIndex = 0

	let categoryList = Object.keys(commandsInCategories)

	const generateEmbed = async () => {
		const current = categoryCommands.slice(categoryCommandsIndex, categoryCommandsIndex + 12)
		return new Discord.MessageEmbed({
			color: '#0099ff',
			title: 'List of Commands',
			description: `**${category.toUpperCase()}** - ${description}`,
			fields: await Promise.all(
				current.map(async arrayDefs => ({
					name: arrayDefs[0],
					value: arrayDefs[1],
					inline: true
				}))
			)
		})
	}

	let embedMessage = '' 
	let selectionmenu = ''
	if (categoryList.length > 1) {
		selectionmenu = new Discord.MessageSelectMenu()
			.setCustomId('select')
			.setPlaceholder('Nothing selected')
			
		for (let i = 0; i < categoryList.length; i++) {
			selectionmenu.addOptions([
				{
					label: categoryList[i].charAt(0).toUpperCase() + categoryList[i].slice(1),
					description: categories[categoryList[i]],
					value: i.toString()
				}
			])
		}
		
		embedMessage = await message.channel.send({
			embeds: [await generateEmbed(0)],
			components: [
				{
					type: 1,
					components: [selectionmenu]
				},
				{
					type: 1,
					components: [backButton, forwardButton, cancelButton]
				}
			]
		})
	} else {
		embedMessage = await message.channel.send({
			embeds: [await generateEmbed(0)],
			components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
		})
	}

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id === message.author.id
	})

	collector.on('collect', async interaction => {
		if (interaction.component.customId != 'cancel' && interaction.component.customId != 'select') {
			if (interaction.customId === 'forward') {
				categoryCommandsIndex += 12

				if (categoryCommandsIndex >= categoryCommands.length) {
					index++

					if (index >= categoryList.length) {
						index = 0
					}
					category = Object.keys(commandsInCategories)[index]
					description = categories[category]
					categoryCommands = commandsInCategories[category]
					categoryCommandsIndex = 0
				}
			} else if (interaction.customId === 'back') {
				categoryCommandsIndex -= 12

				if (categoryCommandsIndex < 0) {
					index--

					if (index < 0) {
						index = categoryList.length-1
					}
					category = Object.keys(commandsInCategories)[index]
					description = categories[category]
					categoryCommands = commandsInCategories[category]
					categoryCommandsIndex = categoryCommands.length - (categoryCommands.length % 12 != 0 ? categoryCommands.length % 12 : 12)
				}
			}

			if (categoryList.length > 1) {
				await interaction.update({
					embeds: [await generateEmbed(0)],
					components: [
						{
							type: 1,
							components: [selectionmenu]
						},
						{
							type: 1,
							components: [backButton, forwardButton, cancelButton]
						}
					]
				})
			} else {
				await interaction.update({
					embeds: [await generateEmbed(0)],
					components: [
						new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
					]
				})
			}
		} else if (interaction.component.customId === 'cancel') {
			collector.stop()
			await interaction.update({
			embeds: [await generateEmbed(0)],
			components: []
			})
		} else {
			index = parseInt(interaction.values[0])
			category = Object.keys(commandsInCategories)[index]
			description = categories[category]
			categoryCommands = commandsInCategories[category]
			categoryCommandsIndex = 0

			if (categoryList.length > 1) {
				await interaction.update({
					embeds: [await generateEmbed(0)],
					components: [
						{
							type: 1,
							components: [selectionmenu]
						},
						{
							type: 1,
							components: [backButton, forwardButton, cancelButton]
						}
					]
				})
			} else {
				await interaction.update({
					embeds: [await generateEmbed(0)],
					components: [
						new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
					]
				})
			}
		}
	})
}

commands.help = new Command({
	desc: "Lists all of Blossom Battler's commands.",
	section: "misc",
	args: [
		{
			name: "Category",
			type: "Word"
		}
	],
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
			DiscordEmbed.setDescription(`**${category.toUpperCase()}** - ${description}`)

			let commandsList = []
			for (let command in commands) {
				if (commands[command].section == category || category == "all") {
					commandsList.push([`${getPrefix(message.guild.id)}${command}`, commands[command].section, commands[command].getFullDesc()])
				}
			}

			if (commandsList.length > 12) {
				let commandsByCategory = {}
				for (let command of commandsList) {
					if (!commandsByCategory[command[1]]) commandsByCategory[command[1]] = []
					commandsByCategory[command[1]].push([command[0], command[2]])
				}
				return sendHelp(message, commandsByCategory)
			} else {
				for (let i = 0; i < commandsList.length; i++) {
					DiscordEmbed.addField(commandsList[i][0], commandsList[i][2], true)
				}
			}
		} else {
			const file = new Discord.MessageAttachment(`${dataPath}/images/Help.png`);
			DiscordEmbed.setDescription(`If you want to check commands in which categories, we have a list of them below!\n\nIf you want to see all commands at once, type ${getPrefix(message.guild.id)}help all.\n\nArguments in <> or {} should be substituted in with other values. If they're in {}, then they're optional.`)
			for (let i in categories) {
				if (i == 'all') continue

				let aliasName = i
				for (const a in aliases) {
					if (aliases[a] == i) {
						aliasName = a.toString()
						break
					}
				}
				DiscordEmbed.fields.push({name: aliasName.charAt(0).toUpperCase() + aliasName.slice(1), value: categories[i], inline: true});
			}
			DiscordEmbed.setThumbnail('attachment://Help.png')

			return message.channel.send({embeds: [DiscordEmbed], files: [file]})
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.searchcommands = new Command({
	desc: "Searches for commands based on a given word.",
	section: "misc",
	aliases: ["searchcommand"],
	args: [
		{
			name: "Word",
			type: "Word",
			forced: true
		}
	],
	func: async (message, args) => {
		let commandsList = []
		for (let command in commands) {
			if (command.toLowerCase().includes(args[0].toLowerCase())) {
				commandsList.push([`${getPrefix(message.guild.id)}${command}`, commands[command].section, commands[command].getFullDesc()])
			}
		}

		if (commandsList.length < 1) {
			return message.channel.send("No commands found.")
		}

		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of Commands')

		if (commandsList.length > 12) {
			let commandsByCategory = {}
			for (let command of commandsList) {
				if (!commandsByCategory[command[1]]) commandsByCategory[command[1]] = []
				commandsByCategory[command[1]].push([command[0], command[2]])
			}
			return sendHelp(message, commandsByCategory)
		} else {
			for (let i = 0; i < commandsList.length; i++) {
				DiscordEmbed.addField(commandsList[i][0], commandsList[i][2], true)
			}
		}
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

let inviteLink = 'https://discord.com/oauth2/authorize?client_id=776480348757557308&scope=bot&permissions=319441726528'

commands.invite = new Command({
	desc: "Invite Blossom Battler to another server!",
	section: "misc",
	func: (message, args) => {
	}
})