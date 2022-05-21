setupBattleStats = (f) => {
	f.buffs = {
		atk: 0,
		mag: 0,
		end: 0,
		prc: 0,
		agl: 0,
		crit: 0,
	};

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

resetEffects = (char) => {
}