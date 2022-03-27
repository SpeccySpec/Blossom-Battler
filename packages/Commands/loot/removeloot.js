//Required
const Discord = require('discord.js');

// Bot Stuff
const utilityFuncs = require('../../utilityFuncs.js');

// Path to 'data' folder
const dataPath = './data'

//FS, for writing files.
const fs = require('fs');

function removeLoot(message, prefix) {
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
				.setTitle(`${prefix}assignloot`)
				.setDescription("(Args <Loot Table>)\nRemoves a loot table and unsets it for everything.")
			message.channel.send({embeds: [DiscordEmbed]})
			return false
	}

	var lootPath = `${dataPath}/Loot/lootTables-${message.guild.id}.json`
	var lootRead = fs.readFileSync(lootPath, {flag: 'as+'});
	if (lootRead == '') lootRead = '{}';
	var lootFile = JSON.parse(lootRead);
	var enmPath = `${dataPath}/Enemies/enemies-${message.guild.id}.json`
	var enmRead = fs.readFileSync(enmPath, {flag: 'as+'});
	var enmFile = JSON.parse(enmRead);
	var chestPath = dataPath+'/chests.json'
	var chestRead = fs.readFileSync(chestPath, {flag: 'as+'});
	var chestFile = JSON.parse(chestRead);

	if (!lootFile[arg[1]]) {
		message.channel.send(`${arg[1]} is not a loot table.`)
		return false
	}

	let enmList = ``

	for (const i in enmFile[message.guild.id]) {
		if (enmFile[message.guild.id][i].loot == arg[1]) {
			enmFile[message.guild.id][i].loot = ''

			enmList += `\n- ${i}`
		}
	}
	fs.writeFileSync(enmPath, JSON.stringify(enmFile, null, '    '));

	for(const serverID in chestFile) {
		for(const channelID in chestFile[serverID]) {
			for (const i in chestFile[serverID][channelID]) {
				if (chestFile[serverID][channelID][i].inputLoot == arg[1]) {
					chestFile[serverID][channelID][i].inputLoot = ''

					for (const item in chestFile[serverID][channelID][i].itemsFromLoot) {

						console.log(item)
						if (chestFile[serverID][channelID][i].items[item] > 0) {
							chestFile[serverID][channelID][i].items[item] -= chestFile[serverID][channelID][i].itemsFromLoot[item]
						}
						
						if (chestFile[serverID][channelID][i].items[item] <= 0) {
							delete chestFile[serverID][channelID][i].items[item]
						}
					}

					chestFile[serverID][channelID][i].itemsFromLoot = {}
				}
			}
		}
	}

	fs.writeFileSync(chestPath, JSON.stringify(chestFile, null, '    '));

	delete lootFile[arg[1]]
	fs.writeFileSync(lootPath, JSON.stringify(lootFile, null, '    '));

	message.channel.send(`**${arg[1]}** has been removed, and with it, the enemies that no longer have the loot are:${enmList}\n\nChests are probably affected as well.`);
}

// Export Functions
module.exports = {
	initialize: function (message, prefix) {
		return removeLoot(message, prefix)
	},
}