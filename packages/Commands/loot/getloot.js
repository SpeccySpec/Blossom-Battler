//Required
const Discord = require('discord.js');

// Bot Stuff
const utilityFuncs = require('../../utilityFuncs.js');

// Path to 'data' folder
const dataPath = './data'

//FS, for writing files.
const fs = require('fs');

function getLoot(message, prefix) {
    const arg = message.content.slice(prefix.length).trim().split(/ +/);

    if (!arg[1]) {
        const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${prefix}getloot`)
				.setDescription("(Args <Loot Table / Enemy Name>)\nGets the loot table you want to look into.")
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

    let itemInput
    let chanceInput
    let lootName

    if (lootFile[arg[1]]) {
        lootName = arg[1]

        itemInput = lootFile[arg[1]].items
        chanceInput = lootFile[arg[1]].itemChances
    } else if (enmFile[message.guild.id][arg[1]]) {
        if (enmFile[message.guild.id][arg[1]].loot == '' || !enmFile[message.guild.id][arg[1]].loot)
            return message.channel.send(`${arg[1]} does not have a set loot table.`);

        lootName = enmFile[message.guild.id][arg[1]].loot

        itemInput = lootFile[lootName].items
        chanceInput = lootFile[lootName].itemChances
    } else
        return message.channel.send(`${arg[1]} is not a loot table, or an enemy type.`);

    let finalText = ``
    let a=0;
    do {
        finalText += `\n- ${itemInput[a]}: ${chanceInput[a]}% chance`
        a++
    } while (a < itemInput.length) //how tf did a for loop not work with it????????

    let ownedBy = ''

    for (const i in enmFile[message.guild.id]) {
        if (enmFile[message.guild.id][i].loot == lootName) {
            if (ownedBy != "") 
				ownedBy += ", ";

            ownedBy += `${i}`
        }
    }

    const DiscordEmbed = new Discord.MessageEmbed()
        .setColor('#A35B33')
        .setTitle(`Loot Table: ${lootName}`)
		.setDescription(`**Loot**:${finalText}\n\n**Owned By**:\n${ownedBy}`)
        .setFooter('Loot Table')
    return message.channel.send({embeds: [DiscordEmbed]})
}

// Export Functions
module.exports = {
	initialize: function (message, prefix) {
		return getLoot(message, prefix)
	},
}