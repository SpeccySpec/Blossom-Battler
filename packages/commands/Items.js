function itemDesc(itemDefs, itemName, message) {
    let finalText = "";

    if (itemDefs.cost && itemDefs.cost != 0) {
        finalText += `Costs **${itemDefs.cost}**\n`;
    }

    if (itemDefs.type) {
        switch (itemDefs.type) {
            case 'skill':
                if (itemDefs.skill != '') {
                    let type = ''
                    if (skillFile[itemDefs.skill]) {
                        if (typeof skillFile[itemDefs.skill].type === 'string')
                            type = `${elementEmoji[skillFile[itemDefs.skill].type]}`;
                        else if (typeof skillFile[itemDefs.skill].type === 'object') {
                            for (const i in skillFile[itemDefs.skill].type) type += `${skillFile[itemDefs.skill].type[i]}`;
                        }
                    }else type = `<:invalid:964148473295409155>`

                    finalText += `Casts **${type}${itemDefs.skill}** when used\n`;
                }
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
    finalText += '\n'

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

        if (itemDefs.image)
            DiscordEmbed.setThumbnail(itemDefs.image);
	return DiscordEmbed;
}

function weaponDesc(weaponDefs, weaponName, message) {
    let finalText = "";

    if (weaponDefs.cost && weaponDefs.cost != 0) {
        finalText += `Costs **${weaponDefs.cost}**\n`;
    }

    if (weaponDefs.melee) {
        finalText += `**Melee** Buff: **${weaponDefs.melee}**\n`;
    }

    if (weaponDefs.atk) {
        finalText += `**ATK** Buff: **${weaponDefs.atk}**\n`;
    }

    if (weaponDefs.mag) {
        finalText += `**MAG** Buff: **${weaponDefs.mag}**\n`;
    }

    if (weaponDefs.skill && weaponDefs.skill != '') {
        let type = ''
        if (skillFile[weaponDefs.skill]) {
            if (typeof skillFile[weaponDefs.skill].type === 'string')
                type = `${elementEmoji[skillFile[weaponDefs.skill].type]}`;
            else if (typeof skillFile[weaponDefs.skill].type === 'object') {
                for (const i in skillFile[weaponDefs.skill].type) type += `${skillFile[weaponDefs.skill].type[i]}`;
            }
        } else type = `<:invalid:964148473295409155>`

        finalText += `The user may cast **${type}${weaponDefs.skill}**\n`;
    }

    finalText += '\n'

    if (weaponDefs.desc)
        finalText += `\n*${weaponDefs.desc}*`;

    let userTxt = ''
	if (weaponDefs.originalAuthor) {
		if (weaponDefs.originalAuthor === 'Default')
			userTxt = 'Default/Official';
		else {
			userTxt = message.guild.members.cache.get(weaponDefs.originalAuthor).user.username
		}
	} else
		userTxt = 'Default/Official';

    let color = elementColors[weaponDefs.element];

    const DiscordEmbed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`${elementEmoji[weaponDefs.element]} ${weaponDefs.name ? weaponDefs.name : weaponDefs} *(${userTxt})*`)
        .setDescription(finalText)

        if (weaponDefs.image)
            DiscordEmbed.setThumbnail(weaponDefs.image);
    return DiscordEmbed;
}

function armorDesc(armorDefs, armorName, message) {
    let finalText = "";

    if (armorDefs.cost && armorDefs.cost != 0) {
        finalText += `Costs **${armorDefs.cost}**\n`;
    }

    if (armorDefs.end) {
        finalText += `**END** Buff: **${armorDefs.end}**\n`;
    }

    if (armorDefs.skill && armorDefs.skill != '') {
        let type = ''
        if (skillFile[armorDefs.skill]) {
            if (typeof skillFile[armorDefs.skill].type === 'string')
                type = `${elementEmoji[skillFile[armorDefs.skill].type]}`;
            else if (typeof skillFile[armorDefs.skill].type === 'object') {
                for (const i in skillFile[armorDefs.skill].type) type += `${skillFile[armorDefs.skill].type[i]}`;
            }
        } else type = `<:invalid:964148473295409155>`

        finalText += `The user may cast **${type}${armorDefs.skill}**\n`;
    }

    finalText += '\n'

    if (armorDefs.desc)
        finalText += `\n*${armorDefs.desc}*`;

    let userTxt = ''
    if (armorDefs.originalAuthor) {
        if (armorDefs.originalAuthor === 'Default')
            userTxt = 'Default/Official';
        else {
            userTxt = message.guild.members.cache.get(armorDefs.originalAuthor).user.username
        }
    } else
        userTxt = 'Default/Official';

    let color = elementColors[armorDefs.element];

    const DiscordEmbed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`${elementEmoji[armorDefs.element]} ${armorDefs.name ? armorDefs.name : armorDefs} *(${userTxt})*`)
        .setDescription(finalText)

        if (armorDefs.image)
            DiscordEmbed.setThumbnail(armorDefs.image);
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

        if (itemFile[args[0]] && itemFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("This item exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of an item name.`);

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
                break;
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
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        message.channel.send({content: `Here's your info on ${args[0]}:`, embeds: [itemDesc(itemFile[args[0]], args[0], message)]})
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
    desc: `Purges an item of your choice. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
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

                    let warningText = {}

                    warningText['recipes'] = ''
                    for (let item in itemFile) {
                        if (itemFile[item].recipe) {
                            if (itemFile[item].recipe.recipe.includes(args[0])) {
                                warningText['recipes'] += `- ${itemFile[item].name}\n`
                            }
                            for (const i in itemFile[item].recipe.recipe) {
                                if (itemFile[item].recipe.recipe[i] == args[0]) {
                                    itemFile[item].recipe.recipe[i] = ''
                                }
                            }
                        }
                    }

                    if (warningText['recipes']) message.channel.send(`**WARNING:**\nThe following items have been updated to remove this item from their recipes:\n\`\`\`${warningText['recipes']}\`\`\``)

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
            name: "New Value #1",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);
        if (itemFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`You cannot edit ${args[0]}.`);

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
            case 'currency':
            case 'cost':
                itemFile[args[0]].cost = Math.max(0, parseInt(args[2]));
                break;
            case 'rarity':
                if (!itemRarities.includes(args[2].toLowerCase()) && args[2].toLowerCase() != 'none') return message.channel.send(`${args[2]} is not a valid item rarity. Valid rarities are:\n${Builders.codeBlock('', '- '+itemRarities.join(',\n- '))}`);
                itemFile[args[0]].rarity = args[2].toLowerCase();
                break;
            case 'truename':
                if (itemFile[args[2]]) {
                    return message.channel.send(`An item called ${itemFile[args[2]].name} (${args[2]}) already exists!`)
                } else {
                    itemFile[args[2]] = utilityFuncs.cloneObj(itemFile[args[0]])
                    delete itemFile[args[0]]

                    for (let item in itemFile) {
                        if (itemFile[item].recipe) {
                            for (const i in itemFile[item].recipe.recipe) {
                                if (itemFile[item].recipe.recipe[i] == args[0]) {
                                    itemFile[item].recipe.recipe[i] = args[2]
                                }
                            }
                        }
                    }
                }
                break;
            case 'image':
                if (!checkImage(message, args[2], message.attachments.first())) return message.channel.send(`${args[2]} is not a valid image.`);
                itemFile[args[0]].image = checkImage(message, args[2], message.attachments.first())
                break;
            default:
                return message.channel.send(`${args[1]} is not a valid field.`);
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
            name: "Phrase",
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

        if (array.length == 0) return message.channel.send(`No items found with the phrase ${args[0]}.`);
        
        listArray(message.channel, array, parseInt(args[1]));
    }
})

commands.randitem = new Command({
    desc: `Get a random item.`,
    section: 'fun',
    args: [],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (Object.keys(itemFile).length == 0) return message.channel.send(`No items have been added yet.`);

        let item = Object.keys(itemFile)[Math.floor(Math.random() * Object.keys(itemFile).length)];
        item = itemFile[item]
        message.channel.send({content:`Congratulations, ${message.guild.members.cache.get(item.originalAuthor).user.username}! ${itemTypeEmoji[item.type]} ${item.name} has been rolled!`, embeds: [itemDesc(item, item.name, message)]})
    }
})

commands.dailyitem = new Command({
    desc: 'Any random item can be set as a daily one! Test your luck to see if yours is here!',
    section: "fun",
    args: [],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
        if (Object.keys(itemFile).length == 0) return message.channel.send(`No items have been added yet!`);
        if (!dailyItem) dailyItem = {};

        let notice = 'Here is the daily item, again.'
        if (!dailyItem[message.guild.id]) {
            dailyItem[message.guild.id] = Object.keys(itemFile)[Math.floor(Math.random() * Object.keys(itemFile).length)];

            let authorTxt = itemFile[dailyItem[message.guild.id]].originalAuthor ? `<@!${itemFile[dailyItem[message.guild.id]].originalAuthor}>` : '<@776480348757557308>'
            notice = `${authorTxt}, your item is the daily item for today!`;
        }

        setTimeout(function() {
            if (itemFile[dailyItem[message.guild.id]]) {
                let today = getCurrentDate();

                fs.writeFileSync(dataPath+'/dailyitem.txt', JSON.stringify(dailyItem));

                let itemTxt = `**[${today}]**\n${notice}`
                message.channel.send({content: itemTxt, embeds: [itemDesc(itemFile[dailyItem[message.guild.id]], itemFile[dailyItem[message.guild.id]].name, message)]});	
            }
        }, 500);
    }
})

commands.itemimage = new Command({
    desc: 'Sets the image for an item.',
    section: 'items',
    args: [
        {
            name: "Item",
            type: "Word",
            forced: true
        },
        {
            name: "Image",
            type: "Attachment",
            forced: true
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item.`);
        if (itemFile[args[0]].originalAuthor != message.author.id && !message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(`You can only set the image for your own items.`);
        if (!checkImage(message, args[1], message.attachments.first())) return message.channel.send(`${args[1]} is not a valid image.`);

        itemFile[args[0]].image = checkImage(message, args[1], message.attachments.first())

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));
        message.react('👍');
    }
})

commands.purgeweapon = new Command({
    desc: `Purges a weapon of your choice. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (!weaponFile[args[0]]) return message.channel.send(`${args[0]} is not a valid weapon name.`);

        if (weaponFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this weapon, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${weaponFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this weapon.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${weaponFile[args[0]].name} has been erased from existance. The loot and chests that have this weapon should be checked in order to ensure that they do not have an invalid weapon.`)
                    delete weaponFile[args[0]]

                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile, null, 4));
                } else
                    message.channel.send(`${weaponFile[args[0]].name} will not be deleted.`);

                    givenResponce = true
                    collector.stop()
                }
            });
            collector.on('end', c => {
                if (givenResponce == false)
                    message.channel.send(`No response given.\n${weaponFile[args[0]].name} will not be deleted.`);
            });
    }
})





// Now for Weapons, treat them similarly to item commands

commands.registerweapon = new Command({
    desc: 'Creates a weapon to be equipped. They can be used in battle to grant certain effects or restore health.',
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Currency Cost",
            type: "Number",
            forced: true
        },
        {
            name: "Element",
            type: "Word",
            forced: true
        },
        {
            name: "Melee Power",
            type: "Number",
            forced: true
        },
        {
            name: "ATK Buff",
            type: "Number",
            forced: true
        },
        {
            name: "MAG Buff",
            type: "Number",
            forced: true
        },
        {
            name: "Skill",
            type: "Word"
        },
        {
            name: "Description",
            type: "Word",
        }
    ],
    func: (message, args) => {
        //treat it similarly as the registeritem command
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (weaponFile[args[0]] && weaponFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("This weapon exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of a weapon name.`);

        if (!Elements.includes(args[2].toLowerCase())) return message.channel.send(`${args[2]} is not a valid element.`);
        if (args[2].toLowerCase() == 'passive') return message.channel.send(`Passive weapons are not allowed.`);

        let skill
        if (args[6]) {
            if (!skillFile[args[6]]) message.channel.send(`${args[6]} is not a valid skill. I'll still make this weapon regardless`);
            else skill = args[6];
        }
        
        weaponFile[args[0]] = {
            name: args[0],
            cost: Math.max(args[1], 0),
            element: args[2].toLowerCase(),
            desc: args[7],
            originalAuthor: message.author.id
        }

        if (skill) weaponFile[args[0]].skill = skill;

        if (args[3] > 0) weaponFile[args[0]].melee = args[3];
        if (args[4] > 0) weaponFile[args[0]].atk = args[4];
        if (args[5] > 0) weaponFile[args[0]].mag = args[5];

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile, null, 4));
        
        message.channel.send({content: `${args[0]} has been registered:`, embeds: [weaponDesc(weaponFile[args[0]], args[0], message)]});
    }
})

commands.getweapon = new Command({
    desc: 'Gets a weapon with the given name.',
    section: 'items',
    args: [
        {
            name: "Weapon",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (!weaponFile[args[0]]) return message.channel.send(`${args[0]} is not a valid weapon.`);

        message.channel.send({content: `Here's your info on ${args[0]}:`, embeds: [weaponDesc(weaponFile[args[0]], args[0], message)]});
    }
})

commands.listweapons = new Command({
    desc: 'Lists all weapons.',
    section: 'items',
    args: [
        {
            name: "Element",
            type: "Word"
        },
        {
            name: "Quick Page",
            type: "Num"
        }
    ],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        let array = []
        for (let weapon in weaponFile) {

            if (!args[0]) {
                array.push({title: `${elementEmoji[weaponFile[weapon].element]} ${weaponFile[weapon].name} (${weapon})`, desc: `${weaponFile[weapon].melee && weaponFile[weapon].melee != 0 ? weaponFile[weapon].melee : `???`} Power Melee Attack`});
                continue;
            }

            if (weaponFile[weapon].element != args[0].toLowerCase()) continue;
            
            array.push({title: `${elementEmoji[weaponFile[weapon].element]} ${weaponFile[weapon].name} (${weapon})`, desc: `${weaponFile[weapon].melee && weaponFile[weapon].melee != 0 ? weaponFile[weapon].melee : `???`} Power Melee Attack`});
        }

        if (array.length == 0) return message.channel.send(`No weapons found.`);

        listArray(message.channel, array, parseInt(args[1]));
    }
})

commands.searchweapons = new Command({
    desc: 'Searches for weapons with the given name.',
    section: 'items',
    args: [
        {
            name: "Phrase",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        let array = []
        for (let weapon in weaponFile) {
            if (weaponFile[weapon].name.includes(args[0])) {
                array.push({title: `${elementEmoji[weaponFile[weapon].element]} ${weaponFile[weapon].name} (${weapon})`, desc: `${weaponFile[weapon].melee && weaponFile[weapon].melee != 0 ? weaponFile[weapon].melee : `???`} Power Melee Attack`});
            }
        }

        if (array.length == 0) return message.channel.send(`No weapons found with the phrase ${args[0]}.`);

        listArray(message.channel, array);
    }
})

commands.randweapon = new Command({
    desc: 'Gets a random weapon.',
    section: 'fun',
    args: [],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (Object.keys(weaponFile).length == 0) return message.channel.send(`No weapons have been added yet.`);

        let weapon = Object.keys(weaponFile)[Math.floor(Math.random() * Object.keys(weaponFile).length)];
        weapon = weaponFile[weapon]
        message.channel.send({content:`Congratulations, ${message.guild.members.cache.get(weapon.originalAuthor).user.username}! ${elementEmoji[weapon.element]} ${weapon.name} has been rolled!`, embeds: [weaponDesc(weapon, weapon.name, message)]})
    }
})

commands.dailyweapon = new Command({
    desc: 'Any random weapon can be set as a daily one! Test your luck to see if yours is here!',
    section: "fun",
    args: [],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
        if (Object.keys(weaponFile).length == 0) return message.channel.send(`No weapons have been added yet!`);
        if (!dailyWeapon) dailyWeapon = {};

        let notice = 'Here is the daily weapon, again.'
        if (!dailyWeapon[message.guild.id]) {
            dailyWeapon[message.guild.id] = Object.keys(weaponFile)[Math.floor(Math.random() * Object.keys(weaponFile).length)];

            let authorTxt = weaponFile[dailyWeapon[message.guild.id]].originalAuthor ? `<@!${weaponFile[dailyWeapon[message.guild.id]].originalAuthor}>` : '<@776480348757557308>'
            notice = `${authorTxt}, your weapon is the daily weapon for today!`;
        }

        setTimeout(function() {
            if (weaponFile[dailyWeapon[message.guild.id]]) {
                let today = getCurrentDate();

                fs.writeFileSync(dataPath+'/dailyweapon.txt', JSON.stringify(dailyWeapon));

                let weaponTxt = `**[${today}]**\n${notice}`
                message.channel.send({content: weaponTxt, embeds: [weaponDesc(weaponFile[dailyWeapon[message.guild.id]], weaponFile[dailyWeapon[message.guild.id]].name, message)]});	
            }
        }, 500);
    }
})

commands.weaponimage = new Command({
    desc: 'Sets the image for a weapon.',
    section: 'items',
    args: [
        {
            name: "Weapon",
            type: "Word",
            forced: true
        },
        {
            name: "Image",
            type: "Attachment",
            forced: true
        }
    ],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (!weaponFile[args[0]]) return message.channel.send(`${args[0]} is not a valid weapon.`);
        if (weaponFile[args[0]].originalAuthor != message.author.id && !message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(`You can only set the image for your own weapons.`);
        if (!checkImage(message, args[1], message.attachments.first())) return message.channel.send(`${args[1]} is not a valid image.`);

        weaponFile[args[0]].image = checkImage(message, args[1], message.attachments.first())

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile, null, 4));
        message.react('👍');
    }
})

commands.editweapon = new Command({
    desc: `Edit existing weapons and change how they work!`,
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
            name: "Value",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (!weaponFile[args[0]]) return message.channel.send(`${args[0]} is not a valid weapon.`);
        if (weaponFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`You cannot edit ${args[0]}.`);

        //fields: element
        let editField = args[1].toLowerCase();
        switch (editField) {
            case 'name':
            case 'desc':
                weaponFile[args[0]][editField] = args[2];
                break;
            case 'melee':
            case 'atk':
            case 'mag':
                weaponFile[args[0]][editField] = parseInt(args[2]);
                break;
            case 'truename':
                if (weaponFile[args[2]]) {
                    return message.channel.send(`A weapon called ${weaponFile[args[2]].name} (${args[2]}) already exists!`)
                } else {
                    weaponFile[args[2]] = utilityFuncs.cloneObj(weaponFile[args[0]])
                    delete weaponFile[args[0]]
                }
                break;
            case 'image':
                if (!checkImage(message, args[2], message.attachments.first())) return message.channel.send(`${args[2]} is not a valid image.`);
                weaponFile[args[0]].image = checkImage(message, args[2], message.attachments.first())
                break;
            case 'cost':
            case 'currency':
                weaponFile[args[0]].cost = Math.max(0, parseInt(args[2]));
                break;
            case 'skill':
                if (!skillFile[arg[2]]) return message.channel.send(`${args[2]} is not a valid skill.`);
                weaponFile[args[0]].skill = args[2];
                break;
            case 'element':
                if (!Elements.includes(args[2].toLowerCase())) return message.channel.send(`${args[2]} is not a valid element.`);
                if (args[2].toLowerCase() == 'passive') return message.channel.send(`Passive weapons are not allowed.`);
                weaponFile[args[0]].element = args[2].toLowerCase();
                break;
            default:
                return message.channel.send(`${args[1]} is not a valid field.`);
            }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile, null, 4));
        message.react('👍');
    }
})



commands.registerarmor = new Command({
    desc: 'Creates an armor piece to be equipped. They can be used in battle to grant certain effects or restore health.',
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Currency Cost",
            type: "Number",
            forced: true
        },
        {
            name: "Element",
            type: "Word",
            forced: true
        },
        {
            name: "END Buff",
            type: "Number",
            forced: true
        },
        {
            name: "Skill",
            type: "Word",
        },
        {
            name: "Description",
            type: "Word",
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (armorFile[args[0]] && armorFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("This armor exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
        if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of an armor name.`);

        if (!Elements.includes(args[2].toLowerCase())) return message.channel.send(`${args[2]} is not a valid element.`);

        let skill
        if (args[4]) {
            if (!skillFile[args[4]]) message.channel.send(`${args[4]} is not a valid skill. I'll still make this armor regardless`);
            else skill = args[4];
        }

        armorFile[args[0]] = {
            name: args[0],
            cost: Math.max(args[1], 0),
            element: args[2].toLowerCase(),
            desc: args[5],
            originalAuthor: message.author.id
        }

        if (skill) armorFile[args[0]].skill = skill;

        if (args[3] > 0) armorFile[args[0]].end = args[3];

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armors.json`, JSON.stringify(armorFile, null, 4));

        message.channel.send({content: `${args[0]} has been registered:`, embeds: [armorDesc(armorFile[args[0]], args[0], message)]});
    }
})

commands.getarmor = new Command({
    desc: 'Gets an armor piece with the given name.',
    section: 'items',
    args: [
        {
            name: "Armor",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (!armorFile[args[0]]) return message.channel.send(`${args[0]} is not a valid armor.`);

        message.channel.send({content: `Here's your info on ${args[0]}:`, embeds: [armorDesc(armorFile[args[0]], args[0], message)]});
    }
})

commands.listarmors = new Command({
    desc: 'Lists all armors.',
    section: 'items',
    args: [
        {
            name: "Element",
            type: "Word"
        },
        {
            name: "Quick Page",
            type: "Num"
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        let array = []
        for (let armor in armorFile) {

            if (!args[0]) {
                array.push({title: `${elementEmoji[armorFile[armor].element]} ${armorFile[armor].name} (${armor})`, desc: `Defensive Skill: ${armorFile[armor].skill && armorFile[armor].skill != '' ? armorFile[armor].skill : `None`}`});
                continue;
            }

            if (armorFile[armor].element != args[0].toLowerCase()) continue;

            array.push({title: `${elementEmoji[armorFile[armor].element]} ${armorFile[armor].name} (${armor})`, desc: `Defensive Skill: ${armorFile[armor].skill && armorFile[armor].skill != '' ? armorFile[armor].skill : `None`}`});
        }

        if (array.length == 0) return message.channel.send(`No armors found.`);

        listArray(message.channel, array, parseInt(args[1]));
    }
})

commands.searcharmors = new Command({
    desc: 'Searches for armors with the given name.',
    section: 'items',
    args: [
        {
            name: "Phrase",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        let array = []
        for (let armor in armorFile) {
            if (armorFile[armor].name.includes(args[0])) {
                array.push({title: `${elementEmoji[armorFile[armor].element]} ${armorFile[armor].name} (${armor})`, desc: `Defensive Skill: ${armorFile[armor].skill && armorFile[armor].skill != '' ? armorFile[armor].skill : `None`}`});
            }
        }

        if (array.length == 0) return message.channel.send(`No armors found with the phrase ${args[0]}.`);

        listArray(message.channel, array);
    }
})

commands.randarmor = new Command({
    desc: 'Gets a random armor piece.',
    section: 'fun',
    args: [],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (Object.keys(armorFile).length == 0) return message.channel.send(`No armors have been added yet.`);

        let armor = Object.keys(armorFile)[Math.floor(Math.random() * Object.keys(armorFile).length)];
        armor = armorFile[armor]
        message.channel.send({content:`Congratulations, ${message.guild.members.cache.get(armor.originalAuthor).user.username}! ${elementEmoji[armor.element]} ${armor.name} has been rolled!`, embeds: [armorDesc(armor, armor.name, message)]})
    }
})

commands.dailyarmor = new Command({
    desc: 'Any random armor can be set as a daily one! Test your luck to see if yours is the one!',
    section: 'fun',
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)
        if (Object.keys(armorFile).length == 0) return message.channel.send(`No armors have been added yet!`);
        if (!dailyArmor) dailyArmor = {};

        let notice = 'Here is the daily armor, again.'
        if (!dailyArmor[message.guild.id]) {
            dailyArmor[message.guild.id] = Object.keys(armorFile)[Math.floor(Math.random() * Object.keys(armorFile).length)];

            let authorTxt = armorFile[dailyArmor[message.guild.id]].originalAuthor ? `<@!${armorFile[dailyArmor[message.guild.id]].originalAuthor}>` : '<@776480348757557308>'
            notice = `${authorTxt}, your armor is the daily armor for today!`;
        }

        setTimeout(function() {
            if (armorFile[dailyArmor[message.guild.id]]) {
                let today = getCurrentDate();

                fs.writeFileSync(dataPath+'/dailyarmor.txt', JSON.stringify(dailyArmor));

                let armorTxt = `**[${today}]**\n${notice}`
                message.channel.send({content: armorTxt, embeds: [armorDesc(armorFile[dailyArmor[message.guild.id]], armorFile[dailyArmor[message.guild.id]].name, message)]});	
            }
        }, 500);
    }
})

commands.armorimage = new Command({
    desc: 'Sets the image for an armor piece.',
    section: 'items',
    args: [
        {
            name: "Armor",
            type: "Word",
            forced: true
        },
        {
            name: "Image",
            type: "Attachment",
            forced: true
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (!armorFile[args[0]]) return message.channel.send(`${args[0]} is not a valid armor.`);
        if (armorFile[args[0]].originalAuthor != message.author.id) return message.channel.send(`You can't change the image of ${armorFile[args[0]].name}.`);
        if (!checkImage(message, args[1], message.attachments.first())) return message.channel.send(`${args[1]} is not a valid image.`);

        armorFile[args[0]].image = checkImage(message, args[1], message.attachments.first())

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armors.json`, JSON.stringify(armorFile, null, 4));
        message.react('👍');
    }
})

commands.editarmor = new Command({
    desc: `Edit existing armor and change how they work!`,
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
            name: "Value",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (!armorFile[args[0]]) return message.channel.send(`${args[0]} is not a valid armor.`);
        if (armorFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`You cannot edit ${args[0]}.`);

        let editField = args[1].toLowerCase();
        switch (editField) {
            case 'name':
            case 'desc':
                armorFile[args[0]][editField] = args[2];
                break;
            case 'truename':
                if (armorFile[args[2]]) {
                    return message.channel.send(`An armor piece called ${armorFile[args[2]].name} (${args[2]}) already exists!`)
                } else {
                    armorFile[args[2]] = utilityFuncs.cloneObj(armorFile[args[0]])
                    delete armorFile[args[0]]
                }
                break;
            case 'cost':
            case 'currency':
                armorFile[args[0]].cost = Math.max(0, parseInt(args[2]));
                break;
            case 'element':
                if (!Elements.includes(args[2].toLowerCase())) return message.channel.send(`${args[2]} is not a valid element.`);
                armorFile[args[0]][editField] = args[2].toLowerCase();
                break;
            case 'end':
                armorFile[args[0]][editField] = parseInt(args[2])
                break;
            case 'skill':
                if (!skillFile[arg[2]]) return message.channel.send(`${args[2]} is not a valid skill.`);
                armorFile[args[0]].skill = args[2];
                break;
            case 'image':
                if (!checkImage(message, args[2], message.attachments.first())) return message.channel.send(`${args[2]} is not a valid image.`);
                armorFile[args[0]].image = checkImage(message, args[2], message.attachments.first())
                break;
            default:
                return message.channel.send(`${args[1]} is not a valid field.`);
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armors.json`, JSON.stringify(armorFile, null, 4));
        message.react('👍');
    }
})

commands.purgearmor = new Command({
    desc: `Purges an armor of your choice. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
    section: 'items',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (!armorFile[args[0]]) return message.channel.send(`${args[0]} is not a valid armor name.`);

        if (armorFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this armor, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${armorFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this armor.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${armorFile[args[0]].name} has been erased from existance. The loot and chests that have this armor should be checked in order to ensure that they do not have an invalid armor.`)
                    delete armorFile[args[0]]

                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armors.json`, JSON.stringify(armorFile, null, 4));
                } else
                    message.channel.send(`${armorFile[args[0]].name} will not be deleted.`);

                    givenResponce = true
                    collector.stop()
                }
            });
            collector.on('end', c => {
                if (givenResponce == false)
                    message.channel.send(`No response given.\n${armorFile[args[0]].name} will not be deleted.`);
            });
    }
})

commands.makeitemrecipe = new Command({
    desc: `Creates a recipe for an item.`,
    section: 'items',
    args: [
        {
            name: "Result Item",
            type: "Word",
            forced: true
        },
        {
            name: "Result Quantity",
            type: "Num",
            forced: true
        },
        {
            name: "Shapeless",
            type: "Word"
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        if (itemFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to assign a recipe to it.")

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");

        args[1] = Math.max(1, parseInt(args[1]));
        args[2] = (args[2] && (args[2] == 'true' || args[2] == 'yes' || args[2] == 'y' || args[2] == '1')) ? true : false

        const file = new Discord.MessageAttachment(`${dataPath}/images/Crafting_Grid.png`);
        const embed = new Discord.MessageEmbed()
            .setTitle(`${itemFile[args[0]].name} Crafting Recipe`)
            .setColor(0x00AE86)
            .setDescription(`How would you want people to craft this item? I'll give you tips.`)
            .addField("Placement", 'Top left grid is of ID 0, and it goes from left to right, top to bottom.', true)
            .addField("Quantity", `For each grid you can place only one item at a time.`, true)
            .addField("Shapeless", `If your craft is shapeless, the order doesn't matter.`, true)
            .addField("What to write", `*<Num: Placement #1> <Word: Item #1> {...}*\nFor each item, you need a placement number before it.`, true)
            .setThumbnail('attachment://Crafting_Grid.png')

        message.channel.send({embeds: [embed], files: [file]})

        let givenResponce = false
		let collector = message.channel.createMessageCollector({ time: 300000 });
		collector.on('collect', m => {
			if (m.author.id == message.author.id) {
                let margs = [...m.content.matchAll(/"([^"]*?)"|[^ ]+/gm)].map(el => el[1] || el[0] || "");
                let nums = []
                for (i in margs) {
                    if (i % 2 == 0) {
                        if (isNaN(margs[i])) { 
                            message.channel.send(`${margs[i]} is not a valid number.`);
                            givenResponce = true
				            collector.stop()
                            break;
                        } else {
                            margs[i] = Math.max(0, Math.min(8, parseInt(margs[i])))
                            nums.push(margs[i])
                        }
                    } else {
                        if (!itemFile[margs[i]]) {
                            message.channel.send(`${margs[i]} is not a valid item name.`);
                            givenResponce = true
                            collector.stop()
                            break;
                        }
                        if (margs[i] == args[0]) {
                            message.channel.send(`You cannot craft ${margs[i]} into itself.`);
                            givenResponce = true
                            collector.stop()
                            break;
                        }
                    }
                }
                if (margs.length % 2 == 1) {
                    message.channel.send(`You need to have an even number of arguments.`);
                    givenResponce = true
                    collector.stop()
                }
                if (nums.length != new Set(nums).size) {
                    message.channel.send(`You cannot place multiple items on the same grid.`);
                    givenResponce = true
                    collector.stop()
                }

                itemFile[args[0]].recipe = {
                    amount: args[1],
                    shapeless: args[2],
                    recipe: margs
                }

                fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));

                message.channel.send(`${itemFile[args[0]].name} has been given a crafting recipe.`)
                givenResponce = true
                collector.stop()
            }
		});
		collector.on('end', c => {
			if (givenResponce == false) message.channel.send(`No response given.\n${itemFile[args[0]].name} will not have a crafting recipe.`);
		});
    }
})

commands.clearitemrecipe = new Command({
    desc: `Clears a recipe for an item.`,
    section: 'items',
    args: [
        {
            name: "Item",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        if (itemFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to assign a recipe to it.")

        if (!itemFile[args[0]].recipe) return message.channel.send(`${itemFile[args[0]].name} does not have a crafting recipe.`);
        
        delete itemFile[args[0]].recipe

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));

        message.channel.send(`${itemFile[args[0]].name} has had its recipe cleared.`)
    }
})