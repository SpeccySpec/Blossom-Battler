getTurnOrder = (btl) => {
	let turnorder = [];

	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			turnorder.push(objClone(btl.teams[i].members[k]));
		}
	}

	if (btl.terrain === 'psychic') {
		turnorder.sort(function(a, b) {
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl);
			return agl1 - agl2;
		});
	} else {
		turnorder.sort(function(a, b) {
			let agl1 = statWithBuff(a.stats.agl, a.buffs.agl);
			let agl2 = statWithBuff(b.stats.agl, b.buffs.agl);
			return agl2 - agl1;
		});
	}
	
	let order = [];
	for (let i in turnorder) order[i] = turnorder[i].id;
	
	console.log(order);
	return order;
}

leaderSkillsAtBattleStart = (party) => {
	if (!party.leaderskill)
		return false;

	if (party.leaderskill.type.toLowerCase() == 'buff') {
		for (const ally of party.members) buffStat(ally, party.leaderskill.var1.toLowerCase(), parseInt(party.leaderskill.var2));
		return true;
	}
}