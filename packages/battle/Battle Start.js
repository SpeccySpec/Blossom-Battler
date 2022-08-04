doPassives = (btl) => {
	if (btl.nopassives && getCharFromId(btl.nopassives[1], btl).hp > 0) return false;
	return true;
}

funcsAtBattleStart = (btl) => {
	// Battle Start Passives
	for (let team of btl.teams) {
		for (let char of team.members) {
			for (let i in char.skills) {
				if (!skillFile[char.skills[i]]) continue;
				if (skillFile[char.skills[i]].type != 'passive') continue;

				for (let k in skillFile[char.skills[i]].passive) {
					if (passiveList[k] && passiveList[k].battlestart) {
						passiveList[k].battlestart(char, skillFile[char.skills[i]], btl, skillFile[char.skills[i]].passive[k]);
					}
				}
			}
		}
	}
}