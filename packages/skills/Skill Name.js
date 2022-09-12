getFullName = (skillDefs) => {
	let fullName = '';
	
	if (typeof(skillDefs.type) === 'object') {
		for (let type of skillDefs.type) fullName += elementEmoji[type] ?? '';
	} else {
		fullName += elementEmoji[skillDefs.type]
	}

	fullName += skillDefs.name ?? '[No Name?]'
	return fullName;
}

getSkillID = (skill) => {
	skillFile = setUpFile(`${dataPath}/json/skills.json`, true);

	for (let i in skillFile) {
		if (skill === skillFile[i]) {
			return i;
		}
	}

	return skill.name;
}