doPassives = (btl) => {
	if (btl.nopassives && getCharFromId(btl.nopassives[1], btl).hp > 0) return false;
	return true;
}

funcsAtBattleStart = (btl) => {
	let psv = null;
	for (let team of btl.teams) {
		for (let char of team.members) {
			if (!char.charms) char.charms = []; // set up charms just incase they aren't

			// Battle Start Passives
			for (let i in char.skills) {
				if (!skillFile[char.skills[i]]) continue;
				if (skillFile[char.skills[i]].type != 'passive') continue;

				psv = skillFile[char.skills[i]];

				for (let k in psv.passive) {
					if (passiveList[k] && passiveList[k].battlestart) {
						if (passiveList[k].multiple) {
							for (let j in psv.passive[k]) {
								passiveList[k].battlestart(char, psv, btl, psv.passive[k][j]);
							}
						} else {
							passiveList[k].battlestart(char, psv, btl, psv.passive[k]);
						}
					}
				}
			}
		}
	}
}