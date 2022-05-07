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