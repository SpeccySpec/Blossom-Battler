/*
	XP
	- HANDLE GAINING XP
	- HANDLE LEVELLING UP
*/
xpBar = (charDefs) => {
	return getBar('xp', charDefs.xp, charDefs.maxxp);
}

gainXp = (message, charDefs, xp, allone) => {
    charDefs.xp += xp;
	console.log(`${charDefs.name} ${charDefs.xp}/${charDefs.maxxp}XP`);

	let channel = message.channel ?? message;

	if (allone) {
		let embed = lvlUpWithXpInMind(charDefs, false, message, true);

		if (embed) {
			channel.send({content: `${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`, embeds: [embed]});
		} else {
			channel.send(`${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`);
		}
	} else {
		channel.send(`${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`);
		lvlUpWithXpInMind(charDefs, false, message);
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

updateSkillEvos = (charDefs, forceEvo) => {
	if (forceEvo == true) {
		for (const i in charDefs.skills) {
			let skillDefs = skillFile[charDefs.skills[i]];

			while (skillDefs && skillDefs.preskills && charDefs.level <= skillDefs.preskills[0][1]) {
				if (skillDefs.preskills[0][0] == 'remove') delete charDefs.autolearn[charDefs.skills.indexOf(charDefs.skills[i])];

				charDefs.skills[i] = skillDefs.preskills[0][0];
				skillDefs = skillFile[charDefs.skills[i]];
			}
			while (skillDefs && skillDefs.evoskills && charDefs.level >= skillDefs.evoskills[0][1]) {
				charDefs.skills[i] = skillDefs.evoskills[0][0];
				skillDefs = skillFile[charDefs.skills[i]];
			}
		}

		charDefs.skills = charDefs.skills.filter(x => x != 'remove');
	} else {
		if (!charDefs.autolearn) return;

		var checkSkills = []
		for (const i in charDefs.autolearn) {
			if (charDefs.autolearn[i] && charDefs.skills[parseInt(i)]) {
				checkSkills.push(charDefs.skills[parseInt(i)])
			}
		}

		for (const i in checkSkills) {
			let skillDefs = skillFile[checkSkills[i]];

			while (skillDefs && skillDefs.preskills && charDefs.level <= skillDefs.preskills[0][1]) {
				if (skillDefs.preskills[0][0] == 'remove') delete charDefs.autolearn[charDefs.skills.indexOf(charDefs.skills[i])];

				charDefs.skills[i] = skillDefs.preskills[0][0];
				skillDefs = skillFile[charDefs.skills[i]];
			}
			while (skillDefs && skillDefs.evoskills && charDefs.level >= skillDefs.evoskills[0][1]) {
				charDefs.skills[i] = skillDefs.evoskills[0][0];
				skillDefs = skillFile[charDefs.skills[i]];
			}
		}

		charDefs.skills = charDefs.skills.filter(x => x != 'remove');
	}
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
lvlUpWithXpInMind = (charDefs, forceEvo, message, returnembed) => {
	let lvlCount = 0;
	while (charDefs.xp >= charDefs.maxxp) {
		if (charDefs.level < 99) {
			levelUp(charDefs, forceEvo, message.guild.id)
			lvlCount++;
		}
	}

	updateSkillEvos(charDefs, forceEvo);

	if (lvlCount <= 0) return;
	if (!message && !returnembed) return;

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
	updateSkillEvos(charDefs, forceEvo);
	if (!message) return;

	let DiscordEmbed = briefDescription(charDefs);
	DiscordEmbed.title = `${charDefs.name} levelled up${(times <= 1) ? '!' : ' ' + times + ' times!'}`;
	if (selectQuote(charDefs, 'lvl')) DiscordEmbed.description = `_${charDefs.name}: "${selectQuote(charDefs, 'lvl')}"_\n\n${DiscordEmbed.description}`;
	message.channel.send({embeds: [DiscordEmbed]});
}