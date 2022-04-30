longBio = (char, server) => {
	let finalTxt = `<Name> ${char.name}\n`;
	if (char.nickname) finalTxt += `<Nickname> ${char.nickname}\n`;
	if (char.bio.species) finalTxt += `<Species> ${char.bio.species}\n`;
	if (char.bio.height) finalTxt += `<Height> ${char.bio.height[0]}'${char.bio.height[1]}"\n`;
	if (char.bio.weight) finalTxt += `<Height> ${char.bio.weight}lb\n`;
	if (char.bio.age) finalTxt += `<Age> ${char.bio.age} Years Old\n`;

	finalTxt += '\n';

	if (char.bio.info) {
		let infoTxt = '';
		if (char.bio.info.length > 100) infoTxt = `${char.bio.info.splice(0, 100)}_..._`
		finalTxt += `**<Info>** ${infoTxt}\n`;
	}

	if (char.bio.backstory) {
		let infoTxt = '';
		if (char.bio.backstory.length > 120) infoTxt = `${char.bio.backstory.splice(0, 120)}_..._`
		finalTxt += `**<Backstory>** ${infoTxt}\n`;
	}

	finalTxt += '\n';

	if (char.bio.likes) finalTxt += `\n**<Likes>** ${char.bio.likes}\n`;
	if (char.bio.dislikes) finalTxt += `\n**<Dislikes>** ${char.bio.dislikes}\n`;
	if (char.bio.fears) finalTxt += `\n**<Fears>** ${char.bio.fears}\n`;

	if (char.bio.custom) {
		finalTxt += '\n';
		for (const i in char.bio.custom) {
			let infoTxt = '';
			if (char.bio.custom[i].length > 150) infoTxt = `${char.bio.custom[i].splice(0, 150)}_..._`
			finalTxt += `**<${i}>** ${infoTxt}\n`;
		}
	}

	finalTxt += '\n';
	
	if (char.bio.voice) finalTxt += `\n**<Voice>** ${char.bio.voice}\n`;
	if (char.bio.theme) finalTxt += `\n**<Theme(s)>** ${char.bio.theme}\n`;

	return new Discord.MessageEmbed()
		.setColor('#12de6a')
		.setTitle(`${char.name}'s Bio`)
		.setDescription(finalTxt)
}

shortBio = (char, sect, server) => {
	let bioTxt = char.bio.custom[sect] ?? char.bio[sect];

	return new Discord.MessageEmbed()
		.setColor('#12de6a')
		.setTitle(`${char.name}'s Bio`)
		.setDescription(bioTxt)
}