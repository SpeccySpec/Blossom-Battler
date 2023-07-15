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
canAfford = (char, skill) => {
	let cost = parseInt(skill.cost);
	let costtype = skill.costtype;
	if (!costtype) costtype = 'mp';

	switch(costtype.toLowerCase()) {
		case 'hppercent':
			if (isBoss(char)) return true;
			if (char.hp <= Math.round((char.maxhp/100) * cost)) return false;
			break;

		case 'mppercent':
			if (isBoss(char)) return true;
			if (char.mp < Math.round((char.maxmp/100) * cost)) return false;
			break;

		case 'mp':
			if (char.mp < cost) return false;
			break;
		
		case 'lb':
			if (char.lbp < cost) return false;
			break;

		default:
			if (char.hp <= cost) return false;
	}

	return true
}

// Can we use this skill?
canUseSkill = (char, skill) => {
	if (!skill) return false;
	if (!skill.type) return false;

	// Can't use passives.
	if (skill.type === "passive") return false;

	// Statusses
	if (char.status) {
		switch(char.status) {
			case 'silence':
				if (skill.atktype === "magic") return false;
				break;

			case 'dazed':
				if (skill.atktype === "physical" || skill.atktype === "ranged") return false;
				break;

			case 'ego':
				if (skill.type === "heal") return false;
				break;
		}
	}

	return canAfford(char, skill);
}

// Will we die from using this skill?
willNotDieFromSkill = (char, skill) => {
	if (!skill) return true;
	if (!skill.type) return true;
	if (skill.target == 'caster' && skill.pow) return false;

	return true;
}

// Use cost costtype with char.
useCost = (char, cost, costtype) => {
	if (!costtype) costtype === 'mp';

	switch(costtype.toLowerCase()) {
		case 'hppercent':
			if (!isBoss(char)) char.hp = Math.max(1, char.hp - Math.round((char.maxhp/100) * cost));
			break;

		case 'mppercent':
			if (!isBoss(char)) char.mp = Math.max(0, char.mp - Math.round((char.maxmp/100) * cost));
			break;

		case 'mp':
			char.mp = Math.max(0, char.mp - cost);
			break;
		
		case 'lb':
			char.lbp = Math.max(0, char.lbp - cost);
			break;

		default:
			char.hp = Math.max(1, char.hp - cost);
	}
}