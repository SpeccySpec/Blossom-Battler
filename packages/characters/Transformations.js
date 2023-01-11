newTransformation = (char, trnsName, mainelement, req, hpBuff, mpBuff, atkBuff, magBuff, prcBuff, endBuff, chrBuff, intBuff, aglBuff, lukBuff, skill) => {
	if (!char.transformations) char.transformations = {};
	
	char.transformations[trnsName] = {
		name: trnsName,
		mainElement: mainelement,

		requirement: req.toLowerCase(),
		desc: '',

		hp: parseInt(hpBuff),
		mp: parseInt(mpBuff),
		atk: parseInt(atkBuff),
		mag: parseInt(magBuff),
		prc: parseInt(prcBuff),
		end: parseInt(endBuff),
		chr: parseInt(chrBuff),
		int: parseInt(intBuff),
		agl: parseInt(aglBuff),
		luk: parseInt(lukBuff),

		tp: 0,
		tpmax: 10,
		level: 1
	}
}

transformationDesc = (char, name, server, message) => {
	let settings = setUpFile(`${dataPath}/json/${server}/settings.json`);

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#FFBA00')
		.setTitle(`${name}'s __${char.mainElement ? elementEmoji[char.mainElement] : ''}${char.name}__ Transformation`)

	if (char.desc != '') DiscordEmbed.setDescription(`*${char.desc}*`);

	let statDesc = ''
	let addStats = [
		"hp",
		"mp",
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
		let addTxt = `+${char[addStats[k]]}${addStats[k].toUpperCase()}\n`
		let subTxt = `${char[addStats[k]]}${addStats[k].toUpperCase()}\n`
		statDesc += `${(char[addStats[k]] >= 0) ? addTxt : subTxt}`;
	}

	DiscordEmbed.fields.push({ name: 'Stats', value: statDesc, inline: true });

	if (char.affintiies || (settings.mechanics.stataffinities && char.statusaffinities)) {
		// Affinities
		charAffs = '';
		let affinityscore = 0
		for (const affinity in char.affinities) {
			if (char.affinities[affinity] && char.affinities[affinity].length > 0) charAffs += `\n${affinityEmoji[affinity]}: `
			for (const a in char.affinities[affinity]) {
				affinityscore += affinityScores[affinity]
				charAffs += `${elementEmoji[char.affinities[affinity][a]]}`;
			}
		}
		const scorecomment = affinityScores[(affinityscore > 0 ? Math.ceil : Math.floor)(affinityscore)]
		charAffs += `\n\nScore: **${affinityscore}**\n*${scorecomment ?? "..."}*`

		// Status Affinities
		if (settings.mechanics.stataffinities) {
			if (char.statusaffinities) {
				statAffs = '';
				let statusaffinityscore = 0
				for (const affinity in char.statusaffinities) {
					if (char.statusaffinities[affinity] && char.statusaffinities[affinity].length > 0) statAffs += `\n${affinityEmoji[affinity]}: `
					for (const a in char.statusaffinities[affinity]) {
						statusaffinityscore += affinityScores[affinity]
						statAffs += `${statusEmojis[char.statusaffinities[affinity][a]]}`;
					}
				}
				if (statAffs != '') {
					const scorecomment = affinityScores[(statusaffinityscore > 0 ? Math.ceil : Math.floor)(statusaffinityscore)]
					charAffs += `\n${statAffs}\n\nScore: **${statusaffinityscore}**\n*${scorecomment ?? "..."}*`
				};
			}
		}
		if (charAffs != '') DiscordEmbed.fields.push({ name: 'Affinities', value: charAffs, inline: true });
	}

	if (char.skill && char.skill != '') {
		let skillTxt = `${elementEmoji[skillFile[char.skill].type]}${skillFile[char.skill].name}`
		if (char.autolearn) skillTxt += ' <:tick:973077052372701294>';
		DiscordEmbed.fields.push({ name: 'Signature Skill', value: skillTxt, inline: false });
	}

	return DiscordEmbed;
}

canTransform = (char, btl, force) => {
	let settings = setUpSettings(btl.guild.id);
	if (!settings.mechanics.transformations) return false;

	if (!char) return false;
	if (char.transformed) return false;
	if (char.notransform) return false;
	if (char.mimic) return false;
	if (char.ragesoul) return false;
	if (char.custom?.orgiamode) return false;

	if (!char.transformations) return false;

	let party = btl.teams[char.team];

	if (force) {
		let tname = force;
		let trans = char.transformations[tname];

		switch(trans.requirement) {
			case 'allydown':
				for (let ally of party.members) {
					if (ally.hp <= 0 && char.id != ally.id) return tname;
				}
				break;

			case 'onlystanding':
				let left = 0;
				for (let ally of party.members) {
					if (ally.hp > 0) left++;
				}
				if (left == 1) return tname;

			case 'belowhalfhp':
				if (char.hp <= char.maxhp/2) return tname;

			case 'outofmp':
				if (char.mp <= 0) return tname;

			case 'leaderdown':
				for (let ally of party.members) {
					if (!ally.leader) continue;
					if (ally.hp <= 0) return tname;
				}
				break;

			case 'trusteddown':
				for (let ally of party.members) {
					if (ally.hp <= 0  && char.id != ally.id && trustLevel(char, ally) > 5) return tname;
				}
				break;
		}
	} else {
		for (let tname in char.transformations) {
			let trans = char.transformations[tname]

			switch(trans.requirement) {
				case 'allydown':
					for (let ally of party.members) {
						if (ally.hp <= 0 && char.id != ally.id) return tname;
					}
					break;

				case 'onlystanding':
					let left = 0;
					for (let ally of party.members) {
						if (ally.hp > 0) left++;
					}
					if (left == 1) return tname;

				case 'belowhalfhp':
					if (char.hp <= char.maxhp/2) return tname;

				case 'outofmp':
					if (char.mp <= 0) return tname;

				case 'leaderdown':
					for (let ally of party.members) {
						if (!ally.leader) continue;
						if (ally.hp <= 0) return tname;
					}
					break;

				case 'trusteddown':
					for (let ally of party.members) {
						if (ally.hp <= 0  && char.id != ally.id && trustLevel(char, ally) > 5) return tname;
					}
					break;
			}
		}
	}

	return false;
}

doTransformation = (char, tname, btl) => {
	let store = [
		"stats",
		"maxhp",
		"maxmp",
		"skills",
		"affinities",
		"statusaffinities"
	];

	addCusVal(char, 'revert', [6, {}, `__${char.name}__'s **${tname}** transformation wore off...`]);

	for (let s of store) {
		char.custom.revert[1][s] = (typeof char[s] == 'object') ? objClone(char[s]) : char[s];

		if (char.transformations[tname][s]) {
			char[s] = char.transformations[tname][s];
		} else {
			if (s === "maxhp") {
				char.hp += char.transformations[tname].hp;
				char.maxhp += char.transformations[tname].hp;
			} else if (s === "maxmp") {
				char.mp += char.transformations[tname].mp;
				char.maxmp += char.transformations[tname].mp;
			}
		}
	}

	char.custom.revert[1].mainElement = char.mainElement;

	if (char.transformations[tname].skill) char.skills.push(char.transformations[tname].skill);
	if (char.transformations[tname].mainElement != char.mainElement) char.mainElement = [char.mainElement, char.transformations[tname].mainElement];

	char.transformed = tname;
	char.notransform = true;
	return true;
}