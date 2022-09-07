makeMelee = (char) => {
	let atkType = 'physical';
	let targType = 'one';
	for (let skillName of char.skills) {
		let psv = skillFile[skillName];
		if (psv.type != 'passive' || !psv.passive) continue;

		if (psv.passive.magicmelee) atkType = 'magic';
		if (psv.passive.attackall) targType = 'allopposing';
	}

	let meleeAtk = {
		name: char.melee.name,
		type: char.melee.type,
		pow: char.melee.pow,
		acc: Math.min(100, char.melee.acc),
		crit: char.melee.crit,
		atktype: atkType,
		target: 'one',
		melee: true
	}

	if (char.melee.status) {
		meleeAtk.status = char.melee.status;
		meleeAtk.statuschance = char.melee.statuschance ?? 0;
	}
	
	return meleeAtk;
}

isMainElement = (skill, char) => {
	if (typeof char.mainElement === 'string') {
		if (typeof skill.type === 'string') {
			if (char.mainElement === skill.type) return true;
		} else {
			if (skill.type.includes(char.mainElement)) return true;
		}
	} else {
		if (typeof skill.type === 'string') {
			if (char.mainElement.includes(skill.type)) return true;
		} else {
			for (let e of char.mainElement) {
				if (skill.type.includes(e)) return true;
			}
		}
	}

	return false;
}