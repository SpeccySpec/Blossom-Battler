writeChar = (creator, guild, name, element, health, magicpoints, attack, magic, perception, endurance, charisma, inteligence, agility, luck) => {
    let charFile = setUpFile(`${dataPath}/json/${guild.id}/characters.json`);

    charFile[name] = {
		name: name,
		mainElement: element,

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

        // Status Effect
        status: "none",
        statusturns: 0,

        // Melee Attack
        melee: {
			name: "Strike Attack",
			type: "strike",
			pow: 30,
			acc: 95,
			crit: 15,
		},

		// Weapons and Armor
		weapon: {},
		armor: {},

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
	for (const i in quoteTypes) charFile[name].quotes[`${quoteTypes[i]}quote`] = [];

    fs.writeFileSync(`${dataPath}/json/${guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	return charFile[name];
}

briefDescription = (char) => {
	let statDesc = ''
	if (!char.type) statDesc += `${char.hp}/${char.maxhp}HP\n${char.mp}/${char.maxmp}MP\n`
	else statDesc += `${char.hp}HP\n${char.mp}MP\n${char.xp}XP\n`
	for (const i in char.stats) {
		statDesc += `\n${char.stats[i]}${i.toUpperCase()}`
	}

	return new Discord.MessageEmbed()
		.setColor(!char.type ? elementColors[char.mainElement] : enemyTypeColors[char.type])
		.setTitle(`${!char.type ? elementEmoji[char.mainElement] : ''}${char.name}'s Stats:`)
		.setDescription(statDesc)
}

let leaderSkillTxt = {
	boost: 'Boosts the specified type.',
	discount: 'Takes away the amount of cost specified to the specified type.',
	buff: 'Start the battle with the specified stat buff',
	status: 'Increased chance to land the specified status effect',
	crit: 'Increased crit chance to the specified element'
}

let usesPercent = {
	buff: false,
	
	boost: true,
	crit: true,
	status: true,
	discount: true
}

const affinityScores = {
	deadly: -4,
	superweak: -2,
	weak: -1,
	resist: 1,
	block: 1.5,
	repel: 1.5,
	drain: 1.5,

	[-6]: "Even glass survies more hits.",
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
	[6]: "Are you sure this is a person and not a WALL?"
}

longDescription = (charDefs, level, server, message) => {
	let char = objClone(charDefs);
	let dispLevel = '';
	let settings = setUpFile(`${dataPath}/json/${server}/settings.json`);

	if (level && char.level != level && server) {
		char.level = level;
		updateStats(char, server, true);

		dispLevel = `(At Level ${level})`;
	}

	let userTxt = getServerUser(char.owner, message);

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(!char.type ? elementColors[char.mainElement] : enemyTypeColors[char.type])
		.setTitle(`${elementEmoji[char.mainElement]}${char.name} ${dispLevel}${!char.type ? ` *(${userTxt})*` : ``}`)

	let desc = ''
	if (char.leaderskill && settings.mechanics.leaderskills) desc += `**${[char.leaderskill.name.toUpperCase()]}**\n_${leaderSkillTxt[char.leaderskill.type]}_\n${char.leaderskill.var2}${(usesPercent[char.leaderskill.type] == true) ? '%' : ''} ${char.leaderskill.type} toward ${char.leaderskill.var1.toUpperCase()}`
	if (char.journal) desc += `\n${char.journal ? `\n\n${char.journal}` : ''}`

	DiscordEmbed.setDescription(desc);

	// Here come the various fields!

	// Stats
	let statDesc = ''
	if (!char.type) statDesc += `Level ${char.level}\n${char.hp}/${char.maxhp}HP\n${char.mp}/${char.maxmp}${char.mpMeter ? char.mpMeter[1] : 'MP'}\n${char.xp}/${char.maxxp}XP\n`;
	else statDesc += `Level ${char.level}\n${char.hp}HP\n${char.mp}MP\n${char.xp}XP\n`;
	for (const i in char.stats) statDesc += `\n${char.stats[i]}${i.toUpperCase()}`;
	DiscordEmbed.fields.push({ name: 'Stats', value: statDesc, inline: true });
	
	// Skills
	let skillDesc = `**Melee Attack**:\n${elementEmoji[char.melee.type]}${char.melee.name}\n_${char.melee.pow} Power, ${char.melee.acc}% Accuracy_\n\n`

	if (char.skills && char.skills.length > 0) {
		skillDesc += '**Skills**:\n';

		for (const i in char.skills) {
			let skill = char.skills[i];

			if (!skillFile[skill]) {
				skillDesc += `🛑 Invalid Skill (${skill})\n`;
			} else {
				let type = typeof skillFile[skill].type == 'object' ? elementEmojis[skillFile[skill].type[0]] : elementEmoji[skillFile[skill].type];
				skillDesc += `${type}${skillFile[skill].name}\n`;

				if (charDefs.autolearn && charDefs.autolearn[i]) skillDesc += '<:tick:918501752398020628>';
			}
		}
	}

	DiscordEmbed.fields.push({ name: 'Skills', value: skillDesc, inline: true });

	// Limit Breaks
	if (settings.mechanics.limitbreaks) {
		let lbDesc = '';

		if (char.lb && char.lb[1]) {
			for (const i in char.lb) {
				lbDesc += `**${i}: ${char.lb[i].name}**\n_${char.lb[i].pow} Power, ${char.lb[i].cost}LB%_`;
				if (char.lb[i].hits > 1) lbDesc += `_, ${char.lb[i].hits} Hits_`;
				lbDesc += '\n\n';
			}
		}
		
		if (lbDesc != '')
			DiscordEmbed.fields.push({ name: 'Limit Breaks', value: lbDesc, inline: true });
	}

	// Affinities
	let affinityscore = 0
	let charAffs = '';
	for (const affinity in char.affinities) {
		for (const i in char.affinities[affinity]) {
			affinityscore += affinityScores[affinity]
			charAffs += `${elementEmoji[char.affinities[affinity][i]]}${affinityEmoji[affinity]}\n`;
		}
	}
	const scorecomment = affinityScores[(affinityscore > 0 ? Math.ceil : Math.floor)(affinityscore)]
	charAffs += `Score: **${affinityscore}**\n*${scorecomment}*`

	// Status Affinities
	if (settings.mechanics.stataffinities) {
		if (char.statusaffinities) {
			let statusaffinityscore = 0
			let statAffs = '';
			for (const affinity in char.statusaffinities) {
				for (const i in char.statusaffinities[affinity]) {
					statusaffinityscore += affinityScores[affinity]
					statAffs += `${statusEmojis[char.statusaffinities[affinity][i]]}${affinityEmoji[affinity]}\n`;
				}
			}
			if (statAffs != '') {
				const scorecomment = affinityScores[(statusaffinityscore > 0 ? Math.ceil : Math.floor)(statusaffinityscore)]
				charAffs += `\n\n${statAffs}Score: **${statusaffinityscore}**\n*${scorecomment}*`
			};
		}
	}
	if (charAffs != '') DiscordEmbed.fields.push({ name: 'Affinities', value: charAffs, inline: true });

	let enmLoot = ``
	if (char.loot && char.loot != '') {
		let lootFile = setUpFile(`${dataPath}/json/${server}/loot.json`)

		if (lootFile[char.loot]) {
			lootDefs = lootFile[char.loot]

			itemFile = setUpFile(`${dataPath}/json/${server}/items.json`)
			weaponFile = setUpFile(`${dataPath}/json/${server}/weapons.json`)
			armorFile = setUpFile(`${dataPath}/json/${server}/armors.json`)

			for (const i in lootDefs.items) {
				if (i % 4 == 0) enmLoot += `- **${lootDefs.items[i]}:** `
				else if (i % 4 == 1) {
					switch (lootDefs.items[i-1]) {
						case "item":
							enmLoot += `${itemFile[lootDefs.items[i]].name ? itemFile[lootDefs.items[i]].name : lootDefs.items[i]} `;
							break;
						case "weapon":
							enmLoot += `${weaponFile[lootDefs.items[i]].name ? weaponFile[lootDefs.items[i]].name : lootDefs.items[i]} `;
							break;
						case "armor":
							enmLoot += `${armorFile[lootDefs.items[i]].name ? armorFile[lootDefs.items[i]].name : lootDefs.items[i]} `;
							break;
					}
				}
				else if (i % 4 == 2) enmLoot += `(${lootDefs.items[i]}x)\n`;
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
		if (enmQualities.def)
			qualityString += `${enmQualities.def} DEF\n`

		if (enmQualities.skill) {
			let specialskill = ''
			if (!skillFile[enmQualities.skill]) {
				specialskill += `🛑 Invalid Skill (${enmQualities.skill})\n`;
			} else {
				let type = typeof skillFile[enmQualities.skill].type == 'object' ? elementEmojis[skillFile[enmQualities.skill].type[0]] : elementEmoji[skillFile[enmQualities.skill].type];
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
			negString += `\n**${i}**: **${negDefs[i].name}**\n*${negDefs[i].desc}*\n*+${negDefs[i].convince ? negDefs[i].convince : 0}%*`;
		
		if (negString != '') DiscordEmbed.fields.push({ name: `Pacifying Tactics`, value: negString, inline: true });
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