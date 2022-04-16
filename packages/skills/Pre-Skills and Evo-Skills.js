// PreSkill Functions
hasPreSkill = (skill, name) => {
	if (!skill.preskills) return false;

	if (name) {
		for (const i in skill.preskills) {
			if (skill.preskills[i][0] == name) return true;
		}

		return false;
	} else 
		return true;
}

setPreSkill = (skill, preskill, lvl) => {
	if (!skill.preskills) skill.preskills = [];
	skill.preskills.push([preskill, lvl]);

	return [preskill, lvl];
}

preSkillRequest = async(message, args, skill, preskill, id) => {
	let user = await client.users.fetch(id);

	if (preskill.originalAuthor == id) {
		message.channel.send(`${user}, ${message.author} desires to make your skill, ${preskill.name}, the Pre-Skill for ${skill.name}. Will you accept?`);
	} else {
		message.channel.send(`${user}, ${message.author} desires to make your skill, ${skill.name}, have a Pre-Skill to ${preskill.name}. Will you accept?`);
	}

	let givenResponce = false;
	let collector = message.channel.createMessageCollector({ time: 15000 });
	collector.on('collect', m => {
		if (m.author.id == id) {
			if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
				setPreSkill(skill, args[1], parseInt(args[2]));
				message.channel.send(`${preskill.name} will be the Pre-Skill for ${skill.name}.`)
				fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			} else
				message.channel.send(`The user has declined. ${preskill.name} will not be the Pre-Skill for ${skill.name}.`);

			givenResponce = true
			collector.stop()
		}
	});
	collector.on('end', c => {
		if (!givenResponce) message.channel.send(`No response given.\nThe user has declined.`);
	});
}

// EvoSkill Functions
hasEvoSkill = (skill, name) => {
	if (!skill.evoskills) return false;

	if (name) {
		for (const i in skill.evoskills) {
			if (skill.evoskills[i][0] == name) return true;
		}

		return false;
	} else 
		return true;
}

setEvoSkill = (skill, evoskill, lvl) => {
	if (!skill.evoskills) skill.evoskills = [];
	skill.evoskills.push([evoskill, lvl]);

	return [evoskill, lvl];
}

evoSkillRequest = async(message, args, skill, evoskill, id) => {
	let user = await client.users.fetch(id);

	if (evoskill.originalAuthor == id) {
		message.channel.send(`${user}, ${message.author} desires to make your skill, ${evoskill.name}, the Evo-Skill for ${skill.name}. Will you accept?`);
	} else {
		message.channel.send(`${user}, ${message.author} desires to make your skill, ${skill.name}, have a Evo-Skill to ${evoskill.name}. Will you accept?`);
	}

	let givenResponce = false;
	let collector = message.channel.createMessageCollector({ time: 15000 });
	collector.on('collect', m => {
		if (m.author.id == id) {
			if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
				setEvoSkill(skill, args[1], parseInt(args[2]));
				message.channel.send(`${evoskill.name} will be the Evo-Skill for ${skill.name}.`)
				fs.writeFileSync(`${dataPath}/json/skills.json`, JSON.stringify(skillFile, null, '    '));
			} else
				message.channel.send(`The user has declined. ${evoskill.name} will not be the Evo-Skill for ${skill.name}.`);

			givenResponce = true
			collector.stop()
		}
	});
	collector.on('end', c => {
		if (!givenResponce) message.channel.send(`No response given.\nThe user has declined.`);
	});
}