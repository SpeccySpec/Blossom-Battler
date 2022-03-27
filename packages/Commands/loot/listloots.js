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

function listLoots(message, prefix) {
    var lootPath = `${dataPath}/Loot/lootTables-${message.guild.id}.json`
    var lootRead = fs.readFileSync(lootPath, {flag: 'as+'});
	if (lootRead == '') lootRead = '{}';
    var lootFile = JSON.parse(lootRead);

    var skillTxt = []
    for (const i in lootFile) {
            skillTxt.push(lootFile[i])
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
		return listLoots(message, prefix)
	},
}