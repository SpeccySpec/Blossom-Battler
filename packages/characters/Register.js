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
        maxxp: 100,

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
		
		// Quotes
		quotes: {
			meleequote: [],
			physquote: [],
			magquote: [],
			allyatkquote: [],
			lbquote: [],
			tcquote: [],
			strongquote: [],
			critquote: [],
			weakquote: [],
			missquote: [],
			blockquote: [],
			repelquote: [],
			drainquote: [],
			resistquote: [],
			hurtquote: [],
			healquote: [],
			helpedquote: [],
			killquote: [],
			deathquote: [],
			lvlquote: [],
			allydeathquote: [],
			consolequote: [],
			imfinequote: []
		},

		// Bio Info
		bio: {
			fullname: "",
			nickname: "",
			species: "",
			height: [0, "feet"],
			weight: [0, "pounds"],
			age: "",
			info: "",

			backstory: "",
			likes: "",
			dislikes: "",
			fears: "",

			voice: "",
			theme: ""
		},
		
		// Trust
		trust: {}
    };

    fs.writeFileSync(`${dataPath}/json/${guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	return charFile[name];
}

briefDescription = (char) => {
	let statDesc = `${char.hp}/${char.maxhp}HP\n${char.mp}/${char.maxmp}MP\n`
	for (const i in char.stats) {
		statDesc += `\n${char.stats[i]}${i.toUpperCase()}`
	}

	return new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement])
		.setTitle(`${elementEmoji[char.mainElement]}${char.name}'s Stats:`)
		.setDescription(statDesc)
}