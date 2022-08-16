commands.registerchar = new Command({
	desc: `Register a character to use in-battle! Characters can learn skills, use items, and initiate in combat, along with wayyy more!.`,
	aliases: ['registercharacter', 'makechar', 'regchar', 'regcharacter', 'charmake'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Main Element",
			type: "Word",
			forced: true
		},
		{
			name: "Base HP",
			type: "Num",
			forced: true
		},
		{
			name: "Base MP",
			type: "Num",
			forced: true
		},
		{
			name: "Base Strength",
			type: "Num",
			forced: true
		},
		{
			name: "Base Magic",
			type: "Num",
			forced: true
		},
		{
			name: "Base Perception",
			type: "Num",
			forced: true
		},
		{
			name: "Base Endurance",
			type: "Num",
			forced: true
		},
		{
			name: "Base Charisma",
			type: "Num",
			forced: true
		},
		{
			name: "Base Intelligence",
			type: "Num",
			forced: true
		},
		{
			name: "Base Agility",
			type: "Num",
			forced: true
		},
		{
			name: "Base Luck",
			type: "Num",
			forced: true
		},
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (enmFile[args[0]]) {
			message.channel.send(`${args[0]} already exists as an enemy. I'll add (Character) to the end of the name for you.`);
			args[0] += '(Character)';
		}

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) {
				return message.channel.send(`${args[0]} already exists, and you don't own them. You cannot overwrite them.`);
			} else {
				message.channel.send(`${args[0]} already exists, so I'll overwrite them for you.`);
			}
		}

		if (!utilityFuncs.inArray(args[1].toLowerCase(), Elements)) return message.channel.send({content: 'Please enter a valid element for **Main Element!**', embeds: [elementList()]});
		if (args[1].toLowerCase() === 'passive' || args[1].toLowerCase() === 'almighty') return message.channel.send('You cannot use **Passive** or **Almighty** as your main element.');

		if ((args[2] + args[3]) > settings.caps.hpmpcap) return message.channel.send(`The maximum total points for HP and MP is ${settings.caps.hpmpcap}! Currently, you have ${args[2]+args[3]}.`);

		let bst = 0;
		for (let i = 4; i < args.length; i++) {
			if (args[i]) {
				if (args[i] <= 0) return message.channel.send("You can't have a stat that is less than 0!");
				if (args[i] > settings.caps.basestatcap) return message.channel.send("You can't have a stat that is more than 10!");
				bst += args[i];
			}
		}

		if (bst > settings.caps.bstcap) return message.channel.send(`${settings.caps.bstcap} is the maximum amount of points across stats! Currently, you have ${bst}.`)
		if (bst < 30) message.channel.send(`${bst}BST is... sort of concerning. I-I won't stop you.`)

		let charDefs = writeChar(message.author, message.guild, args[0], args[1].toLowerCase(), args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]);
		message.channel.send({content: `${args[0]} has been registered!`, embeds: [briefDescription(charDefs)]})

		// Get "New Beginings" achievement.
		winAchievement(message.author, 0);
	}
})

commands.changetruename = new Command({
	desc: `Rename a character/enemy's true name.`,
	aliases: ['changetruename', 'changename', 'changenamechange'],
	section: "characters",
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		},
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''

		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to rename ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (args[1] == "" || args[1] == " ") return message.channel.send('Invalid new character name! Please enter an actual name.');

		if (thingDefs[args[1]]) return message.channel.send(`${args[1]} already exists!`);
		if (args[0] === args[1]) return message.channel.send("...What's the point...?");

		if (thingDefs[args[0]].type) {
			if (charFile[args[1]]) return message.channel.send(`${args[1]} already exists as a character! I cannot let you rename the enemy for access reasons.`);
		} else {
			if (enemyFile[args[1]]) return message.channel.send(`${args[1]} already exists as an enemy! I cannot let you rename the character for access reasons.`);
		}

		thingDefs[args[1]] = objClone(thingDefs[args[0]]);
		delete thingDefs[args[0]];

		if (thingDefs[args[1]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
			let settings = setUpSettings(message.guild.id);
			for (i in settings.encountered) {
				if (settings.encountered[i] == args[0]) settings.encountered[i] = args[1];
			}
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}

		chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
        for (let channel in chestFile) {
            for (let chest in chestFile[channel]) {
                if (chestFile[channel][chest].lock[0] == 'character' || chestFile[channel][chest].lock[0] == 'pet') {
                    if (chestFile[channel][chest].lock[1] == args[0]) {
                        chestFile[channel][chest].lock[1] = args[1]
                    }
                }
            }
        }
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, '    '));

		partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
		for (let party in partyFile) {
			for (let member in partyFile[party].members) {
				if (partyFile[party].members[member] == args[0]) {
					partyFile[party].members[member] = args[1]
				}
			}
			if (partyFile[party].backup) {
				for (let member in partyFile[party].backup) {
					if (partyFile[party].backup[member] == args[0]) {
						partyFile[party].backup[member] = args[1]
					}
				}
			}
			if (partyFile[party].curPet == args[0]) {
				partyFile[party].curPet = args[1]
			}
			if (partyFile[party].negotiates && partyFile[party].negotiates[args[0]]) {
				partyFile[party].negotiates[args[1]] = partyFile[party].negotiates[args[0]];
				delete partyFile[party].negotiates[args[0]];
			}
			if (partyFile[party].negotiateAllies && partyFile[party].negotiateAllies[args[0]]) {
				partyFile[party].negotiateAllies[args[1]] = partyFile[party].negotiateAllies[args[0]];
				delete partyFile[party].negotiateAllies[args[0]]
			}
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(partyFile, null, '    '));

		trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)
		for (let trial in trialFile) {
			for (let wave in trialFile[trial].waves) {
				for (let enemy in trialFile[trial].waves[wave]) {
					if (trialFile[trial].waves[wave][enemy] == args[0]) {
						trialFile[trial].waves[wave][enemy] = args[1]
					}
				}
			}
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, '    '));

		message.channel.send(`${args[0]} has been renamed to ${args[1]}!`);
	}
})


commands.renamechar = new Command({
	desc: `Change a character/enemy's display name.`,
	aliases: ['renamecharacter', 'renamechar', 'charname', 'charnamechange'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		},
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''

		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to rename ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (args[1] == "" || args[1] == " ") return message.channel.send('Invalid new character name! Please enter an actual name.');
		if (thingDefs[args[0]].name === args[1]) return message.channel.send("...What's the point...?");

		thingDefs[args[0]].name = args[1];

		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
		message.channel.send(`${args[0]}'s name has been changed to ${args[1]}!`);

		partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
		for (let party in partyFile) {
			if (partyFile[party].negotiateAllies && partyFile[party].negotiateAllies[args[0]]) {
				if (partyFile[party].negotiateAllies[args[0]].name == args[0])
					partyFile[party].negotiateAllies[args[0]].name = args[1]
			}
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(partyFile, null, '    '));
	}
})

commands.getchar = new Command({
	desc: "Lists a character's stats, skills and more!",
	aliases: ['findchar', 'charinfo', 'chardesc'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Level",
			type: "Num",
			forced: false
		}
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');

		// Alright, let's get the character!
		let DiscordEmbed = longDescription(charFile[args[0]], args[1] ?? charFile[args[0]].level, message.guild.id, message);
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.getgear = new Command({
	desc: "Lists a character's gear and equipment, like held items, weapons, armor and more.",
	aliases: ['getequipment'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');

		let char = charFile[args[0]];

		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor(elementColors[char.mainElement])
			.setTitle(`__${elementEmoji[char.mainElement]}${char.name}'s gear__`);

		if (char.curweapon) {
			var desc = '';
			if (char.curweapon.class) desc += `_${char.curweapon.class}_ weapon\n`;
			if (char.curweapon.melee) desc += `${char.curweapon.melee}<:physical:973077052129423411>\n`;

			if (char.curweapon.atk) desc += `+${char.curweapon.atk}ATK\n`;
			if (char.curweapon.mag) desc += `+${char.curweapon.mag}MAG\n`;
			if (char.curweapon.skill) desc += `Grants __${char.curweapon.skill}__\n`;

			if (char.curweapon.desc) desc += `_${char.curweapon.desc}_`;

			if (desc != '') DiscordEmbed.fields.push({ name: `Current Weapon: __${char.curweapon.name}__`, value: desc, inline: false });
		}

		if (char.curarmor) {
			var desc = '';
			if (char.curarmor.class) desc += `_${char.curarmor.class}_ armor\n`;

			if (char.curarmor.end) desc += `+${char.curarmor.end}END\n`;
			if (char.curarmor.skill) desc += `Grants __${char.curarmor.skill}__\n`;

			if (char.curarmor.desc) desc += `_${char.curarmor.desc}_`;

			if (desc != '') DiscordEmbed.fields.push({ name: `Current Armor: __${char.curarmor.name}__`, value: desc, inline: false });
		}

		if (char.weapons && Object.keys(char.weapons).length > 0) {
			let weapons = '';
			for (let i in char.weapons) {
				weapons += `**${char.weapons[i].name}** - Lv ${char.weapons[i].level ?? 1}\n`;
			}

			if (weapons != '') DiscordEmbed.fields.push({ name: "Weapons List", value: weapons, inline: true });
		}

		if (char.armors && Object.keys(char.armors).length > 0) {
			let armors = '';
			for (let i in char.armors) {
				armors += `**${char.armors[i].name}** - Lv ${char.armors[i].level ?? 1}\n`;
			}

			if (armors != '') DiscordEmbed.fields.push({ name: "Armor List", value: armors, inline: true });
		}

		if (DiscordEmbed.fields.length < 1) return message.channel.send('This character has no gear!');

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.listchars = new Command({
	desc: 'Lists *all* existing characters. Types and Variables must be written as shown.',
	section: "characters",
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
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		const validTypes = ['element', 'superweak', 'weak', 'resist', 'block', 'repel', 'drain', 'user', 'level', 'leaderskills', 'limitbreaks', 'charms', 'transformations', 'teamcombos', 'skill'];

		let settings = setUpSettings(message.guild.id);

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
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message, settings)
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

		for (const i in charFile) {
			if (charFile[i].hidden) continue;

			let isConditionMet = true;
			for (a in args) {
				if (a % 2 == 1) {
					switch (args[a-1].toLowerCase()) {
						case 'element':
							args[a] = args[a].toLowerCase();
							isConditionMet = (charFile[i].mainElement == args[a])
							break;
						case 'superweak':
						case 'weak':
						case 'resist':
						case 'block':
						case 'repel':
						case 'drain':
							args[a] = args[a].toLowerCase();
							if (utilityFuncs.inArray(args[a], Elements)) {
								isConditionMet = (charFile[i].affinities[args[a-1]] && charFile[i].affinities[args[a-1]].includes(args[a]))
							} else if (utilityFuncs.inArray(args[a], statusEffects)) {
								isConditionMet = (charFile[i].statusaffinities[args[a-1]] && charFile[i].statusaffinities[args[a-1]].includes(args[a]))
							}
							break;
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
								let user = message.guild.members.cache.find(m => m.id == variable);
								args[a] = user.id;
							}
							if (message.mentions.members.size > 0) {
								args[a] = message.mentions.members.first().id;
							}

							isConditionMet = (charFile[i].owner == args[a])
							break;
						case 'level':
							args[a] = args[a].toLowerCase();
							args[a] = parseInt(args[a]);
							isConditionMet = (charFile[i].level == args[a])
							break;
						case 'leaderskills':
							args[a] = args[a].toLowerCase();
							if (args[a] == 'true') {
								isConditionMet = (charFile[i].leaderskill && Object.keys(charFile[i].leaderskill).length > 0)
							} else if (args[a] == 'false'){
								isConditionMet = ((charFile[i].leaderskill && Object.keys(charFile[i].leaderskill).length == 0) || !charFile[i].leaderskill)
							} else {
								isConditionMet = (charFile[i].leaderskill && charFile[i].leaderskill.type == args[a])
							}
							break;
						case 'limitbreaks':
							if (isNaN(args[a])) {
								args[a] = args[a].toLowerCase();
								if (args[a] == 'true') {
									isConditionMet = (charFile[i].lb && Object.keys(charFile[i].lb).length > 0)
								} else if (args[a] == 'false') {
									isConditionMet = ((charFile[i].lb && Object.keys(charFile[i].lb).length == 0) || !charFile[i].lb)
								} else {
									isConditionMet = (charFile[i].lb && charFile[i].lb[1] && charFile[i].lb[1].class == args[a])
								}
							} else {
								args[a] = parseInt(args[a]);
								isConditionMet = (charFile[i].lb && charFile[i].lb[args[a]])
							}
							break;
						case 'charms':
							args[a] = args[a].toLowerCase();
							args[a] = args[a] == 'true' || args[a] == 'yes' || args[a] == 'y' || args[a] == '1';
							if (args[a]) {
								isConditionMet = (charFile[i].charms && charFile[i].charms.length > 0)
							} else {
								isConditionMet = (charFile[i].charms.length == 0 || !charFile[i].charms)
							}
							break;
						case 'transformations':
							args[a] = args[a].toLowerCase();
							if (args[a] == 'true') {
								isConditionMet = (charFile[i].transformations && Object.keys(charFile[i].transformations).length > 0)
							} else if (args[a] == 'false') {
								isConditionMet = ((charFile[i].transformations && Object.keys(charFile[i].transformations).length == 0) || !charFile[i].transformations)
							} else {
								isConditionMet = false;
								if (charFile[i].transformations) {
									for (j in charFile[i].transformations) {
										if (charFile[i].transformations[j].requirement == args[a]) {
											isConditionMet = true;
											break;
										}
									}
								}
							}
							break;
						case 'teamcombos':
							if (args[a] == 'true') {
								isConditionMet = (charFile[i].teamCombo && Object.keys(charFile[i].teamCombo).length > 0)
							} else if (args[a] == 'false'){
								isConditionMet = ((charFile[i].teamCombo && Object.keys(charFile[i].teamCombo).length == 0) || !charFile[i].teamCombo)
							} else {
								isConditionMet = (charFile[i].teamCombo && charFile[i].teamCombo[args[a]])
							}
							break;
						case 'skill':
							isConditionMet = charFile[i].skills && charFile[i].skills.includes(args[a])
							break;
					}

					if (isConditionMet == false || isConditionMet == undefined) break;
				}
			}
			if (isConditionMet == false || isConditionMet == undefined) continue;

			let descTxt = `${charFile[i].hp}/${charFile[i].maxhp}HP, ${charFile[i].mp}/${charFile[i].maxmp}MP`;

			array.push({title: `${elementEmoji[charFile[i].mainElement]}${charFile[i].name} (${i})`, desc: descTxt});
		}
		if (array.length == 0) return message.channel.send('No characters found!');

		listArray(message.channel, array, message.author.id);
	}
})

commands.searchchars = new Command({
	desc: 'Searches for characters by phrase.',
	section: "characters",
	args: [
		{
			name: "Phrase",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let array = [];
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		for (const i in charFile) {
			if (charFile[i].hidden) continue;
			if (charFile[i].name.toLowerCase().includes(args[0].toLowerCase()) || i.toLowerCase().includes(args[0].toLowerCase())) {
				array.push({title: `${elementEmoji[charFile[i].mainElement]}${charFile[i].name} (${i})`, desc: `${charFile[i].hp}/${charFile[i].maxhp}HP, ${charFile[i].mp}/${charFile[i].maxmp}MP`});
			}
		}

		if (array.length == 0) return message.channel.send('No characters found!');

		listArray(message.channel, array, message.author.id);
	}
})

commands.nickname = new Command({
	desc: `Change the character's nickname.`,
	aliases: ['nick', 'shortname'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Nick Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		if (args[1].toLowerCase() === 'none' || args[1] === '-') {
			delete charFile[args[0]].nickname;
			message.channel.send(`👍 ${charFile[args[0]].name}'s nickname was removed.`)
		} else {
			charFile[args[0]].nickname = args[1];
			message.channel.send(`👍 ${charFile[args[0]].name}'s nickname was changed to "${args[1]}".`)
		}

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.hidechar = new Command({
	desc: 'Stops the character from being found in lists. You can still find them via "getchar".',
	aliases: ['hide', 'secretchar'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		charFile[args[0]].hidden = !charFile[args[0]].hidden;
		message.channel.send(`👍 ${charFile[args[0]].name}'s visibility was toggled ${charFile[args[0]].hidden ? "on" : "off"}.`)
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.mpmeter = new Command({
	desc: `Change the character's MP Meter.`,
	aliases: ['magicmeter'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Full Name",
			type: "Word",
			forced: true
		},
		{
			name: "Abreviated Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		message.channel.send(`👍 ${charFile[args[0]].name}'s ${charFile[args[0]].mpMeter[1]} meter was changed to a ${args[2].toUpperCase()} meter. ${charFile[args[0]].name} uses ${args[1]} now.`)
		charFile[args[0]].mpMeter = [args[1], args[2].toUpperCase()]
	}
})

commands.mainelement = new Command({
	desc: "Changes the character's Main Element. A Main Element is an element that the character is proficient in. Skills with the main element as it's **sole** type will deal 1.1x damage when attacking enemies.",
	aliases: ['setelement', 'setmainelement', 'changeelement', 'element', 'maintype', 'settype'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Main Element",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''

		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a main element to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (!utilityFuncs.inArray(args[1].toLowerCase(), Elements)) return message.channel.send({content: 'Please enter a valid element for **Main Element!**', embeds: [elementList()]});
		if (args[1].toLowerCase() == 'almighty' && !thingDefs[args[0]].type) return message.channel.send(`${args[0]} can't have Almighty as their main element!`);

		thingDefs[args[0]].mainElement = args[1].toLowerCase();
		message.channel.send(`👍 ${thingDefs[args[0]].name}'s main element is now ${args[1].charAt(0).toUpperCase()+args[1].slice(1)}`);
		
		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.weaponclass = new Command({
	desc: `Change the character's weapon class.`,
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon Class",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon Class #2",
			type: "Word",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		let char = charFile[args[0]];

		if (!weaponClasses[args[1].toLowerCase()]) return message.channel.send(`${args[1]} is an invalid weapon class.`)

		if (args[2]) {
			if (!weaponClasses[args[2].toLowerCase()]) return message.channel.send(`${args[2]} is an invalid weapon class.`);
			char.weaponclass = [args[1].toLowerCase(), args[2].toLowerCase()];
		} else {
			char.weaponclass = args[1].toLowerCase();
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.armorclass = new Command({
	desc: `Change the character's armor class.`,
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Armor Class",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		let char = charFile[args[0]];

		if (!armorClasses[args[1].toLowerCase()]) return message.channel.send(`${args[1]} is an invalid armor class.`)
		char.armorclass = args[1].toLowerCase();

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

// Affinities

// Get element affinity.
/*
getAffinity = (charDefs, element) => {
	if (element.toLowerCase() == 'almighty') return 'neutral';
	if (!charDefs.affinities) return 'neutral';

	for (let i in Affinities) {
		if (charDefs.affinities[Affinities[i]] && charDefs.affinities[Affinities[i]].length > 0) {
			for (let k in charDefs.affinities[Affinities[i]]) {
				if (charDefs.affinities[Affinities[i]][k].toLowerCase() === element.toLowerCase()) return Affinities[i];
			}
		}
	}

	return 'neutral';
}
*/

// Has the specified affinities
hasAffinity = (charDefs, element, affinity) => {
	if (element.toLowerCase() == 'almighty') return false;

	if (!charDefs.affinities) return false;
	if (!charDefs.affinities[affinity]) return false;

	for (const aff of charDefs.affinities[affinity]) {
		if (aff.toLowerCase() == element.toLowerCase()) return true;
	}

	return false;
}

hasStatusAffinity = (charDefs, element, affinity) => {
	if (element.toLowerCase() == 'almighty') return false;

	if (!charDefs.statusaffinities) return false;
	if (!charDefs.statusaffinities[affinity]) return false;

	for (const aff of charDefs.statusaffinities[affinity]) {
		if (aff.toLowerCase() == element.toLowerCase()) return true;
	}

	return false;
}

commands.setaffinity = new Command({
	desc: "Characters can deal less or more damage to others depending on their affinities! Weakness affinities increase the damage output of skills, while resisting ones lower or nullify damage.",
	aliases: ['seteffectiveness', 'affinity', 'effectiveness'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Element",
			type: "Word",
			forced: true
		},
		{
			name: "Affinity",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// a LOT of checks :(
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign an affinity to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		// Element Affinities
		if (utilityFuncs.inArray(args[1].toLowerCase(), Elements)) {
			if (!utilityFuncs.inArray(args[2].toLowerCase(), Affinities) && args[2].toLowerCase() != 'normal') return message.channel.send('Please enter a valid affinity!```diff\n+ SuperWeak\n+ Weak\n+ Normal\n+ Resist\n+ Block\n+ Repel\n+ Drain```');
			if (args[1].toLowerCase() == 'almighty' || args[1].toLowerCase() == 'status' || args[1].toLowerCase() == 'passive' || args[1].toLowerCase() == 'heal') return message.channel.send(`You can't set ${args[1]} affinities!`);

			if (hasAffinity(thingDefs[args[0]], args[1].toLowerCase(), args[2].toLowerCase())) return message.channel.send(`${thingDefs[args[0]].name} already has a ${args[2]} affinity to ${args[1].charAt(0).toUpperCase()+args[1].slice(1).toLowerCase()}!`);

			// Clear Affinities
			for (let a of Affinities) {
				if (a && thingDefs[args[0]].affinities[a]) {
					for (const k in thingDefs[args[0]].affinities[a]) {
						if (thingDefs[args[0]].affinities[a][k].toLowerCase() === args[1].toLowerCase()) {
							thingDefs[args[0]].affinities[a].splice(k, 1);
							break;
						}
					}
				}
			}

			// Apply Affinities (ignore if normal)
			if (args[2].toLowerCase() != 'normal') {
				if (!thingDefs[args[0]].affinities[args[2].toLowerCase()]) thingDefs[args[0]].affinities[args[2].toLowerCase()] = [];
				thingDefs[args[0]].affinities[args[2].toLowerCase()].push(args[1].toLowerCase());
			}
		// Status Affinities
		} else if (utilityFuncs.inArray(args[1].toLowerCase(), statusEffects)) {
			if (setUpSettings(message.guild.id).mechanics.stataffinities === false) return message.channel.send("Status Affinities are disabled for this server.");
			if (!thingDefs[args[0]].statusaffinities) thingDefs[args[0]].statusaffinities = {};

			if ((!utilityFuncs.inArray(args[2].toLowerCase(), Affinities) && args[2].toLowerCase() != 'normal') || args[2].toLowerCase() === 'superweak' || args[2].toLowerCase() === 'repel' || args[2].toLowerCase() === 'drain') return message.channel.send('Please enter a valid affinity!```diff\n+ Weak\n+ Normal\n+ Resist\n+ Block```');
			if (args[1].toLowerCase() == 'infatuation' || args[1].toLowerCase() == 'confusion' || args[1].toLowerCase() == 'mirror') return message.channel.send(`You can't set ${args[1]} affinities!`);

			if (hasStatusAffinity(thingDefs[args[0]], args[1].toLowerCase(), args[2].toLowerCase())) return message.channel.send(`${thingDefs[args[0]].name} already has a ${args[2]} affinity to ${args[1].charAt(0).toUpperCase()+args[1].slice(1).toLowerCase()}!`);

			// Clear Affinities
			for (let a of Affinities) {
				if (thingDefs[args[0]].statusaffinities[a]) {
					if (a && thingDefs[args[0]].statusaffinities[a]) {
						for (const k in thingDefs[args[0]].statusaffinities[a]) {
							if (thingDefs[args[0]].statusaffinities[a][k].toLowerCase() === args[1].toLowerCase()) {
								thingDefs[args[0]].statusaffinities[a].splice(k, 1);
								break;
							}
						}
					}
				}
			}

			// Apply Affinities (ignore if normal)
			if (args[2].toLowerCase() != 'normal') {
				if (!thingDefs[args[0]].statusaffinities[args[2].toLowerCase()]) thingDefs[args[0]].statusaffinities[args[2].toLowerCase()] = [];
				thingDefs[args[0]].statusaffinities[args[2].toLowerCase()].push(args[1].toLowerCase());
			}
		// Neither entered.
		} else {
			return message.channel.send('Please enter a valid element or status effect to resist!');
		}

		// Display Message
		message.channel.send(`👍 ${thingDefs[args[0]].name} has a ${args[2]} affinity to ${args[1].charAt(0).toUpperCase()+args[1].slice(1).toLowerCase()}`);
		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.gainxp = new Command({
	desc: "Gives XP to a character. Enough XP can cause the character to level up! __Affected by the XP Rate of the server__.",
	aliases: ['xpup', 'getxp', 'grantxp', 'givexp'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "XP",
			type: "Num",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// Checks
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");
		if (args[1] <= 0) return message.channel.send("Don't even try it.");
		if (charFile[args[0]].level >= settings.caps.levelcap) return message.channel.send(`${charFile[args[0]].name} cannot level up any further!`);

		// gainXp function handles everything.
		gainXp(message, charFile[args[0]], args[1]);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.awardenemyxp = new Command({
	desc: "Gives XP from an enemy to a character. Enough XP can cause the character to level up! __Affected by the XP Rate of the server__.",
	aliases: ['awardxp', 'awardxpfromenemy'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	admin: 'You don\'t have permission to give XP from enemies to characters!',
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// Checks
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (!enemyFile[args[1]]) return message.channel.send('Nonexistant Enemy.');

		// gainXp function handles everything.
		gainXp(message, charFile[args[0]], enemyFile[args[1]].xp);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.levelup = new Command({
	desc: "Levels up a character.",
	aliases: ['lvlup', 'gainlevel'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Levels",
			type: "Num",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// Checks
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");
		if (args[1] <= 0) return message.channel.send("Don't even try it.");
		if (charFile[args[0]].level >= settings.caps.levelcap) return message.channel.send(`${charFile[args[0]].name} cannot level up any further!`);
		if (args[1] >= 999) return message.channel.send("Don't even try it.");

		// levelUpTimes function handles everything.
		levelUpTimes(charFile[args[0]], false, args[1], message);
		charFile[args[0]].xp = 0;

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.forcelevel = new Command({
	desc: "Manually set a charater's level. This changes all their stats to the respective level.",
	aliases: ['setlevel', 'forcelvl', 'setlvl'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Forced Level",
			type: "Num",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// Checks
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");
		if (args[1] <= 0 || args[1] > settings.caps.levelcap) return message.channel.send("Don't even try it.");

		// Actually force the Level
		charFile[args[0]].level = args[1];
		updateStats(charFile[args[0]], message.guild.id, true);

		//check every skill. if skill exists, check its level lock. If level lock is lower, set it to '', and then filter later
		for (let skill in charFile[args[0]].skills) {
			if (charFile[args[0]].skills[skill].levelLock > args[1]) charFile[args[0]].skills[skill] = '';
		}
		charFile[args[0]].skills = charFile[args[0]].skills.filter(skill => skill != '');
		charFile[args[0]].xp = 0;

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		// Send an Embed to notify us!
		let DiscordEmbed = briefDescription(charFile[args[0]]);
		DiscordEmbed.title = `${charFile[args[0]].name} was forced to Level ${args[1]}!`;
		DiscordEmbed.description = `**Level ${charFile[args[0]].level}**\n${DiscordEmbed.description}`;

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

// Trust
commands.trustxp = new Command({
	desc: "Gives Trust XP to a pair of characters. Enough XP can cause the characters to grow closer, learning new abilities and fighting styles together! __Affected by the Trust Rate of the server__.",
	aliases: ['trustxpup', 'gettrustxp', 'granttrustxp', 'givetrustxp', 'increasetrust', 'uptrust'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Character #2 Name",
			type: "Word",
			forced: true
		},
		{
			name: "XP",
			type: "Num",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " " || args[1] == "" || args[1] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// Checks
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]] || !charFile[args[1]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");
		if (args[0] == args[1]) return message.channel.send("It won't do anything in battle if you try giving yourself Trust XP.");
		if (args[2] == 0) return message.channel.send("It won't do anything when you add or subtract nothing from something");

		// changeTrust function handles everything.
		changeTrust(charFile[args[0]], charFile[args[1]], Math.round(args[2]*(settings.rates.trustrate ?? 1)), true, message.channel, args[0], args[1]);
		delete charFile[args[0]].truename;
		delete charFile[args[1]].truename;
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		message.react('👍');
	}
})

commands.cleartrust = new Command({
	desc: "Clears all Trust XP from a character with another character. You can remove a character's Trust XP in general if you want to.\n**Removing all trust of all characters will require an Administrator permission.**",
	aliases: ['cleartrust', 'removetrust', 'removetrustxp', 'removetrustxpup', 'removetrustxpup'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Character #2 Name",
			type: "Word",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (args[0].toLowerCase() == 'all') {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send("You don't have permission to do that.");
			for (let char in charFile) {
				delete charFile[char].trust;
			}
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
			message.channel.send("All Trust XP has been removed.");
		} else {
			if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");
			if (args[1] && !charFile[args[1]]) return message.channel.send('Nonexistant Character.');
			if (args[1]) {
				delete charFile[args[0]].trust[args[1]];
				delete charFile[args[1]].trust[args[0]];
			} else {
				delete charFile[args[0]].trust;
			}
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
			message.channel.send("Trust has been removed.");
		}
	}
})

// Melee Attacks!
commands.setmelee = new Command({
	desc: "A melee attack is a basic, low power skill, that you can use to save on resources or test a potentially risky plan.",
	aliases: ['meleeattack', 'melee', 'changemelee'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Attack Name",
			type: "Word",
			forced: true
		},
		{
			name: "Element",
			type: "Word",
			forced: true
		},
		{
			name: "Power",
			type: "Num",
			forced: true
		},
		{
			name: "Accuracy",
			type: "Num",
			forced: true
		},
		{
			name: "Critical Hit Chance",
			type: "Num",
			forced: true
		},
		{
			name: "Status Effect",
			type: "Word",
			forced: false
		},
		{
			name: "Status Chance",
			type: "Num",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a melee to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		// Some element and balancing checks
		if (args[2].toLowerCase() != 'strike' && args[2].toLowerCase() != 'slash' && args[2].toLowerCase() != 'pierce' && args[2].toLowerCase() != 'explode') return message.channel.send('You can only use Physical Elements in melee attacks! _(Strike, Slash, Pierce, Explode)_');
		if (args[3] > 60) return message.channel.send('Melee Attacks cannot go above **60 power**!')
		if (args[5] > 15) return message.channel.send('Melee Attacks cannot go above **15% Critical Hit Chance**!')

		// Make the Melee Attack
		thingDefs[args[0]].melee = {
			name: args[1],
			type: args[2].toLowerCase(),
			pow: args[3],
			acc: args[4],
			crit: args[5],
		}

		// Status Effects
		if (args[6] && args[6].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[6].toLowerCase(), statusEffects)) {
				let str = `${args[6]} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
				for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
				str += '```'

				return message.channel.send(str)
			}

			thingDefs[args[0]].melee.status = args[6].toLowerCase();
			statusChance = args[7] ?? 1;
			if (!isNaN(args[7]) && parseInt(args[7]) > 0) thingDefs[args[0]].melee.statuschance = Math.max(Math.min(parseInt(args[7]), 100), 1);
		}

		// Display Message
		message.channel.send(`👍 ${thingDefs[args[0]].name}'s Melee Attack has been changed to **${elementEmoji[args[2].toLowerCase()]}${args[1]}**!`);
		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

// Skill stuff!
knowsSkill = (charDefs, skill) => {
	if (!charDefs.skills) return null;
	if (charDefs.skills.length <= 0) return null;

	for (const i in charDefs.skills) {
		if (charDefs.skills[i] === skill) return i;
	}

	return null;
}

commands.learnskill = new Command({
	desc: "Skills are attacks characters can use in battle! To make one, use the ''registerskill'' command! They can make or break a character or enemy.",
	aliases: ['skilllearn', 'obtainskill'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Skill Names",
			type: "Word",
			multiple: true,
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a skill for ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (!thingDefs[args[0]].type && thingDefs[args[0]].skills.length >= settings.caps.skillamount) return message.channel.send(`You cannot have more than ${settings.caps.skillamount} skills!`);

		// Let's learn skills!
		let learnString = `👍 ${args[0]} learned `;
		let skillLearn = [];

		for (let i = 1; i < args.length; i++) {
			if (knowsSkill(thingDefs[args[0]], args[i])) return message.channel.send(`${args[0]} already knows ${args[i]}!\n\n**[TIP]**\n_Don't enter two of the same skill!_`);

			if (skillFile[args[i]]) {
				if (skillFile[args[i]].levellock) {
					if (!thingDefs[args[0]].type && skillFile[args[i]].levellock == 'unobtainable') return message.channel.send(`${args[i]} is unobtainable!`);
					if (!thingDefs[args[0]].type && thingDefs[args[0]].level < skillFile[args[i]].levellock) return message.channel.send(`${thingDefs[args[0]].name} is level ${thingDefs[args[0]].level}, but must be level ${skillFile[args[i]].levellock} to learn ${skillFile[args[i]].name}!`);
				}

				learnString += (skillFile[args[i]].name ? skillFile[args[i]].name : args[i])
				thingDefs[args[0]].skills.push(args[i])
				skillLearn.push(args[i])

				if (i == args.length-2)
					learnString += ' and '
				else if (i >= args.length-1)
					learnString += '!'
				else
					learnString += ', '
			} else
				return message.channel.send(`${args[i]} isn't a valid skill.`);
		}

		message.channel.send(learnString);

		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.replaceskill = new Command({
	desc: "Changes a skill a character or enemy knows from one to another.",
	aliases: ['changeskill'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "New Skill Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to replace a skill for ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		// Do we know the skill
		if (!skillFile[args[2]]) return message.channel.send('Invalid skill to replace with! Remember that these are case sensitive.');
		if (!knowsSkill(thingDefs[args[0]], args[1])) return message.channel.send(`${thingDefs[args[0]].name} doesn't know ${args[1]}!`);

		// Level Lock
		if (skillFile[args[2]].levellock) {
			if (!thingDefs[args[0]].type && skillFile[args[2]].levellock == 'unobtainable') return message.channel.send(`${args[2]} is unobtainable!`);
			if (!thingDefs[args[0]].type && thingDefs[args[0]].level < skillFile[args[2]].levellock) return message.channel.send(`${thingDefs[args[0]].name} is level ${thingDefs[args[0]].level}, but must be level ${skillFile[args[2]].levellock} to learn ${skillFile[args[2]].name}!`);
		}

		// Let's replace it
		let num = knowsSkill(thingDefs[args[0]], args[1])
		thingDefs[args[0]].skills[num] = args[2]

		message.react('👍');
		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.forgetskill = new Command({
	desc: "Removes a character's skill.",
	aliases: ['loseskill', 'amnesia', 'removeskill'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Skill Name",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
	
		const name = args[0]
		let thingdef

		if (charFile[name]) {
			if (!utilityFuncs.isAdmin(message) && charFile[name].owner != message.author.id) return message.channel.send(`${name} does not belong to you!`);
			thingdef = charFile[name];
		} else if (enemyFile[name]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to remove a skill for ${name}.`);
			thingdef = enemyFile[name];
		} else return message.channel.send(`${name} doesn't exist!`);

		// Do we know the skill
		args.shift()
		for (const skill of args) {
			if (!knowsSkill(thingdef, skill))
				return void message.channel.send(`${thingdef.name} doesn't know ${skill}!`)
			const num = knowsSkill(thingdef, skill)
			thingdef.skills.splice(num, 1)
		}

		message.react('👍');
		if (thingdef.type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.autolearn = new Command({
	desc: "Allows this skill to be automatically evolved when levelling up based on the skill's Evo-Skill.",
	aliases: ['autoskill', 'autoevo'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// some checks
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		// Do we know the skill
		if (!skillFile[args[1]]) return message.channel.send('Invalid skill to replace! Remember that these are case sensitive.');
		if (!knowsSkill(charFile[args[0]], args[1])) return message.channel.send(`${charFile[args[0]].name} doesn't know ${args[1]}!`);

		// Auto Learn
		if (!charFile[args[0]].autolearn) charFile[args[0]].autolearn = {};

		// Let's allow it to auto evolve
		let num = knowsSkill(charFile[args[0]], args[1]);
		charFile[args[0]].autolearn[num] = !charFile[args[0]].autolearn[num];
		message.channel.send(`${charFile[args[0]].name}'s ${skillFile[args[1]].name} automatic evolution has been toggled to ${charFile[args[0]].autolearn[num] ? 'On' : 'Off'}!`);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

let disallowedLeaderSkillElelemts = {
	boost: ['passive', 'almighty'],
	discount: ['passive'],
	crit: ['status', 'heal', 'passive'],
	endure: ['status', 'heal', 'passive']
}

let leaderTxt = '';
for (let i in leaderSkillTxt) {
	leaderTxt += `+ ${i.toUpperCase()}: ${leaderSkillTxt[i]}\n`;
}

// Leader Skills
commands.leaderskill = new Command({
	desc: "A Leader Skill is a skill characters activate for the entire team when they are at the front of a party. This can have various effects on the characters reccomended to use, the skills reccomended to use, the playstyle of your party and more!```diff\n" + leaderTxt + "```",
	aliases: ['setleaderskill', 'leadskill', 'frontskill', 'orderskill'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Leader Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Leader Skill Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable #1",
			type: "Any",
			forced: false
		},
		{
			name: "Variable #2",
			type: "Any",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		if (setUpSettings(message.guild.id).mechanics.leaderSkills == false) return message.channel.send('Leader Skills are disabled on this server.');
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// checkie
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		// ok here goes nothing
		charFile[args[0]].leaderskill = {
			name: args[1],
			type: args[2].toLowerCase()
		}
		
		let var1 = null;
		let var2 = null;

		switch(args[2].toLowerCase()) {
			case 'boost':
			case 'discount':
			case 'crit':
			case 'endure':
				if (args[3].toLowerCase() === "magic" || args[3].toLowerCase() === "physical" || args[3].toLowerCase() === "ranged" || args[3].toLowerCase() === "all") {
					if (args[4] > 10) return message.channel.send(`${args[4]}% is too powerful for a leader skill like this! The maximum for a ${args[3]} affecting leader skill is 10%.`);
				} else {
					if (!utilityFuncs.inArray(args[3].toLowerCase(), Elements)) return message.channel.send({content: `${args[3]} is an invalid element! Try one of these.`, embeds: [elementList()]});
					if (disallowedLeaderSkillElelemts[args[2].toLowerCase()].includes(args[3].toLowerCase())) return message.channel.send(`You cannot use ${args[3]} for this leader skill!`);
					if (args[4] > 30) return message.channel.send(`${args[4]}% is too powerful for a leader skill like this! The maximum for this leader skill is 30%.`);
				}

				if (args[4] < 1) return message.channel.send(`${args[4]}% is too low a boost :/`);
				var1 = args[3].toLowerCase();
				var2 = args[4];
				break;

			case 'status':
				if (!utilityFuncs.inArray(args[3].toLowerCase(), statusEffects)) return message.channel.send({content: `${args[3]} is an invalid status effect!`});
				if (args[4] > 25) return message.channel.send(`${args[4]}% is too powerful for a leader skill like this! The maximum for this leader skill is 25%.`);
				if (args[4] < 1) return message.channel.send(`${args[4]}% is too low a boost :/`);
				var1 = args[3].toLowerCase();
				var2 = args[4];
				break;

			case 'money':
			case 'items':
			case 'pacify':
				if (args[3] > 50) return message.channel.send(`${args[3]}% is too powerful for a leader skill like this! The maximum for this leader skill is 50%.`);
				if (args[3] < 1) return message.channel.send(`${args[3]}% is too low a boost :/`);
				var2 = args[3];
				break;

			case 'buff':
			case 'debuff':
				if (!utilityFuncs.inArray(args[3].toLowerCase(), stats)) return message.channel.send({content: `${args[3]} is an invalid stat!`});
				if (args[4] > 3) return message.channel.send(`${args[4]} is too powerful for a leader skill like this! The maximum for this leader skill is 3.`);
				if (args[4] < 1) return message.channel.send(`${args[4]} is too low a boost :/`);
				var1 = args[3].toLowerCase();
				var2 = args[4];
				break;

			default:
				return message.channel.send(`${args[2]} is an invalid leader skill type! Use either: Boost, Discount, Crit, Endure, Status, Money, Items, Pacify, Buff, Debuff.`);	
		}

		if (var1)
			charFile[args[0]].leaderskill.var1 = var1;
		else
			delete charFile[args[0]].leaderskill.var1;

		if (var2)
			charFile[args[0]].leaderskill.var2 = parseInt(var2);
		else
			delete charFile[args[0]].leaderskill.var2;

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.clearleaderskill = new Command({
	desc: "Clears the leader skill of a character.",
	aliases: ['clearls', 'clearleaderskill', 'clearfrontskill', 'clearorderskill'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (setUpSettings(message.guild.id).mechanics.leaderSkills == false) return message.channel.send('Leader Skills are disabled on this server.');
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// checkie
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send("You don't own this character!");

		// ok here goes nothing
		if (!charFile[args[0]].leaderskill) return message.channel.send('This character does not have a leader skill.');
		delete charFile[args[0]].leaderskill;

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

// Limit Break skills
commands.setlb = new Command({
	desc: "A Limit Break is a powerful skill exclusive to each character that they can pull off if the conditions are met. They cannot be executed if Limit Breaks are disabled for that server.",
	aliases: ['setlimitbreak', 'makelb', 'makelimitbreak'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Limit Break Name",
			type: "Word",
			forced: true
		},
		{
			name: "Limit Break Level",
			type: "Num",
			forced: true
		},
		{
			name: "Limit Break Class",
			type: "Word",
			forced: true
		},
		{
			name: "LB% Required",
			type: "Num",
			forced: true
		},
		{
			name: "Power",
			type: "Num",
			forced: true
		},
		{
			name: "Critical Hit Chance",
			type: "Decimal",
			forced: false
		},
		{
			name: "Hits",
			type: "Num",
			forced: true
		},
		{
			name: "Targets",
			type: "Word",
			forced: true
		},
		{
			name: "Status",
			type: "Word",
			forced: false
		},
		{
			name: "Status Chance",
			type: "Decimal",
			forced: false
		},
		{
			name: "Description",
			type: "Any",
			forced: false
		},
	],
	checkban: true,
	func: (message, args) => {
		if (setUpSettings(message.guild.id).mechanics.limitbreaks === false) return message.channel.send("Limit Breaks are disabled for this server.");
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a limit break to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);
	
		if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[1].length > 50) return message.channel.send(`${args[1]} is too long of a skill name.`);
	
		// So much shit to check :(
		if (args[2] > 4 || args[2] < 1) return message.channel.send('Invalid Limit Break Level! Please enter one from 1-4.');
	
		let powerBounds = [450, 600, 750, 900];
		let percentBounds = [100, 200, 300, 400];
		let levelLocks = [20, 48, 69, 85];

		if (args[2] < 1) return message.channel.send('Please enter Limit Breaks chronologically, starting from Level 1.');
		else {
			if (thingDefs[args[0]].lb && args[2] > 1) {
				if (!thingDefs[args[0]]?.lb?.[args[2]-1]) return message.channel.send(`Please enter Limit Breaks chronologically! You do not have a level ${args[2]-1} Limit Break.`);
			}
		}
	
		if (thingDefs[args[0]].level < levelLocks[args[2]-1]) return message.channel.send(`${thingDefs[args[0]].name} is level ${thingDefs[args[0]].level}, but they must be at level ${levelLocks[args[2]-1]} to obtain a level ${args[2]} limit break.`);

		if (args[3].toLowerCase() != 'atk' && args[3].toLowerCase() != 'heal') return message.channel.send('Invalid Limit Break Class! Please enter either "Atk" or "Heal".');
		if (thingDefs[args[0]].lb && args[2] > 1) {
			if (thingDefs[args[0]]?.lb?.[args[2]-1]?.class != args[3].toLowerCase()) return message.channel.send(`Please enter limit breaks within the same class! You already have a ${thingDefs[args[0]].lb[args[2]-1].class} Limit Break.`);
		}
	
		if (args[4] < percentBounds[args[2]-1]) return message.channel.send(`Level ${args[2]} Limit Breaks costs cannot be lower than ${percentBounds[args[2]-1]} LB%.`);
	
		if (args[5] < 1) return message.channel.send('Limit Break Skills with 0 power or less will not function!');
		if (args[5] > powerBounds[args[2]-1]) return message.channel.send(`Level ${args[2]} Limit Breaks cannot exceed ${powerBounds[args[2]-1]} power.`);
	
		if (args[7] < 1) return message.channel.send('Skills with 0 hits or less will not function!');
	
		if (!args[8] || !utilityFuncs.inArray(args[8].toLowerCase(), Targets)) return message.channel.send('Please enter a valid target type for **Target**!```diff\n- One\n- Ally\n- Caster\n- AllOpposing\n- AllAllies\n- RandomOpposing\n- RandomAllies\n- Random\n- Everyone\n-SpreadOpposing\n- SpreadAllies```')
	
		let skillDefs = {
			name: args[1],
			level: args[2],
			class: args[3].toLowerCase(),
			pow: args[5],
			cost: args[4],
			hits: args[7],
			target: args[8].toLowerCase(),
			originalAuthor: message.author.id
		}
	
		if (args[6] > 0) skillDefs.crit = args[6];
	
		if (args[9] && args[9].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[9].toLowerCase(), statusEffects)) {
				let str = `${args[9]} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
				for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
				str += '```'

				return message.channel.send(str);
			}
					skillDefs.status = args[9].toLowerCase();
			if (isFinite(args[10]) && args[10] < 100) skillDefs.statuschance = args[11];
		}
	
		if (args[11]) skillDefs.desc = args[11];
		
		if (!thingDefs[args[0]].lb) thingDefs[args[0]].lb = {};
		thingDefs[args[0]].lb[args[2]] = skillDefs;
	
		message.react('👍');
		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.clearlb = new Command({
	desc: 'Clears a character\'s limit breaks.',
	section: 'characters',
	aliases: ['clearlimitbreak', 'clearlimitbreaks'],
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true
		},
		{
			name: "Limit Break Level",
			type: "Num",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		if (setUpSettings(message.guild.id).mechanics.limitbreaks === false) return message.channel.send("Limit Breaks are disabled for this server.");
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a limit break to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (thingDefs[args[0]].lb && thingDefs[args[0]].lb != {}) {
			if (args[1]) {
				if (args[1] > 0 && args[1] <= Object.keys(thingDefs[args[0]].lb).length) {
					for (let i = args[1]; i <= Object.keys(thingDefs[args[0]].lb).length + 1; i++) {
						delete thingDefs[args[0]].lb[i];
					}
				} else return message.channel.send(`Limit Break level ${args[1]} does not exist for ${args[0]}.`);
			} else {
				delete thingDefs[args[0]].lb;
			}
		} else return message.channel.send(`${args[0]} doesn't have any limit breaks!`);

		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
		message.channel.send(`${args[0]}'s limit breaks have been cleared.`);
	}
})


commands.changestats = new Command({
	desc: "Change the stats of a character.",
	aliases: ['setstats', 'changestat', 'setstat'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Base HP",
			type: "Num",
			forced: true
		},
		{
			name: "Base MP",
			type: "Num",
			forced: true
		},
		{
			name: "Base Strength",
			type: "Num",
			forced: true
		},
		{
			name: "Base Magic",
			type: "Num",
			forced: true
		},
		{
			name: "Base Perception",
			type: "Num",
			forced: true
		},
		{
			name: "Base Endurance",
			type: "Num",
			forced: true
		},
		{
			name: "Base Charisma",
			type: "Num",
			forced: true
		},
		{
			name: "Base Intelligence",
			type: "Num",
			forced: true
		},
		{
			name: "Base Agility",
			type: "Num",
			forced: true
		},
		{
			name: "Base Luck",
			type: "Num",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id)
				return message.channel.send(`${args[0]} already exists, and you don't own them. You cannot change their stats.`);
		}

		if ((args[1] + args[2]) > settings.caps.hpmpcap) return message.channel.send(`The maximum total points for HP and MP is ${settings.caps.hpmpcap}! Currently, you have ${args[1]+args[2]}.`);
	
		let bst = 0;
		for (let i = 3; i < args.length-1; i++) {
			if (args[i]) {
				if (args[i] <= 0) return message.channel.send("You can't have a stat that is less than 0!");
				if (args[i] > settings.caps.basestatcap) return message.channel.send("You can't have a stat that is more than 10!");
				bst += args[i];
			}
		}

		if (bst > settings.caps.bstcap) return message.channel.send(`${settings.caps.bstcap} is the maximum amount of points across stats! Currently, you have ${bst}.`)
		if (bst < 30) message.channel.send(`${bst}BST is... sort of concerning. I-I won't stop you.`)

		charFile[args[0]].basehp = args[1];
		charFile[args[0]].basemp = args[2];
		charFile[args[0]].basestats = {
			baseatk: args[3] != 0 ? args[3] : 1,
			basemag: args[4] != 0 ? args[4] : 1,
			baseprc: args[5] != 0 ? args[5] : 1,
			baseend: args[6] != 0 ? args[6] : 1,
			basechr: args[7] != 0 ? args[7] : 1,
			baseint: args[8] != 0 ? args[8] : 1,
			baseagl: args[9] != 0 ? args[9] : 1,
			baseluk: args[10] != 0 ? args[10] : 1
		}

		updateStats(charFile[args[0]], message.guild.id, true);

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		
		// Send an Embed to notify us!
		let DiscordEmbed = briefDescription(charFile[args[0]]);
		DiscordEmbed.title = `${charFile[args[0]].name}'s stats have been changed!`;
		DiscordEmbed.description = `**Level ${charFile[args[0]].level}**\n${DiscordEmbed.description}`;
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.updatecharacters = new Command({
	desc: "Updates characters!",
	aliases: ['updatechars', 'fixchars', 'interoperability'],
	section: "moderation",
	args: [],
	func: (message, args) => {
		if (!utilityFuncs.RPGBotAdmin(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are not a hardcoded admin of this bot.`);

		let newFile = {}
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		for (let i in charFile) {
			newFile[i] = objClone(charFile[i]);				
			delete newFile[i].autoLearn;
			delete newFile[i].leaderSkill;
			for (let k of stats) delete newFile[i][k];
			for (let k of Affinities) delete newFile[i][k];
			for (let k of stats) delete newFile[i][`base${k}`];
			for (let k = 1; k < 4; k++) delete newFile[i][`lb${k}`];
			for (let k of quoteTypes) delete newFile[i][`${k}quote`];

			newFile[i].name = i;

			// Melee Attack
			newFile[i].melee = {
				name: charFile[i].melee[0],
				type: charFile[i].melee[1],
				pow: 30,
				acc: 95,
				crit: 15
			}

			// Weapons and Armor
			newFile[i].weapon = {}
			newFile[i].armor = {}

			// Main stats
			newFile[i].stats = {
				atk: charFile[i].atk,
				mag: charFile[i].mag,
				prc: charFile[i].prc,
				end: charFile[i].end,
				chr: charFile[i].chr,
				int: charFile[i].int,
				agl: charFile[i].agl,
				luk: charFile[i].luk
			}

			newFile[i].basestats = {
				baseatk: charFile[i].baseatk,
				basemag: charFile[i].basemag,
				baseprc: charFile[i].baseprc,
				baseend: charFile[i].baseend,
				basechr: charFile[i].basechr,
				baseint: charFile[i].baseint,
				baseagl: charFile[i].baseagl,
				baseluk: charFile[i].baseluk
			}

			// Affinities & Skills
			newFile[i].affinities = {
				superweak: charFile[i].superweak,
				weak: charFile[i].weak,
				resist: charFile[i].resist,
				block: charFile[i].block,
				repel: charFile[i].repel,
				drain: charFile[i].drain
			}

			newFile[i].autolearn = charFile[i].autoLearn

			// Quotes
			if (!newFile[i].quotes) newFile[i].quotes = {};
			for (const k in quoteTypes) {
				newFile[i].quotes[`${quoteTypes[k]}quote`] = charFile[i][`${quoteTypes[k]}quote`];
			}
			
			// Leader Skills
			if (charFile[i].leaderSkill) {
				newFile[i].leaderskill = {
					name: charFile[i].leaderSkill.name,
					type: charFile[i].leaderSkill.type,
					var1: charFile[i].leaderSkill.target,
					var2: charFile[i].leaderSkill.percent
				}
			}

			// LBs
			if (!newFile[i].lb) newFile[i].lb = {};

			for (let k = 1; k < 4; k++) {
				if (charFile[i][`lb${k}`]) newFile[i].lb[k] = charFile[i][`lb${k}`];
			}

			// Bio Info
			if (typeof charFile[i].bio.age != typeof newFile[i].bio.height) newFile[i].bio.height = [4, 0]
			if (typeof charFile[i].bio.age != typeof newFile[i].bio.weight) newFile[i].bio.weight = 0
			if (typeof charFile[i].bio.age != typeof newFile[i].bio.age) newFile[i].bio.age = 10
			if (!charFile[i].bio.custom) newFile[i].bio.custom = {}

			// Update Stats, for certain changes in new BB.
			updateStats(newFile[i], message.guild.id, true);

			// Update Trust
			if (charFile[i].trust) {
				for (let k in charFile[i].trust) {
					if (charFile[i]?.trust[k]?.nextLevel) {
						newFile[i].trust[k] = {
							amount: charFile[i].trust[k].value,
							level: charFile[i].trust[k].level,
						}
					}
					newFile[i].trust[k].maximum = 100+((charFile[i].trust[k].level-1)*15)
					delete newFile[i].trust[k].nextLevel;

					while (newFile[i].trust[k].amount >= newFile[i].trust[k].maximum) {
						newFile[i].trust[k].level++;
						newFile[i].trust[k].amount -= newFile[i].trust[k].maximum;
						newFile[i].trust[k].maximum = 100+((newFile[i].trust[k].level-1)*15);
					}
				}
			}
		}
		
		// delete old shit
		setTimeout(function() {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(newFile, null, '    '));
			message.channel.send('Characters have been updated from an older version to a newer one!');
		}, 300)
	}
})

commands.purgechar = new Command({
	desc: `Deletes a character. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
	section: 'characters',
	aliases: ['unregisterchar', 'charpurge', 'charunregister', 'deletechar', 'chardelete'],
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character name.`);

		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this character, therefore, you have insufficient permissions to delete it.")

		message.channel.send(`Are you **sure** you want to delete ${charFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this character.\n**Y/N**`);

		var givenResponce = false
		var collector = message.channel.createMessageCollector({ time: 15000 });
		collector.on('collect', m => {
			if (m.author.id == message.author.id) {
				if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
					message.channel.send(`${charFile[args[0]].name} has been erased from existance.`)
					delete charFile[args[0]]

					chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
					for (let channel in chestFile) {
						for (let chest in chestFile[channel]) {
							if (chestFile[channel][chest].lock[0] == 'character') {
								if (chestFile[channel][chest].lock[1] == args[0]) {
									chestFile[channel][chest].lock = ['none', '']
								}
							}
						}
					}
					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, '    '));

					partyFile = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
					for (let party in partyFile) {
						partyFile[party].members = partyFile[party].members.filter(m => m != args[0])
						if (partyFile[party].backup) {
							partyFile[party].backup = partyFile[party].backup.filter(m => m != args[0])
						}
					}
					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(partyFile, null, '    '));

					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, 4));
				} else
					message.channel.send(`${charFile[args[0]].name} will not be deleted.`);
				
				givenResponce = true
				collector.stop()
			}
		});
		collector.on('end', c => {
			if (givenResponce == false)
				message.channel.send(`No response given.\n${charFile[args[0]].name} will not be deleted.`);
		});
	}
})

commands.randchar = new Command({
	desc: `Get a random character.`,
	section: "roll",
	aliases: ['randomchar'],
	args: [],
	func: (message, args) => {
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)

		if (Object.keys(charFile).length == 0) return message.channel.send(`No characters have been added yet.`);
		
		let char = Object.keys(charFile)[Math.floor(Math.random() * Object.keys(charFile).length)];

		let DiscordEmbed = longDescription(charFile[char], charFile[char].level, message.guild.id, message);
		message.channel.send({content:`Congratulations, ${message.guild.members.cache.get(charFile[char].owner).user.username}! ${elementEmoji[charFile[char].mainElement]} ${charFile[char].name} has been rolled!`, embeds: [DiscordEmbed]})
	}
})

commands.dailychar = new Command({
	desc: 'Any random character can be set as a daily one! Test your luck to see if yours is here!',
	section: "roll",
	args: [],
	func: (message, args) => {
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)

		if (Object.keys(charFile).length == 0) return message.channel.send(`No characters have been added yet!`);
		if (!dailyChar) dailyChar = {};

		let notice = 'Here is the daily character, again.'
		if (!dailyChar[message.guild.id]) {
			dailyChar[message.guild.id] = Object.keys(charFile)[Math.floor(Math.random() * Object.keys(charFile).length)];

			let authorTxt = charFile[dailyChar[message.guild.id]].owner ? `<@!${charFile[dailyChar[message.guild.id]].owner}>` : '<@776480348757557308>'
			notice = `${authorTxt}, your character is the daily character for today!`;
		}

		setTimeout(function() {
			if (charFile[dailyChar[message.guild.id]]) {
				let today = getCurrentDate();

				fs.writeFileSync(dataPath+'/dailycharacter.txt', JSON.stringify(dailyChar));

				let charTxt = `**[${today}]**\n${notice}`
				let DiscordEmbed = longDescription(charFile[dailyChar[message.guild.id]], charFile[dailyChar[message.guild.id]].level, message.guild.id, message);
				message.channel.send({content: charTxt, embeds: [DiscordEmbed]});
			}
		}, 500);
	}
})

// Quotes... oh boy.
selectQuote = (char, quote, neverEmpty, ...rep) => {
	if (char.status && (char.status === 'sleep' || char.status === 'freeze')) return '';

	let emptyTxt = neverEmpty ? 'No quotes in this section!' : '';

	if (!char.quotes[`${quote}quote`]) return emptyTxt;
	if (char.quotes[`${quote}quote`].length < 1) return emptyTxt;

	let randQuote = Math.round(Math.random() * (char.quotes[`${quote}quote`].length-1));

	let q = char.quotes[`${quote}quote`][randQuote];
	if (rep && rep.length > 1) q = replaceTxt(q, ...rep);

	return `_${char.name}: "${q}"_\n`;
}

commands.setquote = new Command({
	desc: "Quotes are things characters will say in battle! This can help give them more personality and uniqueness.",
	aliases: ['makequote', 'sq'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Quote Type",
			type: "Word",
			forced: true
		},
		{
			name: "The Quote",
			type: "Word",
			forced: true
		},
		{
			name: "Quote ID",
			type: "Num",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a quote to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (args[2].length > 120) return message.channel.send('This quote is too long!');

		if (!utilityFuncs.inArray(args[1].toLowerCase(), quoteTypes)) {
			let quoteStr = '```diff\n';
			for (let quote of quoteTypes) quoteStr += `- ${quoteTypes}`;
			quoteStr += '```';

			return message.channel.send(`Invalid Quote Type! Try one of these:${quoteTypes}`);
		}

		if (!thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`]) thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`] = [];
		if (args[3] && thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`][args[3]]) thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`][args[3]] = args[2];
		else thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`].push(args[2]);

		message.react('👍');
		if (thingDefs[args[0]].type) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		} else {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.clearquote = new Command({
	desc: 'Removes a quote, group of quotes or all quotes from a character.',
	aliases: ['clearquotes', 'cq'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Quote Type",
			type: "Word",
			forced: false
		},
		{
			name: "Quote ID",
			type: "Num",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to remove a quote to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (!args[1]) {
			message.channel.send('**[WARNING]**\nAre you sure? **YOU CANNOT GET THESE BACK!**')
			
			let givenResponce = false
			let collector = message.channel.createMessageCollector({ time: 15000 });
			collector.on('collect', m => {
				if (m.author.id == message.author.id) {
					if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
						m.react('👍');
						message.react('👍');

						for (const i in quoteTypes) thingDefs[args[0]].quotes[`${quoteTypes[i]}quote`] = [];
						if (thingDefs[args[0]].type) {
							fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
						} else {
							fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
						}
					} else {
						m.react('👍');
						message.react('👍');
						message.channel.send(`${thingDefs[args[0]]} will not be cleansed of their quotes.`);
					}
				}
			});
			collector.on('end', c => {
				if (givenResponce == false) message.channel.send("I'll... take that as a no.");
			});
		} else {
			if (!utilityFuncs.inArray(args[1].toLowerCase(), quoteTypes)) {
				let quoteStr = '```diff\n';
				for (let quote of quoteTypes) quoteStr += `- ${quoteTypes}`;
				quoteStr += '```';

				return message.channel.send(`Invalid Quote Type! Try one of these:${quoteTypes}`);
			}

			if (args[2]) {
				if (!thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`]) thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`] = [];
				thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`].splice(args[2], 1);
			} else {
				thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`] = [];
			}

			message.react('👍');
			if (thingDefs[args[0]].type) {
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
			} else {
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
			}
		}
	}
})

commands.getquotes = new Command({
	desc: "View a character's quotes.",
	aliases: ['seequotes', 'showquotes'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Quote Type",
			type: "Word",
			forced: false
		}
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let thingDefs = ''
	
		if (charFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`${args[0]} does not belong to you!`);
			thingDefs = charFile;
		} else if (enemyFile[args[0]]) {
			if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to assign a main element to ${args[0]}.`);
			thingDefs = enemyFile;
		} else return message.channel.send(`${args[0]} doesn't exist!`);

		if (args[1]) {
			if (!utilityFuncs.inArray(args[1].toLowerCase(), quoteTypes)) {
				let quoteStr = '```diff\n';
				for (let quote of quoteTypes) quoteStr += `- ${quoteTypes}`;
				quoteStr += '```';

				return message.channel.send(`Invalid Quote Type! Try one of these:${quoteTypes}`);
			}

			if (!thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`] || !thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`][0]) return message.channel.send('This Quote Type has no quotes!');

			let array = [];
			for (let i in thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`])
				array.push({title: `**[${i}]**`, desc: `_"${thingDefs[args[0]].quotes[`${args[1].toLowerCase()}quote`][i]}"_`});

			listArray(message.channel, array, message.author.id);
		} else {
			let array = [];
			for (let quote of quoteTypes) {
				let quoteTxt = '';
				if (!thingDefs[args[0]].quotes[`${quote}quote`])
					quoteTxt = 'No quotes for this section!';
				else
					quoteTxt = selectQuote(thingDefs[args[0]], quote, true);

				array.push({title: `${quote.charAt(0).toUpperCase()+quote.slice(1)}`, desc: quoteTxt});
			}

			listArray(message.channel, array, message.author.id);
		}
	}
})

commands.randcharquote = new Command({
	desc: "Get a random quote from any character.",
	aliases: ['randquote', 'randomcharaquote'],
	section: "roll",
	args: [],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (Object.keys(charFile).length == 0) return message.channel.send(`No characters have been added yet!`);
		
		let possibleQuotes = []
		for (const i in quoteTypes) {
			for (const k in charFile) {
				if (!charFile[k].hidden && charFile[k][`quotes`] && charFile[k][`quotes`][`${quoteTypes[i]}quote`] && charFile[k][`quotes`][`${quoteTypes[i]}quote`].length > 1) {
					possibleQuotes.push([k, quoteTypes[i], charFile[k][`quotes`][`${quoteTypes[i]}quote`][utilityFuncs.randNum(charFile[k][`quotes`][`${quoteTypes[i]}quote`].length-1)]])
				}
			}
		}
		if (possibleQuotes.length == 0) return message.channel.send(`No quotes found!`);

		let quoteData = possibleQuotes[utilityFuncs.randNum(possibleQuotes.length-1)]   
		let randQuote = `"*${quoteData[2]}*"\n**${quoteData[0]}**, ${quoteData[1].toUpperCase()} Quote`;

		const DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#4b02c9')
			.setTitle("Random Quote.")
			.setDescription(randQuote)
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.dailycharquote = new Command({
	desc: "Any random character quote can be set as a daily one! Test your luck to see if your character's is here!",
	section: "roll",
	args: [],
	func: (message, args) => {
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)
		if (Object.keys(charFile).length == 0) return message.channel.send(`No characters have been added yet!`);

		let possibleQuotes = []
		for (const i in quoteTypes) {
			for (const k in charFile) {
				if (!charFile[k].hidden && charFile[k][`quotes`] && charFile[k][`quotes`][`${quoteTypes[i]}quote`] && charFile[k][`quotes`][`${quoteTypes[i]}quote`].length > 1) {
					possibleQuotes.push([k, quoteTypes[i], charFile[k][`quotes`][`${quoteTypes[i]}quote`][utilityFuncs.randNum(charFile[k][`quotes`][`${quoteTypes[i]}quote`].length-1)]])
				}
			}
		}
		if (possibleQuotes.length == 0) return message.channel.send(`No quotes found!`);

		if (!dailyQuote) dailyQuote = {};

		let notice = 'Here is the daily character quote, again.'
		if (!dailyQuote[message.guild.id]) {
			//pick a random quote
			dailyQuote[message.guild.id] = possibleQuotes[utilityFuncs.randNum(possibleQuotes.length-1)];

			let authorTxt = charFile[dailyQuote[message.guild.id][0]].owner ? `<@!${charFile[dailyQuote[message.guild.id][0]].owner}>` : '<@776480348757557308>'
			notice = `${authorTxt}, your character's quote is the daily character quote for today!`;
		}

		setTimeout(function() {
			if (charFile[dailyQuote[message.guild.id][0]]) {
				let today = getCurrentDate();

				fs.writeFileSync(dataPath+'/dailyquote.txt', JSON.stringify(dailyQuote));

				let charTxt = `**[${today}]**\n${notice}`
				let randQuote = `"*${dailyQuote[message.guild.id][2]}*"\n**${dailyQuote[message.guild.id][0]}**, ${dailyQuote[message.guild.id][1].toUpperCase()} Quote`;
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#4b02c9')
					.setTitle("Daily Character Quote.")
					.setDescription(randQuote)
				message.channel.send({content: charTxt, embeds: [DiscordEmbed]});
			}
		}, 500);
	}
})

commands.getbio = new Command({
	desc: "Lists a character's information, backstory, age, ect",
	aliases: ['bio', 'charbio', 'characterbio'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Section",
			type: "Word",
			forced: false
		}
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');

		// Alright, let's get the character!
		var DiscordEmbed;
		if (!args[1]) {
			DiscordEmbed = longBio(charFile[args[0]], message.guild.id);
		} else {
			if (!charFile[args[0]].bio[args[1].toLowerCase()] && (charFile[args[0]].bio.custom && !charFile[args[0]].bio.custom[args[1].toLowerCase()])) 
				return message.channel.send("Invalid Bio Section!");

			DiscordEmbed = shortBio(charFile[args[0]], args[1].toLowerCase(), message.guild.id);
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.gettrust = new Command({
	desc: "[NOT YET FINISHED] Lists how much a character trusts other characters.",
	aliases: ['trust', 'chartrust', 'charactertrust'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');

		if (!charFile[args[0]]?.trust || Object.keys(charFile[args[0]]?.trust).length == 0) return message.channel.send(`This character has not been given any trust yet.`);

		trustBio(charFile[args[0]], message.channel, message.author.id);
	}
})

commands.setbioinfo = new Command({
	desc: "Sets a character's information, backstory, age, ect",
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Section",
			type: "Word",
			forced: true
		},
		{
			name: "Info",
			type: "Word",
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');

		if (!utilityFuncs.isAdmin(message) && !charFile[args[0]].owner == message.author.id) return message.channel.send('You are not the owner of this character!');

		if (args[1].toLowerCase() != 'appearance' && !args[2]) return message.channel.send('You need to enter a value to set!');

		switch (args[1].toLowerCase()) {
			case "fullname":
			case "nickname":
			case "species":
			case "info":
			case "backstory":
			case "likes":
			case "dislikes":
			case "fears":
			case "voice":
			case "theme":
				if (args[2].toLowerCase() == 'none') args[2] = '';
				charFile[args[0]].bio[args[1].toLowerCase()] = args[2];
				break;
			case "weight":
				if (args[2].toLowerCase() == 'none') args[2] = 0;
				if (isNaN(args[2])) return message.channel.send('Invalid weight! Please enter a decimal.');
				charFile[args[0]].bio.weight = parseFloat(args[2]);
				break;
			case "height":
				if (args[2].toLowerCase() == 'none') args[2] = [0, 0];
				if (isNaN(args[2])) {
					let split = args[2].split('\'');
					if (split.length == 1) {
						let feet = Math.floor(parseFloat(split[0]) / 0.3048);
						let inches = Math.round((parseFloat(split[0]) / 0.3048 - feet) * 12);
						charFile[args[0]].bio.height = [feet, inches]; 
					} else {
						charFile[args[0]].bio.height = [parseInt(split[0]), parseInt(split[1].replace('"', ''))];
					}
				} else {
					return message.channel.send('Invalid Height! Please enter in the format `feet/inches` or `meters`.');
				}
				break;
			case "age":
				if (args[2].toLowerCase() == 'none') args[2] = 0;
				if (isNaN(args[2])) return message.channel.send('Invalid age! Please enter a number.');
				charFile[args[0]].bio.age = parseInt(args[2]);
				break;
			case "gender":
				if (!args[2]) return message.channel.send("Please enter either Male, Female or Other.");
				charFile[args[0]].bio.gender = args[2].toLowerCase() != "male" && args[2].toLowerCase() != "female" ? 'other' : args[2].toLowerCase()
				break
			case "appearance":
				if (args[2] && args[2].toLowerCase() == 'none') {
					charFile[args[0]].bio.appearance = '';
				} else {
					if (!checkImage(message, args[2], message.attachments.first())) return message.channel.send(`${args[2]} is not a valid image.`);
					charFile[args[0]].bio.appearance = checkImage(message, args[2], message.attachments.first());
				}
				break;
			default:
				if (!charFile[args[0]].bio.custom) charFile[args[0]].bio.custom = {};
				if (args[2].toLowerCase() == 'none') args[2] = '';
				charFile[args[0]].bio.custom[args[1]] = args[2];
				if (charFile[args[0]].bio.custom[args[1]] == '') delete charFile[args[0]].bio.custom[args[1]];
				break;
		}
		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.clearbioinfo = new Command({
	desc: "Clears a character's bio information, such as backstory, age, ect",
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Section",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.isAdmin(message) && !charFile[args[0]].owner == message.author.id) return message.channel.send('You are not the owner of this character!');

		switch (args[1].toLowerCase()) {
			case "nickname":
				return message.channel.send(`Please use the ${getPrefix(message.guild.id)}nickname command to clear your nickname!`);

			case "fullname":
			case "species":
			case "info":
			case "backstory":
			case "likes":
			case "dislikes":
			case "fears":
			case "voice":
			case "theme":
			case "weight":
			case "height":
			case "age":
			case "appearance":
				delete charFile[args[0]].bio[args[1].toLowerCase()];
				break;

			case "gender":
				charFile[args[0]].bio.gender = 'other';
				break;

			default:
				if (!charFile[args[0]].bio.custom) charFile[args[0]].bio.custom = {};
				
				if (charFile[args[0]].bio.custom[args[1]])
					delete charFile[args[0]].bio.custom[args[1]];
				else
					return message.channel.send("That value doesn't exist!");

				break;
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.settransformation = new Command({
	desc: "Sets a character's transformation",
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation Name",
			type: "Word",
			forced: true
		},
		{
			name: "Requirement",
			type: "Word",
			forced: true
		},
		{
			name: "HP Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Attack Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Magic Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Perception Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Endurance Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Charisma Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Intelligence Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Agility Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Luck Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Short Description",
			type: "Word",
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) {
            message.channel.send(`You're really mean, you know that?`);
            return false
        }

		if (charFile[args[0]].transformations && ! charFile[args[0]].transformations[args[1]] && Object.keys(charFile[args[0]].transformations).length >= settings.caps.transformations.transformationlimit) return message.channel.send(`You have reached the maximum number of transformations for this character!`);

		let reqTable = ['allydown', 'onlystanding', 'belowhalfhp', 'outofmp', 'leaderdown', 'trusteddown']
		if (!reqTable.includes(args[2])) return message.channel.send(`Invalid requirement! Please enter one of the following: ${reqTable.join(', ')}`);

		if (args[3] > settings.caps.transformations.hpbuff) return message.channel.send(`HP Buff cannot be greater than ${settings.caps.transformations.hpbuff}!`);

		let BST = 0;
		let allowedMore = 0;
		for (let i = 4; i < 12; i++) {
			if (args[i] > settings.caps.transformations.basestatmaxcap) return message.channel.send(`${args[i]} cannot be greater than ${settings.caps.transformations.statbuff}!`);
			if (args[i] < settings.caps.transformations.basestatmincap) return message.channel.send(`${args[i]} cannot be less than ${settings.caps.transformations.basestatmincap}!`);

			if (args[i] < 0)
				allowedMore = -args[i]/2

			if (args[i] > 0)
				BST += args[i];
		}
		if (BST > Math.round(Math.min(settings.caps.transformations.bstcap, settings.caps.transformations.bstcap+allowedMore))) return message.channel.send(`BST cannot be greater than ${Math.min(settings.caps.transformations.bstcap, settings.caps.transformations.bstcap+allowedMore)}! Maximum BST is ${settings.caps.transformations.bstcap}, but that modifies with negative stats.`);

		charFuncs.makeTransformation(charFile[args[0]], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]);
		
		if (args[12] != '') {
			if (args[12].length > 128) return message.channel.send('Short description cannot be longer than 128 characters!');
			charFile[args[0]].transformations[args[1]].desc = args[12];
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		let transDefs = charFile[args[0]].transformations[args[1]]

        const DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#f2c055')
			.setTitle(`${charFile[args[0]].name}'s ${transDefs.name} Transformation's Stats:`)
            .setDescription(`${transDefs.desc ? `*` + transDefs.desc + '*\n\n' : ''}**Stats:**\n${transDefs.hp}HP%++\n\n${transDefs.atk}ATK%++\n${transDefs.mag}MAG%++\n${transDefs.prc}PRC%++\n${transDefs.end}END%++\n${transDefs.chr}CHR%++\n${transDefs.int}INT%++\n${transDefs.agl}AGL%++\n${transDefs.luk}LUK%++`)
        message.channel.send({content: `👍 ${charFile[args[0]].name}'s ${transDefs.name} transformation has been registered!`, embeds: [DiscordEmbed]});
	}
})

commands.cleartransformation = new Command({
	desc: "Clears a transformation from a character.",
	section: "characters",
	aliases: ["cleartransformation", "cleartransformations", "cleartransform", "cleartransforms", "cleartrans", "cleartranss"],
	args: [
		{
			name: "Character",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		delete charFile[args[0]].transformations[args[1]];
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`👍 ${args[0]}'s ${args[1]} transformation has been removed!`);
	}
})

commands.edittransformation = new Command({
	desc: "Change a character transformation's stats.",
	section: "characters",
	aliases: ["edittransformation", "edittransformations", "edittransform", "edittransforms", "edittrans", "edittranss"],
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation Name",
			type: "Word",
			forced: true
		},
		{
			name: "Requirement",
			type: "Word",
			forced: true
		},
		{
			name: "HP Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Attack Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Magic Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Perception Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Endurance Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Charisma Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Intelligence Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Agility Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Luck Buff",
			type: "Num",
			forced: true
		},
		{
			name: "Short Description",
			type: "Word",
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		let reqTable = ['allydown', 'onlystanding', 'belowhalfhp', 'outofmp', 'leaderdown', 'trusteddown']
		if (!reqTable.includes(args[2])) return message.channel.send(`Invalid requirement! Please enter one of the following: ${reqTable.join(', ')}`);

		if (args[3] > settings.caps.transformations.hpbuff) return message.channel.send(`HP Buff cannot be greater than ${settings.caps.transformations.hpbuff}!`);

		let BST = 0;
		let allowedMore = 0;
		for (let i = 4; i < 12; i++) {
			if (args[i] > settings.caps.transformations.basestatmaxcap) return message.channel.send(`${args[i]} cannot be greater than ${settings.caps.transformations.statbuff}!`);
			if (args[i] < settings.caps.transformations.basestatmincap) return message.channel.send(`${args[i]} cannot be less than ${settings.caps.transformations.basestatmincap}!`);

			if (args[i] < 0)
				allowedMore = -args[i]/2

			if (args[i] > 0)
				BST += args[i];
		}
		if (BST > Math.round(Math.min(settings.caps.transformations.bstcap, settings.caps.transformations.bstcap+allowedMore))) return message.channel.send(`BST cannot be greater than ${Math.min(settings.caps.transformations.bstcap, settings.caps.transformations.bstcap+allowedMore)}! Maximum BST is ${settings.caps.transformations.bstcap}, but that modifies with negative stats.`);

		charFile[args[0]].transformations[args[1]].requirement = args[2];
		charFile[args[0]].transformations[args[1]].hp = args[3]
		charFile[args[0]].transformations[args[1]].atk = args[4]
		charFile[args[0]].transformations[args[1]].mag = args[5]
		charFile[args[0]].transformations[args[1]].prc = args[6]
		charFile[args[0]].transformations[args[1]].end = args[7]
		charFile[args[0]].transformations[args[1]].chr = args[8]
		charFile[args[0]].transformations[args[1]].int = args[9]
		charFile[args[0]].transformations[args[1]].agl = args[10]
		charFile[args[0]].transformations[args[1]].luk = args[11]

		if (args[12] != '') {
			if (args[12].length > 128) return message.channel.send('Short description cannot be longer than 128 characters!');
			charFile[args[0]].transformations[args[1]].desc = args[12];
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		let transDefs = charFile[args[0]].transformations[args[1]]

        const DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#f2c055')
			.setTitle(`${charFile[args[0]].name}'s ${transDefs.name} Transformation's Stats:`)
            .setDescription(`${transDefs.desc ? `*` + transDefs.desc + '*\n\n' : ''}**Stats:**\n${transDefs.hp}HP%++\n\n${transDefs.atk}ATK%++\n${transDefs.mag}MAG%++\n${transDefs.prc}PRC%++\n${transDefs.end}END%++\n${transDefs.chr}CHR%++\n${transDefs.int}INT%++\n${transDefs.agl}AGL%++\n${transDefs.luk}LUK%++`)
        message.channel.send({content: `👍 ${charFile[args[0]].name}'s ${transDefs.name} transformation has been changed!`, embeds: [DiscordEmbed]});
	}
})

commands.gettransformation = new Command({
	desc: "Get a character's transformation.",
	section: "characters",
	aliases: ['gettransformation', 'gettrans'],
	args: [
		{
			name: "Character",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation",
			type: "Word",
		}
	],
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		let DiscordEmbed = transformationDesc(charFile[args[0]].transformations[args[1]], charFile[args[0]].name, message.guild.id, message);
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.renametransformation = new Command({
	desc: "Renames a transformation.",
	aliases: ['renametrans'],
	section: 'characters',
	checkban: true,
	args: [
		{
			name: "Character",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		charFile[args[0]].transformations[args[1]].name = args[2];
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		message.channel.send(`👍 ${args[0]}'s ${args[1]} transformation has been renamed!`);
	}
})

commands.transformationtruename = new Command({
	desc: "Sets the true name of a transformation.",
	aliases: ['transformationtruename'],
	section: 'characters',
	checkban: true,
	args: [
		{
			name: "Character",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		if (charFile[args[0]].transformations[args[2]]) return message.channel.send(`${args[0]} already has a transformation named ${args[2]}!`);

		if (args[1] == args[2]) return message.channel.send(`What's the point...?`);

		charFile[args[0]].transformations[args[2]] = charFile[args[0]].transformations[args[1]];
		delete charFile[args[0]].transformations[args[1]];
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		message.channel.send(`👍 ${args[0]}'s ${args[1]} transformation has been renamed!`);
	}
})

commands.transformationaffinity = new Command({
	desc: "Sets the affinities of a transformation that replace a character's affinities.",
	aliases: ['transformationaffinity'],
	section: 'characters',
	checkban: true,
	args: [
		{
			name: "Character",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation",
			type: "Word",
			forced: true
		},
		{
			name: "Element",
			type: "Word",
			forced: true
		},
		{
			name: "Affinity",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		if (utilityFuncs.inArray(args[2].toLowerCase(), Elements)) {
			if (!utilityFuncs.inArray(args[3].toLowerCase(), Affinities) && args[3].toLowerCase() != 'normal') return message.channel.send('Please enter a valid affinity!```diff\n+ SuperWeak\n+ Weak\n+ Normal\n+ Resist\n+ Block\n+ Repel\n+ Drain```');
			if (args[2].toLowerCase() == 'almighty' || args[3].toLowerCase() == 'status' || args[2].toLowerCase() == 'passive' || args[2].toLowerCase() == 'heal') return message.channel.send(`You can't set ${args[2]} affinities!`);

			if (hasAffinity(charFile[args[0]].transformations[args[1]], args[2].toLowerCase(), args[3].toLowerCase())) return message.channel.send(`${charFile[args[0]].transformations[args[1]].name} already has a ${args[2]} affinity to ${args[1].charAt(0).toUpperCase()+args[1].slice(1).toLowerCase()}!`);

			if (!charFile[args[0]].transformations[args[1]].affinities) charFile[args[0]].transformations[args[1]].affinities = {};
			// Clear Affinities
			for (let a of Affinities) {
				if (a && charFile[args[0]].transformations[args[1]].affinities[a]) {
					for (const k in charFile[args[0]].transformations[args[1]].affinities[a]) {
						if (charFile[args[0]].transformations[args[1]].affinities[a][k].toLowerCase() === args[2].toLowerCase()) {
							charFile[args[0]].transformations[args[1]].affinities[a].splice(k, 1);
							break;
						}
					}
				}
			}

			// Apply Affinities (ignore if normal)
			if (args[3].toLowerCase() != 'normal') {
				if (!charFile[args[0]].transformations[args[1]].affinities[args[3].toLowerCase()]) charFile[args[0]].transformations[args[1]].affinities[args[3].toLowerCase()] = [];
				charFile[args[0]].transformations[args[1]].affinities[args[3].toLowerCase()].push(args[2].toLowerCase());
			}
		// Status Affinities
		} else if (utilityFuncs.inArray(args[2].toLowerCase(), statusEffects)) {
			if (!utilityFuncs.inArray(args[3].toLowerCase(), Affinities) && args[3].toLowerCase() != 'normal') return message.channel.send('Please enter a valid affinity!```diff\n+ SuperWeak\n+ Weak\n+ Normal\n+ Resist\n+ Block\n+ Repel\n+ Drain```');
			if (args[2].toLowerCase() == 'infatuation' || args[2].toLowerCase() == 'confusion' || args[2].toLowerCase() == 'mirror') return message.channel.send(`You can't set ${args[1]} affinities!`);

			if (hasStatusAffinity(charFile[args[0]].transformations[args[1]], args[2].toLowerCase(), args[3].toLowerCase())) return message.channel.send(`${charFile[args[0]].transformations[args[1]].name} already has a ${args[3]} affinity to ${args[1].charAt(0).toUpperCase()+args[1].slice(1).toLowerCase()}!`);

			if (!charFile[args[0]].transformations[args[1]].statusaffinities) charFile[args[0]].transformations[args[1]].statusaffinities = {};
			// Clear Affinities
			for (let a of Affinities) {
				if (charFile[args[0]].transformations[args[1]].statusaffinities[a]) {
					if (a && charFile[args[0]].transformations[args[1]].statusaffinities[a]) {
						for (const k in charFile[args[0]].transformations[args[1]].statusaffinities[a]) {
							if (charFile[args[0]].transformations[args[1]].statusaffinities[a][k].toLowerCase() === args[2].toLowerCase()) {
								charFile[args[0]].transformations[args[1]].statusaffinities[a].splice(k, 1);
								break;
							}
						}
					}
				}
			}

			// Apply Affinities (ignore if normal)
			if (args[3].toLowerCase() != 'normal') {
				if (!charFile[args[0]].transformations[args[1]].statusaffinities[args[3].toLowerCase()]) charFile[args[0]].transformations[args[1]].statusaffinities[args[3].toLowerCase()] = [];
				charFile[args[0]].transformations[args[1]].statusaffinities[args[3].toLowerCase()].push(args[2].toLowerCase());
			}
		// Neither entered.
		} else {
			return message.channel.send('Please enter a valid element or status effect to resist!');
		}

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		message.channel.send(`${args[0]}'s ${args[1]} now has a ${args[3]} affinity to ${args[2].charAt(0).toUpperCase()+args[2].slice(1).toLowerCase()}!`);
	}
})

commands.transformationskill = new Command({
	desc: 'Adds a signature skill to a transformation.',
	aliases: ['tskill', 'transskill'],
	checkban: true,
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true
		},
		{
			name: 'Transformation',
			type: 'Word',
			forced: true
		},
		{
			name: 'Skill',
			type: 'Word',
			forced: true
		},
	],
	section: 'characters',
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		if (!skillFile[args[2]]) return message.channel.send(`${args[2]} is not a valid skill!`);

		if (skillFile[args[2]].levellock) {
			if (skillFile[args[2]].levellock == 'unobtainable') return message.channel.send(`${args[2]} is unobtainable!`);
			if (charFile[args[0]].level < skillFile[args[2]].levellock) return message.channel.send(`${charFile[args[0]].name} is level ${charFile[args[0]].level}, but must be level ${skillFile[args[2]].levellock} to learn ${skillFile[args[2]].name}!`);
		}

		if (charFile[args[0]].transformations[args[1]].skill && charFile[args[0]].transformations[args[1]].skill == args[2]) return message.channel.send(`${charFile[args[0]].transformations[args[1]].name} already has ${args[2]} as a signature skill!`);

		charFile[args[0]].transformations[args[1]].skill = args[2];
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`${args[0]}'s ${args[1]} now has ${args[2]} as a signature skill!`);
	}
})

commands.autolearntransformation = new Command({
	desc: "Allows the transformation skill to be automatically evolved when levelling up based on the skill's Evo-Skill.",
	aliases: ['autoskill', 'autoevo'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Transformation",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		// Let's allow it to auto evolve
		charFile[args[0]].transformations[args[1]].autolearn = !charFile[args[0]].transformations[args[1]].autolearn
		message.channel.send(`${charFile[args[0]].name}'s ${skillFile[charFile[args[0]].transformations[args[1]].skill].name} automatic evolution has been toggled to ${charFile[args[0]].transformations[args[1]].autolearn ? 'On' : 'Off'}!`);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.cleartransformationskill = new Command({
	desc: 'Removes a signature skill from a transformation.',
	aliases: ['ctskill', 'cleartransskill'],
	checkban: true,
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true
		},
		{
			name: 'Transformation',
			type: 'Word',
			forced: true
		}
	],
	section: 'characters',
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		if (!settings.mechanics.transformations) return message.channel.send('Transformations are not enabled on this server.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		if (!charFile[args[0]].owner.includes(message.author.id) && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character!');

		if (!charFile[args[0]].transformations[args[1]]) return message.channel.send(`${args[0]} does not have a transformation named ${args[1]}!`);

		if (!charFile[args[0]].transformations[args[1]].skill) return message.channel.send(`${charFile[args[0]].transformations[args[1]].name} does not have a signature skill!`);

		charFile[args[0]].transformations[args[1]].skill = '';
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`${args[0]}'s ${args[1]} no longer has a signature skill!`);
	}
})

// ae
commands.exportchar = new Command({
	desc: "Exports a character so you can use them in another server!",
	aliases: ['movechar', 'keepchar'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let userdata = setUpUserData(message.author.id);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send('Nonexistant Character.');
		if (!utilityFuncs.RPGBotAdmin(message.author.id, message.guild.id) && charFile[args[0]].owner != message.author.id) return message.channel.send('You are not the owner of this character!');

		// Alright, let's get the character!
		userdata.exports[args[0]] = charFile[args[0]];
		message.channel.send(`Exported ${charFile[args[0]].name}! Now you can import them to other servers using "importchar"!`);

		fs.writeFileSync(`${dataPath}/userdata/${message.author.id}.json`, JSON.stringify(userdata, null, 4));
	}
})

commands.exportname = new Command({
	desc: "Changes an export character's truename from the ''exportchar'' command.",
	aliases: ['exportcharname', 'exportnamechange'],
	section: "characters",
	args: [
		{
			name: "Export",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		let userdata = setUpUserData(message.author.id);
		
		if (!userdata.exports[args[0]]) {
			let charList = '```diff\n';
			for (const i in userdata.exports) charList += `- ${i}\n`;
			charList += '```'

			return message.channel.send(`${args[0]} does not exist! Did you mean:${charList}`);
		}

		if (args[0] == args[1]) return message.channel.send(`What's the point...?`);

		// Check for Duplicates
		userdata.exports[args[1]] = objClone(userdata.exports[args[0]]);
		delete userdata.exports[args[0]]

		// Alright, let's get the character's name changed.
		message.channel.send(`Changed ${args[0]} to ${args[1]}.`);
		fs.writeFileSync(`${dataPath}/userdata/${message.author.id}.json`, JSON.stringify(userdata, null, 4));
	}
})

commands.purgeexport = new Command({
	desc: `Deletes a character from exports. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
	section: 'characters',
	aliases: ['unregisterexport', 'exportpurge', 'exportunregister', 'deleteexport', 'exportdelete'],
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let userdata = setUpUserData(message.author.id);

		if (!userdata.exports[args[0]]) return message.channel.send(`${args[0]} is not a valid character name.`);

		if (userdata.exports[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this character, therefore, you have insufficient permissions to delete it.")

		message.channel.send(`Are you **sure** you want to delete ${userdata.exports[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this character.\n**Y/N**`);

		var givenResponce = false
		var collector = message.channel.createMessageCollector({ time: 15000 });
		collector.on('collect', m => {
			if (m.author.id == message.author.id) {
				if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
					message.channel.send(`${userdata.exports[args[0]].name} has been erased from existance.`)
					delete userdata.exports[args[0]]

					fs.writeFileSync(`${dataPath}/userdata/${message.author.id}.json`, JSON.stringify(userdata, null, 4));
				} else
					message.channel.send(`${userdata.exports[args[0]].name} will not be deleted.`);
				
				givenResponce = true
				collector.stop()
			}
		});
		collector.on('end', c => {
			if (givenResponce == false)
				message.channel.send(`No response given.\n${userdata.exports[args[0]].name} will not be deleted.`);
		});
	}
})

commands.importchar = new Command({
	desc: "Imports a character from the ''exportchar'' command.",
	aliases: ['takechar', 'enterchar'],
	section: "characters",
	args: [
		{
			name: "Export",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let userdata = setUpUserData(message.author.id);
		if (Object.keys(userdata.exports).length < 1) return message.channel.send('You have no characters to import from.');
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		
		if (!userdata.exports[args[0]]) {
			let charList = '```diff\n';
			for (const i in userdata.exports) charList += `- ${i}\n`;
			charList += '```'

			return message.channel.send(`${args[0]} has not been imported! Did you mean:${charList}`);
		}

		// Check for Duplicates
		let charname = args[0];
		let givenResponce = false;
		if (charFile[charname]) {
			if (charFile[charname].owner != message.author.id) {
				charname = `${charname}(${message.author.id})`;
			} else {
				message.channel.send(`${charname} already exists! Do you want to overwrite it?\n**Y/N**`);
				let collector = message.channel.createMessageCollector({ time: 15000 });
				collector.on('collect', m => {
					if (m.author.id == message.author.id) {
						givenResponce = true;
						if (m.content.toLowerCase() == 'true' || m.content.toLowerCase() == 'yes' || m.content.toLowerCase() == 'y' || m.content.toLowerCase() == '1') {
							collector.stop();
						} else {
							charname = `${charname}-Import`;
							collector.stop();
						}
					}
				})
				collector.on('end', collected => {
					if (!givenResponce) {
						return message.channel.send('You did not respond in time! Cancelling.');
					} else {
						// Alright, let's get the character!
						charFile[charname] = userdata.exports[args[0]];
						message.channel.send(`Imported ${userdata.exports[args[0]].name} as ${charname}! Now you can use them in this server!`);

						fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
					}
				})
			}
		} else {
			// Alright, let's get the character!
			charFile[charname] = userdata.exports[args[0]];
			message.channel.send(`Imported ${userdata.exports[args[0]].name} as ${charname}! Now you can use them in this server!`);

			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		}
	}
})

commands.exportcharjson = new Command({
	desc: "Exports a character json file. I don't know why you'd want it but... sure.",
	aliases: ['exportcharfile', 'realexportchar'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: async(message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is a nonexistant character!`);

		let link = await hastebin(JSON.stringify(charFile[args[0]], '	', 4), {extension: "json"});

		message.channel.send(`👍 ${message.author}, check your DMs!`);
		message.author.send(`Here is the character data for ${charFile[args[0]].name}!\n${link}`);
	}
})

/*-----------------------------
             Charms
------------------------------*/

commands.listcharms = new Command({
	desc: "Lists all charms available.",
	aliases: ['listcharms', 'listcharm'],
	section: "characters",
	args: [
		{
			name: "Type #1, Variable #1",
			type: "Word",
			multiple: true,
		}
	],
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);

		if (!settings.mechanics.charms) return message.channel.send('Charms are not enabled on this server.');

		let charmFile = setUpFile(`${dataPath}/charms.json`);
		let array = [];

		const validTypes = ['name', 'notches'];

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
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message, settings)
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

		for (i in charmFile) {
			let isConditionMet = true;
			for (a in args) {
				if (a % 2 == 1) {
					switch (args[a-1].toLowerCase()) {
						case 'name':
							if (i.toLowerCase().includes(args[a].toString().toLowerCase()) || charmFile[i].name.toLowerCase().includes(args[a].toString().toLowerCase())) {
								isConditionMet = true;
							}
							break;
						case 'notches':
							if (charmFile[i].notches == args[a]) {
								isConditionMet = true;
							}
							break;
					}
					if (isConditionMet == false || isConditionMet == undefined) break;
				}
			}
			if (isConditionMet == false || isConditionMet == undefined) continue;

			array.push({title: charmFile[i].name, desc: `**${charmFile[i].notches} Notches**\n*${charmFile[i].desc}*`});
		}
		if (array.length == 0) return message.channel.send('No charms found.');
		
		listArray(message.channel, array, message.author.id, 6);
	}
})

commands.findcharm = new Command({
	desc: "Lets a character find a charm.",
	section: "characters",
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true,
		},
		{
			name: "Charm Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	admin: "you don't have permission to give a charm to a character.",
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);

		if (!settings.mechanics.charms) return message.channel.send('Charms are not enabled on this server.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let charmFile = setUpFile(`${dataPath}/charms.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);
		if (!charmFile[args[1]]) return message.channel.send(`${args[1]} is not a valid charm!`);

		for (i in charFile[args[0]].curCharms) {
			if (charFile[args[0]].curCharms[i] == args[1]) return message.channel.send(`${args[0]} already has ${args[1]}!`);
		}

		charFile[args[0]].curCharms.push(args[1]);

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`${args[0]} has found the ${args[1]} charm!`);

		message.delete()
	}
})

commands.abandoncharm = new Command({
	desc: "Lets a character abandon a charm.",
	section: "characters",
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true,
		},
		{
			name: "Charm Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);

		if (!settings.mechanics.charms) return message.channel.send('Charms are not enabled on this server.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let charmFile = setUpFile(`${dataPath}/charms.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);
		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		if (!charmFile[args[1]]) return message.channel.send(`${args[1]} is not a valid charm!`);

		let index = charFile[args[0]].curCharms.indexOf(args[1]);
		if (index == -1) return message.channel.send(`${args[0]} does not have ${args[1]}!`);

		charFile[args[0]].curCharms.splice(index, 1);
		if (charFile[args[0]].charms && charFile[args[0]].charms.includes(args[1])) charFile[args[0]].charms.splice(charFile[args[0]].charms.indexOf(args[1]), 1);

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`${args[0]} has abandoned the ${args[1]} charm!`);
	}
})

commands.equipcharm = new Command({
	desc: "Lets a character equip a charm.",
	section: "characters",
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true,
		},
		{
			name: "Charm Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);

		if (!settings.mechanics.charms) return message.channel.send('Charms are not enabled on this server.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let charmFile = setUpFile(`${dataPath}/charms.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);
		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		if (!charmFile[args[1]]) return message.channel.send(`${args[1]} is not a valid charm!`);

		if (!charFile[args[0]].curCharms.includes(args[1])) return message.channel.send(`${args[0]} does not have ${args[1]}!`);

		if (charFile[args[0]].charms.includes(args[1])) return message.channel.send(`${args[0]} already has ${args[1]} equipped!`);

		let notches = 0
		for (i in charFile[args[0]].charms) {
			notches += charmFile[charFile[args[0]].charms[i]].notches;
		}
		notches += charmFile[args[1]].notches;

		if (notches > charFuncs.needNotches(charFile[args[0]].level)) return message.channel.send(`${args[0]} does not have enough notches to equip ${args[1]}!`);

		charFile[args[0]].charms.push(args[1]);

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`${args[0]} has equipped the ${args[1]} charm!`);
	}
})

commands.unequipcharm = new Command({
	desc: "Lets a character unequip a charm.",
	section: "characters",
	args: [
		{
			name: 'Character',
			type: 'Word',
			forced: true,
		},
		{
			name: "Charm Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);

		if (!settings.mechanics.charms) return message.channel.send('Charms are not enabled on this server.');

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let charmFile = setUpFile(`${dataPath}/charms.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);
		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		if (!charmFile[args[1]]) return message.channel.send(`${args[1]} is not a valid charm!`);

		if (!charFile[args[0]].charms) return message.channel.send(`${args[0]} does not have any charms equipped!`);
		if (!charFile[args[0]].charms.includes(args[1])) return message.channel.send(`${args[0]} does not have ${args[1]} equipped!`);

		let index = charFile[args[0]].charms.indexOf(args[1]);
		charFile[args[0]].charms.splice(index, 1);

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

		message.channel.send(`${args[0]} has unequipped the ${args[1]} charm!`);
	}
})

commands.obtainweapon = new Command({
	desc: 'Gives this character a specified weapon. They can obtain any weapon class, but can only equip weapons of their class.',
	aliases: ['findweapon', 'obtainw', 'findw'],
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
        let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		let char = charFile[args[0]];
		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';

		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		if (!weaponFile[args[1]]) return message.channel.send(`${args[1]} is an invalid weapon!`);
		if (char.weapons[args[1]]) return message.channel.send(`${char.name} already owns a ${weaponFile[args[1]].name}.`);

		message.react('👍');
		char.weapons[args[1]] = objClone(weaponFile[args[1]]);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.equipweapon = new Command({
	desc: "Makes the character wear the specified weapon. They can only use a weapon of their class.",
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
       let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		let char = charFile[args[0]];
		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';

		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		
		if (char.weapons[args[1]]) {
			if (char.weapons[args[1]].class) {
				if (char.weaponclass === 'none')
					return message.channel.send(`${char.name} cannot equip any weapons.`);
				else if ((typeof(char.weaponclass) == 'string' && char.weaponclass === char.weapons[args[1]].class) || (typeof(char.weaponclass) == 'object' && char.weaponclass.includes(char.weapons[args[1]].class))) {
					char.curweapon = objClone(char.weapons[args[1]]);
					delete char.weapons[args[1]];

					message.react('👍');
					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
				} else
					return message.channel.send(`${char.name} is incapable of using this weapon as it's class is not ${char.weaponclass}.`);
			} else {
				char.curweapon = objClone(char.weapons[args[1]]);

				message.react('👍');
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
			}
		}
	}
})

commands.obtainarmor = new Command({
	desc: "Gives this character the specified armor. They can obtain any armor class, but equipping armor that isn't of their armor class may have drawbacks since they're not used to it.",
	aliases: ['findarmor', 'obtaina', 'finda'],
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Armor Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
        let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		let char = charFile[args[0]];
		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';

		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		if (!armorFile[args[1]]) return message.channel.send(`${args[1]} is an invalid weapon!`);
		if (char.armors[args[1]]) return message.channel.send(`${char.name} already owns a ${armorFile[args[1]].name}.`);

		message.react('👍');
		char.armors[args[1]] = objClone(armorFile[args[1]]);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.equiparmor = new Command({
	desc: "Makes the character wear the specified armor. They can only wear armor of their class.",
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Armor Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
       let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		let char = charFile[args[0]];
		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';

		if (charFile[args[0]].owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');
		
		if (char.armors[args[1]]) {
			if (char.armors[args[1]].class) {
				if (char.armorclass === 'none' || char.armorclass === char.armors[args[1]].class) {
					char.curarmor = objClone(char.armors[args[1]]);
					delete char.armors[args[1]];

					message.react('👍');
					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
				} else {
					return message.channel.send(`${char.name} is incapable of wearing this armor as it's armor class is not ${char.armorclass}.`);
				}
			} else {
				char.curarmor = objClone(char.armors[args[1]]);
				delete char.armors[args[1]];

				message.react('👍');
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
			}
		}
	}
})

commands.unequipequipment = new Command({
	desc: "Stop using equipment. This will unequip it from the character's inventory.",
	aliases: ['stopusingequipment'],
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon or Armor",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		let char = charFile[args[0]];
		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';

		if (char.owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');

		switch(args[1].toLowerCase()) {
			case 'weapon':
				if (char.curweapon == {}) return message.channel.send(`${char.name} has no weapon equipped.`);
				char.weapons[char.curweapon.id] = objClone(char.curweapon);
				char.curweapon = {};
				break;

			case 'armor':
				if (char.curarmor == {}) return message.channel.send(`${char.name} has no armor equipped.`);
				char.armors[char.curarmor.id] = objClone(char.curarmor);
				char.curarmor = {};
				break;
			
			default:
				return message.channel.send("Please enter either ''Weapon'' or ''Armor''.");
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.trashequipment = new Command({
	desc: "Trashes an equipment. This removes it from the character's inventory __forever__.",
	aliases: ['removeequipment'],
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon or Armor",
			type: "Word",
			forced: true
		},
		{
			name: "Equipment Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);

		let char = charFile[args[0]];
		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';

		if (char.owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');

		switch(args[1].toLowerCase()) {
			case 'weapon':
				if (char.weapons[args[2]]) {
					delete char.weapons[args[2]];
				} else if (args[2].toLowerCase() === 'all') {
					char.weapons = {};
				} else {
					return message.channel.send(`${args[2]} is a nonexistant weapon.`);
				}
				break;

			case 'armor':
				if (char.armors[args[2]]) {
					delete char.armors[args[2]];
				} else if (args[2].toLowerCase() === 'all') {
					char.armors = {};
				} else {
					return message.channel.send(`${args[2]} is a nonexistant armor.`);
				}
				break;

			case 'all':
				char.weapons = {};
				char.armors = {};
				break;
			
			default:
				return message.channel.send("Please enter either ''Weapon'' or ''Armor''. Or you can enter ''All''...");
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.tradeequipment = new Command({
	desc: "Gives equipment to another character.",
	aliases: ['giveequipment'],
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Weapon or Armor",
			type: "Word",
			forced: true
		},
		{
			name: "Equipment Name",
			type: "Word",
			forced: true
		},
		{
			name: "Target Character",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is not a valid character!`);
		if (!charFile[args[3]]) return message.channel.send(`${args[3]} is not a valid character!`);

		let char = charFile[args[0]];
		let char2 = charFile[args[3]];

		if (!char.weapons) char.weapons = {};
		if (!char.armors) char.armors = {};
		if (!char.weaponclass) char.weaponclass = 'none';
		if (!char.armorclass) char.armorclass = 'none';
		if (!char2.weapons) char2.weapons = {};
		if (!char2.armors) char2.armors = {};
		if (!char2.weaponclass) char2.weaponclass = 'none';
		if (!char2.armorclass) char2.armorclass = 'none';

		if (char.owner != message.author.id && !utilityFuncs.isAdmin(message)) return message.channel.send('You do not own this character.');

		switch(args[1].toLowerCase()) {
			case 'weapon':
				if (char.weapons[args[2]]) {
					char2.weapons[args[2]] = objClone(char.weapons[args[2]]);
					delete char.weapons[args[2]];
				} else {
					return message.channel.send(`${args[2]} is a nonexistant weapon.`);
				}
				break;

			case 'armor':
				if (char.armors[args[2]]) {
					char2.armors[args[2]] = objClone(char.armors[args[2]]);
					delete char.armors[args[2]];
				} else {
					return message.channel.send(`${args[2]} is a nonexistant armor.`);
				}
				break;
			
			default:
				return message.channel.send("Please enter either ''Weapon'' or ''Armor''.");
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

hasTeamCombo = (char, char2) => {
	if (!char.teamcombos) return false;
	if (!char.teamcombos[char2.truename]) return false;
	return char.teamcombos[char2.truename];
}

commands.registertc = new Command({
	desc: "Registers a team combo for a duo of characters! In battle, the power is equal to the sum of the duo's strongest skills doubled, which therefore means both people need to have the applicable cost for their skill. This powerful attack can have an extra too, but only one!",
	aliases: ['registerteamcombo', 'maketc', 'maketeamcombo'],
	section: "characters",
	checkban: true,
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Ally Name",
			type: "Word",
			forced: true
		},
		{
			name: "Team Combo's Name",
			type: "Word",
			forced: true
		},
		{
			name: "Team Combo's Description",
			type: "Word",
			forced: true,
			long: true
		},
		{
			name: "Status Effect",
			type: "Word",
			forced: false
		},
		{
			name: "Status Effect Chance",
			type: "Decimal",
			forced: false
		},
		{
			name: "Hits",
			type: "Num",
			forced: false
		},
		{
			name: "Team Combo Extra",
			type: "Word",
			forced: false
		},
		{
			name: "Variable #1",
			type: "Any",
			forced: false,
			multiple: true
		}
	],
	func: async(message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is a nonexistant character!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is a nonexistant character!`);

		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`You don't own ${args[0]}!`);

		let teamcombo = {
			name: args[2],
			users: [args[0], args[1]],
			desc: args[3]
		}

		if (args[4] && statusEffects.includes(args[4].toLowerCase)) {
			teamcombo.status = args[4].toLowerCase;
			teamcombo.statuschance = (args[5] && args[5] < 100) ? args[5] : 100;
		}

		if (args[6]) {
			if (args[6] < 1) return message.channel.send('Skills with 0 hits or less will not function!');
			if (!isFinite(args[6])) return message.channel.send('Please enter a whole number for **Hits**!');

			if (args[6] > 1) teamcombo.hits = args[6];
		}

		if (args[7])
			applyExtra(message, teamcombo, args[7].toLowerCase(), args.splice(8));

		if (!charFile[args[0]].teamcombos) charFile[args[0]].teamcombos = {};
		charFile[args[0]].teamcombos[args[1]] = teamcombo;

		if (charFile[args[1]].owner == message.author.id) {
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
			message.react('👍');
		} else {
			let user = await client.users.fetch(charFile[args[1]].owner);
			message.channel.send(`${user}, ${message.author} wishes for __${charFile[args[0]].name}__ to have a Team Combo with __${charFile[args[1]].name}__ called _${args[2]}_. Will you accept?`);

			let givenResponce = false;
			let collector = message.channel.createMessageCollector({ time: 15000 });
			collector.on('collect', m => {
				if (m.author.id == charFile[args[1]].owner) {
					if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
						m.react('👍');
						message.react('👍');
						fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
					} else
						message.channel.send("The user has declined. Therefore, no team combo will happen.");

					givenResponce = true;
					collector.stop()
				}
			});
			collector.on('end', c => {
				if (!givenResponce) message.channel.send("No response given.\nThe user has declined. Therefore, no team combo will happen.");
			});
		}
	}
})

commands.gettc = new Command({
	desc: 'List the data and information for the specified team combo.',
	aliases: ['getteamcombo', 'listtc', 'listteamcombo'],
	section: "characters",
	args: [
		{
			name: "Initiator Character",
			type: "Word",
			forced: true
		},
		{
			name: "Assistant Character",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is a nonexistant character!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is a nonexistant character!`);
		if (!charFile[args[0]].teamcombos || !charFile[args[0]].teamcombos[args[1]]) return message.channel.send(`${args[0]} & ${args[1]} have no team combo!`);

		let tc = objClone(charFile[args[0]].teamcombos[args[1]]);
		delete tc.cost;
		delete tc.costtype;

		tc.teamcombo = true;

		tc.acc = 100;
		tc.crit = 0;
		tc.pow = 0;
		let skills = [objClone(charFile[args[0]].skills), objClone(charFile[args[1]].skills)];
		let skillFile = setUpFile(`${dataPath}/json/skills.json`, true);

		for (let i in skills) {
			let pain = skills[i].filter(s => (skillFile[s] && skillFile[s].pow));
			pain.sort(function(a, b) {
				return skillFile[b].pow - skillFile[a].pow;
			});
			tc.pow += skillFile[pain[0]].pow;
		}

		tc.pow /= tc.hits ?? 1;
		tc.type = [
			typeof(skillFile[skills[0][0]].type) === 'object' ? skillFile[skills[0][0]].type[0] : skillFile[skills[0][0]].type,
			typeof(skillFile[skills[1][0]].type) === 'object' ? skillFile[skills[1][0]].type[0] : skillFile[skills[1][0]].type
		]

		message.channel.send({content: `Here is the data for ${args[0]} and ${args[1]}'s Team Combo: ${tc.name}.`, embeds: [skillFuncs.skillDesc(tc, tc.name, message)]})
	}
})

commands.removetc = new Command({
	desc: 'Gets rid of a team combo with 2 characters.',
	aliases: ['removeteamcombo', 'cleartc', 'clearteamcombo'],
	section: "characters",
	args: [
		{
			name: "Initiator Character",
			type: "Word",
			forced: true
		},
		{
			name: "Assistant Character",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is a nonexistant character!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is a nonexistant character!`);
		if (!charFile[args[0]].teamcombos || !charFile[args[0]].teamcombos[args[1]]) return message.channel.send(`${args[0]} & ${args[1]} have no team combo!`);

		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`You don't own ${args[0]}!`);

		delete charFile[args[0]].teamcombos[args[1]];

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

commands.edittc = new Command({
	desc: 'Edits a team combo with 2 characters.',
	aliases: ['editteamcombo', 'changetc', 'changeteamcombo'],
	section: "characters",
	args: [
		{
			name: "Initiator Character",
			type: "Word",
			forced: true
		},
		{
			name: "Assistant Character",
			type: "Word",
			forced: true
		},
		{
			name: "Field",
			type: "Word",
			forced: true
		},
		{
			name: "New Value",
			type: "Any",
			forced: true,
			multiple: true,
		}
	],
	func: (message, args) => {
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (!charFile[args[0]]) return message.channel.send(`${args[0]} is a nonexistant character!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is a nonexistant character!`);
		if (!charFile[args[0]].teamcombos || !charFile[args[0]].teamcombos[args[1]]) return message.channel.send(`${args[0]} & ${args[1]} have no team combo!`);

		if (!utilityFuncs.isAdmin(message) && charFile[args[0]].owner != message.author.id) return message.channel.send(`You don't own ${args[0]}!`);

		let editField = args[2].toLowerCase();
		let currentTeamCombo = charFile[args[0]].teamcombos[args[1]];

		switch(editField) {
			case 'name':
			case 'truename':
				if (args[3].length < 1) return message.channel.send('Description must be at least 1 character long!');
				currentTeamCombo.name = args[3];
				break;
			case 'desc':
			case 'description':
				if (args[3] == 'none') delete currentTeamCombo.desc;
				else {
					if (args[3].length < 1) return message.channel.send('Description must be at least 1 character long!');
					currentTeamCombo.desc = args[3];
				}
				break;
			case 'status':
				if (!utilityFuncs.inArray(args[3].toLowerCase(), statusEffects)) return message.channel.send(`${args[2].toLowerCase()} is an invalid status effect!`);
				currentTeamCombo.status = args[3].toLowerCase();
				break;
			case 'statuschance':
			case 'status chance':
			case 'statchance':
				if (isNaN(args[3])) return message.channel.send(`${args[3]} is not a number!`);
				if (!currentTeamCombo.status) return message.channel.send(`You need a status effect to set the status chance!`);
				currentTeamCombo.statuschance = parseFloat(args[3]);
				break;
			case 'hits':
				if (isNaN(args[3])) return message.channel.send(`${args[3]} is not a number!`);
				currentTeamCombo.hits = parseInt(args[3]);
				break;
			case 'extra':
				if (extrasList[args[3]]) {
					delete currentTeamCombo.extra;
				}
				applyExtra(message, currentTeamCombo, args[3].toLowerCase(), args.splice(4));
				break;
			default:
				return message.channel.send(`${args[2].toLowerCase()} is an invalid field!`);
		}

		charFile[args[0]].teamcombos[args[1]] = currentTeamCombo;
		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	}
})

/*
commands.registertransformation = new Command({
	desc: `Register a transformation for a character to use in-battle! This can buff stats, change skills and more.`,
	aliases: ['maketransformation', 'newtransformation', 'registertransform'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Main Element",
			type: "Word",
			forced: false
		},
		{
			name: "Base HP",
			type: "Num",
			forced: true
		},
		{
			name: "Base MP",
			type: "Num",
			forced: true
		},
		{
			name: "Base Strength",
			type: "Num",
			forced: true
		},
		{
			name: "Base Magic",
			type: "Num",
			forced: true
		},
		{
			name: "Base Perception",
			type: "Num",
			forced: true
		},
		{
			name: "Base Endurance",
			type: "Num",
			forced: true
		},
		{
			name: "Base Charisma",
			type: "Num",
			forced: true
		},
		{
			name: "Base Intelligence",
			type: "Num",
			forced: true
		},
		{
			name: "Base Agility",
			type: "Num",
			forced: true
		},
		{
			name: "Base Luck",
			type: "Num",
			forced: true
		},
	],
	checkban: true,
	func: (message, args) => {
	}
})
*/

/*
	UTILITY COMMANDS
					  */

commands.fullheal = new Command({
	desc: "Fully heal a character, party or everyone in the server.",
	aliases: ['fullyheal', 'fullrestore', 'maxheal', 'maxrestore', 'maxhp'],
	section: "characters",
	args: [
		{
			name: "Character/Party/Everyone",
			type: "Word",
			forced: true
		},
		{
			name: "Character or Party",
			type: "Word",
			forced: false
		}
	],
	checkban: true,
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id)
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');

		// Set up files.
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		// Checks
		let charcheck = args[0].toLowerCase();
		switch(charcheck) {
			case 'character':
			case 'one':
				if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character.`);
				if (!utilityFuncs.isAdmin(message) && charFile[args[1]].owner != message.author.id) return message.channel.send(`You don't own ${args[1]}!`);

				charFile[args[1]].hp = charFile[args[1]].maxhp;
				charFile[args[1]].mp = charFile[args[1]].maxmp;
				break;

			case 'party':
			case 'team':
				if (!parties[args[1]]) return message.channel.send(`${args[1]} is an invalid party.`);

				for (let i of parties[args[1]].members) {
					charFile[i].hp = charFile[i].maxhp;
					charFile[i].mp = charFile[i].maxmp;
				}
				for (let i of parties[args[1]].backup) {
					charFile[i].hp = charFile[i].maxhp;
					charFile[i].mp = charFile[i].maxmp;
				}
				break;

			case 'all':
			case 'everyone':
				for (let i in charFile) {
					charFile[i].hp = charFile[i].maxhp;
					charFile[i].mp = charFile[i].maxmp;
				}
				break;

			default:
				return message.channel.send('Invalid type! Please enter a valid type.');
		}

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
		message.react('👍');
	}
})