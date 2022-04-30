longBio = (char, server) => {
	let finalTxt = `<Name> ${char.name}\n`;
	if (char.nickname) finalTxt += `<Nickname> ${char.nickname}\n`;
	if (char.bio.species) finalTxt += `<Species> ${char.bio.species}\n`;
	if (char.bio.height) finalTxt += `<Height> ${char.bio.height[0]}'${char.bio.height[1]}"\n`;
	if (char.bio.weight) finalTxt += `<Height> ${char.bio.weight}lb\n`;
	if (char.bio.age) finalTxt += `<Age> ${char.bio.age} Years Old\n`;

	finalTxt += '\n';

	if (char.bio.info) {
		let infoTxt = char.bio.info;
		if (infoTxt.length > 100) infoTxt = `${infoTxt.slice(0, 100)}_..._`
		finalTxt += `**<Info>** ${infoTxt}\n`;
	}

	if (char.bio.backstory) {
		let infoTxt = char.bio.backstory;
		if (infoTxt.length > 120) infoTxt = `${infoTxt.slice(0, 120)}_..._`
		finalTxt += `**<Backstory>** ${infoTxt}\n`;
	}

	finalTxt += '\n';

	if (char.bio.likes) finalTxt += `<Likes> ${char.bio.likes}\n`;
	if (char.bio.dislikes) finalTxt += `<Dislikes> ${char.bio.dislikes}\n`;
	if (char.bio.fears) finalTxt += `<Fears> ${char.bio.fears}\n`;

	if (char.bio.custom) {
		finalTxt += '\n';
		for (const i in char.bio.custom) {
			let infoTxt = char.bio.custom[i];
			if (infoTxt.length > 150) infoTxt = `${infoTxt.slice(0, 150)}_..._`
			finalTxt += `<${i}> ${infoTxt}\n`;
		}
	}

	finalTxt += '\n';
	
	if (char.bio.voice) finalTxt += `<Voice> ${char.bio.voice}\n`;
	if (char.bio.theme) finalTxt += `<Theme(s)> ${char.bio.theme}\n`;

	return new Discord.MessageEmbed()
		.setColor('#12de6a')
		.setTitle(`${char.name}'s Bio`)
		.setDescription(finalTxt)
}

shortBio = (char, sect, server) => {
	var bioTxt;
	if (char.bio.custom)
		bioTxt = char.bio.custom[sect] ?? char.bio[sect];
	else
		bioTxt = char.bio[sect];

	return new Discord.MessageEmbed()
		.setColor('#12de6a')
		.setTitle(`${char.name}'s Bio`)
		.setDescription(bioTxt)
}