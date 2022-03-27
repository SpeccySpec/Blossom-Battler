//Required
const Discord = require('discord.js');

// Bot Stuff
const utilityFuncs = require('../../utilityFuncs.js');

// Path to 'data' folder
const dataPath = './data'

//FS, for writing files.
const fs = require('fs');

function makeLoot(message, prefix) {
	if (utilityFuncs.isBanned(message.author.id, message.guild.id) && !utilityFuncs.RPGBotAdmin(message.author.id)) {
		message.channel.send("I've been told you were banned from using the RPG sections of the bot, sorry!")
		return false
	}
	
	if (!message.member.permissions.serialize().ADMINISTRATOR) {
		message.channel.send("You lack sufficient permissions, I'm so sorry!");
		return false
	}

	const arg = message.content.slice(prefix.length).trim().split(/ +/);

	if (!arg[1]) {
		const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`${prefix}makeLoot`)
				.setDescription("(Args <Name> <Items, Drop Chances, ...>)\nCreates a loot table that can be assigned to enemies after a battle victory, and chests.\n\nItems and Drop chances can be written like:\n__<item>, <drop chance>, <item>, <drop chance>__\n or like:\n__<items>, <drop chances>__\n as long as there is at least one item.")
			message.channel.send({embeds: [DiscordEmbed]})
			return false
	}

	if (!arg[2]) {
		message.channel.send("Please specify an item, or a chance of an item dropping.");
		return false
	}

	let itemInput = []
	let chanceInput = []
	let incorrectItems = ""

	var itemPath = dataPath+'/items.json'
	var itemRead = fs.readFileSync(itemPath, {flag: 'as+'});
	var itemFile = JSON.parse(itemRead);

	for (const i in arg) {
		if (i > 1) {
			if (!isFinite(parseFloat(arg[i]))) {
				if (!itemFile[arg[i]])
					incorrectItems += `\n- ${[arg[i]]}`
				else
					itemInput.push(arg[i])
			} else {
				chanceInput.push(Math.round(parseFloat(arg[i])))
			}
		}
	}

	if (incorrectItems.length > 0)
		message.channel.send(`<:warning:878094052208296007>**Your invalid items are:**${incorrectItems}`);

	//item and drop length comparisons

	if (itemInput.length < 1) {
		message.channel.send("I'm sorry, but the loot table doesn't contain an existing item.");
		return false
	}

	if (chanceInput.length > itemInput.length) {
		chanceInput.length = itemInput.length
		message.channel.send("<:warning:878094052208296007>Due to there being more drop chances than items themselves, I'll shorten them for you.");
	}

	if (chanceInput.length < itemInput.length) {
		message.channel.send("<:warning:878094052208296007>Due to there being more items than drops chances themselves, I'll assign the leftover ones a default of 10%.");

		var chancesLeftOver = itemInput.length - chanceInput.length

		for (i = 1; i <= chancesLeftOver; i++)
			chanceInput.push(10)
	}

	console.log(`Items: ${itemInput}\n Chances: ${chanceInput}`)

	//Writing into File

	var lootPath = `${dataPath}/Loot/lootTables-${message.guild.id}.json`
	var lootRead = fs.readFileSync(lootPath, {flag: 'as+'});
	if (lootRead == '') lootRead = '{}';
	var lootFile = JSON.parse(lootRead);

	lootFile[arg[1]] = {
		name: arg[1],
		items: itemInput,
		itemChances: chanceInput 
	}

	fs.writeFileSync(lootPath, JSON.stringify(lootFile, null, '    '));

	//Outputting an embed

	console.log(`Items length: ${itemInput.length}\n Chances length: ${chanceInput.length}`)

	let finalText = ``

	let a=0;
	do {
		finalText += `\n- ${itemInput[a]}: ${chanceInput[a]}% chance`
		a++
	} while (a < itemInput.length) //how tf did a for loop not work with it????????

	const DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#A35B33')
		.setTitle(`A loot table has been made!`)
		.setDescription(`**Name**:\n${arg[1]}\n\n**Loot**:${finalText}`)
		.setFooter('Loot Table')
	message.channel.send({embeds: [DiscordEmbed]})
}

// Export Functions
module.exports = {
	initialize: function (message, prefix) {
		return makeLoot(message, prefix)
	},
}