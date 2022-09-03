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