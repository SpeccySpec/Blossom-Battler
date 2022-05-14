useSkill = (charDefs, btl, act) => {
	let char = objClone(charDefs);
	let skill = objClone(skillFile[act.index]);

	// First, we modify stats via passives n shit. This isn't the actual character anyway so we don't care.

	// Failsafe
	if (!skill.hits) skill.hits = 1;

	// Passives
	for (let psv of char.skills) {
		if (psv.type != 'passive' || !psv.passive) continue;

		for (let i in psv.passive) {
			if (passiveList[i] && passiveList[i].statmod) {
				if (passiveList[i].multiple) {
					for (let k in psv.passive[i]) passiveList[i].statmod(btl, char, skill, psv.passive[i][k]);
				} else
					passiveList[i].statmod(btl, char, skill, psv.passive[i]);
			}
		}
	}

	// Status Effects
	if (char.status && statusEffectFuncs[char.status].statmod)
		char.stats = statusEffectFuncs[char.status].statmod(char, char.stats);

	// Buffs
	let statUse = ['atk', 'mag', 'prc', 'end', 'agl', 'luk'];
	let buffStats = ['atk', 'mag', 'prc', 'end', 'agl', 'crit'];
	for (let i in statUse) char.stats[i] = statWithBuff(char.stats[i], char.buffs[buffStats[i]]);

	// Attack Extras
	if (skill.extras) {
		for (let i in skill.extras) {
			if (extrasList[i] && extrasList[i].statmod) {
				if (extrasList[i].multiple) {
					for (let k in skill.extras) extrasList[i].statmod(char, skill, skill.extras[i][k], btl)
				} else
					extrasList[i].statmod(char, skill, skill.extras[i], btl)
			}
		}
	}
}