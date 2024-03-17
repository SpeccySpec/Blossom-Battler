/*
	XP
	- HANDLE GAINING XP
	- HANDLE LEVELLING UP
*/
xpBar = (charDefs) => {
	return getBar('xp', charDefs.xp, charDefs.maxxp);
}

gainXp = (message, charDefs, xp, allone, server) => {
    charDefs.xp += xp;
	console.log(`${charDefs.name} ${charDefs.xp}/${charDefs.maxxp}XP`);

	let channel = message.channel ?? message;

	if (allone) {
		let embed = lvlUpWithXpInMind(charDefs, false, message, true, server);

		if (embed) {
			channel.send({content: `${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`, embeds: [embed]});
		} else {
			channel.send(`${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`);
		}
	} else {
		channel.send(`${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`);
		lvlUpWithXpInMind(charDefs, false, message, false, server);
	}
}

updateStats = (charDefs, server, updateXp) => {
	let settings = setUpSettings(server);

	// Handle HP
	if (charDefs.basehp > 1) {
		let END = charDefs.basestats.baseend;
		charDefs.hp = Math.floor(charDefs.basehp + ((charDefs.basehp/10)*(charDefs.level-1)) + ((END/2)*(charDefs.level-1)));
		charDefs.maxhp = Math.floor(charDefs.basehp + ((charDefs.basehp/10)*(charDefs.level-1)) + ((END/2)*(charDefs.level-1)));
	}

	if (charDefs.basemp > 1) {
		let INT = charDefs.basestats.baseint;
		charDefs.mp = Math.floor(charDefs.basemp + ((charDefs.basemp/10)*(charDefs.level-1)) + ((INT/2)*(charDefs.level-1)));
		charDefs.maxmp = Math.floor(charDefs.basemp + ((charDefs.basemp/10)*(charDefs.level-1)) + ((INT/2)*(charDefs.level-1)));
	}

	if (settings.formulas && settings.formulas.levelUpFormula && settings.formulas.levelUpFormula === 'percent') {
		for (const i in stats) {
			let baseStat = charDefs.basestats[`base${stats[i]}`]
			charDefs[stats[i]] = Math.min(99, Math.round(baseStat * (1 + ((charDefs.level-1) * 0.091))))
		}
	} else if (settings.formulas && settings.formulas.levelUpFormula && settings.formulas.levelUpFormula === 'assist') {
		for (const i in stats) {
			let baseStat = charDefs.basestats[`base${stats[i]}`]
			charDefs[stats[i]] = Math.min(99, Math.round((baseStat+3) * (1 + ((charDefs.level-1) * 0.06751))))
		}
	} else {
		for (const stat of stats) charDefs.stats[stat] = charDefs.basestats[`base${stat}`];

		let highestStats = [
			["atk", charDefs.basestats.baseatk],
			["mag", charDefs.basestats.basemag],
			["prc", charDefs.basestats.baseprc],
			["end", charDefs.basestats.baseend],
			["chr", charDefs.basestats.basechr],
			["int", charDefs.basestats.baseint],
			["agl", charDefs.basestats.baseagl],
			["luk", charDefs.basestats.baseluk]
		];

		highestStats.sort(function(a, b) {return  a[1] - b[1]})

		for (let i in highestStats) {
			if (i > highestStats.length-4)
				charDefs.stats[highestStats[i][0]] += (charDefs.level-1);
			else if (i <= 1) {
				charDefs.stats[highestStats[i][0]] += (charDefs.level-1)/3;
			} else {
				charDefs.stats[highestStats[i][0]] += (charDefs.level-1)/2;
			}

			charDefs.stats[highestStats[i][0]] = Math.round(Math.min(settings.caps.statcap, charDefs.stats[highestStats[i][0]]));
		}
	}

	if (updateXp) {
		charDefs.maxxp = 500;
		if (charDefs.level > 1) {
			for (let i = 1; i < charDefs.level; i++) charDefs.maxxp += Math.round(charDefs.maxxp/6.5);
		}
	}
}

checkForEvos = async (charDefs, skillDefs, toUpdate, field) => {
	if (skillDefs) {
		if (skillDefs.preskills) {
			for (preskill in skillDefs.preskills) {
				if (charDefs.level <= skillDefs.preskills[preskill][1]) toUpdate[field].preskills.push(skillDefs.preskills[preskill][0]);
			}
		}

		if (skillDefs.evoskills) {
			for (evoskill in skillDefs.evoskills) {
				if (charDefs.level >= skillDefs.evoskills[evoskill][1]) toUpdate[field].evoskills.push(skillDefs.evoskills[evoskill][0]);
			}
		}
	}
}

evoSkillMessageCollector = async (charDefs, toUpdate, channel, server, ind, field) => {
	let skillDefs = skillFile[charDefs.skills[parseInt(ind)]];
	let skillChoice = (field.preskills.length > 1 ? field.preskills : field.evoskills);

	let descText = '';
	let skillButtons = [];

	descText += `Looks like you got multiple paths to choose from! From **`;

	if (typeof skillDefs.type == 'string') {
		descText += elementEmoji[skillDefs.type]
	} else {
		for (const j in skillDefs.type) {
			descText += elementEmoji[skillDefs.type[j]]
		}
	}

	descText += `${skillDefs.name}**, you can **${field.preskills.length > 1 ? 'downgrade' : 'upgrade'}** to:\n`;

	for (skill in skillChoice) {
		let skillInfo = skillFile[skillChoice[skill]];

		descText += '- ';
		if (typeof skillInfo.type == 'string') {
			descText += elementEmoji[skillInfo.type]
		} else {
			for (const j in skillInfo.type) {
				descText += elementEmoji[skillInfo.type[j]]
			}
		}
		descText += `${skillInfo.name}\n`;

		//Skills
		let btncolor = 'blue'
		if (skillInfo?.type === 'heal') 
			btncolor = 'green'
		else if (skillInfo?.type === 'status') 
			btncolor = 'grey'
		else if (skillInfo?.atktype === 'physical') 
			btncolor = 'red'

		let emoji1 = skillInfo ? elementEmoji[skillInfo.type] : elementEmoji.strike;
		if (typeof(skillInfo?.type) === 'object') emoji1 = skillInfo ? elementEmoji[skillInfo.type[0]] : elementEmoji.strike;

		skillButtons.push(makeButton(skillInfo?.name, emoji1, btncolor, true, skillChoice[skill], false))
	}

	descText += `\nWhich one do you choose?`

	let DiscordEmbed = new Discord.MessageEmbed()
	.setColor(elementColors[charDefs.mainElement])
	.setTitle(`__${elementEmoji[charDefs.mainElement]}${charDefs.name}__'s ${field.preskills.length > 1 ? 'preskill' : 'evoskill'} choice: ${skillDefs.name}`)
	.setDescription(descText);

	let embedMessage = ''
	embedMessage = await channel.send({
		embeds: [DiscordEmbed],
		components: [new Discord.MessageActionRow({components: skillButtons})]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id === charDefs.owner || user.flags.serialize().ADMINISTRATOR || adminList.includes(user.id)
	})

	collector.on('collect', async interaction => {
		collector.stop();
		embedMessage.delete();

		charDefs.skills[parseInt(ind)] = skillChoice[skillChoice.indexOf(interaction.component.customId)];
		toUpdate[ind] = {
			"preskills": [],
			"evoskills": []
		}

		checkForEvos(charDefs, skillFile[charDefs.skills[parseInt(ind)]], toUpdate, ind);
		return replaceEvoSkills(charDefs, toUpdate, channel, server)
	});
}

replaceEvoSkills = async (charDefs, toUpdate, channel, server) => {
	for (ind in toUpdate) {
		if (toUpdate[ind].preskills.length == 1) {
			charDefs.skills[parseInt(ind)] = toUpdate[ind].preskills[0];
			toUpdate[ind] = {
				"preskills": [],
				"evoskills": []
			}

			checkForEvos(charDefs, skillFile[charDefs.skills[parseInt(ind)]], toUpdate, ind);
			return replaceEvoSkills(charDefs, toUpdate, channel, server)
		} else if (toUpdate[ind].preskills.length > 1) {
			return evoSkillMessageCollector(charDefs, toUpdate, channel, server, ind, toUpdate[ind]);
		}

		if (toUpdate[ind].evoskills.length == 1) {
			charDefs.skills[parseInt(ind)] = toUpdate[ind].evoskills[0];
			toUpdate[ind] = {
				"preskills": [],
				"evoskills": []
			}

			checkForEvos(charDefs, skillFile[charDefs.skills[parseInt(ind)]], toUpdate, ind);
			return replaceEvoSkills(charDefs, toUpdate, channel, server)
		} else if (toUpdate[ind].evoskills.length > 1) {
			return evoSkillMessageCollector(charDefs, toUpdate, channel, server, ind, toUpdate[ind])
		}
	}

	for (skill in charDefs.skills) {
		if (charDefs.skills[skill] == 'remove') {
			if (charDefs.autolearn) delete charDefs.autolearn[skill.toString()];
		}
	}
	charDefs.skills = charDefs.skills.filter(x => x != 'remove');

	let charFile = setUpFile(`${dataPath}/json/${server}/characters.json`);

	for (i in charFile) {
		if (charFile[i].name == charDefs.name && charFile[i].owner == charDefs.owner && charFile[i].mainElement == charDefs.mainElement) {
			charFile[i] = charDefs;
			fs.writeFileSync(`${dataPath}/json/${server}/characters.json`, JSON.stringify(charFile, null, '    '));
			return;
		}
	}
}

updateSkillEvos = async (charDefs, forceEvo, message, server) => {
	if (!charDefs.autolearn && !forceEvo) return;

	let checkSkills = [];
	let toUpdate = {};

	if (forceEvo) {
		checkSkills = charDefs.skills;
	} else {
		for (const i in charDefs.autolearn) {
			if (charDefs.autolearn[i] && charDefs.skills[parseInt(i)]) {
				checkSkills.push(charDefs.skills[parseInt(i)])
			}
		}
	}

	for (const i in checkSkills) {
		toUpdate[i.toString()] = {
			"preskills": [],
			"evoskills": []
		};

		let skillDefs = skillFile[checkSkills[i]];

		checkForEvos(charDefs, skillDefs, toUpdate, i.toString());
	}

	let channel = message.channel ?? message;

	replaceEvoSkills(charDefs, toUpdate, channel, server);
}

levelUp = (charDefs, forceEvo, server) => {
	let settings = setUpSettings(server)

	if (charDefs.level >= settings.caps.levelcap) {
		charDefs.xp = charDefs.maxxp - 1
		return false
	}

	// Level Up!
	charDefs.level = Math.min(settings.caps.levelcap, charDefs.level+1);

	// Update Stats
	console.log(`LevelUp: ${charDefs.name} levelled up to level ${charDefs.level}.`)
	updateStats(charDefs, server);

	// Update XP
	charDefs.xp -= charDefs.maxxp
	charDefs.maxxp += Math.round(charDefs.maxxp/6.5)
}

levelDown = (charDefs, forceEvo, server) => {
	if (charDefs.level <= 1) {
		charDefs.xp = 1;
		return false;
	}

	// Level Down :(
	charDefs.level = Math.max(1, charDefs.level-1);

	// Update Stats
	console.log(`LevelUp: ${charDefs.name} levelled down to level ${charDefs.level}.`);
	updateStats(charDefs, server);

	// Update Xp
	charDefs.xp = 0
	charDefs.maxxp -= Math.round(charDefs.maxxp/6.5)
}

// Convert all XP into Levels
lvlUpWithXpInMind = (charDefs, forceEvo, message, returnembed, server) => {
	let lvlCount = 0;
	while (charDefs.xp >= charDefs.maxxp) {
		if (charDefs.level < 99) {
			levelUp(charDefs, forceEvo, server)
			lvlCount++;
		}
	}

	if (lvlCount <= 0) return;
	if (!message && !returnembed) return;

	updateSkillEvos(charDefs, forceEvo, message, server);

	let DiscordEmbed = briefDescription(charDefs);
	DiscordEmbed.title = `${charDefs.name} levelled up${(lvlCount <= 1) ? '!' : ' ' + lvlCount + ' times!'}`;
	DiscordEmbed.description = `${selectQuote(charDefs, 'lvl')}\n\n**Level ${charDefs.level}**\n${DiscordEmbed.description}`;

	let channel = message.channel ?? message;

	if (returnembed)
		return DiscordEmbed;
	else if (message)
		channel.send({embeds: [DiscordEmbed]});
}

// Level up a set number of times
levelUpTimes = (charDefs, forceEvo, times, message) => {
	for (let i = 0; i < times; i++) levelUp(charDefs, forceEvo, message.guild.id);

	if (message) {
		let DiscordEmbed = briefDescription(charDefs);
		DiscordEmbed.title = `${charDefs.name} levelled up${(times <= 1) ? '!' : ' ' + times + ' times!'}`;
		if (selectQuote(charDefs, 'lvl')) DiscordEmbed.description = `_${charDefs.name}: "${selectQuote(charDefs, 'lvl')}"_\n\n${DiscordEmbed.description}`;
		message.channel.send({embeds: [DiscordEmbed]});
	}

	updateSkillEvos(charDefs, forceEvo, message, message.guild.id);
}