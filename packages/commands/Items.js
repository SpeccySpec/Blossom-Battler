function getRecipe(itemDefs) {
    let finalText = '';

    if (itemDefs.recipe) { 
        finalText += `Can be ${itemDefs.recipe.shapeless ? `**shapelessly**` : ``} crafted from:\n`;
        let itemTxt = {}
        for (const i in itemDefs.recipe.recipe) {
            const item = Object.values(itemDefs.recipe.recipe[i])[0];
            if (!itemTxt[item]) itemTxt[item] = 0;
            itemTxt[item] += 1;
        }
        for (let i in itemTxt) {
            finalText += `- **${itemTxt[i]}x** ${i}\n`;
        }
    }

    return finalText;
}

function itemDesc(itemDefs, itemName, message) {
    let finalText = "";

    if (itemDefs.cost && itemDefs.cost != 0) {
        finalText += `Costs **${itemDefs.cost}** ${getCurrency(message.guild.id)}s\n`;
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

    finalText += getRecipe(itemDefs)

    finalText += '\n'
    
    if (itemDefs.desc)
		finalText += `\n*${itemDefs.desc}*`;

    let userTxt = getServerUser(itemDefs.originalAuthor, message);

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
        finalText += `Costs **${weaponDefs.cost}** ${getCurrency(message.guild.id)}s\n`;
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

    finalText += getRecipe(weaponDefs)

    finalText += '\n'

    if (weaponDefs.desc)
        finalText += `\n*${weaponDefs.desc}*`;

    let userTxt = getServerUser(weaponDefs.originalAuthor, message);

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
        finalText += `Costs **${armorDefs.cost}** ${getCurrency(message.guild.id)}s\n`;
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

    finalText += getRecipe(armorDefs)

    finalText += '\n'

    if (armorDefs.desc)
        finalText += `\n*${armorDefs.desc}*`;

    let userTxt = getServerUser(armorDefs.originalAuthor, message);

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
    aliases: ['makeitem', 'regitem'],
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
    checkban: true,
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (itemFile[args[0]] && itemFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("This item exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

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
			case 'healall':
			case 'healallmp':
            case 'healhpmp':
                amount = args[4] && parseInt(args[4]) ? parseInt(args[4]) : 40;
                break;
            case 'healallhpmp':
                amount = args[4] && parseInt(args[4]) ? parseInt(args[4]) : 25;
                break;
            case 'revive':
                amount = args[4] && parseInt(args[4]) ? parseInt(args[4]) : 2;
                break;
            case 'pacify':
                amount = args[4] && parseInt(args[4]) ? Math.max(0, Math.min(parseInt(args[4]), 100)) : 30;
                break;

			default:
				return message.channel.send("Invalid item type!");
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
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
    ],
    func: (message, args) => {
        let array = []
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        const validTypes = ['user', 'rarity', 'cost', 'skill', 'heal', 'healmp', 'healhpmp', 'revive', 'pacify', 'material', 'recipe']
        
        if (args[0]) {
			if (args.length % 2 != 0) {
				//check if the last argument exists in validTypes
				if (validTypes.includes(args[args.length - 1])) {
					return message.channel.send(`The **${args[args.length - 1]}** type is missing a variable.`);
				} else {
					return message.channel.send(`**${args[args.length - 1].charAt(0).toUpperCase() + args[args.length - 1].slice(1)}** is invalid! Valid types are: \n -\`${validTypes.join('\`\n -\`')}\``);
				}
			}

			for (i in args) {
				if (i % 2 == 1) {
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message)
					if (!thingy) return
					if (thingy == 'disabled') {
						args[i-1] = '';
						args[i] = '';
					}
				}
			}
			args = args.filter(arg => arg != '');
			
			for (i in args) {
				if (i % 2 == 0) {
					if (args.filter(arg => arg == args[i]).length > 1) {
						return message.channel.send('You cannot have multiple of the same type.');
					}
				}
			}
		}

        for (let item in itemFile) {
            let isConditionMet = true;
            for (a in args) {
                if (a % 2 == 1) {
                    switch (args[a-1].toLowerCase()) {
                        case 'user':
                            args[a] = args[a].toLowerCase();
                            if (args[a].startsWith('<@') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(2, -1));
                                args[a] = user.id;
                            } else if (args[a].startsWith('<@!') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(3, -1));
                                args[a] = user.id;
                            }
                            if (!args[a].includes('@') && message.mentions.members.size == 0) {
                                let user = message.guild.members.cache.find(m => m.id == args[a]);
                                args[a] = user.id;
                            }
                            if (message.mentions.members.size > 0) {
                                args[a] = message.mentions.members.first().id;
                            }

                            isConditionMet = (itemFile[item].originalAuthor == args[a])
                            break;
                        case 'rarity':
                            args[a] = args[a].toLowerCase();
                            isConditionMet = (itemFile[item].rarity == args[a])
                            break;
                        case 'cost':
                            args[a] = parseInt(args[a]);
                            isConditionMet = (itemFile[item].cost == args[a])
                            break;
                        case 'skill':
                        case 'heal':
                        case 'healmp':
                        case 'healhpmp':
                        case 'revive':
                        case 'pacify':
                        case 'material':
                            if (args[a].toString().toLowerCase() == 'true') {
                                isConditionMet = (itemFile[item].type == args[a-1])
                            } else if (args[a].toString().toLowerCase() == 'false') {
                                isConditionMet = (!itemFile[item].type == args[a-1])
                            } else {
                                if (args[a-1] == 'material') {
                                    args[a] = args[a].toString().toLowerCase() == 'true' || args[a].toString().toLowerCase() == 'yes' || args[a].toString().toLowerCase() == 'y' || args[a].toString().toLowerCase() == '1'
                                    //isConditionMet = ((itemFile[item].type == 'material') == args[a])
                                    if (args[a] == true) {
                                        isConditionMet = (itemFile[item].type == 'material')
                                    } else {
                                        isConditionMet = (!itemFile[item].type == 'material')
                                    }
                                } else {
                                    if (args[a-1] != 'skill') args[a] = parseInt(args[a]);
                                    isConditionMet = (itemFile[item].type == [args[a-1]] && itemFile[item][args[a-1]] == args[a])
                                }
                            }
                            break;
                        case 'recipe':
                            args[a] = args[a].toString().toLowerCase() == 'true' || args[a].toString().toLowerCase() == 'yes' || args[a].toString().toLowerCase() == 'y' || args[a].toString().toLowerCase() == '1'
                            if (args[a] == true) {
                                isConditionMet = (itemFile[item].recipe)
                            } else {
                                isConditionMet = (!itemFile[item].recipe)
                            }
                            break;
                    }
                    if (isConditionMet == false || isConditionMet == undefined) break;
                }
            }
            if (isConditionMet == false || isConditionMet == undefined) continue;

            array.push({title: `${itemFile[item].rarity != 'none' ? itemRarityEmoji[itemFile[item].rarity] : ''}${itemTypeEmoji[itemFile[item].type]}${itemFile[item].name} (${item})`, desc: `${itemFile[item].cost} cost`});
        }

        if (array.length == 0) return message.channel.send(`No items found.`);

        listArray(message.channel, array, message.author.id);
    }
})

commands.purgeitem = new Command({
    desc: `Purges an item of your choice. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
    section: 'items',
    aliases: ['unregisteritem', 'itempurge', 'itemunregister', 'deleteitem', 'itemdelete'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    checkban: true,
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);

        if (itemFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${itemFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this item.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${itemFile[args[0]].name} has been erased from existance. The loot and chests that have this item should be checked in order to ensure that they do not have an invalid item.`)
                    delete itemFile[args[0]]

                    let warningText = {}

                    warningText['item recipes'] = ''
                    for (let item in itemFile) {
                        if (itemFile[item].recipe) {
                            if (itemFile[item].recipe.recipe.includes(args[0])) {
                                warningText['item recipes'] += `- ${itemFile[item].name}\n`
                            }
                            for (const i in itemFile[item].recipe.recipe) {
                                if (itemFile[item].recipe.recipe[i] == args[0]) {
                                    itemFile[item].recipe.recipe[i] = ''
                                    itemFile[item].recipe.recipe[i-1] = ''
                                }
                            }
                        }
                        itemFile[item].recipe.recipe.filter(a => (a != ''))
                    }
                    weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
                    armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armor.json`)

                    warningText['weapon recipes'] = ''
                    for (let item in weaponFile) {
                        if (weaponFile[item].recipe) {
                            if (weaponFile[item].recipe.recipe.includes(args[0])) {
                                warningText['weapon recipes'] += `- ${weaponFile[item].name}\n`
                            }
                            for (const i in weaponFile[item].recipe.recipe) {
                                if (weaponFile[item].recipe.recipe[i] == args[0]) {
                                    weaponFile[item].recipe.recipe[i] = ''
                                    weaponFile[item].recipe.recipe[i-1] = ''
                                }
                            }
                        }
                        weaponFile[item].recipe.recipe.filter(a => (a != ''))
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile))

                    warningText['armor recipes'] = ''
                    for (let item in armorFile) {
                        if (armorFile[item].recipe) {
                            if (armorFile[item].recipe.recipe.includes(args[0])) {
                                warningText['armor recipes'] += `- ${armorFile[item].name}\n`
                            }
                            for (const i in armorFile[item].recipe.recipe) {
                                if (armorFile[item].recipe.recipe[i] == args[0]) {
                                    armorFile[item].recipe.recipe[i] = ''
                                    armorFile[item].recipe.recipe[i-1] = ''
                                }
                            }
                        }
                        armorFile[item].recipe.recipe.filter(a => (a != ''))
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armor.json`, JSON.stringify(armorFile))

                    let warning = '**WARNING:**'
                    for (let type in warningText) {
                        if (warningText[type] != '') {
                            warning += `\nThe following ${type} have recipes that use this item:\n${warningText[type]}\n so they were removed.`
                        }
                    }
                    if (warning != '**WARNING:**') message.channel.send(warning)

                    warning = ''
                    warningText = {}
                    warningText['loot'] = ''
                    lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
                    for (let item in lootFile) {
                        for (const i in lootFile[item].items) {
                            if (lootFile[item].items[i].id == args[0] && lootFile[item].items[i].type == 'item') {
                                lootFile[item].items[i] = ''
                            }
                        }
                        if (lootFile[item].items.includes('')) warningText['loot'] += `- ${lootFile[item].name}\n`

                        lootFile[item].items.filter(a => (a != ''))
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile))

                    warningText['chests'] = ''
                    chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
                    for (let channel in chestFile) {
                        for (let chest in chestFile[channel]) {
                            if (chestFile[channel][chest].items && chestFile[channel][chest].items['item']) {
                                for (let item in chestFile[channel][chest].items['item']) {
                                    if (item = args[0]) {
                                        warningText['chests'] += `- ${chestFile[channel][chest].name}\n`
                                        delete chestFile[channel][chest].items['item'][item]
                                    }
                                }
                                if (Object.keys(chestFile[channel][chest].items['item']).length == 0) {
                                    delete chestFile[channel][chest].items['item']
                                }
                            }
                            if (chestFile[channel][chest].lock[0] == 'item') {
                                if (chestFile[channel][chest].lock[1] == args[0]) {
                                    chestFile[channel][chest].lock = ['none', '0']
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));
                    
                    warningText['party items'] = ''
                    partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/party.json`)
                    for (let party in partyFile) {
                        if (partyFile[party].items[args[0]]) {
                            delete partyFile[party].items[args[0]]
                            warningText['party items'] += `- ${party}\n`
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/party.json`, JSON.stringify(partyFile, null, 4));

                    for (let type in warningText) {
                        if (warningText[type] != '') {
                            warning += `\nThe following ${type} have the item in use:\n${warningText[type]}\nso it was removed from them.`
                        }
                    }
                    if (warning != '') message.channel.send(warning)

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
    aliases: ['changeitem', 'itemedit', 'itemchange'],
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
    checkban: true,
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)

        if (!itemFile[args[0]]) return message.channel.send(`${args[0]} is not a valid item name.`);
        if (itemFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send(`You cannot edit ${args[0]}.`);

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
                    if (args[0] == args[2]) return message.channel.send(`What's the point...?`);
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

                    weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
                    armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armor.json`)

                    for (let item in weaponFile) {
                        if (weaponFile[item].recipe) {
                            for (const i in weaponFile[item].recipe.recipe) {
                                if (weaponFile[item].recipe.recipe[i] == args[0]) {
                                    weaponFile[item].recipe.recipe[i] = args[2]
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile, null, 4));

                    for (let item in armorFile) {
                        if (armorFile[item].recipe) {
                            for (const i in armorFile[item].recipe.recipe) {
                                if (armorFile[item].recipe.recipe[i] == args[0]) {
                                    armorFile[item].recipe.recipe[i] = args[2]
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armor.json`, JSON.stringify(armorFile, null, 4));

                    lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
                    for (let item in lootFile) {
                        if (lootFile[item].items) {
                            if (lootFile[item].items[i].type == 'item' && lootFile[item].items[i].id == args[0]) {
                                lootFile[item].items[i].id = args[2]
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4));

                    chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
                    for (let channel in chestFile) {
                        for (let chest in chestFile[channel]) {
                            if (chestFile[channel][chest].items && chestFile[channel][chest].items['item']) {
                                for (let item in chestFile[channel][chest].items['item']) {
                                    if (item = args[0]) {
                                        chestFile[channel][chest].items['item'][args[2]] = chestFile[channel][chest].items['item'][item]
                                        delete chestFile[channel][chest].items['item'][item]
                                    }
                                }
                            }
                            if (chestFile[channel][chest].lock[0] == 'item') {
                                if (chestFile[channel][chest].lock[1] == args[0]) {
                                    chestFile[channel][chest].lock[1] = args[2]
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));

                    partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/party.json`)
                    for (let party in partyFile) {
                        if (partyFile[party].items[args[0]]) {
                            partyFile[party].items[args[2]] = partyFile[party].items[args[0]]
                            delete partyFile[party].items[args[0]]
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/party.json`, JSON.stringify(partyFile, null, 4));
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
        
        listArray(message.channel, array, message.author.id);
    }
})

commands.randitem = new Command({
    desc: `Get a random item.`,
    section: "roll",
    aliases: ['randomitem'],
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
    section: "roll",
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
    checkban: true,
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

commands.registerweapon = new Command({
    desc: 'Creates a weapon to be equipped. They can be used in battle to grant certain effects or restore health.',
    section: 'items',
    aliases: ['makeweapon', 'regweapon'],
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
    checkban: true,
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (weaponFile[args[0]] && weaponFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("This weapon exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

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
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
    ],
    func: (message, args) => {
        let array = []
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        const validTypes = ['user', 'element', 'cost', 'skill', 'melee', 'atk', 'mag', 'recipe']
        
        if (args[0]) {
			if (args.length % 2 != 0) {
				//check if the last argument exists in validTypes
				if (validTypes.includes(args[args.length - 1])) {
					return message.channel.send(`The **${args[args.length - 1]}** type is missing a variable.`);
				} else {
					return message.channel.send(`**${args[args.length - 1].charAt(0).toUpperCase() + args[args.length - 1].slice(1)}** is invalid! Valid types are: \n -\`${validTypes.join('\`\n -\`')}\``);
				}
			}

			for (i in args) {
				if (i % 2 == 1) {
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message)
					if (!thingy) return
					if (thingy == 'disabled') {
						args[i-1] = '';
						args[i] = '';
					}
				}
			}
			args = args.filter(arg => arg != '');
			
			for (i in args) {
				if (i % 2 == 0) {
					if (args.filter(arg => arg == args[i]).length > 1) {
						return message.channel.send('You cannot have multiple of the same type.');
					}
				}
			}
		}

        for (let weapon in weaponFile) {
            let isConditionMet = true;
            for (a in args) {
                if (a % 2 == 1) {
                    switch (args[a-1].toLowerCase()) {
                        case 'user':
                            args[a] = args[a].toLowerCase();
                            if (args[a].startsWith('<@') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(2, -1));
                                args[a] = user.id;
                            } else if (args[a].startsWith('<@!') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(3, -1));
                                args[a] = user.id;
                            }
                            if (!args[a].includes('@') && message.mentions.members.size == 0) {
                                let user = message.guild.members.cache.find(m => m.id == args[a]);
                                args[a] = user.id;
                            }
                            if (message.mentions.members.size > 0) {
                                args[a] = message.mentions.members.first().id;
                            }

                            isConditionMet = (weaponFile[weapon].originalAuthor == args[a])
                            break;
                        case 'cost':
                            args[a] = parseInt(args[a]);
                            isConditionMet = (weaponFile[weapon].cost == args[a])
                            break;
                        case 'element':
                            args[a] = args[a].toLowerCase();
                            isConditionMet = (weaponFile[weapon].element == args[a])
                            break;
                        case 'skill':
                        case 'melee':
                        case 'atk':
                        case 'mag':
                            if (args[a].toString().toLowerCase() == 'true') {
                                isConditionMet = (weaponFile[weapon][args[a-1]])
                            } else if (args[a].toString().toLowerCase() == 'false') {
                                isConditionMet = (!weaponFile[weapon][args[a-1]])
                            } else {
                                if (args[a-1] != 'skill') args[a] = parseInt(args[a]);
                                isConditionMet = (weaponFile[weapon][args[a-1]] == args[a])
                            }
                            break;
                        case 'recipe':
                            args[a] = args[a].toString().toLowerCase() == 'true' || args[a].toString().toLowerCase() == 'yes' || args[a].toString().toLowerCase() == 'y' || args[a].toString().toLowerCase() == '1'
                            if (args[a] == true) {
                                isConditionMet = (weaponFile[weapon].recipe)
                            } else {
                                isConditionMet = (!weaponFile[weapon].recipe)
                            }
                            break;
                    }
                    if (isConditionMet == false || isConditionMet == undefined) break;
                }
            }
            if (isConditionMet == false || isConditionMet == undefined) continue;

            array.push({title: `${elementEmoji[weaponFile[weapon].element]} ${weaponFile[weapon].name} (${weapon})`, desc: `${weaponFile[weapon].melee && weaponFile[weapon].melee != 0 ? weaponFile[weapon].melee : `???`} Power Melee Attack`});
        }

        if (array.length == 0) return message.channel.send(`No weapons found.`);

        listArray(message.channel, array, message.author.id);
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
            if (weaponFile[weapon].name.includes(args[0]) || weapon.includes(args[0])) {
                array.push({title: `${elementEmoji[weaponFile[weapon].element]} ${weaponFile[weapon].name} (${weapon})`, desc: `${weaponFile[weapon].melee && weaponFile[weapon].melee != 0 ? weaponFile[weapon].melee : `???`} Power Melee Attack`});
            }
        }

        if (array.length == 0) return message.channel.send(`No weapons found with the phrase ${args[0]}.`);

        listArray(message.channel, array, message.author.id);
    }
})

commands.randweapon = new Command({
    desc: 'Gets a random weapon.',
    section: "roll",
    aliases: ['randomweapon'],
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
    section: "roll",
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
    checkban: true,
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
    aliases: ['weaponedit', 'changeweapon', 'weaponchange'],
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
    checkban: true,
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (!weaponFile[args[0]]) return message.channel.send(`${args[0]} is not a valid weapon.`);
        if (weaponFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send(`You cannot edit ${args[0]}.`);

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
                    if (args[0] == args[2]) return message.channel.send(`What's the point...?`);
                    weaponFile[args[2]] = utilityFuncs.cloneObj(weaponFile[args[0]])
                    delete weaponFile[args[0]]

                    lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
                    for (let item in lootFile) {
                        if (lootFile[item].items) {
                            if (lootFile[item].items[i].type == 'weapon' && lootFile[item].items[i].id == args[0]) {
                                lootFile[item].items[i].id = args[2]
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4));

                    chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
                    for (let channel in chestFile) {
                        for (let chest in chestFile[channel]) {
                            if (chestFile[channel][chest].items && chestFile[channel][chest].items['weapon']) {
                                for (let item in chestFile[channel][chest].items['weapon']) {
                                    if (item = args[0]) {
                                        chestFile[channel][chest].items['weapon'][args[2]] = chestFile[channel][chest].items['weapon'][item]
                                        delete chestFile[channel][chest].items['weapon'][item]
                                    }
                                }
                            }
                            if (chestFile[channel][chest].lock[0] == 'weapon') {
                                if (chestFile[channel][chest].lock[1] == args[0]) {
                                    chestFile[channel][chest].lock[1] = args[2]
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));

                    partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/party.json`)
                    for (let party in partyFile) {
                        if (partyFile[party].weapons[args[0]]) {
                            partyFile[party].weapons[args[2]] = partyFile[party].weapons[args[0]]
                            delete partyFile[party].weapons[args[0]]
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/party.json`, JSON.stringify(partyFile, null, 4));
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

commands.purgeweapon = new Command({
    desc: `Purges a weapon of your choice. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
    section: 'items',
    aliases: ['weaponpurge', 'unregisterweapon', 'weaponunregister', 'deleteweapon', 'weapondelete'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    checkban: true,
    func: (message, args) => {
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)

        if (!weaponFile[args[0]]) return message.channel.send(`${args[0]} is not a valid weapon name.`);

        if (weaponFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this weapon, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${weaponFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this weapon.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${weaponFile[args[0]].name} has been erased from existance. The loot and chests that have this weapon should be checked in order to ensure that they do not have an invalid weapon.`)
                    delete weaponFile[args[0]]

                    let warning = '**WARNING**'
                    let warningText = {}

                    warningText['loot'] = ''
                    warningText['chests'] = ''
                    lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
                    chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
                    for (let item in lootFile) {
                        for (const i in lootFile[item].items) {
                            if (lootFile[item].items[i].id == args[0] && lootFile[item].items[i].type == 'weapon') {
                                lootFile[item].items[i] = ''
                            }
                        }
                        if (lootFile[item].items.includes('')) warningText['loot'] += `- ${lootFile[item].name}\n`

                        lootFile[item].items.filter(a => (a != ''))
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile))

                    for (let channel in chestFile) {
                        for (let chest in chestFile[channel]) {
                            if (chestFile[channel][chest].items && chestFile[channel][chest].items['weapon']) {
                                for (let item in chestFile[channel][chest].items['weapon']) {
                                    if (item = args[0]) {
                                        warningText['chests'] += `- ${chestFile[channel][chest].name}\n`
                                        delete chestFile[channel][chest].items['weapon'][item]
                                    }
                                }
                                if (Object.keys(chestFile[channel][chest].items['weapon']).length == 0) {
                                    delete chestFile[channel][chest].items['weapon']
                                }
                            }
                        }
                        if (chestFile[channel][chest].lock[0] == 'weapon') {
                            if (chestFile[channel][chest].lock[1] == args[0]) {
                                chestFile[channel][chest].lock = ['none', '']
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));

                    warningText['party weapons'] = ''
                    partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/party.json`)
                    for (let party in partyFile) {
                        if (partyFile[party].weapons[args[0]]) {
                            delete partyFile[party].weapons[args[0]]
                            warningText['party weapons'] += `- ${party}\n`
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/party.json`, JSON.stringify(partyFile, null, 4));

                    for (let type in warningText) {
                        if (warningText[type] != '') {
                            warning += `\nThe following ${type} have the weapon in use:\n${warningText[type]}\nso it was removed from them.`
                        }
                    }
                    if (warning != '**WARNING:**') message.channel.send(warning)

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


commands.registerarmor = new Command({
    desc: 'Creates an armor piece to be equipped. They can be used in battle to grant certain effects or restore health.',
    section: 'items',
    aliases: ['makearmor', 'regarmor'],
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
    checkban: true,
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (armorFile[args[0]] && armorFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("This armor exists already, and you do not own it, therefore, you have insufficient permissions to overwrite it.")

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
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
    ],
    func: (message, args) => {
        let array = []
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        const validTypes = ['user', 'element', 'cost', 'end', 'recipe']

        if (args[0]) {
			if (args.length % 2 != 0) {
				//check if the last argument exists in validTypes
				if (validTypes.includes(args[args.length - 1])) {
					return message.channel.send(`The **${args[args.length - 1]}** type is missing a variable.`);
				} else {
					return message.channel.send(`**${args[args.length - 1].charAt(0).toUpperCase() + args[args.length - 1].slice(1)}** is invalid! Valid types are: \n -\`${validTypes.join('\`\n -\`')}\``);
				}
			}

			for (i in args) {
				if (i % 2 == 1) {
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message)
					if (!thingy) return
					if (thingy == 'disabled') {
						args[i-1] = '';
						args[i] = '';
					}
				}
			}
			args = args.filter(arg => arg != '');
			
			for (i in args) {
				if (i % 2 == 0) {
					if (args.filter(arg => arg == args[i]).length > 1) {
						return message.channel.send('You cannot have multiple of the same type.');
					}
				}
			}
		}

        for (let armor in armorFile) {
            let isConditionMet = true;
            for (a in args) {
                if (a % 2 == 1) {
                    switch (args[a-1].toLowerCase()) {
                        case 'user':
                            args[a] = args[a].toLowerCase();
                            if (args[a].startsWith('<@') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(2, -1));
                                args[a] = user.id;
                            } else if (args[a].startsWith('<@!') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(3, -1));
                                args[a] = user.id;
                            }
                            if (!args[a].includes('@') && message.mentions.members.size == 0) {
                                let user = message.guild.members.cache.find(m => m.id == args[a]);
                                args[a] = user.id;
                            }
                            if (message.mentions.members.size > 0) {
                                args[a] = message.mentions.members.first().id;
                            }

                            isConditionMet = (armorFile[armor].originalAuthor == args[a])
                            break;
                        case 'cost':
                            args[a] = parseInt(args[a]);
                            isConditionMet = (armorFile[armor].cost == args[a])
                            break;
                        case 'element':
                            args[a] = args[a].toLowerCase();
                            isConditionMet = (armorFile[armor].element == args[a])
                            break;
                        case 'skill':
                        case 'end':
                            if (args[a].toString().toLowerCase() == 'true') {
                                isConditionMet = (armorFile[armor][args[a-1]])
                            } else if (args[a].toString().toLowerCase() == 'false') {
                                isConditionMet = (!armorFile[armor][args[a-1]])
                            } else {
                                if (args[a-1] != 'skill') args[a] = parseInt(args[a]);
                                isConditionMet = (armorFile[armor][args[a-1]] == args[a])
                            }
                            break;
                        case 'recipe':
                            args[a] = args[a].toString().toLowerCase() == 'true' || args[a].toString().toLowerCase() == 'yes' || args[a].toString().toLowerCase() == 'y' || args[a].toString().toLowerCase() == '1'
                            if (args[a] == true) {
                                isConditionMet = (armorFile[armor].recipe)
                            } else {
                                isConditionMet = (!armorFile[armor].recipe)
                            }
                            break;
                    }
                    if (isConditionMet == false || isConditionMet == undefined) break;
                }
            }
            if (isConditionMet == false || isConditionMet == undefined) continue;

            array.push({title: `${elementEmoji[armorFile[armor].element]} ${armorFile[armor].name} (${armor})`, desc: `Defensive Skill: ${armorFile[armor].skill && armorFile[armor].skill != '' ? armorFile[armor].skill : `None`}`});
        }

        if (array.length == 0) return message.channel.send(`No armors found.`);

        listArray(message.channel, array, message.author.id);
    }
})

commands.searcharmors = new Command({
    desc: 'Searches for armor with the given name.',
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
            if (armorFile[armor].name.includes(args[0]) || armor.includes(args[0])) {
                array.push({title: `${elementEmoji[armorFile[armor].element]} ${armorFile[armor].name} (${armor})`, desc: `Defensive Skill: ${armorFile[armor].skill && armorFile[armor].skill != '' ? armorFile[armor].skill : `None`}`});
            }
        }

        if (array.length == 0) return message.channel.send(`No armors found with the phrase ${args[0]}.`);

        listArray(message.channel, array, message.author.id);
    }
})

commands.randarmor = new Command({
    desc: 'Gets a random armor piece.',
    section: "roll",
    aliases: ['randomarmor'],
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
    section: "roll",
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
    checkban: true,
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
    aliases: ['armoredit', 'changearmor', 'armorchange'],
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
    checkban: true,
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (!armorFile[args[0]]) return message.channel.send(`${args[0]} is not a valid armor.`);
        if (armorFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send(`You cannot edit ${args[0]}.`);

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
                    if (args[0] == args[2]) return message.channel.send(`What's the point...?`);
                    armorFile[args[2]] = utilityFuncs.cloneObj(armorFile[args[0]])
                    delete armorFile[args[0]]

                    lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
                    for (let item in lootFile) {
                        if (lootFile[item].items) {
                            if (lootFile[item].items[i].type == 'armor' && lootFile[item].items[i].id == args[0]) {
                                lootFile[item].items[i].id = args[2]
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4));

                    chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
                    for (let channel in chestFile) {
                        for (let chest in chestFile[channel]) {
                            if (chestFile[channel][chest].items && chestFile[channel][chest].items['armor']) {
                                for (let item in chestFile[channel][chest].items['armor']) {
                                    if (item = args[0]) {
                                        chestFile[channel][chest].items['armor'][args[2]] = chestFile[channel][chest].items['armor'][item]
                                        delete chestFile[channel][chest].items['armor'][item]
                                    }
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));

                    partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/party.json`)
                    for (let party in partyFile) {
                        if (partyFile[party].armors[args[0]]) {
                            partyFile[party].armors[args[2]] = partyFile[party].armors[args[0]]
                            delete partyFile[party].armors[args[0]]
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/party.json`, JSON.stringify(partyFile, null, 4));
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
    aliases: ['armorpurge', 'unregisterarmor', 'armorunregister', 'deletearmor', 'armordelete'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    checkban: true,
    func: (message, args) => {
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        if (!armorFile[args[0]]) return message.channel.send(`${args[0]} is not a valid armor name.`);

        if (armorFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this armor, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${armorFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this armor.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${armorFile[args[0]].name} has been erased from existance. The loot and chests that have this armor should be checked in order to ensure that they do not have an invalid armor.`)
                    delete armorFile[args[0]]

                    let warning = '**WARNING**'
                    let warningText = {}

                    warningText['loot'] = ''
                    lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
                    for (let item in lootFile) {
                        for (const i in lootFile[item].items) {
                            if (lootFile[item].items[i].id == args[0] && lootFile[item].items[i].type == 'armor') {
                                lootFile[item].items[i] = ''
                            }
                        }
                        if (lootFile[item].items.includes('')) warningText['loot'] += `- ${lootFile[item].name}\n`

                        lootFile[item].items.filter(a => (a != ''))
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile))

                    warningText['chests'] = ''
                    chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
                    for (let channel in chestFile) {
                        for (let chest in chestFile[channel]) {
                            if (chestFile[channel][chest].items && chestFile[channel][chest].items['armor']) {
                                for (let item in chestFile[channel][chest].items['armor']) {
                                    if (item = args[0]) {
                                        warningText['chests'] += `- ${chestFile[channel][chest].name}\n`
                                        delete chestFile[channel][chest].items['armor'][item]
                                    }
                                }
                                if (Object.keys(chestFile[channel][chest].items['armor']).length == 0) {
                                    delete chestFile[channel][chest].items['armor']
                                }
                            }
                            if (chestFile[channel][chest].lock[0] == 'armor') {
                                if (chestFile[channel][chest].lock[1] == args[0]) {
                                    chestFile[channel][chest].lock = ['none', '']
                                }
                            }
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));

                    warningText['party armors'] = ''
                    partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/party.json`)
                    for (let party in partyFile) {
                        if (partyFile[party].armors[args[0]]) {
                            delete partyFile[party].armors[args[0]]
                            warningText['party armors'] += `- ${party}\n`
                        }
                    }
                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/party.json`, JSON.stringify(partyFile, null, 4));

                    for (let type in warningText) {
                        if (warningText[type] != '') {
                            warning += `\nThe following ${type} have the armor in use:\n${warningText[type]}\nso it was removed from them.`
                        }
                    }
                    if (warning != '**WARNING:**') message.channel.send(warning)

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

commands.makecraftingrecipe = new Command({
    desc: `Creates a recipe for an item.`,
    section: 'items',
    aliases: ['makerecipe', 'craftrecipe', 'makecraftrecipe', 'craftingrecipe'],
    args: [
        {
            name: "Result Type",
            type: "Word",
            forced: true
        },
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
    checkban: true,
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        let itemDefs

        if (args[0].toLowerCase() != 'item' && args[0].toLowerCase() != 'weapon' && args[0].toLowerCase() != 'armor') return message.channel.send(`${args[0]} is not a valid item type.`);

        switch (args[0].toLowerCase()) {
            case 'item':
                if (!itemFile[args[1]]) return message.channel.send(`${args[1]} is not a valid item name.`);
                if (itemFile[args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to assign a recipe to it.")
                itemDefs = itemFile[args[1]]
                break;
            case 'weapon':
                if (!weaponFile[args[1]]) return message.channel.send(`${args[1]} is not a valid weapon name.`);
                if (weaponFile[args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this weapon, therefore, you have insufficient permissions to assign a recipe to it.")
                itemDefs = weaponFile[args[1]]
                break;
            case 'armor':
                if (!armorFile[args[1]]) return message.channel.send(`${args[1]} is not a valid armor name.`);
                if (armorFile[args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this armor, therefore, you have insufficient permissions to assign a recipe to it.")
                itemDefs = armorFile[args[1]]
                break;
        }

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");

        args[2] = Math.max(1, args[2]);
        args[3] = (args[3] && (args[3] == 'true' || args[3] == 'yes' || args[3] == 'y' || args[3] == '1')) ? true : false

        const file = new Discord.MessageAttachment(`${dataPath}/images/Crafting_Grid.png`);
        const embed = new Discord.MessageEmbed()
            .setTitle(`${itemDefs.name} Crafting Recipe`)
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
                        if (margs[i] == args[1]) {
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

                let newRecipe = {}
                for (i in margs) {
                    if (i % 2 == 1) {
                        newRecipe[margs[i-1]] = margs[i]
                    }
                }

                for (i in itemFile) {
                    if (itemFile[i].recipe) {
                        if (itemFile[i].recipe.recipe == newRecipe) {
                            message.channel.send(`This crafting recipe is already in use by ${itemFile[i].name}.`);
                            givenResponce = true
                            collector.stop()
                            break;
                        }
                    }
                }
                for (i in weaponFile) {
                    if (weaponFile[i].recipe) {
                        if (weaponFile[i].recipe.recipe == newRecipe) {
                            message.channel.send(`This crafting recipe is already in use by ${weaponFile[i].name}.`);
                            givenResponce = true
                            collector.stop()
                            break;
                        }
                    }
                }
                for (i in armorFile) {
                    if (armorFile[i].recipe) {
                        if (armorFile[i].recipe.recipe == newRecipe) {
                            message.channel.send(`This crafting recipe is already in use by ${armorFile[i].name}.`);
                            givenResponce = true
                            collector.stop()
                            break;
                        }
                    }
                }

                itemDefs.recipe = {
                    amount: args[2],
                    shapeless: args[3],
                    recipe: newRecipe
                }

                switch (args[0].toLowerCase()) {
                    case 'item':
                        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/items.json`, JSON.stringify(itemFile, null, 4));
                        break;
                    case 'weapon':
                        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/weapons.json`, JSON.stringify(weaponFile, null, 4));
                        break;
                    case 'armor':
                        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/armor.json`, JSON.stringify(armorFile, null, 4));
                        break;
                }

                message.channel.send(`${itemDefs.name} has been given a crafting recipe.`)
                givenResponce = true
                collector.stop()
            }
		});
		collector.on('end', c => {
			if (givenResponce == false) message.channel.send(`No response given.\n${itemDefs.name} will not have a crafting recipe.`);
		});
    }
})

commands.clearitemrecipe = new Command({
    desc: `Clears a recipe for an item.`,
    section: 'items',
    aliases: ['clearrecipe', 'removerecipe'],
    args: [
        {
            name: 'Item Type',
            type: 'Word',
            forced: true
        },
        {
            name: "Item",
            type: "Word",
            forced: true
        }
    ],
    checkban: true,
    func: (message, args) => {
        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        let itemFiles = {
            item: itemFile,
            weapon: weaponFile,
            armor: armorFile
        }

        let itemDefs = null;
        if (!itemFiles[args[0].toLowerCase()][args[1]]) return message.channel.send(`${args[1]} is not a valid ${args[0]} name.`);
        if (itemFiles[args[0].toLowerCase()][args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this item, therefore, you have insufficient permissions to remove a recipe from it.")
        if (!itemFiles[args[0].toLowerCase()][args[1]].recipe) return message.channel.send(`${args[1]} does not have a recipe.`);
        itemDefs = itemFiles[args[0].toLowerCase()][args[1]]

        delete itemDefs.recipe

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${args[0].toLowerCase()}s.json`, JSON.stringify(itemFiles[args[0]], null, 4));

        message.channel.send(`${itemDefs.name} has had its crafting recipe removed.`)
    }
})

commands.obtainitems = new Command({
    desc: 'Obtain items/weapons/armor/currency/loot items to a party.',
    aliases: ['giveitem'],
    section: 'parties',
    checkban: true,
    args: [
        {
            name: 'Party Name',
            type: 'Word',
            forced: true
        },
        {
            name: "Items (Type, Item, Amount) #1",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    admin: "You don't have permission to give items to a party.",
    func: (message, args) => {
        let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
        let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`);
        let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`);
        let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`);
        let lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`);

        let itemFiles = {
            item: itemFile,
            weapon: weaponFile,
            armor: armorFile,
            loot: lootFile
        }

        if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party!`);
        let team = parties[args[0]];

        args.splice(0, 1)
        let itemCollector = []
        let itemErrors = []
        let itemCollectorIndex = 0

        while (args.length > 0) {
            itemCollector.push([args[0].toLowerCase(), args[1]])
            args.splice(0, 2)
            if (!isNaN(args[0]) && itemCollector[itemCollectorIndex][0] != 'money') {
                itemCollector[itemCollectorIndex].push(parseInt(args[0]))
                args.splice(0, 1)
            }
            itemCollectorIndex++
        }

        for (i in itemCollector) {
            switch (itemCollector[i][0]) {
                case 'item':
                case 'weapon':
                case 'armor':
                case 'loot':
                    if (!itemCollector[i][1] || !itemFiles[itemCollector[i][0]][itemCollector[i][1]]) {
                        itemErrors.push(`${itemCollector[i][1] ? `${itemCollector[i][1]} is not a valid ${itemCollector[i][0]} name.` : `You did not specify a name for the ${itemCollector[i][0]}.`}`);
                        itemCollector[i] = '-'
                    }
                    if (itemCollector[i][2]) {
                        if (!isNaN(itemCollector[i][2])) {
                            itemCollector[i][2] = Math.max(1, parseInt(itemCollector[i][2]))
                        } else {
                            itemCollector[i][2] = 1
                        }
                    }
                    break;
                case 'money':
                    if (!isNaN(itemCollector[i][1])) {
                        itemCollector[i][1] = Math.max(1, parseInt(itemCollector[i][1]))
                    } else {
                        itemErrors.push(`You did not specify a valid amount of money.`)
                        itemCollector[i] = '-'
                    }
                    break;
                default:
                    itemErrors.push(`${itemCollector[i][0]} is not a valid type.`)
                    itemCollector[i] = '-'
                    break;
            }
        }
        itemCollector = itemCollector.filter(item => item != '-')

        if (itemCollector.length == 0) return message.channel.send(`You did not specify anything to give to team ${team.name}. What went wrong:\n- ${itemErrors.join('\n- ')}`)

        for (i in itemCollector) {
            switch (itemCollector[i][0]) {
                case 'item':
                case 'weapon':
                case 'armor':
                    if (!team.items) team.items = {}
                    if (!team.items[itemCollector[i][1]]) team.items[itemCollector[i][1]] = 0
                    team.items[itemCollector[i][1]] += (itemCollector[i][2] ?? 1)

                    if (itemCollector[i][0] != 'item') {
                        if (!team[itemCollector[i][0]]+'s') team[itemCollector[i][0]+'s'] = {}
                        if (!team[itemCollector[i][0]+'s'][itemCollector[i][1]]) team[itemCollector[i][0]+'s'][itemCollector[i][1]] = objClone(itemFiles[itemCollector[i][0]][itemCollector[i][1]])
                    }
                    break;
                case 'loot':
                    let loot = lootFile[itemCollector[i][1]].items
                    for (j in loot) {
                        if (!team.items) team.items = {}
                        if (!team.items[loot[j].id]) team.items[loot[j].id] = 0
                        team.items[loot[j].id] += loot[j].amount * (itemCollector[i][2] ?? 1)

                        if (['weapon','armor'].includes(loot[j].type)) {
                            if (!team[loot[j].type+'s']) team[loot[j].type+'s'] = {}
                            if (!team[loot[j].type+'s'][loot[j].id]) team[loot[j].type+'s'][loot[j].id] = objClone(itemFiles[loot[j].type][loot[j].id])
                        }
                    }
                    break;
                case 'money':
                    if (!team.currency) team.currency = 0
                    team.currency += itemCollector[i][1]
                    break;
            }
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
        message.channel.send(`Team ${team.name} has been given the items.`)
    }
})

commands.removepartyitems = new Command({
    desc: 'Remove items from a party.',
    aliases: ['removepartyitem'],
    section: 'parties',
    checkban: true,
    args: [
        {
            name: 'Party Name',
            type: 'Word',
            forced: true
        },
        {
            name: "Items (Type, Item, Amount) #1",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    admin: "You don't have permission to remove items from a party.",
    func: (message, args) => {
        let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
        let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`);
        let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`);
        let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`);

        let itemFiles = {
            item: itemFile,
            weapon: weaponFile,
            armor: armorFile,
        }

        if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party!`);
        let team = parties[args[0]];

        args.splice(0, 1)
        let itemCollector = []
        let itemErrors = []
        let itemCollectorIndex = 0

        while (args.length > 0) {
            if (args[0].toLowerCase() != 'all') {
                itemCollector.push([args[0].toLowerCase(), args[1]])
                args.splice(0, 2)
                if (!isNaN(args[0])) {
                    itemCollector[itemCollectorIndex].push(parseInt(args[0]))
                    args.splice(0, 1)
                }
            } else {
                itemCollector.push(['all'])
                args.splice(0, 1)
            }
            itemCollectorIndex++
        }

        for (i in itemCollector) {
            switch (itemCollector[i][0]) {
                case 'item':
                case 'weapon':
                case 'armor':
                    if (!itemCollector[i][1] || ([itemCollector[i][1]].toLowerCase() != 'all' && !itemFiles[itemCollector[i][0]][itemCollector[i][1]])) {
                        itemErrors.push(`${itemCollector[i][1] ? `${itemCollector[i][1]} is not a valid ${itemCollector[i][0]} name.` : `You did not specify a name for the ${itemCollector[i][0]}.`}`);
                        itemCollector[i] = '-'
                    }
                    if (itemCollector[i][2]) {
                        if (!isNaN(itemCollector[i][2])) {
                            itemCollector[i][2] = Math.max(1, parseInt(itemCollector[i][2]))
                        } else {
                            itemCollector[i][2] = 1
                        }
                    }
                    break;
                case 'all':
                    break;
                default:
                    itemErrors.push(`${itemCollector[i][0]} is not a valid type.`)
                    itemCollector[i] = '-'
                    break;
            }
        }
        itemCollector = itemCollector.filter(item => item != '-')

        if (itemCollector.length == 0) return message.channel.send(`You did not specify anything to remove from team ${team.name}. What went wrong:\n- ${itemErrors.join('\n- ')}`)

        for (i in itemCollector) {
            switch (itemCollector[i][0]) {
                case 'item':
                    if (itemCollector[i][1] == 'all') {
                        team.items = {}
                    } else {
                        team.items[itemCollector[i][1]] -= (itemCollector[i][2] ?? 1)
                    }
                    if (team.items[itemCollector[i][1]] <= 0) delete team.items[itemCollector[i][1]]
                    break;
                case 'weapon':
                case 'armor':
                    for (j in team[itemCollector[i][0]+'s']) {
                        if (team.items[j]) {
                            team.items[j] -= (itemCollector[i][2] ?? 1)
                            if (team.items[j] <= 0) { 
                                delete team.items[j]
                                delete team[itemCollector[i][0]+'s'][j]
                            }
                        }
                    }
                    break;
                case 'all':
                    team.items = {}
                    team.weapons = {}
                    team.armors = {}
                    break;
            }
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
        message.channel.send(`${args[0]} has the items specified removed.`)
    }
})

commands.transferitems = new Command({
    desc: 'Transfer items from one party to another.',
    aliases: ['transferitem'],
    section: 'parties',
    checkban: true,
    args: [
        {
            name: 'Party Name',
            type: 'Word',
            forced: true
        },
        {
            name: 'Party Name',
            type: 'Word',
            forced: true
        },
        {
            name: "Items (Type, Item, Amount) #1",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    func: (message, args) => {
        let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
        let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`);
        let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`);
        let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`);

        if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party!`);
        if (!parties[args[1]]) return message.channel.send(`${args[1]} is not a valid party!`);

        if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot give items to another party.")

        party1 = args[0]
        party2 = args[1]

        args.splice(0, 2)
        const validTypes = ['item', 'weapon', 'armor', 'money']
        let itemsDef = []

        let type

        if (args.length % 3 != 0) return message.channel.send(`You didn't write the correct amount of fields.`)

        if (args[0].toLowerCase() != 'all') {
            for (i in args) {
                if (i % 3 == 0) {
                    if (!validTypes.includes(args[i])) return message.channel.send(`${args[i]} is not a valid item type. Valid types are: \n- ${validTypes.join('\n- ')}`)
                    if (!parties[party1][args[i].toLowerCase()+'s']) return message.channel.send(`${party1} does not have any ${args[i].toLowerCase()}s.`)
                    type = args[i].toLowerCase();
                }
                if (type != 'loot' && type != 'money') {
                    if (i % 3 == 1) {
                        itemsDef[i-1] = args[i-1].toLowerCase()

                        if (args[i].toLowerCase() != 'all') {
                            if (args[i-1].toLowerCase() == "item") {
                                if (!itemFile[args[i]]) return message.channel.send(`${args[i]} is not a valid item.`)
                                if (!parties[party1][type+'s'][args[i]]) return message.channel.send(`${party1} doesn't have ${args[i]}!`)
                            }
                            else if (args[i-1].toLowerCase() == "weapon") {
                                if (!weaponFile[args[i]]) return message.channel.send(`${args[i]} is not a valid weapon.`)
                                if (!parties[party1][type+'s'][args[i]]) return message.channel.send(`${party1} doesn't have ${args[i]}!`)
                            }
                            else if (args[i-1].toLowerCase() == "armor") {
                                if (!armorFile[args[i]]) return message.channel.send(`${args[i]} is not a valid armor.`)
                                if (!parties[party1][type+'s'][args[i]]) return message.channel.send(`${party1} doesn't have ${args[i]}!`)
                            }
                        }
                        itemsDef[i] = args[i]
                    }
                    if (i % 3 == 2) {
                        if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                        itemsDef[i] = Math.max(1, parseInt(args[i]))
                    }
                } else {
                    if (i % 3 == 1) {
                        if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                        itemsDef[i-1] = args[i-1].toLowerCase()
                        itemsDef[i] = Math.max(0, parseInt(args[i]))
                        if (!parties[party1].currency || parties[party1].currency < itemsDef[i]) return message.channel.send(`${party1} doesn't have enough currency!`)
                    }
                    if (i % 3 == 2) {
                        itemsDef[i] = '-'
                    }
                }
            }
        }

        if (isPartyLeader(message.author, parties[party2], message.guild.id) || utilityFuncs.isAdmin(message)) {
            transfer(message, party1, party2, itemsDef)
        } else {
            let secondLeader = partyLeader(parties[party2], message.guild.id)
            let givenResponce = false
            //ask for confirmation
            message.channel.send(`${message.author.username} wants to transfer items to ${party2}.\n<@${secondLeader}>, do you want to accept this transfer?\n**Y/N**`)
            const collector = message.channel.createMessageCollector({ time: 15000 });
            collector.on('collect', m => {
                if (m.author.id == secondLeader) {
                    if (m.content.toLowerCase() == 'true' || m.content.toLowerCase() == 'yes' || m.content.toLowerCase() == 'y' || m.content.toLowerCase() == '1') {
                        givenResponce = true
                        transfer(message, party1, party2, itemsDef)
                        collector.stop()
                    } else {
                        message.channel.send(`The transfer has been rejected.`)
                        givenResponce = true
                        collector.stop()
                    }
                }
            })
            collector.on('end', collected => {
                if (!givenResponce) {
                    message.channel.send(`The transfer has been rejected.`)
                }
            })
        }
    }
})

function transfer(message, party1, party2, itemsDef) {
    let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

    for (i in itemsDef) {
        if (itemsDef[0].toLowerCase() != 'all') {
            if (itemsDef[i-1].toLowerCase() != 'money') {
                if (i % 3 == 2) {
                    if (itemsDef[i-1].toLowerCase() != 'all') {
                        itemsDef[i] = Math.min(parties[party1][itemsDef[i-2]+"s"][itemsDef[i-1]], itemsDef[i])
                        if (parties[party1][itemsDef[i-2]+"s"][itemsDef[i-1]]) {
                            parties[party1][itemsDef[i-2]+"s"][itemsDef[i-1]] -= itemsDef[i]

                            if (parties[party1][itemsDef[i-2]+"s"][itemsDef[i-1]] <= 0) {
                                delete parties[party1][itemsDef[i-2]+"s"][itemsDef[i-1]]
                            }

                            if (!parties[party2][itemsDef[i-2]+"s"][itemsDef[i-1]]) {
                                parties[party2][itemsDef[i-2]+"s"][itemsDef[i-1]] = 0
                            }
                            parties[party2][itemsDef[i-2]+"s"][itemsDef[i-1]] += itemsDef[i]
                        }
                    } else {
                        for (j in parties[party1][itemsDef[i-2]+'s']) {
                            if (!parties[party2][itemsDef[i-2]+'s'][j]) {
                                parties[party2][itemsDef[i-2]+'s'][j] = 0
                            }
                            parties[party2][itemsDef[i-2]+'s'][j] += parties[party1][itemsDef[i-2]+'s'][j]
                            delete parties[party1][itemsDef[i-2]+'s'][j]
                        }
                    }
                }
            } else {
                if (i % 3 == 1) {
                    if (parties[party1].currency) {
                        parties[party2].currency += itemsDef[i]
                        parties[party1].currency -= itemsDef[i]
                    }
                }
            }
        } else {
            for (j in parties[party1]['items']) {
                if (!parties[party2]['items'][j]) {
                    parties[party2]['items'][j] = 0
                }
                parties[party2]['items'][j] += parties[party1]['items'][j]
                delete parties[party1]['items'][j]
            }
            for (j in parties[party1]['weapons']) {
                if (!parties[party2]['weapons'][j]) {
                    parties[party2]['weapons'][j] = 0
                }
                parties[party2]['weapons'][j] += parties[party1]['weapons'][j]
                delete parties[party1]['weapons'][j]
            }
            for (j in parties[party1]['armors']) {
                if (!parties[party2]['armors'][j]) {
                    parties[party2]['armors'][j] = 0
                }
                parties[party2]['armors'][j] += parties[party1]['armors'][j]
                delete parties[party1]['armors'][j]
            }

            if (parties[party1].currency) {
                parties[party2].currency += parties[party1].currency
                parties[party1].currency = 0
            }
        }
    }
    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
    message.channel.send(`The transfer has been completed.`)
}
