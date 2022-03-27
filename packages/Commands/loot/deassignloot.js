//Required
const Discord = require('discord.js');

// Bot Stuff
const utilityFuncs = require('../../utilityFuncs.js');

// Path to 'data' folder
const dataPath = './data'

//FS, for writing files.
const fs = require('fs');

function assignLoot(message, prefix) {
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
                .setTitle(`${prefix}deassignloot`)
				.setDescription("(Args <Enemy Name>)\nRemoves a loot table from a certain enemy type.")
            message.channel.send({embeds: [DiscordEmbed]})
            return false
    }

    var enmPath = `${dataPath}/Enemies/enemies-${message.guild.id}.json`
    var enmRead = fs.readFileSync(enmPath, {flag: 'as+'});
    var enmFile = JSON.parse(enmRead);

    if (!enmFile[message.guild.id][arg[1]]) {
        message.channel.send(`${arg[1]} is not an enemy.`)
        return false
    }

    if (!enmFile[arg[1]].loot || enmFile[arg[1]].loot == '' || enmFile[arg[1]].loot == undefined) {
        message.channel.send(`${arg[1]} doesn't have a set loot table.`)
        return false
    }

    enmFile[message.guild.id][arg[1]].loot = ''
    fs.writeFileSync(enmPath, JSON.stringify(enmFile, null, '    '));

    return message.channel.send(`**${arg[1]}** will no longer drop items at random.`);
}

// Export Functions
module.exports = {
	initialize: function (message, prefix) {
		return assignLoot(message, prefix)
	},
}