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
	return Math.round(stat + (buff*(stat/4.5)));
}

buffStat = (f, stat, amount) => {
	let statBuff = stat.toLowerCase();
	f.buffs[statBuff] += amount;

	if (f.buffs[statBuff] > 3) f.buffs[statBuff] = 3;
	if (f.buffs[statBuff] < -3) f.buffs[statBuff] = -3;
}

inflictStatus = (char, status) => {
	if (hasStatusAffinity(char, status.toLowerCase(), 'block')) return `${char.name} blocked the ${statusNames[char.status]}!`;

	char.status = status.toLowerCase();
	char.statusturns = statusEffectFuncs[char.status] ? statusEffectFuncs[char.status].forceturns : 3;
	if (statusEffectFuncs[char.status] && statusEffectFuncs[char.status].oninflict)
		statusEffectFuncs[char.status].oninflict(char);

	return `${char.name} was inflicted with ${statusNames[char.status]}!`;
}

getCharFromId = (id, btl) => {
	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			if (btl.teams[i].members[k].id && btl.teams[i].members[k].id == id) return btl.teams[i].members[k];
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
	if (char?.custom?.orgiamode) {
		char.stats = objClone(char.custom.orgiamode.revert);
		killVar(char, 'orgiamode');
	}

	if (char?.custom?.revert) {
		if (char.mimic) delete char.mimic;

		char.stats = objClone(char.custom.revert[1].stats);
		char.skills = char.custom.revert[1].skills;
		char.name = char.custom.revert[1].name;

		delete char.custom.revert;
	}
}