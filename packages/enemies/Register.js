writeEnemy = (creator, guild, name, mainelement, level, health, magicpoints, experience, attack, magic, perception, endurance, charisma, intelligence, agility, luck, type, description) => {
    let enemyFile = setUpFile(`${dataPath}/json/${guild.id}/enemies.json`);

    enemyFile[name] = {
        name: name,
		mainElement: mainelement,

        // Only the owner can move this character, if they don't have admin permissions.
        owner: creator.id,

        // Level, HP and MP
        level: level,
        hp: health,
        mp: magicpoints,


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

        // Main stats
		stats: {
			atk: attack ? attack : 1,
			mag: magic ? magic : 1,
			prc: perception ? perception : 1,
			end: endurance ? endurance : 1,
			chr: charisma ? charisma : 1,
			int: intelligence ? intelligence : 1,
			agl: agility ? agility : 1,
			luk: luck ? luck : 1
		},

        // Limit Break Meter, XP.
        lb: 0,
        xp: experience,

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
        lb: {},

        // Quotes
		quotes: {},

        // Dreams
        dreams: [],

        // Negotiations
        negotiate: [],
		negotiateDefs: {
			required: 5
		},

        // Loot
        loot: '',

        // Image
        image: '',

        type: type,
        journal: description
    }

    //im lazy
	for (const i in quoteTypes) enemyFile[name].quotes[`${quoteTypes[i]}quote`] = [];

    fs.writeFileSync(`${dataPath}/json/${guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
	return enemyFile[name];
}

foundEnemy = (enm, server) => {
	let settings = setUpSettings(server);
	return settings.encountered.includes(enm);
}