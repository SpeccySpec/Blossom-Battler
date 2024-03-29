// Handle Skills
commands.registerskill = new Command({
	desc: `Register a skill to use in-battle! Characters can learn skills, items can utilize skills too. Skills can also have a number of extras, apply them with "rpg!applyextra".`,
	aliases: ['makeskill', 'regskill'],
	section: "skills",
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
			name: "Attack Type",
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
	func(message, args, guilded) {
		if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
		if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of a skill name.`);

		if (skillFile[args[0]] && message.author.id != skillFile[args[0]].originalAuthor && !utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)
		
		let cost = 0;
		let costtype = 'mp';
		if (args[1] && args[1] > 0) {
			cost = args[1];
			if (args[2] && utilityFuncs.inArray(args[2].toLowerCase(), costTypes)) costtype = args[2].toLowerCase();
		}

		// So much shit to check :(
		if (args[3] < 1) return message.channel.send('Skills with 0 power or less will not function!');
		if (!isFinite(args[3])) return message.channel.send('Please enter a whole number for **Power**!');

		if (args[4] < 1) return message.channel.send('Skills with 0% accuracy or less will not function!');
		if (!isFinite(args[4])) return message.channel.send('Please enter a decimal or whole number for **Accuracy**!');

		if (args[6] < 1) return message.channel.send('Skills with 0 hits or less will not function!');
		if (!isFinite(args[6])) return message.channel.send('Please enter a whole number for **Hits**!');

		let totalDmg = (args[3] < 1 ? 1 : args[3])*args[6];
		if (totalDmg > 2000) return message.channel.send(`The Power cap for skills is 2000! A skill of ${args[6]} hits can have a maximum of ${2000/args[6]} power!`);

		if (!args[7] || !utilityFuncs.inArray(args[7].toLowerCase(), Elements)) {
			return message.channel.send({content: 'Please enter a valid element for **Element!**', embeds: [elementList()]})
		}

		let atype = args[8].toLowerCase();
		if (atype != 'physical' && atype != 'magic' && atype != 'ranged') return message.channel.send(`${atype} is an invalid form of contact! Try physical, magic or ranged.`);

		if (!args[9] || !utilityFuncs.inArray(args[9].toLowerCase(), Targets)) return message.channel.send(`Please enter a valid target type for **Target**!\`\`\`diff\n- ${Targets.join('\n- ')}\`\`\``)

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

		if (Object.keys(skillFile).length == 6000) {
			var c = client.channels.cache.get('874697575746383953');
			if (c) c.send(`**[NOTICE]**\n${message.author} is the one who registered the **6000th skill**, **${args[0]}**!\nThey will recieve 60<:golden:973077051751940138> as a prize!`);

			giveStars(message.author.id, 60);

			const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#4b02c9')
				.setTitle(`You obtained __60<:golden:973077051751940138>!__`)
				.setDescription(`_You have registered the 6000th skill, ${args[0]}! How lucky!_`)
			message.author.send({embeds: [DiscordEmbed]});
		}

		skillFuncs.skillDesc(skillDefs, skillDefs.name, message, `${skillDefs.name} has been registered:`)
	}
})

commands.registerstatus = new Command({
	desc: `Register a status skill to use in-battle! Characters can learn skills, items can utilize skills too. Status skills usually apply positive effects to allies or negative effects to opponents.`,
	section: "skills",
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
			name: "Description",
			type: "Any",
			forced: false
		},
		{
			name: "Status Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable #1",
			type: "Any",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && message.author.id != skillFile[args[0]].originalAuthor && !utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)

		let skill = buildStatus(message, args[5], args);
		if (!skill) return;

		skillFile[args[0]] = skill;
		if (args[4].toLowerCase != 'none') skillFile[args[0]].desc = args[4];
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		if (Object.keys(skillFile).length == 6000) {
			var c = client.channels.cache.get('874697575746383953');
			if (c) c.send(`**[NOTICE]**\n${message.author} is the one who registered the **6000th skill**, **${args[0]}**!\nThey will recieve 60<:golden:973077051751940138> as a prize!`);

			giveStars(message.author.id, 60);

			const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#4b02c9')
				.setTitle(`You obtained __60<:golden:973077051751940138>!__`)
				.setDescription(`_You have registered the 6000th skill, ${args[0]}! How lucky!_`)
			message.author.send({embeds: [DiscordEmbed]});
		}
		
		skillFuncs.skillDesc(skill, skill.name, message, `${skill.name} has been registered:`)
	}
})

commands.registerheal = new Command({
	desc: `Register a heal skill to use in-battle! Characters can learn skills, items can utilize skills too.\n\nA healer is basically required in most battles. Healing skills are the skills most healers learn.`,
	section: "skills",
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
			name: "Target Type",
			type: "Word",
			forced: true
		},
		{
			name: "Description",
			type: "Any",
			forced: false
		},
		{
			name: "Heal Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable #1",
			type: "Any",
			forced: false,
			multiple: true
		},
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && message.author.id != skillFile[args[0]].originalAuthor && !utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)

		let skill = buildHeal(message, args[5], args)
		if (!skill) return;

		skillFile[args[0]] = skill;
		if (args[4].toLowerCase != 'none') skillFile[args[0]].desc = args[4];
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		if (Object.keys(skillFile).length == 6000) {
			var c = client.channels.cache.get('874697575746383953');
			if (c) c.send(`**[NOTICE]**\n${message.author} is the one who registered the **6000th skill**, **${args[0]}**!\nThey will recieve 60<:golden:973077051751940138> as a prize!`);

			giveStars(message.author.id, 60);

			const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#4b02c9')
				.setTitle(`You obtained __60<:golden:973077051751940138>!__`)
				.setDescription(`_You have registered the 6000th skill, ${args[0]}! How lucky!_`)
			message.author.send({embeds: [DiscordEmbed]});
		}

		skillFuncs.skillDesc(skill, skill.name, message, `${skill.name} has been registered:`)
	}
})

commands.registerpassive = new Command({
	desc: `Register a passive skill to use in-battle! Characters can learn skills, items can utilize skills too.\n\nPassive skills are certain effects that activate mid-battle or throughout the battle. These can be positive or negative, usually positive.`,
	section: "skills",
	alias: ['regpass', 'makepass', 'makepassive'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Description",
			type: "Any",
			forced: false
		},
		{
			name: "Passive Type",
			type: "Word",
			forced: true
		},
		{
			name: "Variable #1",
			type: "Any",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && message.author.id != skillFile[args[0]].originalAuthor && !utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send(`${args[0]} exists already and cannot be overwritten because you don't own it!`)

		let skill = buildPassive(message, args[2], args)
		if (!skill) return;

		skillFile[args[0]] = skill;
		if (args[1].toLowerCase != 'none') skillFile[args[0]].desc = args[1];
		fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));

		if (Object.keys(skillFile).length == 6000) {
			var c = client.channels.cache.get('874697575746383953');
			if (c) c.send(`**[NOTICE]**\n${message.author} is the one who registered the **6000th skill**, **${args[0]}**!\nThey will recieve 60<:golden:973077051751940138> as a prize!`);

			giveStars(message.author.id, 60);

			const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#4b02c9')
				.setTitle(`You obtained __60<:golden:973077051751940138>!__`)
				.setDescription(`_You have registered the 6000th skill, ${args[0]}! How lucky!_`)
			message.author.send({embeds: [DiscordEmbed]});
		}

		skillFuncs.skillDesc(skill, skill.name, message, `${skill.name} has been registered:`)
	}
})

commands.updateskills = new Command({
	desc: '**Blossom Battler Administrator Only!**\nUpdates skills in cases of major changes being applied.',
	section: "skills",
	args: [],
	checkban: true,
	admin: 'You have insufficient permissions to update skills.',
	func(message, args, guilded) {
		if (!utilityFuncs.RPGBotAdmin(message.author.id)) {
			message.channel.send("You have insufficient permissions to update skills.")
			return false
		}

		skillFile = setUpFile(`${dataPath}/json/skills.json`, true);

		for (skill in skillFile) {
			if (skillFile[skill]?.passive) {

			}

			if (skillFile[skill]?.statusses) {

			}

			if (skillFile[skill]?.heal) {
				if (skillFile[skill].heal?.regenerate) {
					for (i in skillFile[skill].heal.regenerate) skillFile[skill].heal.regenerate[i].push(0, 0);
				}
			}

			if (skillFile[skill]?.extras) {
				
			}
		}
		fs.writeFileSync(dataPath+'/json/skills.json', JSON.stringify(skillFile, null, '    '));
		message.react('👍');
	}
})

/*
	SKILL EXTRAS GO HERE
							*/
			
listExtras = async (message, extras, title, desc, color) => {
	const generateEmbed = async start => {
		const current = extras.slice(start, start + 6)
		return new Discord.MessageEmbed({
			title: title,
			description: desc,
			color: color,
			fields: await Promise.all(
				current.map(async extraDefs => ({
					name: extraDefs.name,
					value: extraDefs.value,
					inline: true
				}))
			)
		})
	}

	const canFitOnOnePage = extras.length <= 6
	let embedMessage
	if (canFitOnOnePage) {
		embedMessage = await message.channel.send({
			embeds: [await generateEmbed(0)]
		})
		return
	}

	embedMessage = await message.channel.send({
		embeds: [await generateEmbed(0)],
		components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id == message.author.id
	})

	let currentIndex = 0;
	collector.on('collect', async interaction => {
		if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
			if (interaction.customId === 'back') {
				if (currentIndex - 6 < 0) {
					currentIndex = extras.length - (extras.length % 6 == 0 ? 6 : extras.length % 6);
				} else {
					currentIndex -= 6
				}
			} else if (interaction.customId === 'forward') {
				if (currentIndex + 6 >= extras.length) {
					currentIndex = 0
				} else {
					currentIndex += 6
				}
			}

			await interaction.update({
				embeds: [await generateEmbed(currentIndex)],
				components: [
					new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
				]
			})
		} else {
			collector.stop()
			await interaction.update({
			embeds: [await generateEmbed(currentIndex)],
			components: []
			})
		}
	})
}

commands.listatkextras = new Command({
	desc: 'List the possible extras you can give a skill.',
	aliases: ['atkextras', 'extrasatk', 'listextrasatk'],
	section: "skills",
	args: [],
	func(message, args, guilded) {
		let title = 'List of Attacking Extras'
		let desc = 'When attacking, skills can have extra effects! These are called extras, and can be added with the "applyextra" command.'

		let extras = []
		for (let i in extrasList) {
			if (!extrasList[i]?.unregsiterable) extras.push({name: `${extrasList[i].name} (${i.charAt(0).toUpperCase()+i.slice(1)})`, value: `${extrasList[i].getFullDesc()}${extrasList[i].multiple ? '\n\n**CAN BE APPLIED MULTIPLE TIMES!**' : ''}`, inline: true});
		}

		listExtras(message, extras, title, desc, elementColors['fire'])
	}
})

commands.liststatusextras = new Command({
	desc: 'List the possible extras you can give a __status__ skill.',
	aliases: ['statusextras', 'extrasstatus', 'listextrasstatus'],
	section: "skills",
	args: [],
	func(message, args, guilded) {
		let title = 'List of Status Extras'
		let desc = 'When using a status skill, skills can have extra effects! These are called extras, and can be added with the "applyextra" command.'

		let extras = []
		for (let i in statusList) {
			if (!extrasList[i]?.unregsiterable) extras.push({name: `${statusList[i].name} (${i.charAt(0).toUpperCase()+i.slice(1)})`, value: `${statusList[i].getFullDesc()}${statusList[i].multiple ? '\n\n**CAN BE APPLIED MULTIPLE TIMES!**' : ''}`, inline: true});
		}

		listExtras(message, extras, title, desc, elementColors['status'])
	}
})

commands.listhealextras = new Command({
	desc: 'List the possible extras you can give a __heal__ skill.',
	aliases: ['healextras', 'extrasheal', 'listextrasheal'],
	section: "skills",
	args: [],
	func(message, args, guilded) {
		let title = 'List of Heal Extras'
		let desc = 'When using a heal skill, skills can have extra effects! These are called extras, and can be added with the "applyextra" command.'

		let extras = []
		for (let i in healList) {
			if (!extrasList[i]?.unregsiterable) extras.push({name: `${healList[i].name} (${i.charAt(0).toUpperCase()+i.slice(1)})`, value: `${healList[i].getFullDesc()}${healList[i].multiple ? '\n\n**CAN BE APPLIED MULTIPLE TIMES!**' : ''}`, inline: true});
		}

		listExtras(message, extras, title, desc, elementColors['heal'])
	}
})

commands.listpassiveextras = new Command({
	desc: 'List the possible extras you can give a __passive__ skill.',
	aliases: ['passiveextras', 'extraspassive', 'listextraspassive'],
	section: "skills",
	args: [],
	func(message, args, guilded) {
		let title = 'List of Passive Extras'
		let desc = 'When using a passive skill, skills can have extra effects! These are called extras, and can be added with the "applyextra" command.'

		let extras = []
		for (let i in passiveList) {
			if (!extrasList[i]?.unregsiterable) extras.push({name: `${passiveList[i].name} (${i.charAt(0).toUpperCase()+i.slice(1)})`, value: `${passiveList[i].getFullDesc()}${passiveList[i].multiple ? '\n\n**CAN BE APPLIED MULTIPLE TIMES!**' : ''}`, inline: true});
		}

		listExtras(message, extras, title, desc, elementColors['passive'])
	}
})

commands.applyextra = new Command({
	desc: 'A registered skill may have extra effects. These are called "extras". Apply an extra with this command, list all the ones possible with "listatkextras".',
	aliases: ['extraapply'],
	section: "skills",
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
			name: "Variables",
			type: "Any",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		const skillname = args.shift()
		const skilldata = skillFile[skillname]
		const extra = args.shift().toLowerCase()
		if (skilldata) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skilldata.originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skilldata.name}!`);
			}
			
			let type = typeof skilldata.type == 'object' ? skilldata.type[0] : skilldata.type

			let extraList = skilldata.type == 'status' ? statusList : skilldata.type == 'heal' ? healList : skilldata.type == 'passive' ? passiveList : extrasList
			if (extraList?.[extra]?.unregsiterable && !utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send(`You lack permissions to apply ${extraList[extra].name} for this skill.`)

			switch (type) {
				case 'passive':
					applyPassive(message, skilldata, extra, args);
					break;
				case 'status':
					applyStatus(message, skilldata, extra, args);
					break;
				case 'heal':
					applyHeal(message, skilldata, extra, args);
					break;
				default:
					applyExtra(message, skilldata, extra, args);
					break;
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
		} else {
			return message.channel.send(`${skillname} is an invalid Skill Name!`)
		}
	}
})

commands.clearextras = new Command({
	desc: 'Clears all extras of a specific type.',
	aliases: ['extrasclear'],
	section: "skills",
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
	func(message, args, guilded) {
		const skilldata = skillFile[args[0]]
		if (skilldata) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skilldata.originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skilldata.name}!`);
			}

			let type = typeof skilldata.type == 'object' ? skilldata.type[0] : skilldata.type

			switch (type) {
				case 'passive':
					if (!skilldata.passive) return message.channel.send(`${skilldata.name} has no extras!`);
					if (!skilldata.passive[args[1].toLowerCase()]) return message.channel.send(`${skilldata.name} has no ${args[1]} extras!`);

					delete skilldata.passive[args[1].toLowerCase()];
					break;
				case 'status':
					if (!skilldata.statusses) return message.channel.send(`${skilldata.name} has no extras!`);
					if (!skilldata.statusses[args[1].toLowerCase()]) return message.channel.send(`${skilldata.name} has no ${args[1]} extras!`);

					delete skilldata.statusses[args[1].toLowerCase()];
					break;
				case 'heal':
					if (!skilldata.heal) return message.channel.send(`${skilldata.name} has no extras!`);
					if (!skilldata.heal[args[1].toLowerCase()]) return message.channel.send(`${skilldata.name} has no ${args[1]} extras!`);

					delete skilldata.heal[args[1].toLowerCase()];
					break;
				default:
					if (!skilldata.extras) return message.channel.send(`${skilldata.name} has no extras!`);
					if (!skilldata.extras[args[1].toLowerCase()]) return message.channel.send(`${skilldata.name} has no ${args[1]} extras!`);

					delete skilldata.extras[args[1].toLowerCase()];
					break;
			}

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
	section: "skills",
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
			forced: true,
			multiple: true,
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skillFile[args[0]].originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skillFile[args[0]].name}!`);
			}

			let totalDmg = 0
			let editField = args[1].toLowerCase();
			switch(editField) {
				case 'pow':
				case 'power':
				case 'strength':
					if (skillFile[args[0]].extras?.dragonrage) return message.channel.send(`You can't edit the power of "Dragon Rage" skills!`);

					if (isNaN(args[2]) && !isFinite(parseInt(args[2]))) return message.channel.send(`${args[2]} is not a number!`);
					totalDmg = args[2]*skillFile[args[0]].hits;
					if (totalDmg > 2000) return message.channel.send(`The Power cap for skills is 2000! A skill of ${skillFile[args[0]].hits} hits can have a maximum of ${2000/skillFile[args[0]].hits} power!`);
					if (args[2] < 0) return message.channel.send('Skills cannot go below 0 power.');

					skillFile[args[0]].pow = args[2];
					break;
				case 'hits':
					if (isNaN(args[2]) && !isFinite(parseInt(args[2]))) return message.channel.send(`${args[2]} is not a number!`);
					if (parseInt(args[2]) < 1) return message.channel.send('Skills cannot have less than 1 hit.');
					totalDmg = skillFile[args[0]].pow*parseInt(args[2]);
					if (totalDmg > 2000) return message.channel.send(`The Power cap for skills is 2000! A skill of ${skillFile[args[0]].hits} hits can have a maximum of ${2000/skillFile[args[0]].hits} power!`);
					if (args[2] < 0) return message.channel.send('Skills cannot go below 0 power.');

					skillFile[args[0]].hits = args[2];
					break;
				case 'acc':
				case 'crit':
					if (isNaN(args[2])) return message.channel.send(`${args[2]} is not a number!`);
					let amount = parseFloat(args[2])
					if (amount < 0) return message.channel.send('This field can\'t be below 0!'); 
					skillFile[args[0]][editField] = amount;
					break;

				case 'name':
				case 'desc':
					skillFile[args[0]][editField] = args[2];
					break;

				case 'status':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), statusEffects)) return message.channel.send(`${args[2].toLowerCase()} is an invalid status effect!`);
					skillFile[args[0]].status = args[2].toLowerCase();
					break;

				case 'statuschance':
				case 'status chance':
				case 'statchance':
					if (isNaN(args[2])) return message.channel.send(`${args[2]} is not a number!`);
					let amount2 = parseFloat(args[2])
					if (amount2 < 0) return message.channel.send('This field can\'t be below 0!'); 
					if (!skillFile[args[0]].status) return message.channel.send(`You need a status effectto set the status chance!`);
					skillFile[args[0]].statuschance = parseFloat(amount2);
					break;

				case 'cost':
					if (isNaN(args[2])) return message.channel.send(`${args[2]} is not a number!`);
					let amount3 = parseFloat(args[2])
					if (amount3 < 0) return message.channel.send('This field can\'t be below 0!');
					skillFile[args[0]].cost = parseFloat(amount3);
					break;

				case 'costtype':
				case 'cost type':
					if (!costTypes.includes(args[2].toLowerCase())) return message.channel.send(`${args[2].toLowerCase()} is an invalid cost type! Valid cost types are: ${costTypes.join(', ')}`);
					skillFile[args[0]].costtype = args[2].toLowerCase();
					break;

				case 'type':
				case 'element':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), Elements)) return message.channel.send(`${args[2].toLowerCase()} is an invalid element!`);
					if (skillFile[args[0]].statusses && args[2].toLowerCase() != 'status') {
						delete skillFile[args[0]].statusses;
					}
					if (skillFile[args[0]].extras && (args[2].toLowerCase() == 'status' || args[2].toLowerCase() == 'passive' || args[2].toLowerCase() == 'heal')) {
						delete skillFile[args[0]].extras;
					}
					if (skillFile[args[0]].heal && args[2].toLowerCase() != 'heal') {
						delete skillFile[args[0]].heal;
					}
					if (skillFile[args[0]].passive && args[2].toLowerCase() != 'passive') {
						delete skillFile[args[0]].passive;
					}
					if (args[2].toLowerCase() == 'passive') {
						if (!args[3]) return message.channel.send(`Passive skills require a passive type! You can see all types with "${getPrefix(message.guild.id)}passivetypes"`);

						skillFile[args[0]] = {
							name: skillFile[args[0]].name,
							type: 'passive',
							originalAuthor: message.author.id
						}

						applyPassive(message, skillFile[args[0]], args[3], args[4], args[5], args[6], args[7], args[8])

						if (skill.done) {
							delete skill.done;
						} else {
							return false;
						}
					}
					skillFile[args[0]].type = args[2].toLowerCase();
					break;

				case 'atktype':
				case 'contact':
				case 'skilltype':
					if (skillFile[args[0]].type == 'status' || skillFile[args[0]].type == 'heal' || skillFile[args[0]].type == 'passive') return message.channel.send(`These skills cannot have an attack type!`);
					let type = args[2].toLowerCase();
					if (type != 'physical' && type != 'magic' && type != 'ranged') return message.channel.send(`${type} is an invalid form of contact! Try physical, magic or ranged.`);
					skillFile[args[0]].atktype = type;
					break;

				case 'truename':
					if (skillFile[args[2]]) {
						return message.channel.send(`A skill called ${args[2]} (${skillFile[args[2]].name}) already exists!`)
					} else {
						if (args[0] == args[2]) return message.channel.send(`What's the point...?`);
						skillFile[args[2]] = utilityFuncs.cloneObj(skillFile[args[0]])
						delete skillFile[args[0]]

						for (let i in skillFile) {
							if (skillFile[i].evoskills) {
								for (let j in skillFile[i].evoskills) {
									if (skillFile[i].evoskills[j][0] == args[0]) {
										skillFile[i].evoskills[j][0] = args[2];
									}
								}
							}
							if (skillFile[i].preskills) {
								for (let j in skillFile[i].preskills) {
									if (skillFile[i].preskills[j][0] == args[0]) {
										skillFile[i].preskills[j][0] = args[2];
									}
								}
							}
							if (skillFile[i].statusses && skillFile[i].statusses.tanukimation && skillFile[i].statusses.tanukimation[0][1] != null) {
								if (skillFile[i].statusses.tanukimation[0][1] == args[0]) {
									skillFile[i].statusses.tanukimation[0][1] = args[2];
								}
							}
						}

						let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));
						
						for (directory in directoryList) {
							itemFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/items.json`);
							weaponFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/weapons.json`);
							armorFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/armors.json`);
							charFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/characters.json`);
							enemyFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/enemies.json`);

							for (item in itemFile) {
								if (itemFile[item].skill == args[0]) {
									itemFile[item].skill = args[2];
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/items.json`, JSON.stringify(itemFile, null, '    '));

							for (weapon in weaponFile) {
								if (weaponFile[weapon].skill == args[0]) {
									weaponFile[weapon].skill = args[2];
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/weapons.json`, JSON.stringify(weaponFile, null, '    '));

							for (armor in armorFile) {
								if (armorFile[armor].skill == args[0]) {
									armorFile[armor].skill = args[2];
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/armors.json`, JSON.stringify(armorFile, null, '    '));

							for (character in charFile) {
								if (charFile[character].skills) {
									for (skill in charFile[character].skills) {
										if (charFile[character].skills[skill] == args[0]) {
											charFile[character].skills[skill] = args[2];
										}
									}
								}
								if (charFile[character].transformations) {
									for (transformation in charFile[character].transformations) {
										if (charFile[character].transformations[transformation].skill == args[0]) {
											charFile[character].transformations[transformation].skill = args[2];
										}
									}
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/characters.json`, JSON.stringify(charFile, null, '    '));

							for (enemy in enemyFile) {
								if (enemyFile[enemy].skills) {
									for (skill in enemyFile[enemy].skills) {
										if (enemyFile[enemy].skills[skill] == args[0]) {
											enemyFile[enemy].skills[skill] = args[2];
										}
									}
								}
								if (enemyFile[enemy].negotiateDefs) {
									if (enemyFile[enemy].negotiateDefs.skill == args[0]) {
										enemyFile[enemy].negotiateDefs.skill = args[2];
									}
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
						}
					}
					
					break;
				
				case 'levellock':
				case 'level':
				case 'lock':
					if (args[2].toLowerCase() == 'unobtainable') skillFile[args[0]].levellock = 'unobtainable';
					else {
						let level = parseInt(args[2])
						
						if (level <= 1)
							delete skillFile[args[0]].levellock;
						else
							skillFile[args[0]].levellock = level;
					}

					let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));
						
					for (directory in directoryList) {
						let charFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/characters.json`);
						for (character in charFile) {
							if (charFile[character].skills.includes(args[0])) {
								if (skillFile[args[0]].levellock == 'unobtainable' || skillFile[args[0]].levellock > charFile[character].level) {
									charFile[character].skills.splice(charFile[character].skills.indexOf(args[0]), 1);
								}
							}
							if (charFile[character].transformations) {
								for (transformation in charFile[character].transformations) {
									if (charFile[character].transformations[transformation].skill == args[0]) {
										if (skillFile[args[0]].levellock == 'unobtainable' || skillFile[args[0]].levellock > charFile[character].level) {
											delete charFile[character].transformations[transformation].skill;
										}
									}
								}
							}
						}
						fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/characters.json`, JSON.stringify(charFile, null, '    '));
					}

					message.channel.send(`**[NOTICE]**\nConsider using the "levellock" command! It is faster for you, and for me.`)
					break;
				case 'target':
					if (!utilityFuncs.inArray(args[2].toLowerCase(), Targets)) return message.channel.send(`${args[2].toLowerCase()} is an invalid target!`);
					if (skillFile[args[0]].type == 'passive') return message.channel.send('Passive skills cannot have a target!');
					skillFile[args[0]].target = args[2].toLowerCase();
					break;
				default:
					return message.channel.send(`${editField} is an invalid field!`);
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
		}
	}
})

commands.levellock = new Command({
	desc: "Skills can be locked to a certain level to restrict usage. This is usually done for higher levels. If you don't quite like the automatically assigned level lock, then you can use this command to change it.",
	section: "skills",
	aliases: ['lockskill', 'lvllock', 'skillock', 'lock'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Level Lock",
			type: "Num or 'Unobtainable'",
			forced: true
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]]) {
			if (!utilityFuncs.RPGBotAdmin(message.author.id) && skillFile[args[0]].originalAuthor != message.author.id) {
				return message.channel.send(`You don't own ${skillFile[args[0]].name}!`);
			}

			if (args[1].toLowerCase() == 'unobtainable') skillFile[args[0]].levellock == 'unobtainable';
			else {
				let level = parseInt(args[1])
				
				if (level <= 1)
					delete skillFile[args[0]].levellock;
				else
					skillFile[args[0]].levellock = level;
			}

			let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));

			for (directory in directoryList) {
				let charFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/characters.json`);
				for (character in charFile) {
					if (charFile[character].skills.includes(args[0])) {
						if (skillFile[args[0]].levellock == 'unobtainable' || skillFile[args[0]].levellock > charFile[character].level) {
							charFile[character].skills.splice(charFile[character].skills.indexOf(args[0]), 1);
						}
					}
					if (charFile[character].transformations) {
						for (transformation in charFile[character].transformations) {
							if (charFile[character].transformations[transformation].skill == args[0]) {
								if (skillFile[args[0]].levellock == 'unobtainable' || skillFile[args[0]].levellock > charFile[character].level) {
									delete charFile[character].transformations[transformation].skill;
								}
							}
						}
					}
				}
				fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/characters.json`, JSON.stringify(charFile, null, '    '));
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
		}
	}
})

commands.preskill = new Command({
	desc: "Assign an Pre-Skill. This is a skill that characters will use at lower levels.",
	section: "skills",
	aliases: ['previousskill'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Target Skill",
			type: "Word",
			forced: true
		},
		{
			name: "Level",
			type: "Num",
			forced: true
		},
		{
			name: "Assign Evo-Skill",
			type: "Word",
			forced: false
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && (skillFile[args[1]] || args[1].toLowerCase() === "remove")) {
			if (skillFile[args[0]]?.preskills && skillFile[args[0]].preskills.length == 5) return message.channel.send(`${skillFile[args[0]].name} already has enough preskills. There's no need to add more.`);

			if (hasPreSkill(skillFile[args[0]], args[1])) {
				return message.channel.send(`${skillFile[args[0]].name} already has a pre-skill for ${args[1]}!`)
			}

			if (!utilityFuncs.RPGBotAdmin(message.author.id)) {
				if (skillFile[args[0]].originalAuthor != message.author.id && args[1].toLowerCase() === "remove") {
					return preSkillRequest(message, args, skillFile[args[0]], 'remove');
				}

				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]].originalAuthor != message.author.id) {
					return message.channel.send(`You don't own ${skillFile[args[0]].name} or ${skillFile[args[1]].name}.`);
				}

				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]] && skillFile[args[1]].originalAuthor == message.author.id) {
					return preSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[0]].originalAuthor);
				}

				if (skillFile[args[0]].originalAuthor == message.author.id && skillFile[args[1]] && skillFile[args[1]].originalAuthor != message.author.id) {
					return preSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[1]].originalAuthor);
				}
			}

			setPreSkill(skillFile[args[0]], args[1], args[2]);
			if (args[1].toLowerCase() !== "remove" && args[3] && (args[3].toLowerCase() == 'y' || args[3].toLowerCase() == 'yes')) {
				if (!hasEvoSkill(skillFile[args[1]], args[0])) {
					setEvoSkill(skillFile[args[1]], args[0], args[2]-1);
				}
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${skillFile[args[0]] ? args[1] : args[0]} is an invalid Skill Name!`);
		}
	}
})

commands.removepreskill = new Command({
	desc: "Remove a Pre-Skill that a server may have.",
	section: "skills",
	aliases: ['removepreviousskill', 'deletepreskill', 'deletepreviousskill'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Pre-Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Affect Evo-Skill?",
			type: "YesNo",
			forced: false
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && (skillFile[args[1]] || args[1].toLowerCase() === "remove")) {
			if (!hasPreSkill(skillFile[args[0]], args[1])) {
				return message.channel.send(`${skillFile[args[0]].name} does not have a pre-skill for ${args[1]}!`)
			}

			if (!utilityFuncs.RPGBotAdmin(message.author.id)) {
				if (skillFile[args[0]].originalAuthor != message.author.id && args[1].toLowerCase() === "remove") {
					return removePreSkillRequest(message, args, skillFile[args[0]], 'remove');
				}

				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]].originalAuthor != message.author.id) {
					return message.channel.send(`You don't own ${skillFile[args[0]].name} or ${skillFile[args[1]].name}.`);
				}

				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]] && skillFile[args[1]].originalAuthor == message.author.id) {
					return removePreSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[0]].originalAuthor);
				}

				if (skillFile[args[0]].originalAuthor == message.author.id && skillFile[args[1]] && skillFile[args[1]].originalAuthor != message.author.id) {
					return removePreSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[1]].originalAuthor);
				}
			}

			removePreSkill(skillFile[args[0]], args[1]);
			if (args[1].toLowerCase() !== "remove" && args[2]) {
				if (hasEvoSkill(skillFile[args[1]], args[0])) {
					removeEvoSkill(skillFile[args[1]], args[0]);
				}
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${skillFile[args[0]] ? args[1] : args[0]} is an invalid Skill Name!`);
		}
	}
})

commands.evoskill = new Command({
	desc: "Assign an Evo-Skill. This is a skill that characters can learn when they level up! They are usually stronger versions of previous skills.",
	section: "skills",
	aliases: ['evolutionskill'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Target Skill",
			type: "Word",
			forced: true
		},
		{
			name: "Level",
			type: "Num",
			forced: true
		},
		{
			name: "Assign Pre-Skill",
			type: "Word",
			forced: false
		},
		{
			name: "Assign Level Lock",
			type: "Word",
			forced: false
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && skillFile[args[1]]) {
			if (skillFile[args[0]]?.evoskills && skillFile[args[0]].evoskills.length == 5) return message.channel.send(`${skillFile[args[0]].name} already has enough evoskills. There's no need to add more.`);

			if (hasEvoSkill(skillFile[args[0]], args[1])) {
				return message.channel.send(`${skillFile[args[0]].name} already has an evo-skill for ${args[1]}!`)
			}

			if (!utilityFuncs.RPGBotAdmin(message.author.id)) {
				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]].originalAuthor != message.author.id) {
					return message.channel.send(`You don't own ${skillFile[args[0]].name} or ${skillFile[args[1]].name}.`);
				}

				if (skillFile[args[0]].originalAuthor != message.author.id) {
					return evoSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[0]].originalAuthor);
				}

				if (skillFile[args[1]].originalAuthor != message.author.id) {
					return evoSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[1]].originalAuthor);
				}
			}

			setEvoSkill(skillFile[args[0]], args[1], args[2]);
			if (args[3] && (args[3].toLowerCase() == 'y' || args[3].toLowerCase() == 'yes')) {
				if (!hasPreSkill(skillFile[args[1]], args[0])) {
					setPreSkill(skillFile[args[1]], args[0], args[2]-1);
				}
			}

			if (args[4] && (args[4].toLowerCase() == 'y' || args[4].toLowerCase() == 'yes')) {
				skillFile[args[0]].levellock = args[2];

				let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));

				for (directory in directoryList) {
					let charFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/characters.json`);
					for (character in charFile) {
						if (charFile[character].skills[args[0]]) {
							if (skillFile[args[0]].levellock == 'unobtainable' || skillFile[args[0]].levellock > charFile[character].level) {
								delete charFile[character].skills[args[0]];
							}
						}
						if (charFile[character].transformations) {
							for (transformation in charFile[character].transformations) {
								if (charFile[character].transformations[transformation].skill == args[0]) {
									if (skillFile[args[0]].levellock == 'unobtainable' || skillFile[args[0]].levellock > charFile[character].level) {
										delete charFile[character].transformations[transformation].skill;
									}
								}
							}
						}
					}
					fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/characters.json`, JSON.stringify(charFile, null, '    '));
				}
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${skillFile[args[0]] ? args[1] : args[0]} is an invalid Skill Name!`);
		}
	}
})

commands.removeevoskill = new Command({
	desc: "Remove an Evo-Skill that a server may have.",
	section: "skills",
	aliases: ['removeevolutionskill', 'deleteevoskill', 'deleteevolutionskill'],
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Evo-skill Name",
			type: "Word",
			forced: true
		},
		{
			name: "Affect Pre-Skill?",
			type: "YesNo",
			forced: false
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]] && (skillFile[args[1]] || args[1].toLowerCase() === "remove")) {
			if (!hasEvoSkill(skillFile[args[0]], args[1])) {
				return message.channel.send(`${skillFile[args[0]].name} does not have an evo-skill for ${args[1]}!`)
			}

			if (!utilityFuncs.RPGBotAdmin(message.author.id)) {
				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]].originalAuthor != message.author.id) {
					return message.channel.send(`You don't own ${skillFile[args[0]].name} or ${skillFile[args[1]].name}.`);
				}

				if (skillFile[args[0]].originalAuthor != message.author.id && skillFile[args[1]] && skillFile[args[1]].originalAuthor == message.author.id) {
					return removeEvoSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[0]].originalAuthor);
				}

				if (skillFile[args[0]].originalAuthor == message.author.id && skillFile[args[1]] && skillFile[args[1]].originalAuthor != message.author.id) {
					return removeEvoSkillRequest(message, args, skillFile[args[0]], skillFile[args[1]], skillFile[args[1]].originalAuthor);
				}
			}

			removeEvoSkill(skillFile[args[0]], args[1]);
			if (args[2]) {
				if (hasPreSkill(skillFile[args[1]], args[0])) {
					removePreSkill(skillFile[args[1]], args[0]);
				}
			}

			fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			message.react('👍');
		} else {
			return message.channel.send(`${skillFile[args[0]] ? args[1] : args[0]} is an invalid Skill Name!`);
		}
	}
})

/*
	SKILL LISTING
					*/
commands.getskill = new Command({
	desc: 'List the data and information for the specified skill.',
	section: "skills",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
		if (skillFile[args[0]])
			skillFuncs.skillDesc(skillFile[args[0]], args[0], message, `Here is the data for ${skillFile[args[0]].name}`)	
		else
			return message.channel.send(`${args[0]} is an invalid Skill Name!`)
	}
})

commands.listskills = new Command({
	desc: 'Lists *all* existing skills.',
	section: "skills",
	args: [
        {
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
    ],
	func(message, args, guilded) {
		let array = []

		const validTypes = ['user', 'element', 'cost', 'costtype', 'pow', 'acc', 'crit', 'hits', 'atktype', 'target', 'status', 'statuschance', 'preskill', 'evoskill', 'levellock', 'extra']

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

		for (const i in skillFile) {
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

							isConditionMet = (skillFile[i].originalAuthor == args[a])
							break;
						case 'element':
							args[a] = args[a].toLowerCase();
							isConditionMet = (skillFile[i].type == args[a] || skillFile[i].type.includes(args[a]))
							break;
						case 'status':
							args[a] = args[a].toLowerCase();
							isConditionMet = (skillFile[i].status && (skillFile[i].status == args[a] || skillFile[i].status.includes(args[a])))
							break;
						case 'cost':
						case 'pow':
						case 'hits':
							args[a] = parseInt(args[a]);
							isConditionMet = (skillFile[i][args[a-1]] && skillFile[i][args[a-1]] == args[a])
							break;
						case 'acc':
						case 'crit':
						case 'statuschance':
							args[a] = parseFloat(args[a]);
							isConditionMet = (skillFile[i][args[a-1]] && skillFile[i][args[a-1]] == args[a])
							break;
						case 'atktype':
						case 'costtype':
						case 'target':
							args[a] = args[a].toLowerCase();
							isConditionMet = (skillFile[i][args[a-1]] && skillFile[i][args[a-1]].includes(args[a]))
							break;
						case 'preskill':
						case 'evoskill':
							isConditionMet = false

							args[a-1] = args[a-1] + 's';
							if (args[a].toString().toLowerCase() != 'true' && args[a].toString().toLowerCase() != 'false') {
								if (skillFile[i][args[a-1]]) {
									if (!isNaN(args[a])) args[a] = parseInt(args[a]);

									for (const j in skillFile[i][args[a-1]]) {
										if (skillFile[i][args[a-1]][j].includes(args[a])) {
											isConditionMet = true;
											break;
										}
									}
								}
							} else if (args[a].toString().toLowerCase() == 'true') {
								isConditionMet = (skillFile[i][args[a-1]] && Object.keys(skillFile[i][args[a-1]]).length > 0)
							} else if (args[a].toString().toLowerCase() == 'false') {
								isConditionMet = (skillFile[i][args[a-1]] && Object.keys(skillFile[i][args[a-1]]).length == 0) || !skillFile[i][args[a-1]]
							}
							break;
						case 'levellock':
							if (args[a].toString().toLowerCase() != 'true' && args[a].toString().toLowerCase() != 'false') {
								if (!isNaN(args[a])) {
									args[a] = parseInt(args[a]);
								}

								isConditionMet = skillFile[i].levellock && skillFile[i].levellock == args[a].toString().toLowerCase()
							} else if (args[a].toString().toLowerCase() == 'true') {
								isConditionMet = skillFile[i].levellock
							} else if (args[a].toString().toLowerCase() == 'false') {
								isConditionMet = !skillFile[i].levellock
							}
							break;
						case 'extra':
							isConditionMet = false
							if (skillFile[i].type == 'status') {
								if (skillFile[i].statusses) {
									isConditionMet = (skillFile[i].statusses[args[a]])
								}
							} else if (skillFile[i].type == 'heal') {
								if (skillFile[i].heal) {
									isConditionMet = (skillFile[i].heal[args[a]])
								}
							} else if (skillFile[i].type == 'passive') {
								if (skillFile[i].passive) {
									isConditionMet = (skillFile[i].passive[args[a]])
								}
							} else {
								if (skillFile[i].extras) {
									isConditionMet = (skillFile[i].extras[args[a]])
								}
							}
							break;
					}
					if (isConditionMet == false || isConditionMet == undefined) break;
				}
			}
			if (isConditionMet == false || isConditionMet == undefined) continue;

			let descTxt = '';
			if (skillFile[i].type.toString().toLowerCase() == 'passive') {
				descTxt = 'A passive skill.';
			} else if (skillFile[i].type.toString().toLowerCase() == 'status') {
				descTxt = 'A status skill.';
			} else if (skillFile[i].type.toString().toLowerCase() == 'heal') {
				descTxt = 'A heal skill.';
			} else {
				if (hasExtra(skillFile[i], 'ohko')) {
					descTxt = `${skillFile[i].acc}% chance to instantly down the foe.`;
				} else if (hasExtra(skillFile[i], 'stealmp')) {
					descTxt = `Steal ${skillFile[i].pow}MP from the foe.`;
				} else {
					descTxt = `${skillFile[i].pow} Power and ${skillFile[i].acc}% Accuracy.`;
				}
			}

			let element = ''
			if (typeof skillFile[i].type == 'string') {
				element += elementEmoji[skillFile[i].type]
			} else {
				for (const j in skillFile[i].type) {
					element += elementEmoji[skillFile[i].type[j]]
				}
			}
			array.push({title: `${element} ${skillFile[i].name} (${i})`, desc: descTxt});
		}

		if (array.length < 1) return message.channel.send('No skills found!');

		listArray(message.channel, array, message.author.id);
	}
})

commands.searchskills = new Command({
	desc: 'Searches for skills based on the phrase.',
	section: "skills",
	args: [
		{
			name: "Phrase",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
		let array = []
		for (const i in skillFile) {
			if ((skillFile[i]?.name && skillFile[i].name.includes(args[0])) || i.includes(args[0])) {
				let descTxt = '';
				if (skillFile[i].type.toString().toLowerCase() == 'passive') {
					descTxt = 'A passive skill.';
				} else if (skillFile[i].type.toString().toLowerCase() == 'status') {
					descTxt = 'A status skill.';
				} else if (skillFile[i].type.toString().toLowerCase() == 'heal') {
					descTxt = 'A heal skill.';
				} else {
					if (hasExtra(skillFile[i], 'ohko')) {
						descTxt = `${skillFile[i].acc}% chance to instantly down the foe.`;
					} else if (hasExtra(skillFile[i], 'stealmp')) {
						descTxt = `Steal ${skillFile[i].pow}MP from the foe.`;
					} else {
						descTxt = `${skillFile[i].pow} Power and ${skillFile[i].acc}% Accuracy.`;
					}
				}

				let element = ''
				if (typeof skillFile[i].type == 'string') {
					element += elementEmoji[skillFile[i].type]
				} else {
					for (const j in skillFile[i].type) {
						element += elementEmoji[skillFile[i].type[j]]
					}
				}
				array.push({title: `${element} ${skillFile[i].name} (${i})`, desc: descTxt});
			}
		}

		if (array.length < 1) return message.channel.send('No skills found!');

		listArray(message.channel, array, message.author.id);
	}
})

/*
	DELETING SKILLS
					  */
commands.purgeskill = new Command({
	desc: 'Deletes the skill in question. **YOU CANNOT GET IT BACK AFTER DELETION!**',
	aliases: ['unregisterskill', 'skillpurge', 'skillunregister', 'deleteskill', 'skilldelete'],
	section: "skills",
	args: [
		{
			name: "Skill Name",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
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

						//check through every skill's evoskills and preskills. If each entry in them contains the skill, remove it.
						for (const i in skillFile) {
							if (skillFile[i].evoskills) {
								for (const j in skillFile[i].evoskills) {
									if (skillFile[i].evoskills[j][0] == args[0]) {
										skillFile[i].evoskills.splice(j, 1);
									}
								}
							}
							if (skillFile[i].preskills) {
								for (const j in skillFile[i].preskills) {
									if (skillFile[i].preskills[j][0] == args[0]) {
										skillFile[i].preskills.splice(j, 1);
									}
								}
							}
							if (skillFile[i].statusses && skillFile[i].statusses.tanukimation && skillFile[i].statusses.tanukimation[0][1] != null) {
								if (skillFile[i].statusses.tanukimation[0][1] == args[0]) {
									skillFile[i].statusses.tanukimation[0][1] = null;
								}
							}
						}

						let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));
						
						for (directory in directoryList) {
							itemFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/items.json`);
							weaponFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/weapons.json`);
							armorFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/armors.json`);
							charFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/characters.json`);
							enemyFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/enemies.json`);

							for (item in itemFile) {
								if (itemFile[item].skill == args[0]) {
									delete itemFile[item].skill;
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/items.json`, JSON.stringify(itemFile, null, '    '));

							for (weapon in weaponFile) {
								if (weaponFile[weapon].skill == args[0]) {
									delete weaponFile[weapon].skill
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/weapons.json`, JSON.stringify(weaponFile, null, '    '));

							for (armor in armorFile) {
								if (armorFile[armor].skill == args[0]) {
									delete armorFile[armor].skill
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/armors.json`, JSON.stringify(armorFile, null, '    '));

							for (char in charFile) {
								if (charFile[char].skills) {
									for (skill in charFile[char].skills) {
										if (charFile[char].skills[skill] == args[0]) {
											charFile[char].skills[skill] = '';
										}
									}
									charFile[char].skills = charFile[char].skills.filter(skill => skill != '');
								}
								if (charFile[char].transformations) {
									for (transformation in charFile[char].transformations) {
										if (charFile[char].transformations[transformation].skill == args[0]) {
											charFile[char].transformations[transformation].skill = '';
										}
									}
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/characters.json`, JSON.stringify(charFile, null, '    '));

							for (enemy in enemyFile) {
								if (enemyFile[enemy].skills) {
									for (skill in enemyFile[enemy].skills) {
										if (enemyFile[enemy].skills[skill] == args[0]) {
											enemyFile[enemy].skills[skill] = '';
										}
									}
									enemyFile[enemy].skills = enemyFile[enemy].skills.filter(skill => skill != '');
								}
								if (enemyFile[enemy].negotiateDefs) {
									if (enemyFile[enemy].negotiateDefs.skill == args[0]) {
										delete enemyFile[enemy].negotiateDefs.skill;
									}
								}
							}
							fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
						}

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
	section: "roll",
	args: [],
	func(message, args, guilded) {
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
				skillFuncs.skillDesc(skillFile[dailySkill], skillFile[dailySkill].name, message, skillTxt);	
			}
		}, 500);
	}
})

commands.randskill = new Command({
	desc: 'Gets a random skill.',
	section: "roll",
	aliases: ['randomskill'],
	args: [],
	func(message, args, guilded) {
		if (Object.keys(skillFile).length == 0) return message.channel.send(`No skills have been added yet.`);

		let skill = Object.keys(skillFile)[Math.floor(Math.random() * Object.keys(skillFile).length)];
		skillFuncs.skillDesc(skillFile[skill], skillFile[skill].name, message)
	}
})

commands.orderskills = new Command({
	desc: '**Blossom Battler Administrator Only!**\nOrders the skills in the skill file.',
	section: "skills",
	args: [],
	checkban: true,
	admin: 'You have insufficient permissions to order skills.',
	func(message, args, guilded) {
		if (!utilityFuncs.RPGBotAdmin(message.author.id)) {
			message.channel.send("You have insufficient permissions to order skills.")
			return false
		}

		utilityFuncs.orderSkills();
		message.react('👍');
	}
})

/*
	GETTING ELEMENTS AND STATUSES
									*/

commands.listelements = new Command({
	desc: 'Lists all the elements.',
	section: "skills",
	aliases: ['listelement', 'elementlist'],
	args: [],
	func(message, args, guilded) {
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

statusDescs = [
	{
		title: "<:physical:973077052129423411> Physical Negative Ailments",
		statuses: [
			{
				name: "burn",
				desc: `Takes *an amount of HP* of damage each turn until *3 turns pass*, cured, or once 1 HP is reached. *May change the ${statusEmojis["atkdown"]}ATK stat*.`,
				ailments: {
					nonboss: {
						weak: `Takes *1/5th* of max HP & *1/4s* the ${statusEmojis["atkdown"]}ATK stat.`,
						normal: `Takes *1/10th* of max HP & *1/2s* the ${statusEmojis["atkdown"]}ATK stat.`,
						resist: `Takes *1/20th* of max HP & *1/1.25s* the ${statusEmojis["atkdown"]}ATK stat.`,
					},
					boss: `Takes *5 HP* & *doesn't change ${statusEmojis["atkdown"]}ATK stat*.`
				}
			},
			{
				name: "bleed",
				desc: `Takes *an amount of HP* of damage each turn until *3 turns pass*, cured, or once the afflicted is defeated.`,
				ailments: {
					nonboss: {
						weak: `Takes *1/5th* of max HP.`,
						normal: `Takes *1/10th* of max HP.`,
						resist: `Takes *1/20th* of max HP.`,
					},
					boss: `Takes *10 HP*.`
				}
			},
			{
				name: "freeze",
				desc: `Immobilizes the afflicted for an *amount of turns*.`,
				ailments: {
					nonboss: {
						weak: `Lasts *2 turns*.`,
						normal: `Lasts *1 turn*.`,
						resist: `Lasts *1 turn, but has a 50% chance of thawing out*.`,
					},
					boss: `*Thaws out immediately*.`
				}
			},
			{
				name: "paralyze",
				desc: `Has *a chance* to immobilize the afflicted until expired. Halves chance each turn.`,
				ailments: {
					nonboss: {
						weak: `Lasts *5 turns* and sets initial paralyze chance to *160%*.`,
						normal: `Lasts *4 turns* and sets initial paralyze chance to *80%*.`,
						resist: `Lasts *3 turns* and sets initial paralyze chance to *40%*.`,
					},
					boss: `*Shakes it off immediately*.`
				}
			},
			{
				name: "toxin",
				desc: `Takes *an amount of HP* of damage each turn until *3 turns pass*, cured, or once 1 HP is reached. *May change the ${statusEmojis["magdown"]}MAG stat*.`,
				ailments: {
					nonboss: {
						weak: `Takes *1/5th* of max HP & *1/4s* the ${statusEmojis["magdown"]}MAG stat.`,
						normal: `Takes *1/10th* of max HP & *1/2s* the ${statusEmojis["magdown"]}MAG stat.`,
						resist: `Takes *1/20th* of max HP & *1/1.25s* the ${statusEmojis["magdown"]}MAG stat.`,
					},
					boss: `Takes *5 HP* & *doesn't change ${statusEmojis["magdown"]}MAG stat*.`
				}
			},
			{
				name: "dazed",
				desc: `Disables physical and ranged skill usage for *an amount of turns*.`,
				ailments: {
					nonboss: {
						weak: `Lasts *3 turns*.`,
						normal: `Lasts *2 turns*.`,
						resist: `Lasts *1 turn*.`,
					},
					boss: `Lasts *1 turn*.`
				}
			},
			{
				name: "hunger",
				desc: `*May alter ${statusEmojis["atkdown"]}ATK & ${statusEmojis["magdown"]}MAG stats*.`,
				ailments: {
					nonboss: {
						weak: `*1/4s* ${statusEmojis["atkdown"]}ATK & ${statusEmojis["magdown"]}MAG stats.`,
						normal: `*1/2s* ${statusEmojis["atkdown"]}ATK & ${statusEmojis["magdown"]}MAG stats.`,
						resist: `*1/1.25s* ${statusEmojis["atkdown"]}ATK & ${statusEmojis["magdown"]}MAG stats.`,
					},
					boss: `Affects them the same as non-bosses.`
				}
			},
			{
				name: "blind",
				desc: `*May alter ${statusEmojis["prcdown"]}PRC & ${statusEmojis["agldown"]}AGL stats*.`,
				ailments: {
					nonboss: {
						weak: `*1/4s* ${statusEmojis["prcdown"]}PRC & ${statusEmojis["agldown"]}AGL stats.`,
						normal: `*1/2s* ${statusEmojis["prcdown"]}PRC & ${statusEmojis["agldown"]}AGL stats.`,
						resist: `*1/1.25s* ${statusEmojis["prcdown"]}PRC & ${statusEmojis["agldown"]}AGL stats.`,
					},
					boss: `Affects them the same as non-bosses.`
				}
			},
			{
				name: "irradiation",
				desc: `Switches *an amount of random stats* for *an amount of turns*.`,
				ailments: {
					nonboss: {
						weak: `Lasts *5 turns* and switches *3 stats*.`,
						normal: `Lasts *3 turns* and switches *2 stats*.`,
						resist: `Lasts *1 turn* and switches *2 stats*.`,
					},
					boss: `Affects them the same as non-bosses.`
				}
			},
			{
				name: "drenched",
				desc: `Nullifies status affinities for *3 turns*. *Stacks with other status effects.*`,
			}
		]
	},
	{
		title: "<:mental:1004855144745291887> Mental Negative Ailments",
		statuses: [
			{
				name: "dizzy",
				desc: `Halves accuracy of all skills for *2 turns*.`,
			},
			{
				name: "sleep",
				desc: `Immobilizes for *1 turn*. May restore *an amount of HP and MP* while affected.`,
				ailments: {
					nonboss: {
						weak: `Does not restore HP and MP.`,
						normal: `Restores *1/20th* of max HP and max MP`,
						resist: `Restores *1/10th* of max HP and max MP`,
					},
					boss: `Let's them do their turn instead of immobilizing.`
				}
			},
			{
				name: "despair",
				desc: `Takes *an amount of MP* each turn until *3 turns pass*, cured, or until the afflected runs out of MP which renders them defeated.`,
				ailments: {
					nonboss: {
						weak: `Takes *1/5th* of max MP.`,
						normal: `Takes *1/10th* of max MP.`,
						resist: `Takes *1/20th* of max MP.`,
					},
					boss: `Takes *10* MP.`
				}
			},
			{
				name: "brainwash",
				desc: `Forces the afflicted to use a random move from their pool on the flipped target *(one -> ally)* for *an amount of turns*. Will make afflicted hit themselves if no usable skills are detected.`,
				ailments: {
					nonboss: {
						weak: `Lasts *3 turns*.`,
						normal: `Lasts *2 turns*.`,
						resist: `Lasts *1 turn*.`,
					},
					boss: `Shakes it off immediately.`
				}
			},
			{
				name: "fear",
				desc: `Has *a chance* to immobilize the afflicted, but will pass if *3 turns pass*, cured, or takes effect.`,
				ailments: {
					nonboss: {
						weak: `*75%* chance to immobilize, *but will not remove itself once it takes effect.*.`,
						normal: `*50%* chance to immobilize.`,
						resist: `*25%* chance to immobilize.`,
					},
					boss: `Shakes it off immediately.`
				}
			},
			{
				name: "rage",
				desc: `Forces the afflicted to use a stronger melee attack on a random target for *an amount of turns*`,
				ailments: {
					nonboss: {
						weak: `Lasts *3 turns*.`,
						normal: `Lasts *2 turns*.`,
						resist: `Lasts *1 turn*.`,
					},
					boss: `Shakes it off immediately.`
				}
			},
			{
				name: "ego",
				desc: `Disables healing skill usage for *an amount of turns*.`,
				ailments: {
					nonboss: {
						weak: `Lasts *5 turns*.`,
						normal: `Lasts *3 turns*.`,
						resist: `Lasts *1 turn*.`,
					},
					boss: `Lasts *1 turn*.`
				}
			},
			{
				name: "silence",
				desc: `Disables magical skill usage and prevents the afflicted from being healed for *an amount of turns*.`,
				ailments: {
					nonboss: {
						weak: `Lasts *3 turns*.`,
						normal: `Lasts *2 turns*.`,
						resist: `Lasts *1 turn*.`,
					},
					boss: `Lasts *1 turn*.`
				}
			},
			{
				name: "infatuation",
				desc: `Has a 50% chance to hault attack for *3 turns*. *Stacks with other status effects.*`,
			},
			{
				name: "confusion",
				desc: `Has a 50% chance for the afflicted to hit themselves for *3 turns*. *Stacks with other status effects.*`,
			},
			{
				name: "sensitive",
				desc: `Debuffs a random stat once hit a single time per opponent *(2 hits from 2 opponents -> 2 debuffs, 2 hits from 1 opponent -> 1 debuff)* for *an amount of turns*.`,
				ailments: {
					nonboss: {
						weak: `Lasts *2 turns* but debuffs two random statuses instead.`,
						normal: `Lasts *2 turns*.`,
						resist: `Lasts *1 turn*.`,
					},
					boss: `Lasts *1 turn*.`
				}
			},
			{
				name: "insanity",
				desc: `May force the afflicted to take *one of multiple actions* for *an amount of turns*. The possible actions are:\n- Skip Turn\n- Random skill on a random target\n- Insanity Action (Buff random enemy's random stat once / Debuff the afflicted's random stat once / Heal a random target with 50 power)`,
				ailments: {
					nonboss: {
						weak: `Lasts *3 turns*.`,
						normal: `Lasts *3 turns* and *removes Insanity Action* from the effects pool.`,
						resist: `Lasts *3 turns* and *removes Insanity Action and Random Skill* from the effects pool.`,
					},
					boss: {
						weak: `Lasts *1 turn* and *removes Insanity Action* from the effects pool.`,
						normal: `Lasts *1 turn* and *removes Insanity Action and Random Skill* from the effects pool`,
						resist: `Shakes it off immediately.`,
					}
				}
			}
		]
	},
	{
		title: "<:tick:973077052372701294> Positive Ailments",
		statuses: [
			{
				name: "mirror",
				type: "physical",
				desc: `Immobilizes for *3 turns*. ${affinityEmoji["repel"]}Repels magic skills, but may make ${elementEmoji["strike"]}strike, ${elementEmoji["slash"]}slash, ${elementEmoji["pierce"]}pierce and ${elementEmoji["explode"]}explode skills *more effective*.`,
				ailments: {
					nonboss: {
						weak: `Effectiveness of ${elementEmoji["strike"]}strike, ${elementEmoji["slash"]}slash, ${elementEmoji["pierce"]}pierce and ${elementEmoji["explode"]}explode skills is ${affinityEmoji["weak"]}weak.`,
						normal: `Effectiveness of ${elementEmoji["strike"]}strike, ${elementEmoji["slash"]}slash, ${elementEmoji["pierce"]}pierce and ${elementEmoji["explode"]}explode skills is ${affinityEmoji["superweak"]}superweak.`,
						resist: `Effectiveness of ${elementEmoji["strike"]}strike, ${elementEmoji["slash"]}slash, ${elementEmoji["pierce"]}pierce and ${elementEmoji["explode"]}explode skills is ${affinityEmoji["deadly"]}deadly.`,
					},
					boss: `Effectiveness of ${elementEmoji["strike"]}strike, ${elementEmoji["slash"]}slash, ${elementEmoji["pierce"]}pierce and ${elementEmoji["explode"]}explode skills is unchanged.`
				}
			},
			{
				name: "airborne",
				type: "physical",
				desc: `Disables effects of terrain for the afflicted for *3 turns*, but *may expire if they use a physical skill*. Increases dodge chance *(physical -> may increase by 100%, other -> may increase by 10%)* and doubles afflicted's physical skill power.`,
				ailments: {
					nonboss: {
						weak: `*Won't* expire if they use a physical skill and *doubles* dodge chance addition.`,
						normal: `Dodge chance addition is *regular*.`,
						resist: `*Halves* dodge chance addition.`,
					},
					boss: `*Won't* expire if they use a physical skill and *doubles* dodge chance addition.`
				}
			},
			{
				name: "happy",
				type: "mental",
				desc: `*Increases ${statusEmojis["critup"]}LUK & ${statusEmojis["aglup"]}AGL stats positively based on level* for *3 turns*, but *decreases the ${statusEmojis["prcdown"]}PRC stat by 1/10th of the afflicted's level*.`,
				ailments: {
					nonboss: {
						weak: `${statusEmojis["critup"]}LUK & ${statusEmojis["aglup"]}AGL increased by *1/7th* of afflicted's level`,
						normal: `${statusEmojis["critup"]}LUK & ${statusEmojis["aglup"]}AGL increased by *1/10th* of afflicted's level`,
						resist: `${statusEmojis["critup"]}LUK & ${statusEmojis["aglup"]}AGL increased by *1/15th* of afflicted's level`,
					},
					boss: `Affects them the same as non-bosses.`
				}
			},
		]
	}
]

commands.liststatus = new Command({
	desc: 'Lists all the status effects.',
	section: "skills",
	aliases: ['liststatuses', 'statuslist'],
	args: [
		{
			name: "Status",
			type: "Word",
			forced: false,
		}
	],
	async func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);

		const genStatusDescription = (status, hideAffinities) => {
			let text = '';

			if (hideAffinities) {
				if (status.type) text += `${status.type == 'physical' ? '*<:physical:973077052129423411> Physical' : '*<:mental:1004855144745291887> Mental'}*\n`
			} else {
				text += `${isPhysicalStatus(status.name) || status.type == 'physical' ? '*<:physical:973077052129423411> Physical' : '*<:mental:1004855144745291887> Mental'}*\n`
			}

			if (settings.mechanics.technicaldamage) {
				text += '*Techs: ';

				let techTxt = ''
				for (const k in elementTechs[status.name]) {
					if (elementTechs[status.name][k] === 'all') {
						techTxt = 'ALL';
						break;
					} else
						techTxt += elementEmoji[elementTechs[status.name][k]];
				}
				
				if (techTxt === '') techTxt = 'NONE'

				text += techTxt + '*\n\n';
			}

			text += status.desc+'\n\n';

			if (!hideAffinities) {
				if (status.ailments) text += '**Status Affinity Changes:**\n'

				for (affinity in status.ailments) {
					text += affinity == 'nonboss' ? '**Non-Bosses:**' : '**Bosses:**';

					if (typeof status.ailments[affinity] == "object") {
						if (settings.mechanics.stataffinities) {
							text += '\n';

							for (side in status.ailments[affinity]) {
								text += affinityEmoji[side] + ': ' + status.ailments[affinity][side] + '\n';
							}
						} else text += ' '+status.ailments[affinity]['normal']

						text += '\n';
					} else {
						text += " "+status.ailments[affinity]+'\n';
					}
				}
			} else {
				if (status.ailments) text += `For full view, please refer to: __${getPrefix(message.guild.id)}liststatus ${status.name}__`
			}

			return text;
		}

		if (args[0]) {
			if (!utilityFuncs.inArray(args[0].toLowerCase(), statusEffects)) return message.channel.send(`${args[0]} is not a valid status effect!`);

			let statDef;

			for (side in statusDescs) {
				for (stat in statusDescs[side].statuses) {
					if (statusDescs[side].statuses[stat].name == args[0].toLowerCase()) {
						statDef = statusDescs[side].statuses[stat];
						break;
					}
				}
				if (statDef) break;
			}

			message.channel.send({
				embeds: [new Discord.MessageEmbed({
					color: '#0099ff',
					title: `${statusEmojis[statDef.name]}${statusNames[statDef.name]} (${statDef.name})`,
					description: genStatusDescription(statDef, false),
				})]
			})

		} else {
			let page = 0;
			let pageIndex = 0;

			const generateEmbed = async (page) => {
				const current = statusDescs[page].statuses.slice(pageIndex, pageIndex + 6);
				return new Discord.MessageEmbed({
					color: '#0099ff',
					title: 'List of status effects:',
					description: `Status affects will affect fighters in-battle and can be fatal if not cured, or beneficial.\n### ${statusDescs[page].title}`,
					fields: await Promise.all(
						current.map(async arrayDefs => ({
							name: `${statusEmojis[arrayDefs.name]}${statusNames[arrayDefs.name]} (${arrayDefs.name})`,
							value: genStatusDescription(arrayDefs, true),
							inline: true
						}))
					)
				})
			}

			embedMessage = await message.channel.send({
				embeds: [await generateEmbed(page)],
				components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
			})
		
			const collector = embedMessage.createMessageComponentCollector({
				filter: ({user}) => user.id == message.author.id
			})

			collector.on('collect', async interaction => {
				if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
					if (interaction.customId === 'forward') {
						pageIndex += 6

						if (pageIndex >= statusDescs[page].statuses.length) {
							page++

							if (page >= statusDescs.length) {
								page = 0
							}
							pageIndex = 0
						}
					} else if (interaction.customId === 'back') {
						pageIndex -= 6

						if (pageIndex < 0) {
							page--

							if (page < 0) {
								page = statusDescs.length-1
							}
							
							pageIndex = statusDescs[page].statuses.length - (statusDescs[page].statuses.length % 6 != 0 ? statusDescs[page].statuses.length % 6 : 6)
						}
					}
		
					await interaction.update({
						embeds: [await generateEmbed(page)],
						components: [
							new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
						]
					})
				} else {
					collector.stop()
					await interaction.update({
					embeds: [await generateEmbed(page)],
					components: []
					})
				}
			})
		}
	}
})