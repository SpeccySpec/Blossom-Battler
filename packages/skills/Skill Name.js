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