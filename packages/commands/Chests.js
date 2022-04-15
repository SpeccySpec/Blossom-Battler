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

commands.getchest = new Command({
    desc: "Get a chest you desire.",
    section: "chests",
    args: [
        {
            name: "Channel",
            type: "Channel",
            forced: true
        },
        {
            name: "Chest",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        let channel = args[0]
        let name = args[1]

        if (!chestFile[channel]) return message.channel.send("There are no chests in this channel.")
        if (!chestFile[channel][name]) return message.channel.send("There is no chest with that name.")

        let chest = chestFile[channel][name]

        if (chest.hidden) {
            if (chest.originalAuthor != message.author.id && !message.member.permissions.serialize().ADMINISTRATOR) {
                const discordEmbed = new Discord.MessageEmbed()
                    .setColor(0x00AE86)
                    .setTitle(`${chest.name} is hidden`)
                    .setDescription(`You can't get this chest, as it is hidden.`)

                message.channel.send({embeds: [discordEmbed]})
            }
            else {
                message.author.send({content: `Here's info on ${chest.name}:`, embeds: [chestDesc(chest, name, message)]})
            }
        }
        else {
            message.channel.send({content: `Here's info on ${chest.name}:`, embeds: [chestDesc(chest, name, message)]})
        }
    }
})