longBio = (char, server) => {
	let finalTxt = `**<Name>** ${char.name}\n`;
	if (char.nickname) finalTxt += `**<Nickname>** ${char.nickname}\n`;
	if (char.bio.fullname) finalTxt += `**<Full Name>** ${char.bio.fullname}\n`;
	if (char.bio.species) finalTxt += `**<Species>** ${char.bio.species}\n`;
	if (char.bio.gender) finalTxt += `**<Gender>** ${char.bio.gender == 'male' ? '<:male:973077052079083570>' : char.bio.gender == 'male' ? '<:female:973077052049719306>' : 'Other'}\n`
	if (char.bio.height) finalTxt += `**<Height>** ${typeof char.bio.height == 'object' ? `${char.bio.height[0]}'${char.bio.height[1]}"`: `${char.bio.height}m`}\n`;
	if (char.bio.weight) finalTxt += `**<Weight>** ${char.bio.weight}lb\n`;
	if (char.bio.age) finalTxt += `**<Age>** ${char.bio.age} Years Old\n`;

	finalTxt += '\n';

	if (char.bio.info) {
		let infoTxt = char.bio.info;
		if (infoTxt.length > 300) infoTxt = `${infoTxt.slice(0, 175)}_..._`
		finalTxt += `**<Info>** ${infoTxt}\n`;
	}

	if (char.bio.backstory) {
		let infoTxt = char.bio.backstory;
		if (infoTxt.length > 500) infoTxt = `${infoTxt.slice(0, 250)}_..._`
		finalTxt += `**<Backstory>** ${infoTxt}\n`;
	}

	finalTxt += '\n';

	if (char.bio.likes) finalTxt += `**<Likes>** ${char.bio.likes}\n`;
	if (char.bio.dislikes) finalTxt += `**<Dislikes>** ${char.bio.dislikes}\n`;
	if (char.bio.fears) finalTxt += `**<Fears>** ${char.bio.fears}\n`;

	if (char.bio.custom) {
		finalTxt += '\n';
		for (const i in char.bio.custom) {
			let infoTxt = char.bio.custom[i];
			if (infoTxt.length > 300) infoTxt = `${infoTxt.slice(0, 150)}_..._`
			finalTxt += `**<${i}>** ${infoTxt}\n`;
		}
	}

	finalTxt += '\n';
	
	if (char.bio.voice) finalTxt += `**<Voice>** ${char.bio.voice}\n`;
	if (char.bio.theme) finalTxt += `**<Theme(s)>** ${char.bio.theme}\n`;


	let embed = new Discord.MessageEmbed()
		.setColor('#12de6a')
		.setTitle(`${char.name}'s Bio`)
		.setDescription(finalTxt)

		if (char.bio.appearance) embed.setThumbnail(char.bio.appearance);

	return embed;
}

shortBio = (char, sect, server) => {
	var bioTxt;
	if (char.bio.custom[sect])
		bioTxt = char.bio.custom[sect] ?? char.bio[sect];
	else {
		if (sect == 'height') {
			bioTxt = `${typeof char.bio[sect] == 'object' ? `${char.bio[sect][0]}'${char.bio[sect][1]}"`: `${char.bio[sect]}m`}`;
		} else if (sect == 'weight') {
			bioTxt = `${char.bio[sect]}lb`;
		} else if (sect == 'age') {
			bioTxt = `${char.bio[sect]} Years Old`;
		} else if (sect == 'gender') {
			bioTxt = `${char.bio[sect] == 'male' ? `<:male:970044964870434836>` : char.bio[sect] == 'male' ? `<:female:970044964992090142>` : 'Other'}`
		} else {
			bioTxt = char.bio[sect];
		}
	}

	return new Discord.MessageEmbed()
		.setColor('#12de6a')
		.setTitle(`${char.name}'s Bio`)
		.setDescription(bioTxt)
}