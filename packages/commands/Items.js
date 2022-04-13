function itemDesc(itemDefs, itemName, message) {
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
			userTxt = message.guild.members.cache.get(itemDefs.originalAuthor).user.username
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
        switch (args[3].toLowerCase()) {
            case 'skill':
                if (!skillFile[args[4]]) return message.channel.send(`${args[4]} is not a valid skill name.`);
                if (skillFile[args[4]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`You cannot use a skill that you do not own.`);
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

        message.channel.send({content: `${itemFile[args[0]].name} has been registered:`, embeds: [itemDesc(itemFile[args[0]], args[0], message)]})
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

        message.channel.send({embeds: [itemDesc(itemFile[args[0]], args[0], message)]})
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

        if (array.length == 0) return message.channel.send(`No items found.`);

        listArray(message.channel, array, parseInt(args[1]));
    }
})

commands.purgeitem = new Command({
    desc: `Purges an item of your choice.`,
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        if (itemFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${itemFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this item.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${itemFile[args[0]].name} has been erased from existance. The loot and chests that have this item should be checked in order to ensure that they do not have an invalid item.`)
                    delete itemFile[args[0]]

                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));
                } else
                    message.channel.send(`${itemFile[args[0]].name} will not be deleted.`);

                    givenResponce = true
                    collector.stop()
                }
            });
            collector.on('end', c => {
                if (givenResponce == false)
                    message.channel.send(`No response given.\n${itemFile[args[0]].name} will not be deleted.`);
            });
    }
})

commands.edititem = new Command({
    desc: `Edit existing items and change how they work in battle!`,
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Field",
            type: "Word",
            forced: true
        },
        {
            name: "New Value 1",
            type: "Word",
            forced: true
        },
        {
            name: "New Value 2",
            type: "Word",
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        if (!message.member.permissions.serialize().ADMINISTRATOR) {
            if (itemFile[args[0]].originalAuthor != message.author.id) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to edit it.")
        }

        let editField = args[1].toLowerCase();
        switch (editField) {
            case 'name':
            case 'desc':
                itemFile[args[0]][editField] = args[2];
                break;
            case 'type':
                if (!itemTypes.includes(args[2].toLowerCase())) return message.channel.send(`${args[2]} is not a valid item type. Valid types are:\n${Builders.codeBlock('', '- '+itemTypes.join(',\n- '))}`);
                let amount
                switch (args[2].toLowerCase()) {
                    case 'skill':
                        if (!skillFile[args[3]]) return message.channel.send(`${args[4]} is not a valid skill name.`);
                        if (skillFile[args[3]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`You cannot use a skill that you do not own.`);
                        amount = args[3]
                        break;
                    case 'heal':
                    case 'healmp':
                        amount = args[3] && parseInt(args[3]) ? parseInt(args[3]) : 60;
                        break;
                    case 'healhpmp':
                        amount = args[3] && parseInt(args[3]) ? parseInt(args[3]) : 40;
                        break;
                    case 'revive':
                        amount = args[3] && parseInt(args[3]) ? parseInt(args[3]) : 2;
                        break;
                    case 'pacify':
                        amount = args[3] && parseInt(args[3]) ? Math.max(0, Math.min(parseInt(args[3]), 100)) : 30;
                }

                delete itemFile[args[0]].skill;
                delete itemFile[args[0]].heal;
                delete itemFile[args[0]].healmp;
                delete itemFile[args[0]].healhpmp;
                delete itemFile[args[0]].revive;
                delete itemFile[args[0]].pacify;

                itemFile[args[0]].type = args[2].toLowerCase();
                if (amount) itemFile[args[0]][args[2]] = amount;
                break;
            case 'cost':
                itemFile[args[0]].cost = Math.max(0, parseInt(args[2]));
                break;
            case 'rarity':
                if (!itemRarities.includes(args[2].toLowerCase()) && args[2].toLowerCase() != 'none') return message.channel.send(`${args[2]} is not a valid item rarity. Valid rarities are:\n${Builders.codeBlock('', '- '+itemRarities.join(',\n- '))}`);
                itemFile[args[0]].rarity = args[2].toLowerCase();
                break;
            case 'truename':
                if (itemFile[args[2]]) {
                    return message.channel.send(`An item called ${args[2]} (${itemFile[args[2]].name}) already exists!`)
                } else {
                    itemFile[args[2]] = utilityFuncs.cloneObj(itemFile[args[0]])
                    delete itemFile[args[0]]
                }
                break;
            }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));
        message.react('👍');
    }
})

commands.searchitems = new Command({
    desc: `Search for items by name.`,
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        let array = []
        for (let item in itemFile) {
            if (itemFile[item].name.includes(args[0]) || item.includes(args[0])) {
                array.push({title: `${itemTypeEmoji[itemFile[item].type]}${itemFile[item].name} (${item})`, desc: `${itemFile[item].cost} cost`});
            }
        }

        if (array.length == 0) return message.channel.send(`No items found with the name ${args[0]}.`);
        
        listArray(message.channel, array, parseInt(args[1]));
    }
})

commands.randitem = new Command({
    desc: `Get a random item.`,
    section: 'items',
    args: [],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (Object.keys(itemFile).length == 0) return message.channel.send(`No items have been added yet.`);

        let item = Object.keys(itemFile)[Math.floor(Math.random() * Object.keys(itemFile).length)];
        item = itemFile[item]
        message.channel.send({content:`Congratulations! <@!${item.originalAuthor}>! ${itemTypeEmoji[item.type]} ${item.name} has been rolled!`, embeds: [itemDesc(item, item.name, message)]})
    }
})