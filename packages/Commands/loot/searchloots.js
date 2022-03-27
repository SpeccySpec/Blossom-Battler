//Required
const Discord = require('discord.js');

// Bot Stuff
const utilityFuncs = require('../../utilityFuncs.js');

// Path to 'data' folder
const dataPath = './data'

//FS, for writing files.
const fs = require('fs');

// Buttons
const backId = 'back'
const forwardId = 'forward'
const backButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Back',
	emoji: '⬅️',
	customId: backId
})
const forwardButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Forward',
	emoji: '➡️',
	customId: forwardId
})

function searchLoots(message, prefix) {
    const arg = message.content.slice(prefix.length).trim().split(/ +/);

    if (!arg[1] || arg[1] === ' ' || arg[1] === 'null') {
        const DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${prefix}searchloots`)
			.setDescription("(Args <Search Parameter>)\nSearch for Loot Tables that include the word specified.")
        message.channel.send({embeds: [DiscordEmbed]})
        return false
    }

    var lootPath = `${dataPath}/Loot/lootTables-${message.guild.id}.json`
    var lootRead = fs.readFileSync(lootPath, {flag: 'as+'});
	if (lootRead == '') lootRead = '{}';
    var lootFile = JSON.parse(lootRead);

    var skillTxt = []
    for (const skillName in lootFile) {
        if (skillName.includes(arg[1])) {
            skillTxt.push(lootFile[skillName])
        }
    }

	sendSkillArray(message.channel, skillTxt)
}

const sendSkillArray = async(channel, theArray) => {
	const generateEmbed = async start => {
		const current = theArray.slice(start, start + 10)
		return new Discord.MessageEmbed({
			title: `Showing results ${start + 1}-${start + current.length} out of ${theArray.length}`,
			fields: await Promise.all(
				current.map(async arrayDefs => ({
					name: `${arrayDefs.name}`,
					value: `${arrayDefs.items.length} Items`
				}))
			)
		})
	}

	const canFitOnOnePage = theArray.length <= 10
	const embedMessage = await channel.send({
		embeds: [await generateEmbed(0)],
		components: canFitOnOnePage ? [] : [new Discord.MessageActionRow({components: [forwardButton]})]
	})

	if (canFitOnOnePage) return

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => true // fuck you and your (the sequel)
	})

	let currentIndex = 0
	collector.on('collect', async interaction => {
		interaction.customId === backId ? (currentIndex -= 10) : (currentIndex += 10)
		await interaction.update({
			embeds: [await generateEmbed(currentIndex)],
			components: [
				new Discord.MessageActionRow({
					components: [
						...(currentIndex ? [backButton] : []),
						...(currentIndex + 10 < theArray.length ? [forwardButton] : [])
					]
				})
			]
		})
	})
}

// Export Functions
module.exports = {
	initialize: function (message, prefix) {
		return searchLoots(message, prefix)
	},
}