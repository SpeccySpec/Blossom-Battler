// Handle Skills
commands.registerskill = new Command({
	desc: `Register a skill to use in-battle! Characters can learn skills, items can utilize skills too. Skills can also have a number of extras, apply them with "rpg!applyextra".`,
	aliases: ['makeskill', 'regskill'],
	section: "battle",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Cost",
			type: "Num",
			forced: false
		},
		{
			name: "Cost Type",
			type: "Word",
			forced: false
		},
		{
			name: "Power",
			type: "Num",
			forced: true
		},
		{
			name: "Accuracy",
			type: "Decimal",
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
			name: "Element",
			type: "Word",
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

		if (skillFile[args[0]] && message.author.id != skillFile[args[0]].originalAuthor) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)
		
		let cost = 0;
		let costtype = 'mp';
		if (args[1] && args[1] > 0) {
			cost = args[1];
			if (args[2] && utilityFuncs.inArray(args[2].toLowerCase(), costTypes)) costtype = args[2].toLowerCase();
		}

		// So much shit to check :(
		if (!args[3]) return message.channel.send('Please enter a value for **Power**! Skills can have up to 2000 power.');
		if (args[3] < 1) return message.channel.send('Skills with 0 power or less will not function!');
		if (!isFinite(args[3])) return message.channel.send('Please enter a whole number for **Power**!')

		if (!args[4]) return message.channel.send('Please enter a value for **Accuracy**! Skills can have up to 100 accuracy.');
		if (args[4] < 1) return message.channel.send('Skills with 0% accuracy or less will not function!');
		if (!isFinite(args[4])) return message.channel.send('Please enter a decimal or whole number for **Accuracy**!')

		if (!args[5]) return message.channel.send('Please enter a value for **Critical Hit Chance**, or leave it at 0 for no critical hit.');
		if (!isFinite(args[5])) return message.channel.send('Please enter a decimal or whole number for **Critical Hit Chance**!')

		if (!args[6]) return message.channel.send('Please enter a value for **Hits**!');
		if (args[6] < 1) return message.channel.send('Skills with 0 hits or less will not function!');
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
			pow: args[3],
			hits: args[6],
			acc: Math.min(100, args[4]),
			cost: cost,
			costtype: costtype,
			target: args[9].toLowerCase(),
			originalAuthor: message.author.id
		}

		if (args[5] > 0) skillDefs.crit = args[5];

		if (args[10] && args[10].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[10].toLowerCase(), statusEffects)) {
				let str = `${args[10]} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
				for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
				str += '```'

				return message.channel.send(str)
			}

			skillDefs.status = args[10].toLowerCase();
			if (isFinite(args[11]) && args[11] < 100) skillDefs.statuschance = args[11];
		}

		if (args[12]) skillDefs.desc = args[12];

		skillFile[args[0]] = skillDefs;
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		message.channel.send({content: `${skillDefs.name} has been registered:`, embeds: [skillFuncs.skillDesc(skillDefs, skillDefs.name, message.guild.id)]})
	}
})

commands.registerstatus = new Command({
	desc: `Register a status skill to use in-battle! Characters can learn skills, items can utilize skills too. Status skills usually apply positive effects to allies or negative effects to opponents.`,
	section: "battle",
	alias: ['regstatus', 'regstat', 'makestatus', 'makestat'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Cost",
			type: "Num",
			forced: false
		},
		{
			name: "Cost Type",
			type: "Word",
			forced: false
		},
		{
			name: "Target Type",
			type: "Word",
			forced: true
		},
		{
			name: "Status Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable 1",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 2",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 3",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 4",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 5",
			type: "Any",
			forced: false
		},
		{
			name: "Description",
			type: "Any",
			forced: false
		},
	],
	func: (message, args) => {
		let skill = buildStatus(message, args)
		if (!skill) return;

		skillFile[args[0]] = skill;
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
		
		let embed = skillFuncs.skillDesc(skill, skill.name, message.guild.id)
		console.log(embed)

		message.channel.send({content: `${skill.name} has been registered:`, embeds: [embed]})
	}
})

commands.registerheal = new Command({
	desc: `Register a heal skill to use in-battle! Characters can learn skills, items can utilize skills too.\n\nA healer is basically required in most battles. Healing skills are the skills most healers learn.`,
	section: "battle",
	alias: ['regheal', 'makeheal'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Cost",
			type: "Num",
			forced: false
		},
		{
			name: "Cost Type",
			type: "Word",
			forced: false
		},
		{
			name: "Heal Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable 1",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 2",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 3",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 4",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 5",
			type: "Any",
			forced: false
		},
		{
			name: "Description",
			type: "Any",
			forced: false
		},
	],
	func: (message, args) => {
		let skill = buildHeal(message, args)
		if (!skill) return;

		skillFile[args[0]] = skill;
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		let embed = skillFuncs.skillDesc(skill, skill.name, message.guild.id)
		console.log(embed)

		message.channel.send({content: `${skill.name} has been registered:`, embeds: [embed]})
	}
})

commands.registerpassive = new Command({
	desc: `Register a passive skill to use in-battle! Characters can learn skills, items can utilize skills too.\n\nPassive skills are certain effects that activate mid-battle or throughout the battle. These can be positive or negative, usually positive.`,
	section: "battle",
	alias: ['regpass', 'makepass', 'makepassive'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Cost",
			type: "Num",
			forced: false
		},
		{
			name: "Cost Type",
			type: "Word",
			forced: false
		},
		{
			name: "Passive Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable 1",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 2",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 3",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 4",
			type: "Any",
			forced: false
		},
		{
			name: "Variable 5",
			type: "Any",
			forced: false
		},
		{
			name: "Description",
			type: "Any",
			forced: false
		},
	],
	func: (message, args) => {
		let skill = buildPassive(message, args)
		if (!skill) return;

		skillFile[args[0]] = skill;
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		let embed = skillFuncs.skillDesc(skill, skill.name, message.guild.id)
		console.log(embed)

		message.channel.send({content: `${skill.name} has been registered:`, embeds: [embed]})
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
	desc: 'List the possible extras you can give a skill.',
	aliases: ['atkextras', 'extrasatk', 'listextrasatk'],
	section: "battle",
	args: [
		{
			name: "Page Number",
			type: "Num",
			forced: false
		},
	],
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

		if (args[0]) {
			firstOne += 6*(args[0]-1);
			lastOne += 6*(args[0]-1);
		}

		for (let i = firstOne; i <= lastOne; i++) {
			if (extras[i]) DiscordEmbed.fields.push(extras[i]);
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.liststatusextras = new Command({
	desc: 'List the possible extras you can give a __status__ skill.',
	aliases: ['statusextras', 'extrasstatus', 'listextrasstatus'],
	section: "battle",
	args: [
		{
			name: "Page Number",
			type: "Num",
			forced: false
		},
	],
	func: (message, args) => {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of Status Extras')
			.setDescription('When using a status skill, skills can have extra effects! These are called extras, and can be added with the "applyextra" command.')

		let extras = []
		for (let i in statusList) {
			extras.push({name: `${statusList[i].name} (${i.charAt(0).toUpperCase()+i.slice(1)})`, value: statusList[i].desc, inline: true});
		}

		let firstOne = 0;
		let lastOne = 5;

		if (args[0]) {
			firstOne += 6*(args[0]-1);
			lastOne += 6*(args[0]-1);
		}

		for (let i = firstOne; i <= lastOne; i++) {
			if (extras[i]) DiscordEmbed.fields.push(extras[i]);
		}

		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.applyextra = new Command({
	desc: 'A registered skill may have extra effects. These are called "extras". Apply an extra with this command, list all the ones possible with "listatkextras".',
	aliases: ['extraapply'],
	section: "battle",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Extra",
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
		},
		{
			name: "Variable #3",
			type: "Any",
			forced: false
		},
		{
			name: "Variable #4",
			type: "Any",
			forced: false
		},
		{
			name: "Variable #5",
			type: "Any",
			forced: false
		},
	],
	func: (message, args) => {
		if (!args[0]) return message.channel.send('Please enter a valid skill name!')
		if (!args[1]) return message.channel.send('Please enter a valid extra! You can list them all with "listatkextras".')

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
	desc: 'Clears all extras of a specific type.',
	aliases: ['extrasclear'],
	section: "battle",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Extra",
			type: "Word",
			forced: true
		},
	],
	func: (message, args) => {
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
	desc: `Edit existing skills and change how they work in battle! If you're looking for extras, use "applyextra" and "clearextras" commands.`,
	section: "battle",
	aliases: ['changeskill', 'skilledit', 'skillchange'],
	args: [
		{
			name: "Skill Name",
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
			forced: true
		}
	],
	func: (message, args) => {
		if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skillFile[args[0]].originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skillFile[args[0]].name}!`);
			}

			let editField = args[1].toLowerCase();
			switch(editField) {
				case 'pow':
				case 'power':
				case 'strength':
					let totalDmg = args[2]*skillFile[args[0]].hits;
					if (totalDmg > 2000) return message.channel.send(`The Power cap for skills is 2000! A skill of ${skillFile[args[0]].hits} hits can have a maximum of ${2000/skillFile[args[0]].hits} power!`);
					if (args[2] < 0) return message.channel.send('Skills cannot go below 0 power.');

					skillFile[args[0]].pow = args[2];

				case 'acc':
				case 'crit':
					skillFile[args[0]][editField] = args[2];
					break;

				case 'name':
				case 'desc':
					skillFile[args[0]][editField] = args[2];
					break;

				case 'status':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), statusEffects)) return message.channel.send(`${args[2].toLowerCase()} is an invalid status effect!`);
					skillFile[args[0]].status = args[2].toLowerCase();
					break;

				case 'type':
				case 'element':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), Elements)) return message.channel.send(`${args[2].toLowerCase()} is an invalid status effect!`);
					skillFile[args[0]].type = args[2].toLowerCase();
					break;

				case 'atktype':
				case 'contact':
				case 'skilltype':
					let type = args[2].toLowerCase();
					if (type != 'physical' && type != 'magic' && type != 'ranged') return message.channel.send(`${type} is an invalid form of contact! Try physical, magic or ranged.`);
					skillFile[args[0]].atktype = type;
					break;

				case 'truename':
					if (skillFile[args[2]]) {
						return message.channel.send(`A skill called ${args[2]} (${skillFile[args[2]].name}) already exists!`)
					} else {
						skillFile[args[2]] = utilityFuncs.cloneObj(skillFile[args[0]])
						delete skillFile[args[0]]
					}
					
					break;

				default:
					skillFile[args[0]][editField] = args[2];
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
		}
	}
})

/*
	SKILL LISTING
					*/
commands.getskill = new Command({
	desc: 'List the data and information for the specified skill.',
	section: "battle",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (skillFile[args[0]])
			message.channel.send({content: `Here is the data for ${skillFile[args[0]].name}`, embeds: [skillFuncs.skillDesc(skillFile[args[0]], skillFile[args[0]].name, message.guild.id)]})
		else
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
	}
})

commands.listskills = new Command({
	desc: 'Lists *all* existing skills.',
	section: "battle",
	args: [
		{
			name: "Element",
			type: "Word",
			forced: false
		}
	],
	func: (message, args) => {
		let array = []
		for (const i in skillFile) {
			let descTxt = '';
			if (skillFile[i].passive) {
				let pt = skillFile[i].passive;
				descTxt = `Passive Type: __${pt.charAt(0).toUpperCase()+pt.slice(1)}__`;
			} else if (skillFile[i].type.toLowerCase() == 'status') {
				descTxt = 'A status skill.';
			} else {
				if (hasExtra(skillFile[i], 'ohko')) {
					descTxt = `${skillFile[i].acc}% chance to instantly down the foe.`;
				} else if (hasExtra(skillFile[i], 'stealmp')) {
					descTxt = `Steal ${skillFile[i].pow}MP from the foe.`;
				} else {
					descTxt = `${skillFile[i].pow} Power and ${skillFile[i].acc}% Accuracy.`;
				}
			}

			if (!args[0]) {
				array.push({title: `${elementEmoji[skillFile[i].type]}${skillFile[i].name} (${i})`, desc: descTxt});
				continue;
			}

			if (skillFile[i].type != args[0].toLowerCase()) continue;
			array.push({title: `${elementEmoji[skillFile[i].type]}${skillFile[i].name} (${i})`, desc: descTxt});
		}

		listArray(message.channel, array, args[1]);
	}
})

commands.searchskills = new Command({
	desc: 'Searches for skills based on the phrase.',
	section: "battle",
	args: [
		{
			name: "Phrase",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let array = []
		for (const i in skillFile) {
			if (skillFile[i].name.includes(args[0])) {
				array.push({title: `${elementEmoji[skillFile[i].type]}${skillFile[i].name} (${i})`, desc: `${skillFile[i].pow} Power and ${skillFile[i].acc}% Accuracy.`});
			}
		}

		listArray(message.channel, array, args[1]);
	}
})

/*
	DELETING SKILLS
					  */
commands.purgeskill = new Command({
	desc: 'Deletes the skill in question. **YOU CANNOT GET IT BACK AFTER DELETION!**',
	aliases: ['unregisterskill', 'skillpurge', 'skillunregister', 'deleteskill', 'skilldelete'],
	section: "battle",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
        if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && message.author.id != skillFile[args[0]].originalAuthor)
				return message.channel.send("You have insufficient permissions to delete this skill as you don't own it.");

			message.channel.send(`Are you **sure** you want to delete ${skillFile[args[0]].name}? You will NEVER get this back, so please, ensure you _WANT_ to delete this skill.\n**Y/N**`);

			let givenResponce = false
			let collector = message.channel.createMessageCollector({ time: 15000 });
			collector.on('collect', m => {
				if (m.author.id == message.author.id) {
					if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
						message.channel.send(`${skillFile[args[0]].name} has been erased from existance. You should be wary to look around. This removal caused things to not work like before.\n`)
						delete skillFile[args[0]];

						fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
					} else message.channel.send(`${skillFile[args[0]].name} will not be deleted.`);

					givenResponce = true
					collector.stop()
				}
			});
			collector.on('end', c => {
				if (givenResponce == false) message.channel.send(`No response given.\n${skillFile[args[0]].name} will not be deleted.`);
			});
		} else {
            message.channel.send(`${args[0]} is an invalid skill.`);
            return
        }
	}
})

/*
	DAILY SKILLS
				  */
commands.dailyskill = new Command({
	desc: 'Any random skill can be set as a daily one! Test your luck to see if yours is here!',
	section: "fun",
	args: [],
	func: (message, args) => {
		if (Object.keys(skillFile).length == 0) return message.channel.send(`No skills have been added yet!`);
		if (!dailySkill) dailySkill = 'none';

		let notice = 'Here is the daily skill, again.'
		if (dailySkill === 'none') {
			dailySkill = Object.keys(skillFile)[Math.floor(Math.random() * Object.keys(skillFile).length)];

			let authorTxt = skillFile[dailySkill].originalAuthor ? `<@!${skillFile[dailySkill].originalAuthor}>` : '<@776480348757557308>'
			notice = `${authorTxt}, your skill is the daily skill for today!`;
		}

		setTimeout(function() {
			if (skillFile[dailySkill]) {
				let today = getCurrentDate();

				fs.writeFileSync(dataPath+'/dailyskill.txt', dailySkill.toString());

				let skillTxt = `**[${today}]**\n${notice}`
				message.channel.send({content: skillTxt, embeds: [skillFuncs.skillDesc(skillFile[dailySkill], skillFile[dailySkill].name, message.guild.id)]});	
			}
		}, 500);
	}
})

commands.randskill = new Command({
	desc: 'Gets a random skill.',
	section: "fun",
	aliases: ['randomskill'],
	args: [],
	func: (message, args) => {
		if (Object.keys(skillFile).length == 0) return message.channel.send(`No skills have been added yet.`);

		let skill = Object.keys(skillFile)[Math.floor(Math.random() * Object.keys(skillFile).length)];
		message.channel.send({embeds: [skillFuncs.skillDesc(skillFile[skill], skillFile[skill].name, message.guild.id)]})
	}
})

/*
	GETTING ELEMENTS AND STATUSES
									*/

commands.listelements = new Command({
	desc: 'Lists all the elements.',
	section: "battle",
	aliases: ['listelement', 'elementlist'],
	args: [],
	func: (message, args) => {
		const DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of usable elements:')

		let elementList = '';
		for (let element in Elements) {
			elementList += `${elementEmoji[Elements[element]]} ${Elements[element]}\n`;
		}
		
		DiscordEmbed.setDescription(elementList)
		message.channel.send({embeds: [DiscordEmbed]})
	}
})

commands.liststatus = new Command({
	desc: 'Lists all the status effects.',
	section: "battle",
	aliases: ['liststatuses', 'statuslist'],
	args: [],
	func: (message, args) => {
		const DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of status effects:')
			.setDescription('Status affects will affect fighters in-battle and can be fatal if not cured.')
			.addFields()

		let statusDesc = {
			burn: '💥Take 1/10th of max HP damage each turn until cured, or you reach one hp. Halves ATK stat.',
			bleed: '💥Take 1/10th of max HP damage each until cured, or the inflicted is defeated.',
			freeze: '💥Immobilized for one turn.',
			paralyze: '💥Immobilized for one turn.',
			poison: '💥Take 1/10th of max HP damage each turn until cured, or you reach one hp. Halves MAG stat.',
			dizzy: '🌀Accuracy of all skills halved for 3 turns.',
			sleep: '🌀Immobilized for 2 turns, restore 1/20th of HP & MP while affected.',
			despair: '🌀Lose 1/10th of max MP every turn until cured. Downs the inflicted once they reach 0MP.',
			brainwash: '🌀Use a random move on the incorrect target for 2 turns.',
			fear: '🌀50% chance to be immobilized but cured from the status.',
			rage: '🌀Forced to use stronger melee attack on a random target for 2 turns.',
			ego: '🌀Unnable to use heal skills for 3 turns.',
			silence: '🌀Unable to use any magical skills for 2 turns.',
			dazed: '💥Unable to use any physical skills for 2 turns.',
			hunger: '💥ATK, MAG, AGL & PRC halved.',
			illness: '💥Take 1/10th of max HP damage each turn until cured, or the inflicted is defeated. 1/3 chance to infect another party member next to you. Spreads amongst backup if in backup.',
			infatuation: '🌀50% chance to hault attack. Stacks with other status effects.',
			confusion: '🌀50% chance to damage self when attacking. Stacks with other status effects.',
			mirror: '💥Immobilized for 3 turns. Repel magic skills.',
			blind: '💥PRC and AGL halved.'
		}

		for (const i in statusEffects) {
			let techTxt = ''
			for (const k in elementTechs[statusEffects[i]]) {
				if (elementTechs[statusEffects[i]][k] === 'all') {
					techTxt = 'ALL';
					break;
				} else
					techTxt += elementEmoji[elementTechs[statusEffects[i]][k]];
			}
			
			if (techTxt === '') techTxt = 'NOTHING'

			DiscordEmbed.fields.push({name: `${statusEmojis[statusEffects[i].toLowerCase()]}${statusEffects[i]}`, value: `_${techTxt} tech off of ${statusEmojis[statusEffects[i].toLowerCase()]}._\n${statusDesc[statusEffects[i].toLowerCase()]}`, inline: true})
		}

		message.channel.send({embeds: [DiscordEmbed]})
	}
})