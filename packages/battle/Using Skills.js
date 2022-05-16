canUseLb = (char, btl) => {
	let settings = setUpSettings(btl.guild.id);
	if (!settings.mechanics.limitbreaks) return false;

	// We'll sort this out later.
	return false;
}

// Is this a tech
function isTech(charDefs, element) {
	if (!charDefs.status) return false;
	if (charDefs.status === 'sleep' || charDefs.status === 'blind') return true;

	for (let i in elementTechs[charDefs.status]) {
		let techElement = elementTechs[charDefs.status][i];
		if (typeof element == 'string') {
			if (element == techElement) return true;
		} else {
			for (let k in element) {
				if (element[k] == techElement) return true;
			}
		}
	}

	return false;
}


// Is the status effect physical?
function isPhysicalStatus(status) {
	if (!status) return false;
	let statusName = status.toLowerCase();

	return (statusName === 'burn' || statusName === 'bleed' || statusName === 'freeze' || statusName === 'paralyze' || statusName === 'poison' || statusName === 'hunger' || statusName === 'dazed' || statusName === 'irradiated' || statusName === 'mirror' || statusName === 'blind');
}

useCost = (char, cost, costtype) => {
	if (cost && costtype) {
		if (costtype === "hp" && !char.boss)
			char.hp = Math.max(1, char.hp - cost);
		else if (costtype === "hppercent" && !char.boss)
			char.hp = Math.round(Math.max(1, char.hp - ((char.maxhp / 100) * cost)));
		else if (costtype === "mp")
			char.mp = Math.max(0, char.mp - cost);
		else if (costtype === "mppercent" && !char.boss)
			char.mp = Math.round(Math.max(0, char.mp - ((char.maxmp / 100) * cost)));
	}
	
	return true
}

// Placeholder
genDmg = (char, targ, skill) => {
	return randNum(char.level+20)+randNum(skill.pow/4);
}

attackWithSkill = (char, targ, skill, btl) => {
	const result = {
		txt: ``,
		oneMore: false,
		teamCombo: false
	}

	// Healing Skills
	if (skill.type === 'heal') {
		if (skill.heal) {
			for (let i in skill.heal) {
				if (!healList[i]) continue;
				if (!healList[i].onuse) continue;

				if (healList[i].multiple) {
					for (let k in skill.heal[i]) {
						result.txt += `${healList[i].onuse(char, targ, skill, btl, skill.heal[i][k])}\n`;
					}
				} else {
					result.txt += `${healList[i].onuse(char, targ, skill, btl, skill.heal[i])}\n`;
				}
			}
		}
	// Status Skills
	} else if (skill.type === 'status') {
		if (skill.statusses) {
			for (let i in skill.statusses) {
				if (!statusList[i]) continue;
				if (!statusList[i].onuse) continue;

				if (statusList[i].multiple) {
					for (let k in skill.statusses[i]) {
						result.txt += `${statusList[i].onuse(char, targ, skill, btl, skill.statusses[i][k])}\n`;
					}
				} else {
					result.txt += `${statusList[i].onuse(char, targ, skill, btl, skill.statusses[i])}\n`;
				}
			}
		}
	// Attacking Skills
	} else {
		// Override
		if (skill.extras) {
			let returnThis = false;

			for (let i in skill.extras) {
				if (!extrasList[i]) continue;
				if (!extrasList[i].onuseoverride) continue;

				if (extrasList[i].multiple) {
					for (let k in skill.extras[i]) {
						result.txt += `${extrasList[i].onuseoverride(char, targ, btl, skill.extras[i][k])}\n`;
						return true;
					}
				} else {
					result.txt += `${extrasList[i].onuseoverride(char, targ, btl, skill.extras[i])}\n`;
					return true;
				}
			}

			if (returnThis) return result;
		}

		// Placeholder damage formula
		let dmg = genDmg(char, targ, skill)
		result.txt += `${targ.name} took ${dmg} damage!`;
	}

	return result;
}

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
	
	// more shit
	let skillCost = skill.cost;
	if (party.leaderskill.type === 'discount') {
	}

	// Who will this skill target? Each index of "targets" is [ID, Power Multiplier].
	let targets = [];
	let possible = [];
	
	// (easy access)
	let party = btl.teams[char.team];

	// Insert IDs into the target.
	switch(skill.target.toLowerCase()) {
		case 'one':
		case 'ally':
			let targ = btl.teams[act.target[0]].members[act.target[1]] ?? btl.teams[0].members[0];
			targets.push([targ.id, 1]);
			break;

		case 'caster':
			targets.push([char.id, 1]);
			break;

		case 'allopposing':
			for (let i in btl.teams) {
				if (char.team == i) continue;
				
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0) targets.push([btl.teams[i].members[k].id, 1]);
			}
			break;

		case 'allallies':
			for (let i in party.members)
				if (party.members[i].hp > 0) targets.push([party.members[i].id, 1]);
			break;

		case 'randomopposing':
			for (let i in btl.teams) {
				if (char.team == i) continue;
				
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0) possible.push(btl.teams[i].members[k].id);
			}

			for (let i = 0; i < skill.hits; i++)
				targets.push([possible[randNum(possible.length-1)] ?? possible[0], 1]);

			skill.hits = 1; // make the skill one hit now.
			break;

		case 'randomallies':
			while (targets.length < skill.hits) {
				let charDefs = party.members[randNum(party.members.length-1)];
				if (charDefs && charDefs.hp > 0) targets.push([charDefs.id, 1]);
			}

			skill.hits = 1; // make the skill one hit now.
			break;

		case 'random':
			for (let i in btl.teams) {
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0 && btl.teams[i].members[k].id != char.id) possible.push(btl.teams[i].members[k].id);
			}

			for (let i = 0; i < skill.hits; i++)
				targets.push([possible[randNum(possible.length-1)] ?? possible[0], 1]);

			skill.hits = 1; // make the skill one hit now.
			break;

		case 'everyone':
			for (let i in btl.teams) {
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0 && btl.teams[i].members[k].id != char.id) targets.push([btl.teams[i].members[k].id, 1]);
			}
			break;

		case 'spreadallies':
		case 'spreadopposing':
			targets.push([btl.teams[act.target[0]].members[act.target[1]].id, 1]);
			if (btl.teams[act.target[0]].members[act.target[1]-1] && btl.teams[act.target[0]].members[act.target[1]-1].hp > 0) targets.push([btl.teams[act.target[0]].members[act.target[1]-1].id, 0.6666666666666666]);
			if (btl.teams[act.target[0]].members[act.target[1]+1] && btl.teams[act.target[0]].members[act.target[1]+1].hp > 0) targets.push([btl.teams[act.target[0]].members[act.target[1]+1].id, 0.6666666666666666]);
			break;
	}

	let targTxt = `__${char.name}__ => `;
	let finalText = `_${char.name}_ used _${skill.name}_!`;

	if (targets.length <= 1) 
		targTxt += `__${getCharFromId(targets[0][0], btl).name}__`;
	else {
		if (skill.target === 'allallies' || skill.target === 'spreadallies') {
			targTxt += '__Allies__'
		} else if (skill.target === 'everyone') {
			targTxt += '__Everyone__'
		} else if (skill.target === 'random' || skill.target === 'randomopposing') {
			targTxt += '__???__'
		} else {
			targTxt += '__Foes__'
		}
	}

	if (skill.heal) {
		for (let i in skill.heal) {
			if (healList[i].override) {
				if (healList[i].multiple) {
					for (let k in skill.heal[i]) {
						finalText += healList[i].override(char, skill, btl, skill.heal[i][k]);
					}
				} else {
					finalText += healList[i].override(char, skill, btl, skill.heal[i]);
				}

				// Take away the cost
				useCost(char, skillCost, skill.costtype);

				// Now, send the embed!
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor(elementColors[char.mainElement] ?? elementColors.strike)
					.setTitle(targTxt)
					.setDescription(finalText)
				return btl.channel.send({embeds: [DiscordEmbed]});
			}
		}
	}

	for (let i in targets) {
		let targ = getCharFromId(targets[i][0], btl);
		let skillDefs = objClone(skill);
		skillDefs.pow *= targets[i][1];

		let result = attackWithSkill(char, targ, skillDefs, btl);
		finalText += result.txt;

		if (result.oneMore) btl.doonemore = true;
		if (result.teamCombo) btl.canteamcombo = true;
	}

	// Take away the cost
	useCost(char, skillCost, skill.costtype);

	// Now, send the embed!
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[char.mainElement] ?? elementColors.strike)
		.setTitle(targTxt)
		.setDescription(finalText)
	btl.channel.send({embeds: [DiscordEmbed]});

	// return true or something
	return true;
}