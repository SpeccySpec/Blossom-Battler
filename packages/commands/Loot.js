function lootDesc(lootDefs, lootName, message, itemFile, weaponFile, armorFile) {

    if (!itemFile) itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
    if (!weaponFile) weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
    if (!armorFile) armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)

    let finalText = "";

    for (const i in lootDefs.items) {
        finalText += `- **${lootDefs.items[i].type}:** `
        switch (lootDefs.items[i].type) {
            case "item":
                finalText += `**${itemTypeEmoji[itemFile[lootDefs.items[i].id].type]}${itemFile[lootDefs.items[i].id].rarity && itemFile[lootDefs.items[i].id].rarity != 'none' ? itemRarityEmoji[itemFile[lootDefs.items[i].id].rarity] : ``} ${itemFile[lootDefs.items[i].id].name ? itemFile[lootDefs.items[i].id].name : lootDefs.items[i].id}** `;
                break;
            case "weapon":
                finalText += `**${elementEmoji[weaponFile[lootDefs.items[i].id].element]} ${weaponFile[lootDefs.items[i].id].name ? weaponFile[lootDefs.items[i].id].name : lootDefs.items[i].id}** `;
                break;
            case "armor":
                finalText += `**${elementEmoji[armorFile[lootDefs.items[i].id].element]} ${armorFile[lootDefs.items[i].id].name ? armorFile[lootDefs.items[i].id].name : lootDefs.items[i].id}** `;
                break;
        }
        finalText += `(${lootDefs.items[i].amount}x) (${lootDefs.items[i].chance}% Chance)\n`;
    }
    
    let userTxt = getServerUser(lootDefs.originalAuthor, message);

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
    checkban: true,
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (lootFile[args[0]] && message.author.id != lootFile[args[0]].originalAuthor && !utilityFuncs.isAdmin(message)) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)

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
            items: []
        }

        for (i in args) {
            if (i % 4 == 3) {
                lootFile[name].items.push({
                    type: args[i-3],
                    id: args[i-2],
                    amount: args[i-1],
                    chance: args[i]
                })
            }
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
    checkban: true,
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (!lootFile[args[0]]) return message.channel.send(`${args[0]} does not exist.`)
        if (lootFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send(`${args[0]} exists already and cannot be renamed because you don't own it!`)
        if (lootFile[args[1]]) return message.channel.send(`${args[1]} already exists.`)

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
        if (args[1].length > 50) return message.channel.send(`${args[1]} is too long of a loot table name.`);

        lootFile[args[1]] = lootFile[args[0]]
        lootFile[args[1]].name = args[1]
        delete lootFile[args[0]]

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4))

        let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));
						
		for (directory in directoryList) {
            enemyFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/enemies.json`)

            for (enemy in enemyFile) {
                if (enemyFile[enemy].loot == args[0]) enemyFile[enemy].loot = args[1]
            }

            fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/enemies.json`, JSON.stringify(enemyFile, null, 4))
        }

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
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
	],
    func: (message, args) => {
        let array = []
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        const validTypes = ['user', 'weapon', 'item', 'armor'];

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

        for (let loot in lootFile) {
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

                            isConditionMet = (lootFile[loot].originalAuthor == args[a])
                            break;
                        case 'item':
                        case 'weapon':
                        case 'armor':
                            if (args[a].toString().toLowerCase() != 'true' && args[a].toString().toLowerCase() != 'false') {
                                isConditionMet = false
                                if (lootFile[loot].items) {
                                    for (let i in lootFile[loot].items) {
                                        if (lootFile[loot].items[i].id == args[a] && lootFile[loot].items[i].type == args[a-1]) {
                                            isConditionMet = true
                                            break;
                                        }
                                    }
                                }
                            } else {
                                if (args[a].toString().toLowerCase() == 'true') {
                                    isConditionMet = (lootFile[loot].items && lootFile[loot].items.some(item => item.type == args[a-1]))
                                } else {
                                    isConditionMet = (!lootFile[loot].items || (lootFile[loot].items && !lootFile[loot].items.some(item => item.type == args[a-1])))
                                }
                            }
                            break;
                    }
                    if (isConditionMet == false || isConditionMet == undefined) break;
                }
            }
            if (isConditionMet == false || isConditionMet == undefined) continue;

            let amount = 0
            for (i in lootFile[loot].items) {
                amount += lootFile[loot].items[i].amount
            }
            array.push({title: `${lootFile[loot].name} (${loot})`, desc: `${amount} items`});
        }

        if (array.length == 0) return message.channel.send(`No loot tables found.`);

        listArray(message.channel, array, message.author.id);
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
                    amount += lootFile[loot].items[i].amount
                }
                array.push({title: `${lootFile[loot].name} (${loot})`, desc: `${amount} items`});
            }
        }

        if (array.length == 0) return message.channel.send(`No loot tables found with the phrase ${args[0]}.`);

        listArray(message.channel, array, message.author.id);
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
    checkban: true,
    func: (message, args) => {
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)

        if (!lootFile[args[0]]) return message.channel.send(`${args[0]} is not a valid loot table name.`);

        if (lootFile[args[0]].originalAuthor != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this loot table, therefore, you have insufficient permissions to delete it.")

        message.channel.send(`Are you **sure** you want to delete ${lootFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this loot table.\n**Y/N**`);

        var givenResponce = false
        var collector = message.channel.createMessageCollector({ time: 15000 });
        collector.on('collect', m => {
            if (m.author.id == message.author.id) {
                if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
                    message.channel.send(`${lootFile[args[0]].name} has been erased from existance.`)
                    delete lootFile[args[0]]

                    fs.writeFileSync(`${dataPath}/json/${message.guild.id}/loot.json`, JSON.stringify(lootFile, null, 4));

                    let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));
                    for (directory in directoryList) {
                        enemyFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/enemies.json`)
            
                        for (enemy in enemyFile) {
                            if (enemyFile[enemy].loot == args[0]) enemyFile[enemy].loot = ''
                        }
            
                        fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/enemies.json`, JSON.stringify(enemyFile, null, 4))
                    }
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