verifiedChar = (char) => {
	// Manual Verification
	if (char.forceverified) return true;
	if (char.forceunverified) return false;

	// Level Limit
	if (char.level > 99) return false;
	
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
		if (skill.pow*(skill.hits ?? 1) > 1000) return false;

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

	// Basic checks complete
	return true;
}