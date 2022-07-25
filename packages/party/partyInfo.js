let leaderSkillTxt = {
	boost: 'Boosts the specified type.',
	discount: 'Takes away the amount of cost specified to the specified type.',
	buff: 'Start the battle with the specified stat buff',
	status: 'Increased chance to land the specified status effect',
	crit: 'Increased crit chance to the specified element',
	money: 'Increased money gain after battle.',
	items: 'Increased items gain after battle.',
	pacify: 'Pacify Enemies by the specified percentage at the start of battle.',
	endure: 'Endure one fatal attack.',
}

let usesPercent = {
	buff: false,
	
	boost: true,
	crit: true,
	status: true,
	discount: true,
	money: true,
	items: true,
	pacify: true,
	endure: true,
}

partyDesc = (party, message) => {
	let settings = setUpSettings(message.guild.id);
	let chars = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

	// Show Leader Skill
	let embedColor = '#e36b2b';
	let leaderSkill = 'No Leader Skill...?';
	if (chars[party.members[0]]) {
		let char = chars[party.members[0]];
		embedColor = elementColors[char.mainElement] ?? '#e36b2b';

		if (char.leaderskill) leaderSkill = `**${[char.leaderskill.name.toUpperCase()]}**\n_${leaderSkillTxt[char.leaderskill.type]}_\n${char.leaderskill.var2}${(usesPercent[char.leaderskill.type] == true) ? '%' : ''} ${char.leaderskill.type} toward ${char.leaderskill.var1.toUpperCase()}`
	}

	// okay here's the embed :)
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(embedColor)
		.setTitle(`Team ${party.name}`)
		.setDescription(leaderSkill)
		.addFields();

	// Members
	if (party.members && party.members.length > 0) {
		let members = '';
		for (const i in party.members) members += `\n[**${i}**] ${chars[party.members[i]].name}`;
	
		DiscordEmbed.fields.push({ name: 'Team Members', value: members, inline: true });
	}

	// Backup
	if (party.backup && party.backup.length > 0) {
		let members = '';
		for (const i in party.backup) members += `\n[**${i}**] ${chars[party.backup[i]].name}`;

		DiscordEmbed.fields.push({ name: 'Backup Members', value: members, inline: true });
	}

	// Pets
	if (party.negotiateAllies) {
		let p = '';
		for (const i in party.negotiateAllies) {
			let petDefs = party.negotiateAllies[i];
			p += `\n${petDefs.nickname}${(petDefs.nickname != i) ? (" (" + i + ")") : ""} - ${petDefs.skill}`;
		}

		if (p != '') DiscordEmbed.fields.push({ name: 'Pets', value: p, inline: true });
	}

	let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`);
	let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`);
	let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`);

	// Items
	let items = '';
	for (const i in party.items) items += `${itemTypeEmoji[itemFile[i]?.type] ?? ''} ${itemRarityEmoji[itemFile[i]?.rarity] ?? ''}${i}: ${party.items[i]}\n`;

	if (items != '') DiscordEmbed.fields.push({ name: 'Items', value: items, inline: true });

	// Weapons and Armor
	let weapons = '';
	let armor = '';

	if (party.weapons) {
		for (const i in party.weapons) {
			let weaponDefs = party.weapons[i];
			weapons += `${elementEmoji[weaponDefs.element]} ${i} - **${weaponDefs.atk ? weaponDefs.atk : '0'}ATK**, **${weaponDefs.mag ? weaponDefs.mag : '0'}MAG**\n`;
		}
	}

	if (party.armors) {
		for (const i in party.armors) {
			let armorDefs = party.armors[i];
			armor += `${elementEmoji[armorDefs.element]} ${i} - **${armorDefs.def ? armorDefs.def : '0'}DEF**\n`;
		}
	}

	if (weapons != '') DiscordEmbed.fields.push({ name: 'Weapons', value: weapons, inline: true });
	if (armor != '') DiscordEmbed.fields.push({ name: 'Armors', value: armor, inline: true });

	return DiscordEmbed;
}