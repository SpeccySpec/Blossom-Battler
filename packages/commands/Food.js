// This File can be used for Food related things!
// Here you go Verwex :)
foodFiles = {}

userPreferences = setUpFile(`${dataPath}/json/food/S_preferences.json`)
userPrivacy = setUpFile(`${dataPath}/json/food/S_privacy.json`)

//available categories
var categories = ['icecream', 'pizza', 'hamburger']

for (i in categories) {
    foodFiles[categories[i]] = setUpFile(`${dataPath}/json/food/${categories[i]}.json`)
}

//subcategories
subcategories = {
    'icecream': ['cones', 'flavors'],
    'pizza': ['crusts', 'sauces', 'cheeses', 'toppings', 'condiments'],
    'hamburger': ['buns', 'ingredients']
}

imagesNeeded = {
	"cones": 1,
	"flavors": 1,
	"crusts": 1,
	"sauces": 1,
	"cheeses": 1,
	"toppings": 1,
	"condiments": 1,
	"buns": 2,
	"ingredients": 1
}

singularVerb = {
	'buns': 'bun',
	'ingredients': 'ingredient',
	'crusts': 'crust',
	'cheeses': 'cheese',
	'condiments': 'condiment',
	'sauces': 'sauce',
	'toppings': 'topping',
	'flavors': 'flavor',
	'cones': 'cone'
}

isInMultiples = {
	'buns': false,
	'ingredients': true,
	'crusts': false,
	'cheeses': false,
	'condiments': true,
	'sauces': false,
	'toppings': true,
	'flavors': true,
	'cones': false
}

foodArguments = {
	"icecream": {
		"flavors": {
			"name": "Flavors",
			"type": "number",
			"default": 3,
			"min": 0,
			"max": 50,
			"required": true
		}
	},
	"pizza": {
		"toppings": {
			"name": "Toppings",
			"type": "number",
			"default": 6,
			"min": 0,
			"max": 50,
			"required": true
		},
		"condiments": {
			"name": "Condiments",
			"type": "number",
			"default": 2,
			"min": 0,
			"max": 20,
			"required": false
		},
		"cheese_include": {
			"name": "Include Cheese",
			"type": "boolean",
			"required": false
		},
		"sauce_include": {
			"name": "Include Sauce",
			"type": "boolean",
			"required": false
		}
	},
	"hamburger": {
		"ingredients": {
			"name": "Ingredients",
			"type": "number",
			"default": 6,
			"min": 0,
			"max": 50,
			"required": true
		}
	},
}

function setupFileProfile(user, option, file) {
    if (file[user]) return;

    switch (option) {
        case 'privacy':
            file[user] = {
                "global": true,
                "bServers": [],
                "bCategories": [],
                "bChannels": []
            }
            fs.writeFileSync(`${dataPath}/json/food/S_privacy.json`, JSON.stringify(file, null, '    '));
            break;
		case 'preferences':
			file[user] = {
				OfficialChance: 100,
				UserChance: 100,
				BlockedUsers: [],
				BlockedPhrases: []
			}
			fs.writeFileSync(`${dataPath}/json/food/S_preferences.json`, JSON.stringify(file, null, '    '));
			break;
		default:
			if (!file[user]) {
				file[user] = {}
			}

			for (i in subcategories[option]) {
				if (!file[user][subcategories[option][i]]) {
					file[user][subcategories[option][i]] = {}
				}
			}

			fs.writeFileSync(`${dataPath}/json/food/${option}.json`, JSON.stringify(file, null, '    '));
			break;
		}
}

function makeBar(thing) {
	return ":white_medium_square:".repeat(Math.floor((Math.round(thing))/10))
}

async function retrieveMembers(message) {
	let users = await message.guild.members.fetch().catch(console.error)
	let list = users.map(m => m.id)
	return list
}

async function generateHastebin(text) {
	return await hastebin(text, { extension: "txt" })
}

function setInvalidEmbed(message, limit) {
	let embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Invalid Category${!limit ? `/Subcategory` : ''}`)
		.setDescription(`The category${!limit ? `/subcategory` : ''} you entered is invalid. Use one of these listed below:`)
		for (i in categories) {
			embed.addField(categories[i], !limit ? `- `+subcategories[categories[i]].join('\n- ') : `_ _`, true)
		}
	return message.channel.send({embeds: [embed]})
}

function checkImage(message, arg, image) {
	const validExtensions = ['png', 'bmp', 'tiff', 'tif', 'gif', 'jpg', 'jpeg', 'apng', 'webp']
	if (image != undefined) {
		if (!validExtensions.includes(image.url.split('.').pop())) {
			message.channel.send(`The image you uploaded is not a valid image.`)
			return false
		}
		return image.url
	}
	if (arg) {
		if (arg.startsWith('<') && arg.endsWith('>')) {
			arg = arg.slice(1, -1)
		}
		if (!validExtensions.includes(arg.split('.').pop())) {
			message.channel.send(`The image you uploaded is not a valid image.`)
			return false
		}
		return arg
	}
}

function checkCategories(args, limit) {
	if (!args[0]) return false

	if (!categories.includes(args[0].toLowerCase())) {
		return false
	}

	if (limit) {
		return true
	}

	if (!subcategories[args[0].toLowerCase()].includes(args[1].toLowerCase())) {
		return false
	}

	return true
}













//Commands

//Privacy
commands.foodprivacy = new Command({
	desc: '*Args: {Word: Choice}*\nI will change your privacy settings on food view. You can private yourself from:\n- *global*\n- *server*\n- *category*\n- *channel*\n\nTo view your settings, use it without arguments.',
	section: "food",
	func: (message, args) => {

        setupFileProfile(message.author.id, 'privacy', userPrivacy)

		const validOptions = ['global', 'server', 'category', 'channel']

        if (!args[0] || (args[0] && !validOptions.includes(args[0].toLowerCase()))) {
            const isGlobalBlock = userPrivacy[message.author.id].global ? 'Yes' : 'No'

			const isServerBlock = userPrivacy[message.author.id].bServers.includes(message.guild.id) ? 'Yes' : 'No'

            let categoryBlock = ``

			for (i in userPrivacy[message.author.id].bCategories) {
				const categoryID = userPrivacy[message.author.id].bCategories[i]
				let category
				try {
					category = message.guild.channels.cache.get(categoryID)
				} catch (e) {
					continue
				}
				categoryBlock += `\n- ${category.name} *(${category.isText() ? 'Thread Parent' : 'Category'})*`
			}

            if (categoryBlock == ``)
			categoryBlock = `None`

            let channelBlock = ``

			for (i in userPrivacy[message.author.id].bChannels) {
				const channelID = userPrivacy[message.author.id].bChannels[i]
				let channel
				try {
				channel = message.guild.channels.cache.get(channelID)
				} catch (err) {
					continue
				}
				channelBlock += `\n- ${channel.name} *(${channel.isThread() ? 'Thread' : 'Channel'})*`
			}

			if (channelBlock == ``)
			channelBlock = `None`

            embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Privacy preferences for ${message.author.username}`)
			.setDescription(`If you want to set privacy, try these arguments:\n*global* - for setting the global privacy\n*server* - for setting the current server's privacy\n*category* - for setting the privacy of a category you're in\n*channel* - for setting the privacy of a channel you're in\n\n_ _`)
			.addFields(
				{ name: 'Globally private', value: `${isGlobalBlock}`, inline: true },
				{ name: `Private for ${message.guild.name}`, value: `${isServerBlock}`, inline: true },
				{ name: `Private ${message.guild.name} categories/thread parents`, value: `${categoryBlock}`, inline: false },
				{ name: `Private ${message.guild.name} channels/threads`, value: `${channelBlock}`, inline: false },
			)

			return message.channel.send({embeds: [embed]})
        } else {
			switch (args[0].toLowerCase()) {
				case 'global':
					userPrivacy[message.author.id].global = !userPrivacy[message.author.id].global

					message.channel.send(`Your own food is ${userPrivacy[message.author.id].global == true ? 'now private globally.' : 'no longer globally private.'}`)
					break;
				case 'server':
					var serverID = message.guild.id

					if (userPrivacy[message.author.id].bServers.includes(serverID)) {
						userPrivacy[message.author.id].bServers.splice(userPrivacy[message.author.id].bServers.indexOf(serverID), 1)
						message.channel.send(`Your own food is no longer private for the **${message.guild.name}** server.`)
					} else {
						userPrivacy[message.author.id].bServers.push(serverID)
						message.channel.send(`Your own food is now private for the **${message.guild.name}** server.`)
					}
					break;
				case 'category':
					var categoryID = message.channel.parentId

					if (categoryID == null)
					return message.channel.send(`There isn't a category this channel is appended to.`)

					if (userPrivacy[message.author.id].bCategories.includes(categoryID)) {
						userPrivacy[message.author.id].bCategories.splice(userPrivacy[message.author.id].bServers.indexOf(categoryID)-1, 1)
						message.channel.send(`Your own food is no longer private within the **${message.channel.parent.name}** ${message.channel.parent.isText() ? 'thread parent' : 'category'}.`)
					} else {
						userPrivacy[message.author.id].bCategories.push(categoryID)
						message.channel.send(`Your own food is now private within the **${message.channel.parent.name}** ${message.channel.parent.isText() ? 'thread parent' : 'category'}.`)
					}
					break;
				case 'channel':
					var channelID = message.channel.id

					if (userPrivacy[message.author.id].bChannels.includes(channelID)) {
						userPrivacy[message.author.id].bChannels.splice(userPrivacy[message.author.id].bServers.indexOf(channelID)-1, 1)
						message.channel.send(`Your own food is no longer private within the **${message.channel.name}** ${message.channel.isThread() ? 'thread' : 'channel'}.`)
					} else {
						userPrivacy[message.author.id].bChannels.push(channelID)
						message.channel.send(`Your own food is now private within the **${message.channel.name}** ${message.channel.isThread() ? 'thread' : 'channel'}.`)
					}
			}

			fs.writeFileSync(`${dataPath}/json/food/S_privacy.json`, JSON.stringify(userPrivacy, null, '    '));
		}
    }
})




//preferences
commands.foodpreferences = new Command({
	desc: '*Args: {Word: Choice}*\nI will change your user food preferences. You can set preferences for:\n- *official_chance <Number: Chance>*\n- *user_chance <Number: Chance>*\n- *user_block <ID: User>*\n- *phrase_block <Word: Phrase>*\n\nTo view your preferences, use it without arguments.',
	section: "food",
	func: (message, args) => {

		setupFileProfile(message.author.id, 'preferences', userPreferences)

		const ochanceAliases = args[0] && ['official_chance', 'official', 'official chance', 'officialchance'].includes(args[0].toLowerCase())
		const uchanceAliases = args[0] && ['user_chance', 'user chance', 'userchance'].includes(args[0].toLowerCase())
		const ublockAliases = args[0] && ['user_block', 'user block', 'user', 'userblock'].includes(args[0].toLowerCase())
		const pblockAliases = args[0] && ['phrase_block', 'phrase block', 'phrase', 'phraseblock'].includes(args[0].toLowerCase())

		if (((ochanceAliases || uchanceAliases || ublockAliases || pblockAliases) && !args[1]) || (!ochanceAliases && !uchanceAliases && !ublockAliases & !pblockAliases)) {
			const oChan = Math.round(userPreferences[message.author.id].OfficialChance)
			const uChan = Math.round(userPreferences[message.author.id].UserChance)
			const indexOChan = makeBar(userPreferences[message.author.id].OfficialChance)
			const indexUChan = makeBar(userPreferences[message.author.id].UserChance)

			passOff()

			async function passOff() {
				let userText = ''
				for (let i = 0; i < userPreferences[message.author.id].BlockedUsers.length; i++) {
					if (message.guild.members.cache.get(userPreferences[message.author.id].BlockedUsers[i]))
					userText += `\n- ${message.guild.members.cache.get(userPreferences[message.author.id].BlockedUsers[i]).user.tag}`
				}
				if (userText == '')
				userText = 'None'

				if (userText.length > 256) {
					let link = await generateHastebin(userText)
		
					userText = `*Hastebin:\n${link}.*`
				}

				let phraseText = userPreferences[message.author.id].BlockedPhrases.length > 0 ? '' : 'None'
				for (i in userPreferences[message.author.id].BlockedPhrases) {
					phraseText += `\n- ${userPreferences[message.author.id].BlockedPhrases[i]}`
				}

				if (phraseText.length > 256) {
					let link = await generateHastebin(phraseText)
		
					phraseText = `*Hastebin:\n${link}.*`
				}

				embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`User preferences for ${message.author.username}`)
				.setDescription(`If you want to set preferences, try:\n*official_chance <Number: Chance>* - Official Product Chance\n*user_chance <Number: Chance>* - User Product Chance\n*user_block <ID: User>* - Blocked Users\n*phrase_block <Word: Phrase>* - Blocked Phrases`)
				.addFields(
					{ name: 'Official Product Chance', value: `${oChan}% ${indexOChan}`, inline: true },
					{ name: `User Product Chance`, value: `${uChan}% ${indexUChan}`, inline: false },
					{ name: `Filtered Users`, value: `${userText}`, inline: true },
					{ name: `Filtered Phrases`, value: `${phraseText}`, inline: true },
				)

				return message.channel.send({embeds: [embed]})
			}
			return
		}

		if (pblockAliases) {
			if (userPreferences[message.author.id].BlockedPhrases.includes(args[1].toLowerCase())) {
                userPreferences[message.author.id].BlockedPhrases.splice(userPreferences[message.author.id].BlockedPhrases.indexOf(args[1].toLowerCase()), 1)
                message.channel.send(`The phrase **${args[1].toLowerCase()}** is no longer on your own blacklist.`)
            } else {
                userPreferences[message.author.id].BlockedPhrases.push(args[1].toLowerCase())
                message.channel.send(`The phrase **${args[1].toLowerCase()}** is now on your own blacklist.`)
            }
		} else if (ochanceAliases) {
			args[1] = Math.max(Math.min(parseInt(args[1]), 100), 0)
			userPreferences[message.author.id].OfficialChance = args[1]
			message.channel.send(`Your chance of food from the official category has been set to **${args[1]}%**.`)
		} else if (uchanceAliases) {
			args[1] = Math.max(Math.min(parseInt(args[1]), 100), 0)
			userPreferences[message.author.id].UserChance = args[1]
			message.channel.send(`Your chance of food from the users has been set to **${args[1]}%**.`)
		} else if (ublockAliases) {
			let userID = args[1]
			//if it is a mention, convert it to an ID
			if (userID.startsWith('<@!') && userID.endsWith('>')) {
				userID = userID.slice(3, -1)
			}

			if (client.users.cache.has(userID)) {
				if (userPreferences[message.author.id].BlockedUsers.includes(userID)) {
					userPreferences[message.author.id].BlockedUsers.splice(userPreferences[message.author.id].BlockedUsers.indexOf(userID), 1)
					message.channel.send(`The user **${client.users.cache.get(userID).username}** is no longer on your own blacklist.`)
				} else {
					userPreferences[message.author.id].BlockedUsers.push(userID)
					message.channel.send(`The user **${client.users.cache.get(userID).username}** is now on your own blacklist.`)
				}
			} else {
				return message.channel.send(`The user **${userID}** does not exist.`)
			}
		}

		fs.writeFileSync(`${dataPath}/json/food/S_preferences.json`, JSON.stringify(userPreferences, null, '    '));
}})




commands.foodcategories = new Command({
	desc: `Shows all the food categories and subcategories.`,
	section: "food",
	func: (message, args) => {
		let embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Food Categories`)
		for (i in categories) {
			embed.addField(categories[i], `- `+subcategories[categories[i]].join('\n- '), true)
		}

		return message.channel.send({embeds: [embed]})
	}
})




commands.registerfood = new Command({
	desc: `*Args: <Word: Main Category> <Word: Sub-category> <Word: Name> <Attachment: Image>*\nRegister a food item.`,
	section: "food",
	func: (message, args) => {

		if (args.length < 3) {
			let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${getPrefix(message.guild.id)}registerfood`)
			.setDescription(`To register a food item, try:\n*${getPrefix(message.guild.id)}registerfood <Word: Main Category> <Word: Sub-category> <Word: Name> <Attachment: Image>*`)
		
			return message.channel.send({embeds: [embed]})
		}

		if (!checkCategories(args)) return setInvalidEmbed(message)

		setupFileProfile(message.author.id, args[0].toLowerCase(), foodFiles[args[0].toLowerCase()])

		if (Object.keys(foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()]).length >= 50) {
			return message.channel.send(`You have reached the maximum amount of food items for the category **${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]}**.`)
		}

		if (Object.keys(foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()]).includes(args[2].toLowerCase())) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** already exists in your list.`)
		}

		if (args[2].length > 256) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item name **${args[2].toLowerCase()}** is too long.`)
		}

		if (!args[3] && !message.attachments.size) {
			return message.channel.send(`You must attach an image or send a link to your ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item.`)
		}

		let attachments = []
		let attachImages = message.attachments.map(a => a)
		for (i = 0; i < imagesNeeded[args[1].toLowerCase()]; i++) {
			if (!checkImage(message, args[3 + i], attachImages[i])) continue
			attachments.push(checkImage(message, args[3 + i], attachImages[i]))
		}
		if (attachments.length < imagesNeeded[args[1].toLowerCase()]) {
			return message.channel.send(`You must attach ${imagesNeeded[args[1].toLowerCase()] - attachments.length} more image(s).`)
		}

		//write to json
		foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()][args[2].toLowerCase()] = {
			"name": args[2].toLowerCase(),
			"image": attachments
		}

		fs.writeFileSync(`${dataPath}/json/food/${args[0].toLowerCase()}.json`, JSON.stringify(foodFiles[args[0].toLowerCase()], null, '    '));
		message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** has been registered.`)
	}
})




commands.renamefood = new Command({
	desc: `*Args: <Word: Main Category> <Word: Sub-category> <Word: Name> <Word: New Name>*\nRename a food item.`,
	section: "food",
	func: (message, args) => {
		
		if (args.length < 4) {
			let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${getPrefix(message.guild.id)}renamefood`)
			.setDescription(`To rename a food item, try:\n*${getPrefix(message.guild.id)}renamefood <Word: Main Category> <Word: Sub-category> <Word: Name> <Word: New Name>*`)
		
			return message.channel.send({embeds: [embed]})
		}

		if (!checkCategories(args)) return setInvalidEmbed(message)

		setupFileProfile(message.author.id, args[0].toLowerCase(), foodFiles[args[0].toLowerCase()])

		if (!Object.keys(foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()]).includes(args[2].toLowerCase())) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** does not exist in your list.`)
		}

		if (args[3].length > 256) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item name **${args[3].toLowerCase()}** is too long.`)
		}

		if (Object.keys(foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()]).includes(args[3].toLowerCase())) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item name **${args[3].toLowerCase()}** already exists in your list.`)
		}

		//write to json
		foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()][args[3].toLowerCase()] = foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()][args[2].toLowerCase()]
		delete foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()][args[2].toLowerCase()]

		fs.writeFileSync(`${dataPath}/json/food/${args[0].toLowerCase()}.json`, JSON.stringify(foodFiles[args[0].toLowerCase()], null, '    '));
		message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** has been renamed to **${args[3].toLowerCase()}**.`)
	}
})




commands.removefood = new Command({
	desc: `*Args: <Word: Main Category> <Word: Sub-category> <Word: Name>*\nRemove a food item.`,
	section: "food",
	func: (message, args) => {
		
		if (args.length < 3) {
			let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${getPrefix(message.guild.id)}removefood`)
			.setDescription(`To remove a food item, try:\n*${getPrefix(message.guild.id)}removefood <Word: Main Category> <Word: Sub-category> <Word: Name>*`)
		
			return message.channel.send({embeds: [embed]})
		}

		if (!checkCategories(args)) return setInvalidEmbed(message)

		setupFileProfile(message.author.id, args[0].toLowerCase(), foodFiles[args[0].toLowerCase()])

		if (!Object.keys(foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()]).includes(args[2].toLowerCase())) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** does not exist in your list.`)
		}

		//write to json
		delete foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()][args[2].toLowerCase()]

		fs.writeFileSync(`${dataPath}/json/food/${args[0].toLowerCase()}.json`, JSON.stringify(foodFiles[args[0].toLowerCase()], null, '    '));
		message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** has been removed.`)
	}
})




commands.foodtemplate = new Command({
	desc: `*Args: <Word: Main Category> <Word: Sub-category>*\nGet a template for a food item.`,
	section: "food",
	func: (message, args) => {
		
		if (args.length < 2) {
			let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${getPrefix(message.guild.id)}foodtemplate`)
			.setDescription(`To get a template for a food item, try:\n*${getPrefix(message.guild.id)}foodtemplate <Word: Main Category> <Word: Sub-category>*`)
		
			return message.channel.send({embeds: [embed]})
		}

		if (!checkCategories(args)) return setInvalidEmbed(message)

		setupFileProfile(message.author.id, args[0].toLowerCase(), foodFiles[args[0].toLowerCase()])

		let attachment = new Discord.MessageAttachment(`${dataPath}/images/food/${args[0].toLowerCase()}/${args[1].toLowerCase()}/template.png`)
		let embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`${args[0].charAt(0).toUpperCase() + args[0].slice(1)} ${singularVerb[args[1].toLowerCase()].charAt(0).toUpperCase() + singularVerb[args[1].toLowerCase()].slice(1)} Template`)
		.setDescription(`This is a template for ${args[0].toLowerCase()} ${args[1].toLowerCase()}.`)
		.setImage(`attachment://template.png`)

		return message.channel.send({embeds: [embed], files: [attachment]})
	}
})




commands.foodimage = new Command({
	desc: `*Args: <Word: Main Category> <Word: Sub-category> <Word: Name> <Attachment: Image>*\nChange the image of a food item.`,
	section: "food",
	func: (message, args) => {
		
		if (args.length < 3) {
			let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${getPrefix(message.guild.id)}foodimage`)
			.setDescription(`To change the image of a food item, try:\n*${getPrefix(message.guild.id)}foodimage <Word: Main Category> <Word: Sub-category> <Word: Name> <Attachment: Image>*`)
		
			return message.channel.send({embeds: [embed]})
		}

		if (!checkCategories(args)) return setInvalidEmbed(message)

		setupFileProfile(message.author.id, args[0].toLowerCase(), foodFiles[args[0].toLowerCase()])

		if (!Object.keys(foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()]).includes(args[2].toLowerCase())) {
			return message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** does not exist in your list.`)
		}

		if (!args[3] && !message.attachments.size) {
			return message.channel.send(`You must attach an image or send a link to your ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item.`)
		}

		let attachments = []
		let attachImages = message.attachments.map(a => a)
		for (i = 0; i < imagesNeeded[args[1].toLowerCase()]; i++) {
			if (!checkImage(message, args[3 + i], attachImages[i])) continue
			attachments.push(checkImage(message, args[3 + i], attachImages[i]))
		}
		if (attachments.length < imagesNeeded[args[1].toLowerCase()]) {
			return message.channel.send(`You must attach ${imagesNeeded[args[1].toLowerCase()] - attachments.length} more image(s).`)
		}

		//write to json
		foodFiles[args[0].toLowerCase()][message.author.id][args[1].toLowerCase()][args[2].toLowerCase()] = {
			"name": args[2].toLowerCase(),
			"image": attachments
		}

		fs.writeFileSync(`${dataPath}/json/food/${args[0].toLowerCase()}.json`, JSON.stringify(foodFiles[args[0].toLowerCase()], null, '    '));
		message.channel.send(`The ${args[0].toLowerCase()} ${singularVerb[args[1].toLowerCase()]} item **${args[2].toLowerCase()}** has been updated.`)
	}
})




commands.food = new Command({
	desc: `*Args: <Word: Main Category>*\nMake yourself food based on items.`,
	section: "food",
	func: (message, args) => {
		makefood(message, args)
	}
})

async function makefood(message, args) {
	if (!checkCategories(args, true)) return setInvalidEmbed(message, true)

	let foodargs = {}

	if (args.length == 1) {

		let desc = `To use it for this category, try:\n *${getPrefix(message.guild.id)}food ${args[0].toLowerCase()}* `
		//for foodArguments, list them as fields
		for (const i in foodArguments[args[0].toLowerCase()]) {
			//if the argument is required, surround it with <>, otherwise, surround it in {}
			let type = foodArguments[args[0].toLowerCase()][i].type
			if (foodArguments[args[0].toLowerCase()][i].required) {
				desc += `*<${type.charAt(0).toUpperCase() + type.slice(1)}: ${foodArguments[args[0].toLowerCase()][i].name}>* `
			} else {
				desc += `*{${type.charAt(0).toUpperCase() + type.slice(1)}: ${foodArguments[args[0].toLowerCase()][i].name}}* `
			}
		}

		let embed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`${getPrefix(message.guild.id)}food`)
		.setDescription(desc)

		return message.channel.send({embeds: [embed]})
	}

	//for args, parse them from foodArguments. If they are required, but not present, throw an error
	let start = 1
	let foodamount
	for (const i in foodArguments[args[0].toLowerCase()]) {
		
		if (foodArguments[args[0].toLowerCase()][i].required) {
			if (!args[start]) {
				return message.channel.send(`You must provide the ${foodArguments[args[0].toLowerCase()][i].name} argument.`)
			}
		}

		switch (foodArguments[args[0].toLowerCase()][i].type) {
			case "number":
				//make sure the number is bound to min and max, and if there isn't a number, then det it to its default
				foodargs[foodArguments[args[0].toLowerCase()][i].name.toLowerCase()] = (args[start] && (parseInt(args[start]) || args[start] == 0)) ? Math.max(Math.min(parseInt(args[1]), foodArguments[args[0].toLowerCase()][i].max), foodArguments[args[0].toLowerCase()][i].min) : foodArguments[args[0].toLowerCase()][i].default
				break
			case "boolean":
				foodargs[foodArguments[args[0].toLowerCase()][i].name.toLowerCase()] = (args[start] ? (args[start].toLowerCase() == "true" ? true : false) : true)
				break
		}

		if (start == 1) foodamount = foodargs[foodArguments[args[0].toLowerCase()][i].name.toLowerCase()]
		start += 1
	}

	let users = await message.guild.members.fetch().catch(console.error);
	users = users.filter(u => (foodFiles[args[0].toLowerCase()][u.id]))
	users = users.filter(u => ((userPreferences[message.author] && !userPreferences[message.author].BlockedUsers.includes(u.id)) || !userPreferences[message.author]))

	let food = {}

	for (i in subcategories[args[0].toLowerCase()]) {
		if (!food[subcategories[args[0].toLowerCase()][i]]) food[subcategories[args[0].toLowerCase()][i]] = {}

		users.forEach((id) => {
			for (f in foodFiles[args[0].toLowerCase()][id.id][subcategories[args[0].toLowerCase()][i]]) {
				//check if their name contains a phrase the user blocked in preferences
				if (userPreferences[message.author] && userPreferences[message.author].BlockedPhrases.includes(f)) continue
				if ((userPreferences[message.author.id] && Math.random() * 100 < userPreferences[message.author.id].UserChance) || !userPreferences[message.author.id]) {
					food[subcategories[args[0].toLowerCase()][i]][f] = foodFiles[args[0].toLowerCase()][id.id][subcategories[args[0].toLowerCase()][i]][f]
					food[subcategories[args[0].toLowerCase()][i]][f].owner = id.user.tag
				}
			}
		})

		for (o in foodFiles[args[0].toLowerCase()]['official'][subcategories[args[0].toLowerCase()][i]]) {
			if (userPreferences[message.author] && userPreferences[message.author].BlockedPhrases.includes(o)) continue
			if ((userPreferences[message.author.id] && Math.random() * 100 < userPreferences[message.author.id].OfficialChance) || !userPreferences[message.author.id]) {
				food[subcategories[args[0].toLowerCase()][i]][o] = foodFiles[args[0].toLowerCase()]['official'][subcategories[args[0].toLowerCase()][i]][o]
				food[subcategories[args[0].toLowerCase()][i]][o].owner = "Official"
			}
		}

		if (Object.keys(food[subcategories[args[0].toLowerCase()][i]]).length == 0)
			return message.channel.send(`No food found for ${args[0].toLowerCase()} ${subcategories[args[0].toLowerCase()][i]}. Maybe there's something in preferences that made me throw an error.`)
	}

	if (foodamount >= 10) {
		message.channel.send('Please wait while we generate your food...')
	}

	let results = {}

	for (const i in subcategories[args[0].toLowerCase()]) {
		ismultiple = isInMultiples[subcategories[args[0].toLowerCase()][i]]

		if (ismultiple) {
			results[`${subcategories[args[0].toLowerCase()][i]}_amount`] = foodargs[subcategories[args[0].toLowerCase()][i]]
			results[subcategories[args[0].toLowerCase()][i]] = []

			for (a = 0; a < foodargs[subcategories[args[0].toLowerCase()][i]]; a++) {
				results[subcategories[args[0].toLowerCase()][i]].push(food[subcategories[args[0].toLowerCase()][i]][Object.keys(food[subcategories[args[0].toLowerCase()][i]])[Math.floor(Math.random() * Object.keys(food[subcategories[args[0].toLowerCase()][i]]).length)]])
			}
		} else {
			//check if there is an foodarg argument with include on it
			if ((!foodargs[`include `+singularVerb[subcategories[args[0].toLowerCase()][i]]]) && foodargs[`include `+singularVerb[subcategories[args[0].toLowerCase()][i]]] != undefined) { results[subcategories[args[0].toLowerCase()][i]] = "None"; continue}
			results[subcategories[args[0].toLowerCase()][i]] = food[subcategories[args[0].toLowerCase()][i]][Object.keys(food[subcategories[args[0].toLowerCase()][i]])[Math.floor(Math.random() * Object.keys(food[subcategories[args[0].toLowerCase()][i]]).length)]]
		}
	}

	generateImage(message, args, results)
}

async function generateImage(message, args, results) {

	const attachment = await generateFood(args, results, args[0].toLowerCase())

	let embed = new Discord.MessageEmbed()
		.setColor(0x00AE86)
		.setTitle(`Here's your ${args[0].toLowerCase()}!`)
		.setImage(`attachment://image.png`)

	for (i in results) {
		if (i.includes('amount')) {
			embed.addField(`${singularVerb[i.replace('_amount', '')].charAt(0).toUpperCase() + singularVerb[i.replace('_amount', '')].replace('_amount', '').slice(1)} Amount`, `${results[i]}`, false)
		} else if (typeof results[i] == 'string') {
			embed.addField(`${singularVerb[i].charAt(0).toUpperCase() + singularVerb[i].replace('_amount', '').slice(1)}`, `${results[i]}`, true)
		} else if (typeof results[i] == 'object') {
			if (isInMultiples[i]) {
				let foodstring = ''
				for (f in results[i]) {
					foodstring += `- ${results[i][f].name} *(${results[i][f].owner})*\n`
				}

				if (results[i].length == 0) foodstring = 'None'

				//if length of result[i] is bigger than 8, send a hastebin
				if (results[i].length > 8) {
					foodstring = `Hastebin:\n${await hastebin(foodstring)}`
				}

				embed.addField(`${i.charAt(0).toUpperCase() + i.slice(1)}`, foodstring, false)
			} else {
				embed.addField(`${singularVerb[i].charAt(0).toUpperCase() + singularVerb[i].replace('_amount', '').slice(1)}`, `${results[i].name} *(${results[i].owner})*`, true)
			}
		}
	}

	message.channel.send({embeds: [embed], files: [attachment]})
}

async function generateFood(args, results, category) {

	//filter results based on if they don't have "_amount" in the name
	let filteredresults = {}
	for (i in results) {
		if (!i.includes('_amount') && results[i] != 'None') {
			filteredresults[i] = results[i]
		}
	}
	results = filteredresults

	function drawRotated(degrees, image){
		context.save();
	
		context.translate(canvas.width/2,canvas.height/2);
	
		context.rotate(degrees*Math.PI/180);
	
		context.drawImage(image,-image.width/2,-image.width/2);
	
		context.restore();
	}

	let canvas

	switch (category) {
		case 'icecream':
			canvas = Canvas.createCanvas(201, 240 + (62 * results[`flavors`].length));
			break
		case 'pizza':
			canvas = Canvas.createCanvas(180, 180);
			break
		case 'hamburger':
			canvas = Canvas.createCanvas(201, 130 + (12 * results[`ingredients`].length));
			break
	}

	const context = canvas.getContext('2d');
	let draw
	let coneY
	let lastScoopY

	switch (category) {
		case 'pizza':
			for (i in results) {
				if (results[i].length > 0) {
					for (a in results[i]) {
						if (results[i][a].owner == "Official") {
							draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/${i}/${results[i][a].name}.png`)
						} else {
							try {
								draw = await Canvas.loadImage(results[i][a].image)
							} catch (e) {
								draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_${results[i]}.png`)
							}
						}
						drawRotated(Math.random() * 360, draw)
					}
				} else {
					if (results[i].owner == "Official") {
						draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/${i}/${results[i].name}.png`)
					} else {
						try {
							draw = await Canvas.loadImage(results[i].image)
						} catch (e) {
							draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_${results[i]}.png`)
						}
					}
					drawRotated(Math.random() * 360, draw)
				}
			}
			break
		case 'icecream':
			if (results['cones'].owner == "Official") {
				draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/cones/${results['cones'].name}.png`)
			} else {
				try {
					draw = await Canvas.loadImage(results['cones'].image)
				} catch (e) {
					draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_cones.png`)
				}
			}

			coneY = canvas.height - 240
       		context.drawImage(draw, 20, coneY, 161, 231);

			for (i in results[`flavors`]) {
				if (results[`flavors`][i].owner == "Official") {
					draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/flavors/${results[`flavors`][i].name}.png`)
				} else {
					try {
						draw = await Canvas.loadImage(results[`flavors`][i].image)
					} catch (e) {
						draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_scoops.png`)
					}
				}

				lastScoopY = coneY - 110 - 62 * (i-1)
				context.drawImage(draw, 20, lastScoopY, 161, 155);
			}
			break
		case 'hamburger':
			if (results['buns'].owner == "Official") {
				draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/buns/${results['buns'].name}_Bottom.png`)
			} else {
				try {
					draw = await Canvas.loadImage(results['buns'].image[0])
				} catch (e) {
					draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_buns_bottom.png`)
				}
			}

			coneY = canvas.height - 94
        	context.drawImage(draw, 20, coneY, 161, 94);

			for (i in results[`ingredients`]) {
				if (results[`ingredients`][i].owner == "Official") {
					draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/ingredients/${results[`ingredients`][i].name}.png`)
				} else {
					try {
						draw = await Canvas.loadImage(results[`ingredients`][i].image)
					} catch (e) {
						draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_ingredients.png`)
					}
				}

				lastScoopY = coneY - 24 - 12 * (i-1)
            	context.drawImage(draw, 22, lastScoopY, 161, 80);
			}

			lastScoopY = coneY - 12 - 12 * (results[`ingredients`].length-1)

			if (results['buns'].owner == "Official") {
				draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/buns/${results['buns'].name}_Top.png`)
			} else {
				try {
					draw = await Canvas.loadImage(results['buns'].image[1])
				} catch (e) {
					draw = await Canvas.loadImage(`${dataPath}/images/food/${category}/error_buns_top.png`)
				}
			}

			coneY = lastScoopY - 32
			context.drawImage(draw, 20, coneY, 161, 94);
			break
	}

	return new Discord.MessageAttachment(canvas.toBuffer(), 'image.png');
}