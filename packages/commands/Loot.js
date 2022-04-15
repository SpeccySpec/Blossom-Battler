function lootDesc(lootDefs, lootName, message, itemFile, weaponFile, armorFile) {

    if (!itemFile) itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
    if (!weaponFile) weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
    if (!armorFile) armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

    let finalText = "";

    for (const i in lootDefs.items) {
        if (i % 4 == 0) finalText += `- **${lootDefs.items[i]}:** ` //${lootDefs.items[i+2]} (${lootDefs.items[i+1]}x) (${lootDefs.items[i+3]}% Chance)\n`;
        else if (i % 4 == 1) {
            switch (lootDefs.items[i-1]) {
                case "item":
                    finalText += `**${itemTypeEmoji[itemFile[lootDefs.items[i]].type]}${itemFile[lootDefs.items[i]].rarity && itemFile[lootDefs.items[i]].rarity != 'none' ? itemRarityEmoji[itemFile[lootDefs.items[i]].rarity] : ``} ${itemFile[lootDefs.items[i]].name ? itemFile[lootDefs.items[i]].name : lootDefs.items[i]}** `;
                    break;
                case "weapon":
                    finalText += `**${elementEmoji[weaponFile[lootDefs.items[i]].element]} ${weaponFile[lootDefs.items[i]].name ? weaponFile[lootDefs.items[i]].name : lootDefs.items[i]}** `;
                    break;
                case "armor":
                    finalText += `**${elementEmoji[armorFile[lootDefs.items[i]].element]} ${armorFile[lootDefs.items[i]].name ? armorFile[lootDefs.items[i]].name : lootDefs.items[i]}** `;
                    break;
            }
        }
        else if (i % 4 == 2) finalText += `(${lootDefs.items[i]}x) `;
        else finalText += `(${lootDefs.items[i]}% Chance)\n`;
    }

    let userTxt = ''
	if (lootDefs.originalAuthor) {
		if (lootDefs.originalAuthor === 'Default')
			userTxt = 'Default/Official';
		else {
			try { userTxt = message.guild.members.cache.get(lootDefs.originalAuthor).user.username } catch (e) { userTxt = lootDefs.originalAuthor }
		}
	} else
		userTxt = 'Default/Official';

    const DiscordEmbed = new Discord.MessageEmbed()
        .setColor('#00C917')
		.setTitle(`${lootDefs.name ? lootDefs.name : lootDefs} *(${userTxt})*`)
		.setDescription(finalText)
	return DiscordEmbed;
}




commands.registerloot = new Command({
    desc: 'Creates a loot table that can be assigned to enemies after a battle victory.\n*Fields* should be written in the exact order as shown.',
    section: 'loot',
    aliases: ['regloot', 'makeloot'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true,
        },
        {
            name: "Fields (Type, Item, Amount, Chance) #1",
            type: "Word",
            forced: true,
            multiple: true,
        }
    ],
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (lootFile[args[0]] && message.author.id != lootFile[args[0]].originalAuthor && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of a loot table name.`);

        let name = args[0]
        args.shift();

        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        for (i in args) {
            if (i % 4 == 0) {
                if (args[i].toLowerCase() != "item" && args[i].toLowerCase() != "weapon" && args[i].toLowerCase() != "armor") return message.channel.send(`${args[i]} is not a valid type.`)
                args[i] = args[i].toLowerCase();
            }
            else if (i % 4 == 1) {
                if (args[i-1].toLowerCase() == "item") {
                    if (!itemFile[args[i]]) return message.channel.send(`${args[i]} is not a valid item.`)
                }
                else if (args[i-1].toLowerCase() == "weapon") {
                    if (!weaponFile[args[i]]) return message.channel.send(`${args[i]} is not a valid weapon.`)
                }
                else if (args[i-1].toLowerCase() == "armor") {
                    if (!armorFile[args[i]]) return message.channel.send(`${args[i]} is not a valid armor.`)
                }
            }
            else if (i % 4 == 2) {
                if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                args[i] = Math.max(1, Math.min(parseInt(args[i]), 25))
            }
            else {
                if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid float.`)
                args[i] = Math.max(1, Math.min(100, parseFloat(args[i])))
            }
        }

        if (args.length % 4 != 0) return message.channel.send(`You didn't write the correct amount of fields.`)
        if (args.length / 4 > 20) return message.channel.send(`That's a lot of loot. Too much.`)

        lootFile[name] = {
            name: name,
            originalAuthor: message.author.id,
            items: args
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4))

        message.channel.send({content: `${name} has been registered:`, embeds: [lootDesc(lootFile[name], name, message, itemFile, weaponFile, armorFile)]})
    }
})

commands.renameloot = new Command({
    desc: 'Renames a loot table.',
    section: 'loot',
    args: [
        {
            name: "Loot",
            type: "Word",
            forced: true,
        },
        {
            name: "New Name",
            type: "Word",
            forced: true,
        }
    ],
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (!lootFile[args[0]]) return message.channel.send(`${args[0]} does not exist.`)
        if (lootFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send(`${args[0]} exists already and cannot be renamed because you don't own it!`)
        if (lootFile[args[1]]) return message.channel.send(`${args[1]} already exists.`)

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
        if (args[1].length > 50) return message.channel.send(`${args[1]} is too long of a loot table name.`);

        lootFile[args[1]] = lootFile[args[0]]
        lootFile[args[1]].name = args[1]
        delete lootFile[args[0]]

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4))

        message.channel.send(`${args[0]} has been renamed to ${args[1]}:`)
    }
})

commands.getloot = new Command({
    desc: 'Gets a loot table.',
    section: 'loot',
    args: [
        {
            name: "Loot",
            type: "Word",
            forced: true,
        }
    ],
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (!lootFile[args[0]]) return message.channel.send(`${args[0]} does not exist.`)

        message.channel.send({content: `Here's your info on ${args[0]}:`, embeds: [lootDesc(lootFile[args[0]], args[0], message)]})
    }
})

commands.listloots = new Command({
    desc: `Lists all loot tables.`,
    section: 'loot',
    args: [
        {
            name: "Quick Page",
            type: "Num"
        }
    ],
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        let array = []
        for (let loot in lootFile) {
            let amount = 0
            for (i in lootFile[loot].items) {
                if (i % 4 == 2) amount += lootFile[loot].items[i]
            }
            array.push({title: `${lootFile[loot].name} (${loot})`, desc: `${amount} items`});
        }

        if (array.length == 0) return message.channel.send(`No loot tables found.`);

        listArray(message.channel, array, parseInt(args[0]));
    }
})

commands.searchloots = new Command({
    desc: `Search for loot tables by phrase.`,
    section: 'loot',
    args: [
        {
            name: "Phrase",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        let array = []
        for (let loot in lootFile) {
            if (lootFile[loot].name.includes(args[0]) || loot.includes(args[0])) {
                let amount = 0
                for (i in lootFile[loot].items) {
                    if (i % 4 == 2) amount += lootFile[loot].items[i]
                }
                array.push({title: `${lootFile[loot].name} (${loot})`, desc: `${amount} items`});
            }
        }

        if (array.length == 0) return message.channel.send(`No loot tables found with the phrase ${args[0]}.`);

        listArray(message.channel, array, parseInt(args[1]));
    }
})

commands.purgeloot = new Command({
    desc: `Deletes a loot table. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
    section: 'loot',
    aliases: ['unregisterloot', 'lootpurge', 'lootunregister', 'deleteloot', 'lootdelete'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (!lootFile[args[0]]) return message.channel.send(`${args[0]} is not a valid loot table name.`);

        if (lootFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this loot table, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${lootFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this loot table.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${lootFile[args[0]].name} has been erased from existance.`)
                    delete lootFile[args[0]]

                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4));
                } else
                    message.channel.send(`${lootFile[args[0]].name} will not be deleted.`);

                    givenResponce = true
                    collector.stop()
                }
            });
        collector.on('end', c => {
            if (givenResponce == false)
                message.channel.send(`No response given.\n${lootFile[args[0]].name} will not be deleted.`);
        });
    }
})







function chestDesc(chestDefs, chestName, message, itemFile, weaponFile, armorFile) {
    if (!itemFile) itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
    if (!weaponFile) weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
    if (!armorFile) armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

    let userTxt = ''
	if (chestDefs.originalAuthor) {
		if (chestDefs.originalAuthor === 'Default')
			userTxt = 'Default/Official';
		else {
			try { userTxt = message.guild.members.cache.get(chestDefs.originalAuthor).user.username } catch (e) { userTxt = chestDefs.originalAuthor }
		}
	} else
		userTxt = 'Default/Official';

    let lockTxt = ''
    let lockTypeName = chestDefs.lock[0].charAt(0).toUpperCase() + chestDefs.lock[0].slice(1)
    switch (chestDefs.lock[0]) {
        case 'party':
        case 'character':
        case 'pet':
            break;
        case 'money':
            lockTxt = `${lockTypeName} (${chestDefs.lock[1]})`
            break;
        case 'item':
            lockTxt = `${lockTypeName} (${itemTypeEmoji[itemFile[chestDefs.lock[1]].type]}${itemRarityEmoji[itemFile[chestDefs.lock[1]].rarity]} ${itemFile[chestDefs.lock[1]].name})`
            break;
        case 'weapon':
            lockTxt = `${lockTypeName} (${elementEmoji[weaponFile[chestDefs.lock[1]].element]} ${weaponFile[chestDefs.lock[1]].name})`
            break;
        case 'armor':
            lockTxt = `${lockTypeName} (${elementEmoji[armorFile[chestDefs.lock[1]].element]} ${armorFile[chestDefs.lock[1]].name})`
            break;
        case 'password':
            lockTxt = `${lockTypeName} (${chestDefs.lock[1]})`
            break;
        case 'none':
            lockTxt = `${lockTypeName}`
    }

    let channelText = ''
    try {
        channelText = `${message.guild.channels.cache.get(chestDefs.channel).name} (${chestDefs.channel})`
    } catch (e) {
        channelText = `${chestDefs.channel}`
    }

    let itemText = ''
    if (chestDefs.items != {}) {
        const categories = ['item', 'weapon', 'armor']
        for (let category in categories) {
            if (chestDefs.items[categories[category]]) {
                itemText += `*${categories[category].charAt(0).toUpperCase() + categories[category].slice(1)}s:*\n`
                for (let item in chestDefs.items[categories[category]]) {
                    switch (categories[category]) {
                        case 'item':
                            itemText += `- ${itemTypeEmoji[itemFile[item].type]}${itemRarityEmoji[itemFile[item].rarity]} ${itemFile[item].name} (${chestDefs.items[categories[category]][item]}x)\n`
                            break;
                        case 'weapon':
                            itemText += `- ${elementEmoji[weaponFile[item].element]} ${weaponFile[item].name} (${chestDefs.items[categories[category]][item]}x)\n`
                            break;
                        case 'armor':
                            itemText += `- ${elementEmoji[armorFile[item].element]} ${armorFile[item].name} (${chestDefs.items[categories[category]][item]}x)\n`
                            break;
                    }
                }
            }
        }
    }

    if (chestDefs.desc) itemText += `\n\n*${chestDefs.desc}*`

    const DiscordEmbed = new Discord.MessageEmbed()
        .setColor('#AB5200')
		.setTitle(`${chestDefs.name ? chestDefs.name : chestDefs} *(${userTxt})*`)
        .addFields(
            { name: 'Channel', value: `${channelText}`, inline: true },
            { name: 'Hidden', value: chestDefs.hidden ? 'Yes' : 'No', inline: true },
        )
        if (lockTxt) DiscordEmbed.addField('Lock', lockTxt, true)
        if (itemText != '') DiscordEmbed.addField('Items', itemText, true)
	return DiscordEmbed;
}

commands.registerchest = new Command({
    desc: 'Registers a chest to use for storing items, weapons or armors.',
    section: 'chests',
    aliases: ['makechest', 'regchest'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Channel",
            type: "Channel",
            forced: true
        },
        {
            name: "Hidden",
            type: "Word",
            forced: true
        },
        {
            name: "Lock Type",
            type: "Word",
            forced: true
        },
        {
            name: "Lock Key",
            type: "Word",
        },
        {
            name: "Description",
            type: "Word"
        },
        {
            name: "Items (Type, Item, Amount) #1",
            type: "Word",
            multiple: true
        }
    ],
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        if (chestFile[args[0]] && chestFile[args[0]].originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You do not own this chest, therefore, you have insufficient permissions to overwrite it.")

        let name = args[0]
        let channel = args[1]
        let hidden = args[2].toLowerCase() == 'true' || args[2].toLowerCase() == 'yes' || args[2].toLowerCase() == 'y' || args[2].toLowerCase() == '1'

        let lockType = args[3].toLowerCase()
        const validLockTypes = ['party', 'character', 'money', 'pet', 'item', 'weapon', 'armor', 'password', 'none']
        if (!validLockTypes.includes(lockType)) return message.channel.send(`${args[3]} is not a valid lock type. Valid lock types are: \n- ${validLockTypes.join('\n- ')}`)

        let lockKey = args[4]
        if (lockType != 'none' && !lockKey) return message.channel.send("You must specify a lock key.")

        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

        switch (lockType) {
            case 'party':
            case 'character':
            case 'pet':
                return message.channel.send("This type of lock hasn't been implemented yet.")
            case 'money':
                if (isNaN(lockKey)) return message.channel.send("The lock key must be a number.")
                lockKey = Math.max(0, parseInt(lockKey))
            case 'item':
                if (!itemFile[lockKey]) return message.channel.send("The item you specified does not exist.")
                break;
            case 'weapon':
                if (!weaponFile[lockKey]) return message.channel.send("The weapon you specified does not exist.")
                break;
            case 'armor':
                if (!armorFile[lockKey]) return message.channel.send("The armor you specified does not exist.")
                break;
            case 'password':
                if (!lockKey) return message.channel.send("You must specify a password.")
                break;
        }

        let description = args[5]

        args.splice(0, 6)

        for (i in args) {
            if (i % 3 == 0) {
                if (args[i].toLowerCase() != "item" && args[i].toLowerCase() != "weapon" && args[i].toLowerCase() != "armor") return message.channel.send(`${args[i]} is not a valid type.`)
                args[i] = args[i].toLowerCase();
            }
            else if (i % 3 == 1) {
                if (args[i-1].toLowerCase() == "item") {
                    if (!itemFile[args[i]]) return message.channel.send(`${args[i]} is not a valid item.`)
                }
                else if (args[i-1].toLowerCase() == "weapon") {
                    if (!weaponFile[args[i]]) return message.channel.send(`${args[i]} is not a valid weapon.`)
                }
                else if (args[i-1].toLowerCase() == "armor") {
                    if (!armorFile[args[i]]) return message.channel.send(`${args[i]} is not a valid armor.`)
                }
            }
            else if (i % 3 == 2) {
                if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                args[i] = Math.max(1, parseInt(args[i]))
            }
        }

        if (args.length % 3 != 0) return message.channel.send(`You didn't write the correct amount of fields.`)
    
        if (!chestFile[channel]) chestFile[channel] = {}

        chestFile[channel][name] = {
            originalAuthor: message.author.id,
            name: name,
            channel: channel,
            party: '',
            lock: [lockType, lockKey],
            hidden: hidden,
            items: {}
        }

        if (description && description.toLowerCase() != 'none') chestFile[channel][name].desc = description

        if (args) {
            for (i in args) {
                if (i % 3 == 2) {
                    if (!chestFile[channel][name].items[args[i-2]]) chestFile[channel][name].items[args[i-2]] = {}
                    
                    if (!chestFile[channel][name].items[args[i-2]][args[i-1]]) chestFile[channel][name].items[args[i-2]][args[i-1]] = 0
                    chestFile[channel][name].items[args[i-2]][args[i-1]] += args[i]
                }
            }
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4))

        if (!hidden) message.channel.send({content: `Chest ${name} has been created.`, embeds: [chestDesc(chestFile[channel][name], name, message, itemFile, weaponFile, armorFile)]})
        else {
            message.delete()
            message.channel.send(`Chest ${name} has been created.`)
            message.author.send({content: `Chest ${name} has been created.`, embeds: [chestDesc(chestFile[channel][name], name, message, itemFile, weaponFile, armorFile)]})
        }
    }
})