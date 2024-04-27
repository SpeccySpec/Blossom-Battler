const affinityScores = {
	deadly: -999,
	superweak: -2,
	weak: -1,
	resist: 1,
	block: 1.5,
	repel: 1.5,
	drain: 1.5
}

verifiedChar = (char, server) => {
	let settings = setUpSettings(server);

	// Manual Verification
	if (char.forceverified) return true;
	if (char.forceunverified) return false;

	// Level Limit
	if (char.level > 99) return false;

	// HP and MP maximum
	if ((char.basehp+char.basemp) > 65) return false;

	// Base Stat Total
	let bst = 0;
	for (let i in char.basestats) {
		if (char.basestats[i] > 10) return false;
		bst += char.basestats[i];
	}

	if (bst > 45) return false;

	// Skill limit
	let elements = [];
	let almighty = 0;
	let passives = 0;
	let statusses = 0;
	for (let i of char.skills) {
		let skill = skillFile[i];
		if (!skill) return false;
		if (skill.pow*(skill.hits ?? 1) > 1200) return false;
		if (skill.type != "status" && skill.statuschance && skill.statuschance >= 100) return false;
		if (skillTier(skill) > 5) return false;

		if (typeof(skill.type) == 'object') {
			for (let type of skill.type) {
				if (type === 'status')
					statusses++;
				else if (type === 'passive')
					passives++;
				else {
					if (!elements.includes(type)) elements.push(type);
					if (type === 'almighty') almighty++;
				}
			}
		} else {
			if (skill.type === 'status')
				statusses++;
			else if (skill.type === 'passive')
				passives++;
			else {
				if (!elements.includes(skill.type)) elements.push(skill.type);
				if (skill.type === 'almighty') almighty++;
			}
		}
	}

	if (almighty > 2) return false;
	if (passives > (char.mainElement === 'passive' ? 3 : 2)) return false;
	if (statusses > (char.mainElement === 'status' ? 3 : 2)) return false;
	if (elements.length > 3) return false;
	if (char.skills.length > 8) return false;

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

	if (totaffinities === 0 || totaffinities > 15) return false;
	if (affinityscore > 3) return false;

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

			if (statustotaffinities > 15) return false;
			if (statusaffinityscore > 3) return false;
		}
	}

	// Basic checks complete
	return true;
}