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