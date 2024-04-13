// Get full name of skill including elements.
getFullName = (skillDefs) => {
	if (!skillDefs) return "[INVALID SKILL]";

	let fullName = '';
	if (typeof(skillDefs.type) === 'object') {
		for (let type of skillDefs.type) fullName += elementEmoji[type] ?? '';
	} else {
		fullName += elementEmoji[skillDefs.type]
	}

	fullName += skillDefs.name ?? '[No Name?]'
	return fullName;
}

// Get skill ID
getSkillID = (skill) => {
	skillFile = setUpFile(`${dataPath}/json/skills.json`, true);

	for (let i in skillFile) {
		if (skill === skillFile[i]) {
			return i;
		}
	}

	return skill.name;
}

// Can char afford to use skill? If so, return true.
canAfford = (char, skill, btl) => {
	let cost = parseInt(skill.cost);
	let costtype = skill.costtype;
	if (!costtype) costtype = 'mp';
	let team = btl.teams[char.team];

	if (char.status && ['tired', 'energized'].includes(char.status.toLowerCase())) {
		if (char.status.toLowerCase() == 'tired') {
			if (hasStatusAffinity(char, 'tired', 'resist') || isBoss(char)) cost *= 1.1;
			else if (hasStatusAffinity(char, 'tired', 'weak')) cost *= 1.3;
			else cost *= 1.2;
		}

		if (char.status.toLowerCase() == 'energized') {
			if (hasStatusAffinity(char, 'energized', 'weak') || isBoss(char)) cost *= 0.7;
			else if (hasStatusAffinity(char, 'energized', 'resist')) cost *= 0.9;
			else cost *= 0.8;
		}
	}

	switch(costtype.toLowerCase()) {
		case 'hppercent':
			if (isBoss(char)) return true;
			if (char.hp <= Math.round((char.maxhp/100) * cost)) return false;
			break;

		case 'mppercent':
			if (isBoss(char)) return true;
			if (char.mp < Math.round((char.maxmp/100) * cost)) return false;
			break;

		case 'hpandmppercent':
			if (isBoss(char)) return true;
			if (char.hp <= Math.round((char.maxhp/100) * cost)) return false;
			if (char.mp < Math.round((char.maxmp/100) * cost)) return false;
			break;

		case 'mp':
			if (char.mp < cost) return false;
			break;

		case 'hpandmp':
			if (char.hp <= cost) return false;
			if (char.mp < cost) return false;
			break;
		
		case 'lb':
			if (char.lbp < cost) return false;
			break;

		case 'money':
			if (!team.currency || (team.currency && team.currency < cost)) return false;
			break;

		case 'moneypercent':
			if (!team.currency || (team.currency && team.currency < Math.round((team.maxcur/100) * cost))) return false;
			break;

		default:
			if (char.hp <= cost) return false;
	}

	return true
}

// Can we use this skill?
canUseSkill = (char, skill, skillid, btl) => {
	if (!skill) return false;
	if (!skill.type) return false;

	// Can't use passives.
	if (skill.type === "passive") return false;

	// Statusses
	if (char.status) {
		switch(char.status) {
			case 'silence':
				if (skill.atktype === "magic" || skill.atktype === "sorcery") return false;
				break;

			case 'dazed':
				if (skill.atktype === "physical" || skill.atktype === "ranged") return false;
				break;

			case 'ego':
				if (skill.type === "heal") return false;
				break;

			case 'disabled':
				return false;
				break;
		}
	}

	// Disable.
	if (char.custom?.disable) {
		if (char.custom.disable[0] == skillid) return false;
	}

	return canAfford(char, skill, btl);
}

// Will we die from using this skill?
willNotDieFromSkill = (char, skill) => {
	if (!skill) return true;
	if (!skill.type) return true;
	if (skill.target == 'caster' && skill.pow) return false;

	return true;
}

// Use cost costtype with char.
useCost = (char, cost, costtype, btl) => {
	if (!costtype) costtype === 'mp';
	let team = btl.teams[char.team];

	switch(costtype.toLowerCase()) {
		case 'hppercent':
			if (!isBoss(char)) {
				char.hp = Math.max(1, char.hp - Math.round((char.maxhp/100) * cost));

				if (char?.custom?.unstable?.hp >= 0) {
					char.custom.unstable.hp += Math.round((char.maxhp/100) * cost) * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
				}
			}
			break;

		case 'mppercent':
			if (!isBoss(char)) {
				char.mp = Math.max(0, char.mp - Math.round((char.maxmp/100) * cost));

				if (char?.custom?.unstable?.mp >= 0) {
					char.custom.unstable.mp += Math.round((char.maxmp/100) * cost) * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
				}
			}
			break;

		case 'hpandmppercent':
			if (!isBoss(char)) {
				char.hp = Math.max(1, char.hp - Math.round((char.maxhp/100) * cost));
				char.mp = Math.max(0, char.mp - Math.round((char.maxmp/100) * cost));

				if (char?.custom?.unstable?.hp >= 0) {
					char.custom.unstable.hp += Math.round((char.maxhp/100) * cost) * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
					char.custom.unstable.mp += Math.round((char.maxmp/100) * cost) * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
				}
			}
			break;

		case 'mp':
			char.mp = Math.max(0, char.mp - cost);

			if (char?.custom?.unstable?.mp >= 0) {
				char.custom.unstable.mp += cost * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
			}
			break;

		case 'hpandmp':
			char.mp = Math.max(0, char.mp - cost);
			char.hp = Math.max(1, char.hp - cost);

			if (char?.custom?.unstable?.hp >= 0) {
				char.custom.unstable.hp += cost * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
				char.custom.unstable.mp += cost * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
			}
			break;
		
		case 'lb':
			char.lbp = Math.max(0, char.lbp - cost);

			if (char?.custom?.unstable?.lb >= 0) {
				char.custom.unstable.lb += cost * (hasStatusAffinity(char, 'unstable', 'weak') ? 2 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.5 : 1));
			}
			break;

		case 'money':
			team.currency = Math.max(0, team.currency - cost);

			if (char?.custom?.unstable?.money >= 0) {
				char.custom.unstable.money += cost * (hasStatusAffinity(char, 'unstable', 'weak') ? 3 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.75 : 1.5));
			}
			break;

		case 'moneypercent':
			if (!isBoss(char)) {
				team.currency = Math.max(1, team.currency - Math.round((team.maxcur/100) * cost));

				if (char?.custom?.unstable?.money >= 0) {
					char.custom.unstable.money += Math.round((team.maxcur/100) * cost) * (hasStatusAffinity(char, 'unstable', 'weak') ? 3 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.75 : 1.5));
				}
			}
			break;

		default:
			char.hp = Math.max(1, char.hp - cost);

			if (char?.custom?.unstable?.hp >= 0) {
				char.custom.unstable.hp += cost * (hasStatusAffinity(char, 'unstable', 'weak') ? 1 : (hasStatusAffinity(char, 'unstable', 'resist') ? 0.25 : 0.5));
			}
	}
}