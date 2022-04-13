function itemDesc(itemDefs, itemName) {
    let finalText = "";

    if (itemDefs.cost && itemDefs.cost != 0) {
        finalText += `Costs **${itemDefs.cost}**\n`;
    }

    //now type and its value
    if (itemDefs.type) {
        switch (itemDefs.type) {
            case 'skill':
                let type = ''
                if (typeof skillFile[itemDefs.skill].type === 'string')
                    type = `${elementEmoji[skillFile[itemDefs.skill].type]}`;
                else if (typeof skillFile[itemDefs.skill].type === 'object') {
                    for (const i in skillFile[itemDefs.skill].type) type += `${skillFile[itemDefs.skill].type[i]}`;
                }

                finalText += `Casts **${type}${itemDefs.skill}** when used\n`;
                break;
            case 'heal':
                finalText += `Heals **${itemDefs.heal}** HP when used\n`;
                break;
            case 'healmp':
                finalText += `Heals **${itemDefs.healmp}** MP when used\n`;
                break;
            case 'healhpmp':
                finalText += `Heals **${itemDefs.healhpmp}** HP and MP when used\n`;
                break;
            case 'revive':
                finalText += `Revives **${itemDefs.revive}** HP when used\n`;
                break;
            case 'pacify':
                finalText += `Pacifies a foe with **${itemDefs.pacify}**% when used\n`;
                break;
            case 'material':
                finalText += `A **type of material** used in **item fusions** or **equipment upgrading**\n`;
        }
    }

    if (itemDefs.desc)
		finalText += `\n*${itemDefs.desc}*`;

    let userTxt = ''
	if (itemDefs.originalAuthor) {
		if (itemDefs.originalAuthor === 'Default')
			userTxt = 'Default/Official';
		else {
			client.users.fetch(itemDefs.originalAuthor).then((user) => {
				userTxt = user.username;
			})
		}
	} else
		userTxt = 'Default/Official';

    const DiscordEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
		.setTitle(`${itemTypeEmoji[itemDefs.type]}${itemDefs.rarity && itemDefs.rarity != 'none' ? itemRarityEmoji[itemDefs.rarity] : ``} ${itemDefs.name ? itemDefs.name : itemDefs} *(${userTxt})*`)
		.setDescription(finalText)
	return DiscordEmbed;
}




//Commands

commands.registeritem = new Command({
    desc: `Registers a new item to use in-battle! Characters can buy these items with currency in shops, and use them for various effects.`,
    section: 'items',
    args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		},
        {
            name: "Rarity",
            type: "Word",
			forced: true
        },
        {
            name: "Currency Cost",
            type: "Num",
			forced: true
        },
        {
            name: "Type",
            type: "Word",
			forced: true
        },
        {
            name: "Value",
            type: "Word"
        },
        {
            name: "Description",
            type: "Word",
        }
	],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (itemFile[args[0]] && itemFile[args[0]].originalAuthor != message.author.id) return message.channel.send("This item exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of a skill name.`);

        if (!itemRarities.includes(args[1].toLowerCase()) && args[1].toLowerCase() != 'none') return message.channel.send(`${args[1]} is not a valid rarity. Valid rarities are:\n${Builders.codeBlock('', '- '+itemRarities.join(',\n- '))}`);

        if (!itemTypes.includes(args[3].toLowerCase())) return message.channel.send(`${args[3]} is not a valid type. Valid types are:\n${Builders.codeBlock('', '- '+itemTypes.join(',\n- '))}`);

        itemFile[args[0]] = {
            name: args[0],
            rarity: args[1].toLowerCase(),
            cost: Math.max(args[2], 0),
            type: args[3].toLowerCase(),
            originalAuthor: message.author.id
        }

        if (args[5]) itemFile[args[0]].desc = args[5];

        let amount
        switch (args[3]) {
            case 'skill':
                if (!skillFile[args[4]]) return message.channel.send(`${args[4]} is not a valid skill name.`);
                amount = args[4]
                break;
            case 'heal':
            case 'healmp':
                amount = args[4] && parseInt(args[4]) ? parseInt(args[4]) : 60;
                break;
            case 'healhpmp':
                amount = args[4] && parseInt(args[4]) ? parseInt(args[4]) : 40;
                break;
            case 'revive':
                amount = args[4] && parseInt(args[4]) ? parseInt(args[4]) : 2;
                break;
            case 'pacify':
                amount = args[4] && parseInt(args[4]) ? Math.max(0, Math.min(parseInt(args[4]), 100)) : 30;
        }

        if (amount) itemFile[args[0]][args[3]] = amount;

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));

        message.channel.send({content: `${itemFile[args[0]].name} has been registered:`, embeds: [itemDesc(itemFile[args[0]], args[0])]})
    }
})

commands.getitem = new Command({
    desc: `Gets the item with the given name.`,
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        if (!args[0]) return message.channel.send(`Please provide an item name.`);

        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        message.channel.send({embeds: [itemDesc(itemFile[args[0]], args[0])]})
    }
})

commands.listitems = new Command({
    desc: `Lists all items.`,
    section: 'items',
    args: [
        {
            name: "Type",
            type: "Word",
        },
        {
            name: "Quick Page",
            type: "Num"
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        let array = []
        for (let item in itemFile) {
            
            if (!args[0]) {
				array.push({title: `${itemTypeEmoji[itemFile[item].type]}${itemFile[item].name} (${item})`, desc: `${itemFile[item].cost} cost`});
				continue;
			}

            if (itemFile[item].type != args[0].toLowerCase()) continue;
            array.push({title: `${itemTypeEmoji[itemFile[item].type]}${itemFile[item].name} (${item})`, desc: `${itemFile[item].cost} cost`});
        }

        listArray(message.channel, array, parseInt(args[1]));
    }
})