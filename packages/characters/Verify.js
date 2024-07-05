const affinityScores = {
	deadly: -999,
	superweak: -2,
	weak: -1,
	resist: 1,
	block: 1.5,
	repel: 1.5,
	drain: 1.5
}

let extratypes = ["extras", "statusses", "heal", "passive"];

verifiedChar = (char, server) => {
	let settings = setUpSettings(server);

	// Manual Verification
	if (char.forceverified) return true;
	if (char.forceunverified) return "Made unverified by admin";

	// Level Limit
	if (char.level > 99) return "Over level 99";

	// HP and MP maximum
	if ((char.basehp+char.basemp) > 65) return "BaseHP + BaseMP is over 65";

	// Base Stat Total
	let bst = 0;
	for (let i in char.basestats) {
		if (char.basestats[i] > 10) return `${i.toUpperCase()} stat is over 10.`;
		bst += char.basestats[i];
	}

	if (bst > 45) return "Base stat total is over 45.";

	// Skill limit
	let elements = [];
	let almighty = 0;
	let passives = 0;
	let statusses = 0;
	let skill;
	let movelinks = [];
	for (let i of char.skills) {
		skill = skillFile[i];
		if (!skill) return `${i} is not a valid skill.`;
		if (skill.pow*(skill.hits ?? 1) > 1200) return `${getFullName(skill)} has over 1200 power total.`;
		if (skill.type != "support" && skill.type != "status" && skill.statuschance && skill.statuschance >= 100) return `${getFullName(skill)} has a guaranteed status.`;
		if (skillTier(skill) > 5) return `${getFullName(skill)} is tier 6 or higher.`;

		if (typeof(skill.type) == 'object') {
			for (let type of skill.type) {
				if (type === 'support' || type === 'status')
					statusses++;
				else if (type === 'passive')
					passives++;
				else {
					if (!elements.includes(type)) elements.push(type);
					if (type === 'almighty') almighty++;
				}
			}
		} else {
			if (skill.type === 'support' || skill.type === 'status')
				statusses++;
			else if (skill.type === 'passive')
				passives++;
			else {
				if (!elements.includes(skill.type)) elements.push(skill.type);
				if (skill.type === 'almighty') almighty++;
			}
		}

		// Move Link
		movelinks = [];
		for (let k in extratypes) {
			if (skill[extratypes[k]] && skill[extratypes[k]].movelink)
				for (let j in skill[extratypes[k]].movelink) movelinks.push(skill[extratypes[k]].movelink[j]);
		}

		for (let k in movelinks) {
			if (skillFile[movelinks[k]]) {
				skill = skillFile[movelinks[k]];
				if (!skill) return `${getFullName(skillFile[i])} is linked with an invalid skill.`;
				if (skill.pow*(skill.hits ?? 1) > 1200) return `${getFullName(skillFile[i])} is linked with ${getFullName(skill)} which has too much power.`;
				if (skill.type != "support" || skill.type != "status" && skill.statuschance && skill.statuschance >= 100) return `${getFullName(skillFile[i])} is linked with ${getFullName(skill)} which has a guaranteed status.`;
				if (skillTier(skill) > 5) return `${getFullName(skillFile[i])} is linked with ${getFullName(skill)} which is tier 6 or higher.`;
		
				if (typeof(skill.type) == 'object') {
					for (let type of skill.type) {
						if (type === 'support' || type === 'status')
							statusses++;
						else if (type === 'passive')
							passives++;
						else {
							if (!elements.includes(type)) elements.push(type);
							if (type === 'almighty') almighty++;
						}
					}
				} else {
					if (skill.type === 'support' || skill.type === 'status')
						statusses++;
					else if (skill.type === 'passive')
						passives++;
					else {
						if (!elements.includes(skill.type)) elements.push(skill.type);
						if (skill.type === 'almighty') almighty++;
					}
				}
			}
		}
	}

	if (almighty > 2) return "More than 2 almighty skills.";
	if (passives > (char.mainElement === 'passive' ? 3 : 2)) return `More than ${(char.mainElement === 'passive' ? 3 : 2)} passives.`;
	if (statusses > ((char.mainElement === 'support' || char.mainElement === 'status') ? 3 : 2)) return `More than ${((char.mainElement === 'support' || char.mainElement === 'status') ? 3 : 2)} status skills.`;
	if (elements.length > 3) return "Too many elements.";
	if (char.skills.length > 8) return "More than 8 skills.";

	// Affinities: A score higher than 3 unverifies the character. No affinities unverifies the character. 9 or more affinities unverifies the character.
	let affinityscore = 0
	let totaffinities = 0

	for (const affinity in char.affinities) {
		if (char.affinities[affinity].length == 0) continue;

		for (const i in char.affinities[affinity]) {
			totaffinities++;
			affinityscore += affinityScores[affinity];
		}
	}

	if (totaffinities === 0 || totaffinities > 15) return (totaffinities === 0) ? "No affinities" : "More than 15 affinities.";
	if (affinityscore > 3) return "Affinity Score higher than 3.";

	// Status Affinities: The same, except, don't care if the character has none.
	if (settings.mechanics.stataffinities) {
		if (char.statusaffinities) {
			let statusaffinityscore = 0
			let statustotaffinities = 0
			let finaladdition = 0;
			
			for (const affinity in char.statusaffinities) {
				if (char.statusaffinities[affinity].length == 0) continue;

				for (const i in char.statusaffinities[affinity]) {
					statustotaffinities++;

					finaladdition = affinityScores[affinity];
					if (isPositiveStatus(char.statusaffinities[affinity][i]))
						finaladdition *= -1;
					if (isNeutralStatus(char.statusaffinities[affinity][i]))
						finaladdition *= 0;

					statusaffinityscore += finaladdition
				}
			}

			if (statustotaffinities > 15) return "More than 15 status affinities.";
			if (statusaffinityscore > 3) return "Status Affinity score higher than 3.";
		}
	}

	// Basic checks complete
	return true;
}