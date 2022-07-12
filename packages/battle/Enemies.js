// Are you a boss
isBoss = (f) => {
	if (!f.type) return false;
	return (f.type.includes('boss') || f.type.includes('deity'));
}

// Enemy thinker!
enemyThinker = (char, btl) => {
	// Ah shit. Enemy AI. AH FUCk.
	let ai = [];

	// Difficulty levels should be handled
	switch(char.difficulty ?? 'easy') {
		default: // Easy mode AI:
			// Select random options. Only change if the target is dead.
			// Never consider bad outcomes.
			// Never watch out for affinities.
			// Never watch out for shields, traps, ect.
			for (let i in btl.teams) {
				if (i == char.team) continue;

				for (let targ of btl.teams[i].members) {
					if (targ.hp <= 0) continue;

					ai.push({
						move: 'skills',
						index: char.skills[randNum(char.skills.length-1)],
						target: [i, targ.pos],
						points: 0
					})
				}
			}
	}

	// Sort the AI's possible options. Choose the one with the most points.
	ai.sort(function(a, b) {return a.points-b.points});
	return ai[0];
}

doEnemyTurn = (char, btl) => {
	btl.action = enemyThinker(char, btl);
	return doAction(char, btl, btl.action);
}

// Pacifying
doPacify = (char, btl, action) => {
	let i = action.index;
	let targ = btl.teams[action.target[0]].members[action.target[1]];
	let finaltxt = targ.negotiate[i].action ?? `%PLAYER% tries to pacify ${targ.name}`;

	while (finaltxt.includes('%PLAYER%')) finaltxt = finaltxt.replace('%PLAYER%', char.name);
	while (finaltxt.includes('%ENEMY%')) finaltxt = finaltxt.replace('%ENEMY%', targ.name);

	let convince = targ.negotiate[i].convince;
	let specialType = targ.negotiate[i].special ?? 'none';

	for (let s of char.skills) {
		if (s.type != 'passive') continue;

		if (s.passive.kindheart) {
			convince += Math.trunc(((convince/100)*s.passive.kindheart)*100)/100; // trunc to 2 decimal places
		}
	}

	switch(specialType) {
		default:
			targ.pacify += convince;
			finaltxt += `\n_(Pacified by ${convince}%!)_\n`;

			if (targ.pacify >= 100) {
				targ.pacified = true;
				finaltxt += `\n${targ.name} is fully pacified `;

				if (targ.negotiateDefs) {
					let parties = setUpFile(`${dataPath}/json/${btl.guild.id}/parties.json`, true);

					if (parties[btl.teams[char.team].id]) {
						let party = parties[btl.teams[char.team].id];

						if (!party.negotiates) party.negotiates = {};
						party.negotiates[targ.name] = party.negotiates[targ.name] ? party.negotiates[targ.name]+1 : 1;

						if (party.negotiates[targ.name] == targ.negotiateDefs.required) {
							finaltxt += 'and wants to join your team!';

							party.negotiateAllies[targ.name] = {
								nickname: targ.name,
								hp: Math.round(targ.hp/2),
								mp: Math.round(targ.mp/2),
								maxhp: Math.round(targ.maxhp/2),
								maxmp: Math.round(targ.maxmp/2),
								stats: targ.stats,

								skill: targ.negotiateDefs.qualities.skill,
								atkbuff: targ.negotiateDefs.qualities.atk,
								magbuff: targ.negotiateDefs.qualities.mag,
								endbuff: targ.negotiateDefs.qualities.end,

								happines: 255, // OKAY BUT WHAT IF WE COULD DO THIS TAMAGOCHI THING WITH PETS THATD BE SO SICK
								mood: 'happy', // YOU'D GET TO SEE THEIR MOOD AND SHIT
								food: 100, // AND FEED THEM
								// Although there wouldn't be no real punishment, maybe just a boost in damage output.
								// Things like being forced to tank Makarakarn and Tetrakarn before would now lower happiness or mood ect
							}
						} else {
							finaltxt += `and is satisfied!\n\n_(**${party.negotiates[targ.name]}/${targ.negotiateDefs.required}** ${targ.name}s pacified.)_`;
						}

						fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
					}
				} else {
					finaltxt += 'and stops attacking!';
				}
			}
	}

	DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#d613cc')
		.setTitle(`${char.name} => ${targ.name}`)
		.setDescription(finaltxt)
	btl.channel.send({embeds: [DiscordEmbed]})
}