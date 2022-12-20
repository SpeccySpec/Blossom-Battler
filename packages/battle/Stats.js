setupBattleStats = (f) => {
	f.buffs = {
		atk: 0,
		mag: 0,
		end: 0,
		prc: 0,
		agl: 0,
		crit: 0,
	};

	f.lbp = 0;
	f.donetc = false;

	if (f.charms) {
		if (f.charms.includes("StalwartShell")) f.stats.end += 5;

		if (f.charms.includes("FragileHeart") || f.charms.includes("UnbreakableHeart")) {
			f.maxhp += 50; f.hp += 50;
		}
	}

	if (f.curweapon) {
		let boost = {
			atk: f.curweapon.atk ?? 0,
			mag: f.curweapon.mag ?? 0,
			end: f.curweapon.end ?? 0,
			agl: f.curweapon.agl ?? 0
		}
		for (let i in boost) {
			if (f.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
			if (typeof(f.weaponclass) === 'object') boost[i] = Math.round(boost[i]*0.66666667);
			f.stats[i] += boost[i];
		}

		if (f.curweapon.skill) f.skills.push(f.curweapon.skill);
	}

	if (f.curarmor) {
		let boost = {
			atk: f.curarmor.atk ?? 0,
			mag: f.curarmor.mag ?? 0,
			end: f.curarmor.end ?? 0,
			agl: f.curarmor.agl ?? 0
		}
		for (let i in boost) {
			if (f.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
			f.stats[i] += boost[i];
		}

		if (f.curarmor.skill) f.skills.push(f.curarmor.skill);

		// Wrong Armor Class Drawbacks
		if (f.armorclass === 'none' && f.curarmor.class) {
			if (f.curarmor.class === "light") {
				f.stats.end = Math.max(1, f.stats.end-Math.round(f.level/10));
			} else if (f.curarmor.class === "heavy") {
				f.stats.agl = Math.max(1, f.stats.agl-Math.round(f.level/8));
			} else if (f.curarmor.class === "magic") {
				f.stats.atk = Math.max(1, f.stats.atk-Math.round(f.level/10));
			}
		}
	}

	return true;
}

statWithBuff = (stat, buff) => {
	if (!buff || buff == 0) return stat;

	return Math.round(stat + (buff*(stat/4.5)));
}

buffStat = (f, stat, amount, boosted) => {
	let statBuff = stat.toLowerCase();

	switch(statBuff) {
		case 'all':
			for (let stat of f.buffs) {
				stat += amount;

				console.log(boosted + stat)

				if (boosted || Math.abs(stat) == 4) 
					stat = Math.max(Math.min(stat, 4), -4);
				else 
					stat = Math.max(Math.min(stat, 3), -3);
			}
			break;

		default:
			f.buffs[statBuff] += amount;

			console.log(boosted + f.buffs[statBuff])

			if (boosted || Math.abs(f.buffs[statBuff]) == 4) 
				f.buffs[statBuff] = Math.max(Math.min(f.buffs[statBuff], 4), -4);
			else 
				f.buffs[statBuff] = Math.max(Math.min(f.buffs[statBuff], 3), -3);
	}
}

inflictStatus = (char, status, notxt) => {
	if (!status) return '';
	if (status.toLowerCase() === 'paralysis' || status.toLowerCase() === 'paralyse') status = 'paralyze';
	//same with poison but toxin
	if (status.toLowerCase() === 'poison') status = 'toxin';
	if (!statusEffectFuncs[status.toLowerCase()]) return '';

	// Do we block this status?
	if (hasStatusAffinity(char, status.toLowerCase(), 'block')) 
		return notxt ? '' : `${char.name} blocked the ${statusNames[char.status]}!`;

	// Inflict the status.
	let statusfuncs = statusEffectFuncs[status.toLowerCase()];
	if (statusfuncs.stackable) {
		char[status.toLowerCase()] = statusfuncs.forceturns ?? 3;
	} else {
		char.status = status.toLowerCase();
		char.statusturns = statusfuncs.forceturns ?? 3;
	}

	// OnInflict status hook
	if (statusfuncs.oninflict) statusfuncs.oninflict(char);

	// Status text.
	return notxt ? '' : `${char.name} was inflicted with ${statusNames[status]}!`;
}

getCharFromId = (id, btl) => {
	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			if (btl.teams[i].members[k].id && btl.teams[i].members[k].id == id) return btl.teams[i].members[k];
		}

		// If they're in backup then return "backup"
		for (const k in btl.teams[i].backup) {
			if (btl.teams[i].backup[k].id && btl.teams[i].backup[k].id == id) return "backup";
		}
	}

	return btl.teams[0].members[0];
}

nextAvaliableId = (btl) => {
	let id = 0;
	for (const i in btl.teams) {
		id += btl.teams[i].members.length;
	}

	return id;
}

resetEffects = (char) => {
	if (char.ragesoul) delete char.ragesoul;

	if (char.custom?.orgiamode) {
		char.stats = objClone(char.custom.orgiamode.revert);
		killVar(char, 'orgiamode');
	}

	if (char.custom?.revert) {
		if (char.mimic) delete char.mimic;

		for (let i in char.custom.revert[1]) {
			if (char[i]) char[i] = char.custom.revert[1][i];
		}

		killVar(char, 'revert');
	}
}