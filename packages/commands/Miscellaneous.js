const { stdout, stderr } = require("process");

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
	desc: "Lists all of Blossom Battler's commands, or help regarding a specific command of your choosing.",
	section: "misc",
	noslash: true,
	args: [
		{
			name: "Category / Command",
			type: "Word"
		}
	],
	func(message, args, guilded) {
		if (commands[args[0]]) {
			commands[args[0]].summonDocumentation(message, args, getPrefix(message.guild.id)+args[0].toLowerCase());
		} else {
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
					if ((commands[command].section == category || category == "all") && commands[command].section != 'aliases') {
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
				DiscordEmbed.setFooter(`${commandsList.length} total commands found.`);
			} else {
				const file = new Discord.MessageAttachment(`${dataPath}/images/Help.png`);
				DiscordEmbed.setDescription(`If you want to check commands in which categories, we have a list of them below!\n\nIf you want to see all commands at once, type ${getPrefix(message.guild.id)}help all.\n\nArguments in <> or {} should be substituted in with other values. If they're in {}, then they're optional.`)
				for (let i in categories) {
					if (i == 'all') break;

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
	}
})

commands.searchcommands = new Command({
	desc: "Searches for commands based on a given word.",
	section: "misc",
	aliases: ["searchcommand"],
	noslash: true,
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
			.setFooter(`${commandsList.length} total commands found.`);

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
	noslash: true,
	func(message, args, guilded) {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#4b02c9')
			.setTitle("Invite me to your server!")
			.setDescription(`_I'm Blossom Battler, a discord bot that will add Turn-Based RPG Battling to your Discord Server! With me, you can create characters, skills, items, enemies and more! I also have a few other fun things that I can do, that may not be so RPG focused._\n\nSound interesting? [Why not give it a shot?](${inviteLink})`)
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

credits = [
	{
		userID: '516359709779820544',
		role: "Creator",
		description: "The self-doubting individual who created Blossom Battler to begin with."
	},
	{
		userID: '441198920668938260',
		role: "Co-Creator",
		description: "The chill and talented person responsible for a lot of features and many custom emojis."
	},
	{
		userID: '621307633718132746',
		role: "Co-Creator",
		description: "The one with the most efficient code and optimizations, bringing Blossom Battler to the righteous speed it deserves."
	},
	{
		userID: '363363984390356993',
		role: "Beta Tester",
		description: "A chill and levelheaded individual who figured out many bugs with his ability to push skills to the limit."
	},
	{
		userID: '313972298992451585',
		role: "Beta Tester",
		description: "A funny guy who always liked to push the limits of things and experiment, for the benefit of it."
	},
	{
		userID: '798092550392381450',
		role: "Beta Tester",
		description: "A genuinely sweet guy with a horrendous amount of forks that he made, figuring out issues with the code."
	},
	{
		userID: '412328234198237189',
		role: "Beta Tester",
		description: "A guy with a great sense of humor, suggesting ideas and ideas for new features."
	},
	{
		userID: '569614525951901696',
		role: 'Beta Tester',
		description: 'A gal with great willpower to research and charisma with a creative mind, sharing many ideas that helped expand the bot.'
	},
	{
		name: "Everyone at the Blossom Battler Discord",
		description: "You have been very helpful with bug reports and feature suggestions, and you have been a great help to the development of Blossom Battler.",
		thumbnail: `https://cdn.discordapp.com/attachments/958747864970981376/1004818067953553618/Help.png`
	},
	{
		name: "You",
		description: "For enjoying Blossom Battler."
	}
]

//credits command, with it being a collector with buttons to flip to the next page and previous page.
commands.credits = new Command({
	desc: "Shows who created Blossom Battler, beta tested by, and thanks to.",
	section: "misc",
	noslash: true,
	func(message, args, guilded) {
		creditsEmbed(message)
	}
})

let users = []

creditsEmbed = async (message) => {
	let index = 0
	if (users.length < 1) {
		for (let i = 0; i < credits.length; i++) {
			if (credits[i].userID) {
				users.push(await client.users.fetch(credits[i].userID))
			} else {
				users.push(null)
			}
		}
	}

	const generateEmbed = async () => {
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Credits')
			.setDescription(`This is a list of people who have helped make Blossom Battler, and who have been beta tested by.`)
			.setFooter(`Page ${index + 1}/${credits.length}`)

		if (credits[index].userID) {
			if (users[index] != null) {
				embed.setThumbnail(users[index].displayAvatarURL())
				embed.addField(`Name`, `${users[index].username}`, false)
			}
			embed.addField(`Role`, credits[index].role, false)
			embed.addField(`Description`, credits[index].description, false)
		} else { 
			embed.addField(`Name`, credits[index].name, false)
			embed.addField(`Description`, credits[index].description, false)
		}

		if (credits[index].thumbnail) {
			embed.setThumbnail(credits[index].thumbnail)
		}
		
		return embed
	}

	let embedMessage = ''
	embedMessage = await message.channel.send({
		embeds: [await generateEmbed(0)],
		components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id === message.author.id
	})

	collector.on('collect', async interaction => {
		if (interaction.component.customId != 'cancel' && interaction.component.customId != 'select') {
			if (interaction.customId === 'forward') {
				index++

				if (index > credits.length - 1) {
					index = 0
				}
			} else if (interaction.customId === 'back') {
				index--

				if (index < 0) {
					index = credits.length - 1
				}
			}

			await interaction.update({
				embeds: [await generateEmbed(0)],
				components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
			})
		} else if (interaction.customId === 'cancel') {
			collector.stop()
			await interaction.update({
			embeds: [await generateEmbed(0)],
			components: []
			})
		}
	})
}

const {exec, spawn} = require("child_process")

commands.git = new Command({
	desc: "SUPERADMIN ONLY.",
	section: "misc",
	noslash: true,
	args: [
		{
			name: "Command",
			type: "Word",
			forced: true
		}
	],
	async func(message, args, guilded) {
		if (!utilityFuncs.RPGBotAdmin(message.author.id))
			return void message.channel.send("Only a super admin can use this.")
		message.channel.send("Loading...")
		switch (args[0].toLowerCase()) {
			case "status": {
				exec("git fetch", (error, _, stderr) => {
					if (error)
						return void message.channel.send(stderr)
					exec("git status", (error, stdout, stderr) => {
						if (error)
							return void message.channel.send(stderr)
						message.channel.send(`\`\`\`\n${stdout}\`\`\``)
					})
				})
				break
			}
			case "pull": {
				exec("git pull", async (error, stdout, stderr) => {
					if (error)
						return void message.channel.send(stderr)
					await message.channel.send(`\`\`\`\n${stdout}\`\`\``)
					await message.channel.send("Restarting bot...")
					spawn(process.argv.shift(), process.argv, {
						cwd: process.cwd(),
						detached : true,
						stdio: "inherit"
					})
					await message.channel.send("Restarted successfully!")
					process.exit(0)
				})
				break
			}
			default: {
				message.channel.send("`<Command>` can only be `pull` and `status`")
			}
		}
	}
})

const {SaveBackup} = require("../backups.js")
commands.databackup = new Command({
	desc: "SUPERADMIN ONLY.",
	section: "misc",
	noslash: true,
	async func(message) {
		if (message) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id))
				return void message.channel.send("Only a super admin can use this.")
			message.react('👍');
		}
		SaveBackup()
	}
})

const fs = require("fs")
commands.exportbackup = new Command({
	desc: "SUPERADMIN ONLY.",
	section: "misc",
	noslash: true,
	args: [
		{
			name: "Name",
			type: "Word",
		}
	],
	async func(message, args) {
		if (message) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id))
				return void message.channel.send("Only a super admin can use this.")
			message.react('👍');
		}
		if (args[0]) {
			message.channel.send(
				{
					content: "Here is the backup you requested!",
					files: [`backups/${args[0].replace(/[\\/]/g, "")}`]
				}
			)
		} else {
			fs.readdir("backups", (err, files) => {
				if (err) {
					return void message.channel.send(`Failed to read the backups directory!\n${err}`)
				}
				message.channel.send(
					"Please choose one of the following backups:\n```diff\n- " +
					files.join("\n- ") + "\n```"
				)
			})
		}
	}
})