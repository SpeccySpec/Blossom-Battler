// Handle Skills
commands.registerskill = new Command({
	desc: `*Args: <Word: Name> {Num: Cost} {Word: CostType} <Num: Power> <Num: Acc> {Num: CritChance} <Num: Hits> <Word: Element> <Word: Targets> {Word: Status} {Num: StatusChance} "{Sentence: Description}"*\nRegister a skill to use in-battle! Characters can learn skills, items can utilise skills too. Skills can also have a number of extras, apply them with "rpg!applyextra".`,
	section: "battle",
	func: (message, args) => {
		if (!args[0]) {
            const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .addFields(
                    { name: `${prefix}registerskill`, value: `*Args: <Word: Name> {Num: Cost} {Word: CostType} <Num: Power> <Num: Acc> {Num: CritChance} <Num: Hits> <Word: Element> <Word: Targets> {Word: Status} {Num: StatusChance} "{Sentence: Description}"*\nCreates a skill to be used in battle. \nThese skills have certain properties that can change how they're used.\n\nAllow me to explain`, inline: false },
                    { name: 'Cost', value: "To be used in combination with the next one.", inline: true },
                    { name: 'CostType', value: "HP, MP, HP% or MP%. For example, if I set cost to 5, and costtype to MP%, it would take 5% of my MP.", inline: true },
                    { name: 'Power', value: "Self Explanitory. \nA little insight on how damage is calculated, somewhat similar to the Persona series.", inline: true },
                    { name: 'Accuracy', value: "A chance out of 100 that the move lands. Modified by user perception and enemy agility.", inline: true },
                    { name: 'Critical Hit Chance', value: "The chance that this move is a critical hit out of 100. Modified by user and enemy luck.", inline: true },
                    { name: 'Hit Count', value: 'The amount of hits this move does. Generally, moves with more hits have less power.', inline: true },
                    { name: 'Element', value: "The element this skill is. This is either Strike, Slash, Pierce, Fire, Water, Ice, Electric, Wind, Earth, Grass, Psychic, Poison, Nuclear, Metal, Curse, Bless, Almighty, Heal, with Status and Passive relegated to alternate commands.", inline: true },
                    { name: 'Physical or Magic?', value: "If this skill is physical it will use the user's Strength stat, otherwise, Magic.", inline: true },
                    { name: 'Target', value: "Whether this targets all foes or one foe, maybe even all allies depending on the skill. The target types are 'one', 'allopposing', 'ally', 'allallies', 'caster' and 'everyone'", inline: true },
                    { name: 'Status Affliction', value: "The status effect this skill can inflict.", inline: true },
                    { name: 'Status Chance', value: "Chance this skill has to inflict a status effect (will do nothing if 'Status Affliction' is 'none'.", inline: true },
                    { name: 'Description', value: "This Skills's description. Try to explain what the move does, so your friends can imagine it! Enclose this value in quotation marks.", inline: true },
                )
            message.channel.send({embeds: [DiscordEmbed]});
            return false;
		}

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of a skill name.`);
		
		let cost = 0;
		let costtype = 'mp';
		if (args[1] && args[1] > 0) {
			cost = parseInt(args[1]);
			if (args[2] && utilityFuncs.inArray(args[2].toLowerCase(), costTypes)) costtype = args[2].toLowerCase();
		}

		// So much shit to check :(
		if (!args[3]) return message.channel.send('Please enter a value for **Power**! Skills can have up to 2000 power.');
		if (parseInt(args[3]) < 1) return message.channel.send('Skills with 0 power or less will not function!');
		if (!isFinite(args[3])) return message.channel.send('Please enter a whole number for **Power**!')

		if (!args[4]) return message.channel.send('Please enter a value for **Accuracy**! Skills can have up to 100 accuracy.');
		if (parseFloat(args[4]) < 1) return message.channel.send('Skills with 0% accuracy or less will not function!');
		if (!isFinite(args[4])) return message.channel.send('Please enter a decimal or whole number for **Accuracy**!')

		if (!args[5]) return message.channel.send('Please enter a value for **Critical Hit Chance**, or leave it at 0 for no critical hit.');
		if (!isFinite(args[5])) return message.channel.send('Please enter a decimal or whole number for **Critical Hit Chance**!')

		if (!args[6]) return message.channel.send('Please enter a value for **Hits**!');
		if (parseInt(args[6]) < 1) return message.channel.send('Skills with 0 hits or less will not function!');
		if (!isFinite(args[6])) return message.channel.send('Please enter a whole number for **Hits**!')

		if (!args[7] || !utilityFuncs.inArray(args[7].toLowerCase(), Elements)) {
			return message.channel.send({content: 'Please enter a valid element for **Element!**', embeds: [elementList()]})
		}

		let atype = args[8].toLowerCase();
		if (atype != 'physical' && atype != 'magic' && atype != 'ranged') return message.channel.send(`${atype} is an invalid form of contact! Try physical, magic or ranged.`);

		if (!args[9] || !utilityFuncs.inArray(args[9].toLowerCase(), Targets)) return message.channel.send('Please enter a valid target type for **Target**!```diff\n- One\n- Ally\n- Caster\n- AllOpposing\n- AllAllies\n- RandomOpposing\n- RandomAllies\n- Random\n- Everyone\n-SpreadOpposing\n- SpreadAllies```')

		let skillDefs = {
			name: args[0],
			type: args[7].toLowerCase(),
			atktype: atype,
			pow: parseInt(args[3]),
			hits: parseInt(args[6]),
			acc: Math.min(100, parseFloat(args[4])),
			cost: cost,
			costtype: costtype,
			target: args[9].toLowerCase(),
			originalAuthor: message.author.id
		}

		if (parseFloat(args[5]) > 0) skillDefs.crit = parseFloat(args[5]);

		if (args[10] && args[10].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[10].toLowerCase(), statusEffects)) {
				let str = `${args[10]} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
				for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
				str += '```'

				return message.channel.send(str)
			}

			skillDefs.status = args[10].toLowerCase();
			if (isFinite(args[11]) && parseFloat(args[11]) < 100) skillDefs.statuschance = parseFloat(args[11]);
		}

		if (args[12]) skillDefs.desc = args[12]

		skillFile[args[0]] = skillDefs;
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		message.channel.send({content: `${skillDefs.name} has been registered:`, embeds: [skillFuncs.skillDesc(skillDefs, skillDefs.name, message.guild.id)]})
	}
})

/*
commands.updateskills = new Command({
	desc: 'Update all skills for this new version of Bloom Battler.',
	section: "battle",
	func: (message, args) => {
	}
})
*/

/*
	SKILL EXTRAS GO HERE
							*/

commands.listatkextras = new Command({
	desc: '_Args <Num: Page>_\nList the possible extras you can give a skill.',
	section: "battle",
	func: (message, args) => {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of Attacking Extras')
			.setDescription('When attacking, skills can have extra effects! These are called extras, and can be added with the "applyextra" command.')

		let extras = []
		for (let i in extrasList) {
			extras.push({name: `${extrasList[i].name} (${i.charAt(0).toUpperCase()+i.slice(1)})`, value: extrasList[i].desc, inline: true});
		}

		let firstOne = 0;
		let lastOne = 5;

		firstOne += 6*(parseInt(args[0])-1);
		lastOne += 6*(parseInt(args[0])-1);

		for (let i = firstOne; i <= lastOne; i++) {
			if (extras[i]) DiscordEmbed.fields.push(extras[i]);
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.applyextra = new Command({
	desc: `*Args: <Word: Skill Name> <Word: Extra> <Any: Var1> <Any: Var2> <Any: Var3> <Any: Var4> <Any: Var5>\nRegister a skill to use in-battle! Characters can learn skills, items can utilise skills too. Skills can also have a number of extras, apply them with "rpg!applyextra".`,
	section: "battle",
	func: (message, args) => {
		if (!args[0]) return message.channel.send('Please enter a valid skill name!')
		if (!args[1]) return message.channel.send('Please enter a valid extra! You can list them all with rpg!listextras.')

		if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skillFile[args[0]].originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skillFile[args[0]].name}!`);
			}
			applyExtra(message, skillFile[args[0]], args[1].toLowerCase(), args[2], args[3], args[4], args[5], args[6]);
			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
		} else {
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
		}
	}
})

commands.clearextras = new Command({
	desc: `*Args: <Word: Skill Name> <Word: Extra>*\nClears all extras of a specific type.`,
	section: "battle",
	func: (message, args) => {
		if (!args[0]) return message.channel.send('Please enter a valid skill name!')
		if (!args[1]) return message.channel.send('Please enter a valid extra! You can list them all with rpg!listextras.')

		if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skillFile[args[0]].originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skillFile[args[0]].name}!`);
			}

			if (!skillFile[args[0]].extras) return message.channel.send(`${skillFile[args[0]].name} has no extras!`);
			if (!skillFile[args[0]].extras[args[1].toLowerCase()]) return message.channel.send(`${skillFile[args[0]].name} has no ${args[1]} extras!`);

			delete skillFile[args[0]].extras[args[1].toLowerCase()];
			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
		}
	}
})

/*
	EDIT SKILLS
				 */
commands.editskill = new Command({
	desc: `*Args: <Word: Skill Name> <Word: Field> <Any: New Value>*\nEdit existing skills and change how they work in battle! If you're looking for extras, use "applyextra" and "clearextras" commands.`,
	section: "battle",
	func: (message, args) => {
		if (!args[0]) return message.channel.send('Please enter a valid skill name!')
		if (!args[1]) return message.channel.send('Please enter a valid field!')
		if (!args[2]) return message.channel.send('Please enter a value for the field.')

		if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skillFile[args[0]].originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skillFile[args[0]].name}!`);
			}

			let editField = args[1].toLowerCase();
			switch(editField) {
				case 'pow':
				case 'power':
				case 'strength':
					let totalDmg = parseInt(args[2])*skillFile[args[0]].hits;
					if (totalDmg > 2000) return message.channel.send(`The Power cap for skills is 2000! A skill of ${skillFile[args[0]].hits} hits can have a maximum of ${2000/skillFile[args[0]].hits} power!`);
					if (parseInt(args[2]) < 0) return message.channel.send('Skills cannot go below 0 power.');

					skillFile[args[0]].pow = parseInt(args[2]);

				case 'acc':
				case 'crit':
					skillFile[args[0]][editField] = parseFloat(args[2]);

				case 'name':
				case 'desc':
					skillFile[args[0]][editField] = args[2];

				case 'status':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), statusEffects)) return message.channel.send(`${args[2].toLowerCase()} is an invalid status effect!`);
					skillFile[args[0]].status = args[2].toLowerCase();

				case 'type':
				case 'element':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), Elements)) return message.channel.send(`${args[2].toLowerCase()} is an invalid status effect!`);
					skillFile[args[0]].type = args[2].toLowerCase();

				case 'atktype':
				case 'contact':
				case 'skilltype':
					let type = args[2].toLowerCase();
					if (type != 'physical' && type != 'magic' && type != 'ranged') return message.channel.send(`${type} is an invalid form of contact! Try physical, magic or ranged.`);
					skillFile[args[0]].atktype = type;

				case 'truename':
					if (skillFile[args[2]]) {
						return message.channel.send(`A skill called ${args[2]} (${skillFile[args[2]].name}) already exists!`)
					} else {
						skillFile[args[2]] = utilityFuncs.cloneObj(skillFile[args[0]])
						delete skillFile[args[0]]
					}

				default:
					skillFile[args[0]][editField] = parseInt(args[2]);
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
		}
	}
})

commands.listskills = new Command({
	desc: `*Args: <Word: Element> <Num: Quick Page>*\nLists *all* existing skills.`,
	section: "battle",
	func: (message, args) => {
	}
})