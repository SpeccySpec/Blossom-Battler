writeChar = (creator, guild, name, element, health, magicpoints, attack, magic, perception, endurance, charisma, inteligence, agility, luck) => {
    let charFile = setUpFile(`${dataPath}/json/${guild.id}/characters.json`);

    charFile[name] = {
		name: name,
		mainElement: element,

		// Weapons n Shit
		weaponclass: 'none',
		armorclass: 'none',
		weapons: {},
		armors: {},
		curweapon: {},
		curarmor: {},

        // Only the owner can move this character, if they don't have admin permissions.
        owner: creator.id,

        // Level, HP and MP
        level: 1,
        hp: health,
        mp: magicpoints,
        maxhp: health,
        maxmp: magicpoints,
		basehp: health,
		basemp: magicpoints,

		mpMeter: ['Magic Points', 'MP'],

        // Status Effect - Left out due to new format.
//      status: "none",
//      statusturns: 0,

        // Melee Attack
        melee: {
			name: "Strike Attack",
			type: "strike",
			pow: 30,
			acc: 95,
			crit: 15,
		},

        // Main stats
		stats: {
			atk: attack ? attack : 1,
			mag: magic ? magic : 1,
			prc: perception ? perception : 1,
			end: endurance ? endurance : 1,
			chr: charisma ? charisma : 1,
			int: inteligence ? inteligence : 1,
			agl: agility ? agility : 1,
			luk: luck ? luck : 1
		},

		basestats: {
			baseatk: attack ? attack : 1,
			basemag: magic ? magic : 1,
			baseprc: perception ? perception : 1,
			baseend: endurance ? endurance : 1,
			basechr: charisma ? charisma : 1,
			baseint: inteligence ? inteligence : 1,
			baseagl: agility ? agility : 1,
			baseluk: luck ? luck : 1
		},

        // Limit Break Meter, XP.
        lb: 0,
        xp: 0,
        maxxp: 500,

        // Affinities & Skills
		affinities: {
			superweak: [],
			weak: [],
			resist: [],
			block: [],
			repel: [],
			drain: [],
		},

        skills: [],
		autolearn: [],
		
		// Quotes
		quotes: {},

		// Bio Info
		bio: {
			fullname: "",
			nickname: "",
			species: "",
			gender: "other",
			height: [4, 0],
			weight: 0,
			age: 10,
			info: "",

			backstory: "",
			likes: "",
			dislikes: "",
			fears: "",

			voice: "",
			theme: "",

			custom: {}
		},
		
		// Trust
		trust: {}
    };

	//im lazy
	for (const i in quoteTypes) charFile[name].quotes[`${i}quote`] = [];

    fs.writeFileSync(`${dataPath}/json/${guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	return charFile[name];
}

briefDescription = (char) => {
	let statDesc = ''
	if (!char.type) statDesc += `${char.hp}/${char.maxhp}HP\n${char.mp}/${char.maxmp}${char.mpMeter ? char.mpMeter[1] : "MP"}\n`
	else statDesc += `${char.hp}HP\n${char.mp}${char.mpMeter ? char.mpMeter[1] : "MP"}\n${char.xp}XP\n`
	for (const i in char.stats) {
		statDesc += `\n${char.stats[i]}${i.toUpperCase()}`
	}

	let prefix = elementEmoji[char.mainElement] ?? elementEmoji.strike;
	let color = elementColors[char.mainElement] ?? elementColors.strike;

	if (typeof char.mainElement === "object") {
		prefix = "";
		for (let i in char.mainElement)
			prefix += elementEmoji[char.mainElement[i]] ?? elementEmoji.strike;

		color = elementColors[char.mainElement[0]] ?? elementColors.strike;
	}

	return new Discord.MessageEmbed()
		.setColor(!char.type ? color : enemyTypeColors[char.type])
		.setTitle(`${!char.type ? prefix : ''}${char.name}'s Stats:`)
		.setDescription(statDesc)
}

let usesPercent = {
	buff: false,
	debuff: false,
	
	boost: true,
	crit: true,
	status: true,
	discount: true,
	money: true,
	items: true,
	pacify: true,
	endure: true,
	heal: true,
}

const affinityScores = {
	deadly: -999,
	superweak: -2,
	weak: -1,
	resist: 1,
	block: 1.5,
	repel: 1.5,
	drain: 1.5,

	[-999]: "Your local hacker.",
	[-30]: "Literally the weakest character in the world, at least you'll stop now.",
	[-10]: "Please stop.",
	[-9]: "A bunch of useless atoms.",
	[-8]: "A corpse.",
	[-7]: "Are you sure they are still alive by now?",
	[-6]: "Even glass survives more hits.",
	[-5]: "Extremely likely to get hurt a lot.",
	[-4]: "A fragile individual.",
	[-3]: "Easily hurt, but could survive.",
	[-2]: "May get hurt a little, but it's fine.",
	[-1]: "Not really weak, but not resistant either.",
	[0]: "Perfectly balanced, as all things should be.",
	[1]: "Not really resistant, but not weak either.",
	[2]: "Your average fighter.",
	[3]: "The tanker.",
	[4]: "An impenetrable individual.",
	[5]: "Don't even bother attacking this guy.",
	[6]: "Are you sure this is a person and not a WALL?",
	[7]: "Probably the protagonist of the story.",
	[8]: "How about you learn the word balance?",
	[9]: "Ever heard of weak affinities?",
	[10]: "Plot armor v2.",
	[30]: "Oh I get it now, you like creating almighty invincible gods."
}

renderAffinities = (shortenAmount, charDefs, DiscordEmbed, settings, message, useguild) => {
	let char = objClone(charDefs);
	
	if (!settings) settings = setUpFile(`${dataPath}/json/${useguild ?? message.guild.id}/settings.json`);

	let prefix = elementEmoji[char.mainElement] ?? elementEmoji.strike;
	let color = elementColors[char.mainElement] ?? elementColors.strike;

	if (typeof char.mainElement === "object") {
		prefix = "";
		for (let i in char.mainElement)
			prefix += elementEmoji[char.mainElement[i]] ?? elementEmoji.strike;

		color = elementColors[char.mainElement[0]] ?? elementColors.strike;
	}

	if (!DiscordEmbed) {
		let dispLevel = '';
	
		let userTxt = useguild
			? getServerUserFromGuild(char.owner, message)
			: getServerUser(char.owner, message);
	
		if (char.ai) userTxt = "Automated";
	
		let issues = verifiedChar(char, useguild ?? message.guild.id)
		let tick = issues.length
			? (issues.length == 1 ? issues.pop().slice(2) : `${issues.length} issues!`)
			: '<:tick:973077052372701294>'
		DiscordEmbed = new Discord.MessageEmbed()
			.setColor(!char.type ? color : enemyTypeColors[char.type])
			.setTitle(`${prefix}${char.name} (${tick}) ${dispLevel}${!char.type ? ` *(${userTxt})*` : ``}`)
	}

	let affinityscore = 0
	let totaffinities = 0
	let charAffs = '';

	for (const affinity in char.affinities) {
		if (char.affinities[affinity].length == 0) continue;
		charAffs += `\n${affinityEmoji[affinity]}: `

		for (const i in char.affinities[affinity]) {
			totaffinities++
			affinityscore += affinityScores[affinity]
			
			charAffs += `${elementEmoji[char.affinities[affinity][i]]}`;
		}
	}

	let scorecomment = affinityScores[(affinityscore > 0 ? Math.ceil : Math.floor)(affinityscore)]

	if (affinityscore == -69) scorecomment = "You'd think this is __nice__, but it really isn't."
	if (affinityscore == 69) scorecomment = "Heh, __nice__. No but seriously, stop this nonsense."

	if (scorecomment && affinityscore <= 3 && affinityscore >= -3 && totaffinities > 15)
		scorecomment += "\nOr at least that would be the case if you didn't have so many affinities."
	if (totaffinities == 0)
		scorecomment = `Your character has no affinities yet, add one with \`${getPrefix(useguild ?? message.guild.id)}setaffinity\`!`
	if (totaffinities == 1)
		scorecomment += "\nThey...probably should have more than 1 affinity though."
	charAffs += `\n\nScore: **${affinityscore}**\n*${scorecomment ?? "..."}*`

	// Status Affinities
	if (settings.mechanics?.stataffinities) {
		if (char.statusaffinities) {
			let statusaffinityscore = 0
			let statustotaffinities = 0
			let finaladdition = 0;
			let statAffs = '';
			
			for (const affinity in char.statusaffinities) {
				if (char.statusaffinities[affinity].length == 0) continue;
				statAffs += `\n${affinityEmoji[affinity]}: `

				for (const i in char.statusaffinities[affinity]) {
					statustotaffinities++;

					finaladdition = affinityScores[affinity];
					if (isPositiveStatus(char.statusaffinities[affinity][i]))
						finaladdition *= -1;
					if (isNeutralStatus(char.statusaffinities[affinity][i]))
						finaladdition *= 0;

					statusaffinityscore += finaladdition
					statAffs += `${statusEmojis[char.statusaffinities[affinity][i]]}`;
				}
			}
			if (statAffs != '') {
				let scorecomment = affinityScores[(statusaffinityscore > 0 ? Math.ceil : Math.floor)(statusaffinityscore)]
				if (scorecomment && statusaffinityscore <= 3 && statusaffinityscore >= -3 && statustotaffinities > 15)
					scorecomment += "\nOr at least that would be the case if you didn't have so many affinities."
				if (statustotaffinities == 1)
					scorecomment += "\nThey...probably should have more than 1 affinity though."
				charAffs += `\n${statAffs}\n\nScore: **${statusaffinityscore}**\n*${scorecomment ?? "..."}*`
			};
		}
	}

	let emojiCount = charAffs.match(/<:.+?:\d+>/g);

	if (shortenAmount && (emojiCount?.length ?? 0) > 23) {
		charAffs += `\n\nToo many affinities. For the full view, refer to __${message?.guild?.id ? getPrefix(message.guild.id) : 'rpg!'}getaffinities.__`;

		let remaining = emojiCount.length - 23;
		let splitLines = charAffs.split('\n');

		for (i in splitLines) {
			splitLines[i] = [i, splitLines[i]];
		}

		while (remaining > 0) {
			splitLines = splitLines.sort((a,b) => (b[1].match(/<:.+?:\d+>/g)?.length ?? 0) - (a[1].match(/<:.+?:\d+>/g)?.length ?? 0));

			let curEmojiCount = splitLines[0][1].match(/<:.+?:\d+>/g);
			if (curEmojiCount != null) {
				splitLines[0][1] = splitLines[0][1].replace(curEmojiCount[curEmojiCount.length - 1], '[PP]');
			}
			remaining--;
		}

		splitLines = splitLines.sort((a,b) => a[0] - b[0]);

		for (i in splitLines) {
			splitLines[i] = splitLines[i][1];

			let remainders = splitLines[i].match(/\[PP\]/g)?.length ?? 0;

			splitLines[i] = splitLines[i].replace(/\[PP\]/, ` and ${remainders} other${remainders != 1 ? 's' : ''}`);
			splitLines[i] = splitLines[i].replace(/\[PP\]/g, ``);
		}

		charAffs = splitLines.join('\n');
	}

	if (charAffs != '') {
		if (shortenAmount) DiscordEmbed.fields.push({ name: 'Affinities', value: charAffs, inline: true });
		else DiscordEmbed.setDescription(charAffs);
	}

	return DiscordEmbed;
}

longDescription = (charDefs, level, server, message, useguild) => {
	let char = objClone(charDefs);

	let dispLevel = '';
	let settings = setUpFile(`${dataPath}/json/${server}/settings.json`);

	if (level && char.level != level && server) {
		char.level = level;
		updateStats(char, server, true);

		dispLevel = `(At Level ${level})`;
	}

	if (settings.mechanics?.powerlevels)
		dispLevel += ` (POW: ${calcPowerLevel(char)})`;

	let userTxt = useguild
		? getServerUserFromGuild(char.owner, message)
		: getServerUser(char.owner, message);

	if (char.ai) userTxt = "Automated";

	let prefix = elementEmoji[char.mainElement] ?? elementEmoji.strike;
	let color = elementColors[char.mainElement] ?? elementColors.strike;

	if (typeof char.mainElement === "object") {
		prefix = "";
		for (let i in char.mainElement)
			prefix += elementEmoji[char.mainElement[i]] ?? elementEmoji.strike;

		color = elementColors[char.mainElement[0]] ?? elementColors.strike;
	}

	let issues = verifiedChar(char, server)
	console.log(issues)
	let tick = issues.length
		? (issues.length == 1 ? issues.pop().slice(2) : `${issues.length} issues!`)
		: '<:tick:973077052372701294>'
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(!char.type ? color : enemyTypeColors[char.type])
		.setTitle(`${prefix}${char.name} (${tick}) ${dispLevel}${!char.type ? ` *(${userTxt})*` : ``}`)

	let desc = ''
	if (char.curweapon && char.curweapon.name) {
		desc += `**${char.curweapon.type ? elementEmoji[char.curweapon.type] : ''}${classEmoji.weapon[char.curweapon.class ?? 'none']}__${char.curweapon.name}__ equipped.**\n`;
	} else if (char.weaponclass) {
		if (typeof(char.weaponclass) == 'object') {
			desc += `_Can wield ${classEmoji.weapon[char.weaponclass[0]]}${char.weaponclass[0]} and ${classEmoji.weapon[char.weaponclass[1]]}${char.weaponclass[1]} weapons._\n`;
		} else {
			if (char.weaponclass && char.weaponclass != "none") desc += `_Can wield ${classEmoji.weapon[char.weaponclass]}${char.weaponclass} weapons._\n`;
		}
	}

	if (char.curarmor && char.curarmor.name) {
		desc += `**${char.curarmor.type ? elementEmoji[char.curarmor.type] : ''}${classEmoji.armor[char.curarmor.class ?? 'none']}__${char.curarmor.name}__ equipped.**\n`;
	} else if (char.armorclass && char.armorclass != "none") {
		desc += `_Can wear ${classEmoji.armor[char.armorclass]}${char.armorclass} armor._\n`;
	}
	
	desc += '\n';

	if (char.leaderskill && settings.mechanics.leaderskills) desc += `**${[char.leaderskill.name.toUpperCase()]}**\n_${leaderSkillTxt[char.leaderskill.type]}_\n${char.leaderskill.var2}${(usesPercent[char.leaderskill.type] == true) ? '%' : ''} ${char.leaderskill.type} ${char.leaderskill.var1 ? `toward ${elementEmoji[char.leaderskill.var1] ?? ''}${char.leaderskill.var1.toUpperCase()}` : ''}`;
	if (char.journal) desc += `\n${char.journal ? `\n\n${char.journal}` : ''}`

	DiscordEmbed.setDescription(desc);

	// Here come the various fields!

	// Stats
	let statDesc = ''
	if (!char.type) 
		statDesc += `Level ${char.level}\n${char.hp}/${char.maxhp}HP (${char.basehp} Base)\n${char.mp}/${char.maxmp}${char.mpMeter[1]} (${char.basemp} Base)\n${char.xp}/${char.maxxp}XP\n${getBar('xp', char.xp, char.maxxp, 9)}\n`;
	else 
		statDesc += `Level ${char.level}\n${char.hp}HP\n${char.mp}${char.mpMeter ? char.mpMeter[1] : "MP"}\n${char.xp}XP\n`;

	for (const i in char.stats) {
		statDesc += `\n${char.stats[i]}${i.toUpperCase()}${!char.type ? ` (${char.basestats['base'+i]} Base)` : ''}`;

		if (char.curweapon && char.curweapon[i])
			statDesc += ` **${(char.curweapon[i] > 0) ? '+' : '-'}${Math.abs(char.curweapon[i])}${i.toUpperCase()}**`;
		if (char.curarmor && char.curarmor[i])
			statDesc += ` **${(char.curarmor[i] > 0) ? '+' : '-'}${Math.abs(char.curarmor[i])}${i.toUpperCase()}**`;
	}

	DiscordEmbed.fields.push({ name: 'Stats', value: statDesc, inline: true });

	// Skills
	let skillDesc = '';
	if (char.melee) {
		skillDesc += `**Melee Attack**:\n`

		if (char.melee.type) {
			if (char.curweapon && char.curweapon.element) {
				skillDesc += `${classEmoji.weapon[char.curweapon.class ?? 'none']}${elementEmoji[char.curweapon.element ?? 'strike']}`;
			} else {
				skillDesc += elementEmoji[char.melee.type];
			}
		}

		skillDesc += `${char.melee.name}\n`;

		if (char.curweapon && char.curweapon.melee)
			skillDesc += `_${char.melee.pow+(char.level*1.5)}**+${char.curweapon.melee}**<:physical:973077052129423411>`;
		else
			skillDesc += `_${char.melee.pow+(char.level*1.5)}<:physical:973077052129423411>`;

		skillDesc += `, ${char.melee.acc}% Accuracy,\n${char.melee.crit}%${critEmoji}`;
		if (char.melee.status && char.melee.statuschance) skillDesc += `, ${char.melee.statuschance}%${statusEmojis[char.melee.status]}`;
		skillDesc += '_\n\n';
	}

	if (char.skills && char.skills.length > 0) {
		skillDesc += '**Skills**:\n';

		for (const i in char.skills) {
			let skill = char.skills[i];

			if (!skillFile[skill]) {
				skillDesc += `🛑 Invalid Skill (${skill})\n`;
			} else {
				let type = typeof skillFile[skill].type == 'object' ? elementEmoji[skillFile[skill].type[0]] : elementEmoji[skillFile[skill].type];
				skillDesc += `${type}${skillFile[skill].name}`;
				if (charDefs.autolearn && charDefs.autolearn[i]) skillDesc += ' <:tick:973077052372701294>';
				skillDesc += `\n`;
			}
		}
	}

	if (char.curweapon?.skill) {
		let skill = char.curweapon.skill;

		skillDesc += "**"
		if (!skillFile[skill]) {
			skillDesc += `🛑 Invalid Skill (${skill})**\n`;
		} else {
			let type = typeof skillFile[skill].type == 'object' ? elementEmoji[skillFile[skill].type[0]] : elementEmoji[skillFile[skill].type];
			skillDesc += `${classEmoji.weapon[char.curweapon.class ?? 'none']}${type}${skillFile[skill].name}**\n`;
		}
	}

	if (char.curarmor?.skill) {
		let skill = char.curarmor?.skill;

		skillDesc += "**"
		if (!skillFile[skill]) {
			skillDesc += `🛑 Invalid Skill (${skill})**\n`;
		} else {
			let type = typeof skillFile[skill].type == 'object' ? elementEmoji[skillFile[skill].type[0]] : elementEmoji[skillFile[skill].type];
			skillDesc += `${classEmoji.armor[char.curarmor.class ?? 'none']}${type}${skillFile[skill].name}**\n`;
		}
	}

	// Fix skills n shit
	if (skillDesc.length > 1000) skillDesc = `${skillDesc.slice(0, 1000)}_..._`;

	DiscordEmbed.fields.push({ name: 'Skills', value: skillDesc, inline: true });

	// Affinities
	DiscordEmbed = renderAffinities(true, char, DiscordEmbed, settings, message, useguild);

	// Limit Breaks
	if (settings.mechanics.limitbreaks) {
		if (char.lb && char.lb[1]) {
			let lb;
			let lbDesc = "";
			let elements = "";
			let atktype = "";
			let extratxt = "";
			let powtxt = "";
			for (const i in char.lb) {
				lb = objClone(char.lb[i]);

				if (!lb.islimitbreak) {
					lbDesc = "This Limit Break is outdated! You must update it."
					DiscordEmbed.fields.push({ name: `__Limit Break: Level ${i}__`, value: lbDesc, inline: false });
					continue;
				}

				if (typeof lb.type == "object") {
					elements = `${elementEmoji[lb.type[0]]}${elementEmoji[lb.type[1]]}`; // they wont have more than 2 types anyway... probably.
				} else {
					elements = elementEmoji[lb.type];
				}

				// pow
				powtxt = lb.pow ? `**${lb.pow}** power` : '';
				powtxt += (lb.hits > 1) ? `, and hits **${lb.hits}** times\n` : '';

				// attack type
				if (!["support", "status", "heal"].includes(lb.type) && lb.atktype) {
					let attackArray = lb.atktype.split('');
					attackArray[0] = attackArray[0].toUpperCase()

					atktype = `**${attackArray.join('')}** attack.\n`;
				} else {
					atktype = "";
				}

				// Attack Extras
				const [extrastype, extraslist] = extraTypes[lb.type == 'support' ? 'status' : lb.type] ?? ["extras", extrasList]
				const extras = lb[extrastype]

				extratxt = '';
				for (const extra in extras) {
					const getinfo = extraslist[extra]?.getinfo;
					if (getinfo) extratxt += getinfo([...extras[extra]], lb) + ".\n";
				}

				lbDesc = `__**${elements}${lb.name}**__\nCosts **${lb.cost}%** of the Limit Break Gauge\n${powtxt}${skillTargetText[lb.target] ?? skillTargetText.one}\n${atktype}${skillStatusText(lb)}${extratxt}\n_${lb.desc}_`;
				DiscordEmbed.fields.push({ name: `__Limit Break: Level ${i}__`, value: lbDesc, inline: false });
			}
		}
	}

	let transTxt = '';
	if (charDefs.transformations && settings.mechanics.transformations) {
		for (const i in charDefs.transformations) {
			transTxt += `**${charDefs.transformations[i].name}** *(${charDefs.transformations[i].requirement})*\n`

			let addStats = [
				"hp",
				"atk",
				"mag",
				"prc",
				"end",
				"agl",
				"int",
				"chr",
				"luk"
			]
			for (const k in addStats) {
				let addTxt = `+${charDefs.transformations[i][addStats[k]]}${addStats[k]}`
				let subTxt = `${charDefs.transformations[i][addStats[k]]}${addStats[k]}`
				transTxt += `${(charDefs.transformations[i][addStats[k]] >= 0) ? addTxt : subTxt}`;
				if (k < addStats.length-1)
					transTxt += ', '
			}

			transTxt += '\n';
		}
	}
	if (transTxt != '') DiscordEmbed.fields.push({ name: 'Transformations', value: transTxt, inline: false });

	// Charms
	if (settings.mechanics.charms && char.curCharms && char.curCharms.length > 0) {
		let charmFile = setUpFile(`${dataPath}/json/charms.json`);
			
		let notches = 0
		if (charDefs.charms) {
			for (const i in charDefs.charms)
				notches += charmFile[charDefs.charms[i]].notches
		}
			
		let charms = ''
		for (const i in charDefs.curCharms) {
			if (charFuncs.equippedCharm(charDefs, charDefs.curCharms[i]))
				charms += `**${charmFile[charDefs.curCharms[i]].name}** (${charmFile[charDefs.curCharms[i]].notches} notches)\n`
			else
				charms += `${charmFile[charDefs.curCharms[i]].name} (${charmFile[charDefs.curCharms[i]].notches} notches)\n`
		}
			
		if (charms === '')
			charms = 'None'
		else
			charms += `*${notches}/${charFuncs.needNotches(charDefs.level)} Notches taken.*`

		if (charms != '')
			DiscordEmbed.fields.push({ name: 'Charms', value: charms, inline: false });
	}

	let enmLoot = ``
	if (char.loot && char.loot != '') {
		let lootFile = setUpFile(`${dataPath}/json/${server}/loot.json`)

		if (lootFile[char.loot]) {
			lootDefs = lootFile[char.loot]

			itemFile = setUpFile(`${dataPath}/json/${server}/items.json`)
			weaponFile = setUpFile(`${dataPath}/json/${server}/weapons.json`)
			armorFile = setUpFile(`${dataPath}/json/${server}/armors.json`)

			for (const i in lootDefs.items) {
				enmLoot += `- **${lootDefs.items[i].type}:** `
				switch (lootDefs.items[i].type) {
					case "item":
						enmLoot += `${itemFile[lootDefs.items[i].id] ? itemFile[lootDefs.items[i].id].name : lootDefs.items[i].id} `;
						break;
					case "weapon":
						enmLoot += `${weaponFile[lootDefs.items[i].id] ? weaponFile[lootDefs.items[i].id].name : lootDefs.items[i].id} `;
						break;
					case "armor":
						enmLoot += `${armorFile[lootDefs.items[i].id] ? armorFile[lootDefs.items[i].id].name : lootDefs.items[i].id} `;
						break;
				}
				enmLoot += `(${lootDefs.items[i].amount}x)\n`;
			}
		}
	}
	if (enmLoot != '') DiscordEmbed.fields.push({ name: 'Loot', value: enmLoot, inline: true });

	if (char.negotiateDefs && char.negotiateDefs.qualities) {
		let enmQualities = char.negotiateDefs.qualities
		let qualityString = ''
		
		if (enmQualities.atk)
			qualityString += `${enmQualities.atk} ATK\n`
		if (enmQualities.mag)
			qualityString += `${enmQualities.mag} MAG\n`
		if (enmQualities.end)
			qualityString += `${enmQualities.end} END\n`

		if (enmQualities.skill) {
			let specialskill = ''
			if (!skillFile[enmQualities.skill]) {
				specialskill += `🛑 Invalid Skill (${enmQualities.skill})\n`;
			} else {
				let type = typeof skillFile[enmQualities.skill].type == 'object' ? elementEmoji[skillFile[enmQualities.skill].type[0]] : elementEmoji[skillFile[enmQualities.skill].type];
				specialskill += `${type}${skillFile[enmQualities.skill].name}\n`;
			}
			qualityString += `\n**Special**\n${specialskill}`
		}

		if (qualityString != '') DiscordEmbed.fields.push({ name: `Pet Qualities`, value: qualityString, inline: true });
	}

	if (char.negotiate) {
		let negDefs = char.negotiate
		let negString = ''
		for (const i in char.negotiate)
			negString += `\n**${i}**: **${negDefs[i].name}**\n*${negDefs[i]?.desc ?? 'No description.'}*\n${(negDefs[i]?.specials && Object.keys(negDefs[i]?.specials).length != 0) ? '_Specials used: **'+Object.keys(negDefs[i].specials).join(', ')+'**_\n' : ''}*${negDefs[i].convince ? (negDefs[i].convince < 0 ? '' : '+') + negDefs[i].convince : 0}%*`;
		
		if (negString != '') DiscordEmbed.fields.push({ name: `Pacifying Tactics`, value: negString, inline: true });
	}

	if (char.type && char.battlethemes) {
		let finalTxt = '';
		for (let i in char.battlethemes) {
			finalTxt += `**[${i.toUpperCase()}]**\n`;
			for (let k in char.battlethemes[i]) {
				finalTxt += `[${char.battlethemes[i][k][0]}](${char.battlethemes[i][k][1]})\n`;
			}
		}

		DiscordEmbed.fields.push({ name: "Battle Themes", value: finalTxt, inline: false });
	}

	if (char.image && char.image != '') {
		let file = ''
		if (char.image.includes('https://') || char.image.includes('http://')) {
			DiscordEmbed.setThumbnail(char.image)
		} else {
			file = new Discord.MessageAttachment(`${dataPath}/images/enemies/${char.image}.png`); 
			DiscordEmbed.setThumbnail(`attachment://${char.image}.png`)
		}
	}

	// Ae
	return DiscordEmbed;
}

imageFile = (char) => {
	if (char.image && char.image != '') {
		let file = new Discord.MessageAttachment(`${dataPath}/images/enemies/${char.image}.png`);
		return file
	}
}

charColor = (char) => {
	let color = elementColors[char.mainElement] ?? elementColors.strike;
	if (typeof char.mainElement === "object") color = elementColors[char.mainElement[0]] ?? elementColors.strike;
	return color;
}

charPrefix = (char) => {
	let prefix = elementEmoji[char.mainElement] ?? "";

	if (typeof char.mainElement === "object") {
		prefix = "";
		for (let i in char.mainElement)
			prefix += elementEmoji[char.mainElement[i]] ?? "";
	}

	return prefix;
}