function chestDesc(chestDefs, chestName, message, itemFile, weaponFile, armorFile, charFile, enemyFile, partyFile) {
    if (!itemFile) itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
    if (!weaponFile) weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
    if (!armorFile) armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)
    if (!charFile) charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)
    if (!enemyFile) enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)
    if (!partyFile) partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)

    let userTxt = getServerUser(chestDefs.originalAuthor, message)

    let lockTxt = ''
    let lockTypeName = chestDefs.lock[0].charAt(0).toUpperCase() + chestDefs.lock[0].slice(1)
    switch (chestDefs.lock[0]) {
        case 'party':
            lockTxt = `${lockTypeName} ${partyFile[chestDefs.lock[1]].name}`
            break
        case 'pet':
            lockTxt = `${lockTypeName} (${elementEmoji[enemyFile[chestDefs.lock[1]].mainElement]} ${enemyFile[chestDefs.lock[1]].name})`
            break
        case 'character':
            lockTxt = `${lockTypeName} (${elementEmoji[charFile[chestDefs.lock[1]].mainElement]} ${charFile[chestDefs.lock[1]].name})`
            break
        case 'money':
            lockTxt = `${lockTypeName} (${chestDefs.lock[1]} ${getCurrency(message.guild.id)}s)`
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
            break;
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
        if (chestDefs.items['money']) {
            itemText += `*Money:*\n ${chestDefs.items['money']} ${getCurrency(message.guild.id)}s`
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
    desc: 'Registers a chest to use for storing items, weapons or armors.\n*Items* should be written in the order as shown.\n\nI support loot tables too, with *Items* being written like *(\'Loot\', Name, Repeat Amount)*.',
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
    checkban: true,
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        if (chestFile[args[0]] && chestFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this chest, therefore, you have insufficient permissions to overwrite it.")

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
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        switch (lockType) {
            case 'party':
                let partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
                if (!partyFile[lockKey]) return message.channel.send("That party does not exist.")
                break;
            case 'pet':
                let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)
                if (!enemyFile[lockKey]) return message.channel.send(`${lockKey} is not a valid enemy.`)
                if (!enemyFile[lockKey].negotiateDefs || (enemyFile[lockKey].negotiateDefs && Object.keys(enemyFile[lockKey].negotiateDefs).length == 0)) return message.channel.send(`${lockKey} can't become a pet lock.`)
                break;
            case 'character':
                let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)
                if (!charFile[lockKey]) return message.channel.send(`${lockKey} is not a valid character.`)
            case 'money':
                if (isNaN(lockKey)) return message.channel.send("The lock key must be a number.")
                lockKey = Math.max(0, parseInt(lockKey))
                break;
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
        const validTypes = ['item', 'weapon', 'armor', 'loot', 'money']
        let itemsDef = []

        let type

        if (args.length % 3 != 0) return message.channel.send(`You didn't write the correct amount of fields.`)

        for (i in args) {
            if (i % 3 == 0) {
                if (!validTypes.includes(args[i])) return message.channel.send(`${args[i]} is not a valid item type. Valid types are: \n- ${validTypes.join('\n- ')}`)
                type = args[i].toLowerCase();
            }
            if (type != 'loot' && type != 'money') {
                if (i % 3 == 1) {
                    itemsDef[i-1] = args[i-1].toLowerCase()

                    if (args[i-1].toLowerCase() == "item") {
                        if (!itemFile[args[i]]) return message.channel.send(`${args[i]} is not a valid item.`)
                    }
                    else if (args[i-1].toLowerCase() == "weapon") {
                        if (!weaponFile[args[i]]) return message.channel.send(`${args[i]} is not a valid weapon.`)
                    }
                    else if (args[i-1].toLowerCase() == "armor") {
                        if (!armorFile[args[i]]) return message.channel.send(`${args[i]} is not a valid armor.`)
                    }
                    itemsDef[i] = args[i]
                }
                if (i % 3 == 2) {
                    if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                    itemsDef[i] = Math.max(1, parseInt(args[i]))
                }
            } else if (type == 'loot') {
                if (i % 3 == 1)
                    if (!lootFile[args[i]]) return message.channel.send(`${args[i]} is not a valid loot table.`)
                if (i % 3 == 2) {
                    if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                    args[i] = Math.max(1, parseInt(args[i]))
                    if (args[i] > 10) return message.channel.send(`${args[i]} is too high.`)

                    for (let j = 0; j < args[i]; j++) {
                        if (lootFile[args[i-1]].items) {
                            for (let k in lootFile[args[i-1]].items) {
                                itemsDef.push(lootFile[args[i-1]].items[k].type)
                                itemsDef.push(lootFile[args[i-1]].items[k].id)
                                itemsDef.push(lootFile[args[i-1]].items[k].amount)
                            }
                        }
                    }
                }
            } else if (type == 'money') {
                if (i % 3 == 1) {
                    if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                    itemsDef[i-1] = args[i-1].toLowerCase()
                    itemsDef[i] = parseInt(args[i])
                }
                if (i % 3 == 2) {
                    itemsDef[i] = '-'
                }
            }
        }
    
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

        if (itemsDef) {
            for (i in itemsDef) {
                if (i % 3 == 2) {
                    if (itemsDef[i-2] != 'money') {
                        if (!chestFile[channel][name].items[itemsDef[i-2]]) chestFile[channel][name].items[itemsDef[i-2]] = {}
                        
                        if (!chestFile[channel][name].items[itemsDef[i-2]][itemsDef[i-1]]) chestFile[channel][name].items[itemsDef[i-2]][itemsDef[i-1]] = 0
                        chestFile[channel][name].items[itemsDef[i-2]][itemsDef[i-1]] += itemsDef[i]
                    } else {
                        if (!chestFile[channel][name].items['money']) chestFile[channel][name].items['money'] = 0
                        chestFile[channel][name].items['money'] += itemsDef[i-1]
                    }
                }
            }
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4))

		if (message.author.bot) return;

        if (!hidden) 
			message.channel.send({content: `Chest ${name} has been created.`, embeds: [chestDesc(chestFile[channel][name], name, message, itemFile, weaponFile, armorFile)]})
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
            if (chest.originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) {
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

commands.listchests = new Command({
    desc: `Lists all chests.`,
    section: 'chests',
    args: [
        {
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
    ],
    func: (message, args) => {
        let array = [];
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        const validTypes = ['channel', 'user', 'lock', 'item', 'weapon', 'armor', 'money'];

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

        for (const channel in chestFile) {
            for (const i in chestFile[channel]) {
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

                                isConditionMet = (chestFile[channel][i].originalAuthor == args[a])
                                break;
                            case 'channel':
                                if (args[a].startsWith('<#') && args[a].endsWith('>')) {
                                    let channel = message.guild.channels.cache.find(c => c.id == args[a].slice(2, -1));
                                    args[a] = channel.id;
                                } else if (args[a].startsWith('<#!') && args[a].endsWith('>')) {
                                    let channel = message.guild.channels.cache.find(c => c.id == args[a].slice(3, -1));
                                    args[a] = channel.id;
                                }
                                if (!args[a].includes('#') && message.mentions.channels.size == 0) {
                                    if (args[a].match(/^[0-9]+$/)) {
                                        let channel = message.guild.channels.cache.find(c => c.id == args[a]);
                                        args[a] = channel.id;
                                    } else {
                                        let channel = message.guild.channels.cache.find(c => c.name == args[a]);
                                        args[a] = channel.id;
                                    }
                                }
                                if (message.mentions.channels.size > 0) {
                                    args[a] = message.mentions.channels.first().id;
                                }

                                isConditionMet = (chestFile[channel][i].channel == args[a])
                                break;
                            case 'lock':
                                isConditionMet = (chestFile[channel][i].lock && chestFile[channel][i].lock[0] == args[a])
                                break;
                            case 'item':
                            case 'weapon':
                            case 'armor':
                                if (args[a].toString().toLowerCase() != 'true' && args[a].toString().toLowerCase() != 'false') {
                                    isConditionMet = (chestFile[channel][i]['items'] && chestFile[channel][i]['items'][args[a-1]] && Object.keys(chestFile[channel][i]['items'][args[a-1]]).includes(args[a]))
                                } else {
                                    if (args[a].toString().toLowerCase() == 'true') {
                                        isConditionMet = (chestFile[channel][i]['items'] && chestFile[channel][i]['items'][args[a-1]] && Object.keys(chestFile[channel][i]['items'][args[a-1]]).length > 0)
                                    } else {
                                        isConditionMet = ((chestFile[channel][i]['items'] && chestFile[channel][i]['items'][args[a-1]] && Object.keys(chestFile[channel][i]['items'][args[a-1]]).length == 0) || !chestFile[channel][i]['items'] || (chestFile[channel][i]['items'] && !chestFile[channel][i]['items'][args[a-1]]))
                                    }
                                }
                                break;
                            case 'money':
                                if (args[a].toString().toLowerCase() != 'true' && args[a].toString().toLowerCase() != 'false') {
                                    isConditionMet = (chestFile[channel][i]['items'] && chestFile[channel][i]['items']['money'] == parseInt(args[a]))
                                } else {
                                    if (args[a].toString().toLowerCase() == 'true') {
                                        isConditionMet = (chestFile[channel][i]['items'] && chestFile[channel][i]['items']['money'] > 0)
                                    } else {
                                        isConditionMet = ((chestFile[channel][i]['items'] && chestFile[channel][i]['items']['money'] == 0) || (chestFile[channel][i]['items'] && !chestFile[channel][i]['items']['money']) || !chestFile[channel][i]['items'])
                                    }
                                }
                                break;
                        }

                        if (isConditionMet == false || isConditionMet == undefined) break;
                    }
                }
                if (isConditionMet == false || isConditionMet == undefined) continue;

                let channelTxt = ''
                try {
                    channelTxt = `${message.guild.channels.cache.get(chestFile[channel][i].channel).name}`
                } catch (e) {
                    channelTxt = `${chestFile[channel][i].channel}`
                }

                let name = `${chestFile[channel][i].name} (${i})`

                //check if hidden, if so, surround channelTxt and name in ||
                if (chestFile[channel][i].hidden) {
                    channelTxt = `||${channelTxt}||`
                    name = `||${name}||`
                }

        
                array.push({title: name, desc: `located in ${channelTxt}`});
            }
        }

        if (array.length == 0) return message.channel.send(`No chests found.`);

        listArray(message.channel, array, message.author.id);
    }
})

commands.searchchests = new Command({
    desc: `Searches for chests based on a phrase.`,
    section: 'chests',
    args: [
        {
            name: "Phrase",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        let array = []
        for (let channel in chestFile) {
            for (let chest in chestFile[channel]) {
                let name = `${chestFile[channel][chest].name} (${chest})`

                if (!name.includes(args[0])) continue

                let channelTxt = ''
                try {
                    channelTxt = `${message.guild.channels.cache.get(chestFile[channel][chest].channel).name} (${chestFile[channel][chest].channel})`
                } catch (e) {
                    channelTxt = `${chestFile[channel][chest].channel}`
                }

                //check if hidden, if so, surround channelTxt and name in ||
                if (chestFile[channel][chest].hidden) {
                    channelTxt = `||${channelTxt}||`
                    name = `||${name}||`
                }

                array.push({title: name, desc: `located in ${channelTxt}`});
            }
        }

        if (array.length == 0) return message.channel.send(`No chests found.`);

        listArray(message.channel, array, message.author.id);
    }
})

commands.purgechest = new Command({
    desc: `Purges a chest. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
    section: 'chests',
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
    checkban: true,
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        if (!chestFile[args[0]]) return message.channel.send(`There are no chests in this channel.`);
        if (!chestFile[args[0]][args[1]]) return message.channel.send(`${args[1]} is not a valid chest name.`);

        if (chestFile[args[0]][args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this chest, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${chestFile[args[0]][args[1]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this chest.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${chestFile[args[0]][args[1]].name} has been erased from existance.`)
                    delete chestFile[args[0]][args[1]]

                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));
                } else
                    message.channel.send(`${chestFile[args[0]][args[1]].name} will not be deleted.`);

                    givenResponce = true
                    collector.stop()
                }
            });
        collector.on('end', c => {
            if (givenResponce == false)
                message.channel.send(`No response given.\n${chestFile[args[0]][args[1]].name} will not be deleted.`);
        });
    }
})

commands.editchest = new Command({
    desc: `Edit an existing chest and change things about it!`,
    section: 'chests',
    aliases: ['chestedit', 'changechest', 'chestchange'],
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
        },
        {
            name: "Field",
            type: "Word",
            forced: true
        },
        {
            name: "Value #1",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    checkban: true,
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        if (!chestFile[args[0]]) return message.channel.send(`There are no chests in this channel.`);
        if (!chestFile[args[0]][args[1]]) return message.channel.send(`${args[1]} is not a valid chest.`);
        if (chestFile[args[0]][args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send(`You cannot edit ${args[1]}.`);

        //fields: element
        let editField = args[2].toLowerCase();
        switch (editField) {
            case 'name':
            case 'desc':
                chestFile[args[0]][args[1]][editField] = args[3];
                break;
            case 'location':
            case 'channel':
                if (!message.guild.channels.cache.find(c => c.name == args[3] || c.id == args[3] || c.id == args[3].replace(/[<#>]/g, ''))) return message.channel.send(`${args[3]} is not a valid channel.`);
                chestFile[args[0]][args[1]][editField] = args[3];

                if (!chestFile[args[3]]) chestFile[args[3]] = {}
                chestFile[args[3]][args[1]] = chestFile[args[0]][args[1]]
                delete chestFile[args[0]][args[1]]
                break;
            case 'truename':
                if (chestFile[args[0]] && chestFile[args[0]][args[3]]) {
                    return message.channel.send(`A chest called ${chestFile[args[0]][args[3]].name} (${args[3]}) already exists in that channel!`)
                } else {
                    if (args[1] == args[3]) return message.channel.send(`What's the point...?`);
                    chestFile[args[0]][args[3]] = utilityFuncs.cloneObj(chestFile[args[0]][args[1]])
                    delete chestFile[args[0]][args[1]]
                }
                break;
            case 'spoiler':
            case 'hidden':
            case 'hide':
                chestFile[args[0]][args[1]].hidden = !chestFile[args[0]][args[1]].hidden;
                break;
            case 'lock':
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
                        let partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
                        if (!partyFile[lockKey]) return message.channel.send("That party does not exist.")
                        break;
                    case 'pet':
                        let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)
                        if (!enemyFile[lockKey]) return message.channel.send(`${lockKey} is not a valid enemy.`)
                        if (!enemyFile[lockKey].negotiateDefs || (enemyFile[lockKey].negotiateDefs && Object.keys(enemyFile[lockKey].negotiateDefs).length == 0)) return message.channel.send(`${lockKey} can't become a pet lock.`)
                        break;
                    case 'character':
                        let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)
                        if (!charFile[lockKey]) return message.channel.send(`${lockKey} is not a valid character.`)
                        break;
                    case 'money':
                        if (isNaN(lockKey)) return message.channel.send("The lock key must be a number.")
                        lockKey = Math.max(0, parseInt(lockKey))
                        break;
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
                        break
                }

                chestFile[args[0]][args[1]].lock = [lockType, lockKey]
                break;
            default:
                return message.channel.send(`${args[2]} is not a valid field.`);
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));
        message.react('👍');
    }
})

commands.chestitems = new Command({
    desc: `Put or remove items into a chest.\nTo remove all items from a category, use *'all'* in *item name*. If all in general, use *'all'* in *item type*. *Item* should be written in the order as shown`,
    section: 'chests',
    aliases: ['chestitem'],
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
        },
        {
            name: "Add/Remove",
            type: "Word",
            forced: true
        },
        {
            name: "Item (Type, Name, Amount) #1",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    checkban: true,
    func: (message, args) => {
        chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)

        if (!chestFile[args[0]]) return message.channel.send(`There are no chests in this channel.`);
        if (!chestFile[args[0]][args[1]]) return message.channel.send(`${args[1]} is not a valid chest.`);
        if (chestFile[args[0]][args[1]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send(`You cannot edit ${args[1]}.`);

        let chestName = args[1]
        let chest = chestFile[args[0]][chestName]

        let addRemove = args[2].toLowerCase();
        if (addRemove != 'add' && addRemove != 'remove') return message.channel.send(`${args[2]} is not a valid add/remove type.`);

        args.splice(0, 3)

        let itemType = args[0].toLowerCase();
        const validTypes = ['item', 'weapon', 'armor', 'money', 'all']
        if (!validTypes.includes(itemType)) return message.channel.send(`${itemType} is not a valid item type. Valid item types are: \n- ${validTypes.join('\n- ')}`)
        let itemName
        let itemAmount

        itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
        weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
        armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)
        
        if (itemType != 'all') {
            itemType = []
            itemName = []
            itemAmount = []

            if (args.length % 3 != 0) return message.channel.send(`You didn't write the correct amount of fields.`)

            for (let i in args) {
                if (i % 3 == 2) { 
                    if (args[i-2].toLowerCase() != "item" && args[i-2].toLowerCase() != "weapon" && args[i-2].toLowerCase() != "armor" && args[i-2].toLowerCase() != "money") return message.channel.send(`${args[i-2]} is not a valid type.`)
                    args[i-2] = args[i-2].toLowerCase();
                    itemType.push(args[i-2])

                    if (args[i-2].toLowerCase() != "money") {
                        if (args[i-1].toLowerCase() != 'all') {
                            if (args[i-2].toLowerCase() == "item") {
                                if (!itemFile[args[i-1]]) return message.channel.send(`${args[i-1]} is not a valid item.`)
                                itemName.push(args[i-1])
                            }
                            else if (args[i-2].toLowerCase() == "weapon") {
                                if (!weaponFile[args[i-1]]) return message.channel.send(`${args[i-1]} is not a valid weapon.`)
                                itemName.push(args[i-1])
                            }
                            else if (args[i-2].toLowerCase() == "armor") {
                                if (!armorFile[args[i-1]]) return message.channel.send(`${args[i-1]} is not a valid armor.`)
                                itemName.push(args[i-1])
                            }
                        } else itemName.push(args[i-1].toLowerCase())

                        if (isNaN(args[i])) return message.channel.send(`${args[i]} is not a valid number.`)
                        args[i] = Math.max(1, parseInt(args[i]))
                        itemAmount.push(args[i])
                    } else {
                        if (isNaN(args[i-1])) return message.channel.send(`${args[i-1]} is not a valid number.`)
                        args[i] = Math.max(0, parseInt(args[i-1]))
                        itemAmount.push(parseInt(args[i-1]))
                    }
                }
            }
        }

        if (addRemove == 'remove') {
            if (itemType == 'all') {
                for (let item in chest.items) {
                    const categories = ['weapon', 'armor', 'item', 'money']
                    for (i in categories) {
                        if (chest.items[categories[i]]) {
                            delete chest.items[categories[i]]
                        }
                    }
                }
            } else {
                for (let i in itemType) {
                    if (itemType[i] != 'money') {
                        if (!chest.items[itemType[i]]) return message.channel.send(`There are no ${itemType[i]} items in ${args[1]}.`);
                        if (itemName[i] == 'all') {
                            delete chest.items[itemType[i]]
                        } else {
                            if (!chest.items[itemType[i]][itemName[i]]) continue;
                            
                            itemAmount[i] = Math.min(chest.items[itemType[i]][itemName[i]], parseInt(itemAmount[i]));
                            chest.items[itemType[i]][itemName[i]] -= itemAmount[i];

                            if (chest.items[itemType[i]][itemName[i]] <= 0) {
                                delete chest.items[itemType[i]][itemName[i]]
                            }
                        }
                    } else {
                        if (!chest.items['money']) return message.channel.send(`There are no ${getCurrency(message.guild.id)}s in ${args[1]}.`);
                        itemAmount[i] = Math.min(chest.items['money'], parseInt(itemAmount[i]));
                        chest.items['money'] -= itemAmount[i];

                        if (chest.money <= 0) {
                            delete chest['money']
                        }
                    }
                }
            }
        } else {
            if (itemType == 'all') return message.channel.send(`You cannot add all items to a chest.`);
            if (itemName.includes('all')) return message.channel.send(`You cannot add all items to a chest.`);

            for (let i in itemType) {
                if (itemType[i] != 'money') {
                    thingFile = setUpFile(`${dataPath}/json/${message.guild.id}/${itemType[i]}s.json`)

                    if (!thingFile[itemName[i]]) return message.channel.send(`${itemName[i]} is not a valid ${itemType[i]}.`);

                    if (!chest.items[itemType[i]]) chest.items[itemType[i]] = {};
                    if (!chest.items[itemType[i]][itemName[i]]) chest.items[itemType[i]][itemName[i]] = 0;

                    chest.items[itemType[i]][itemName[i]] += itemAmount[i];
                } else {
                    if (!chest.items[itemType[i]]) chest.items[itemType[i]] = 0;
                    chest.items[itemType[i]] += itemAmount[i];
                }
            }
        }

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, 4));
        message.channel.send(`Updated ${chestName}'s items.`);
    }
})