/*
	XP
	- HANDLE GAINING XP
	- HANDLE LEVELLING UP
*/
xpBar = (charDefs) => {
	let xpPercent = Math.round((charDefs.xp/charDefs.maxxp)*100)
	let xpSquares = Math.min(10, Math.floor(xpPercent/10))

	return `**[**${'🟦'.repeat(xpSquares)}${'⬛'.repeat(10 - xpSquares)}**]**`;
}

gainXp = (message, charDefs, xp) => {
    charDefs.xp += xp;

    message.channel.send(`${xpBar(charDefs)}\n${charDefs.name} got _${xp}XP_!`);
    console.log(`${charDefs.name} ${charDefs.xp}/${charDefs.maxxp}XP`)

	lvlUpWithXpInMind(charDefs, false, message);
}

updateStats = (charDefs, server, updateXp) => {
	let settings = setUpFile(server)
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

	if (settings.formulas.lvlformula && settings.formulas.lvlformula === 'percent') {
		for (const i in stats) {
			let baseStat = charDefs.basestats[`base${stats[i]}`]
			charDefs[stats[i]] = Math.min(99, Math.round(baseStat * (1 + ((charDefs.level-1) * 0.091))))
		}
	} else if (settings.formulas.lvlformula && settings.formulas.lvlformula === 'assist') {
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

levelUp = (charDefs, forceEvo, server) => {
	let settings = setUpFile(server)

	if (charDefs.level >= settings.caps.levelcap) {
		charDefs.xp = charDefs.maxxp - 1
		console.log(`LevelUp: ${charDefs.name} cannot level up further.`)
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
	
	// Check Skills
	if (charDefs.lvlUpQueue) {
		for (const i in charDefs.lvlUpQueue) {
			if (charDefs.lvlUpQueue[i][1] == charDefs.level) {
				charDefs.skills.push(charDefs.lvlUpQueue[i][0])
			}
		}
	}
	
	if (forceEvo == true) {
		for (const i in charDefs.skills) {
			if (skillFile[charDefs.skills[i]] && skillFile[charDefs.skills[i]].evoSkill) {
				var skillDefs = skillFile[charDefs.skills[i]]

				if (charDefs.level == skillDefs.evoSkill[1])
					charDefs.skills[i] = skillDefs.evoSkill[0];
			}
		}
	} else {
		if (!charDefs.autoLearn) return;

		var checkSkills = []
		for (const i in charDefs.autoLearn) {
			if (charDefs.autoLearn[i] && charDefs.skills[parseInt(i)]) {
				checkSkills.push([charDefs.skills[parseInt(i)], parseInt(i)])
			}
		}

		for (const i in checkSkills) {
			if (skillFile[checkSkills[i][0]] && skillFile[checkSkills[i][0]].evoSkill) {
				var skillDefs = skillFile[checkSkills[i][0]]
				
				if (charDefs.level == skillDefs.evoSkill[1]) charDefs.skills[checkSkills[i][1]] = skillDefs.evoSkill[0];
			}
		}
	}
}

levelDown = (charDefs, server) => {
	if (charDefs.level <= 1) {
		charDefs.xp = 1;
		console.log(`LevelUp: ${charDefs.name} cannot level down further.`);
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
lvlUpWithXpInMind = (charDefs, forceEvo, message) => {
	let lvlCount = 0;
	while (charDefs.xp >= charDefs.maxxp) {
		if (charDefs.level < 99) {
			levelUp(charDefs, forceEvo, message.guild.id)
			lvlCount++;
		}
	}

	if (lvlCount <= 0) return;
	if (!message) return;

	let DiscordEmbed = briefDescription(charDefs);
	DiscordEmbed.title = `${charDefs.name} levelled up${(lvlCount <= 1) ? '!' : ' ' + lvlCount + ' times!'}`;
//	DiscordEmbed.description = `_${charDefs.name}: "${selectQuote(charDefs, 'lvl')}"_\n\n${DiscordEmbed.description}`;
	DiscordEmbed.description = `_${charDefs.name}: "ae"_\n\n**Level ${charDefs.level}**\n${DiscordEmbed.description}`;
	message.channel.send({embeds: [DiscordEmbed]});
}

// Level up a set number of times
levelUpTimes = (charDefs, forceEvo, times, message) => {
	for (let i = 0; i < times; i++) levelUp(charDefs, forceEvo, message.guild.id);
	if (!message) return;

	let DiscordEmbed = briefDescription(charDefs);
	DiscordEmbed.title = `${charDefs.name} levelled up${(times <= 1) ? '!' : ' ' + times + ' times!'}`;
//	DiscordEmbed.description = `_${charDefs.name}: "${selectQuote(charDefs, 'lvl')}"_\n\n${DiscordEmbed.description}`;
	DiscordEmbed.description = `_${charDefs.name}: "ae"_\n\n**Level ${charDefs.level}**\n${DiscordEmbed.description}`;
	message.channel.send({embeds: [DiscordEmbed]});
}