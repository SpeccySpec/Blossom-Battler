let leaderSkillTxt = {
	boost: 'Boosts the specified type.',
	discount: 'Takes away the amount of cost specified to the specified type.',
	buff: 'Start the battle with the specified stat buff',
	status: 'Increased chance to land the specified status effect',
	crit: 'Increased crit chance to the specified element'
}

let usesPercent = {
	buff: false,
	
	boost: true,
	crit: true,
	status: true,
	discount: true
}

partyDesc = (party, message) => {
	let settings = setUpSettings(message.guild.id);
	let chars = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

	let m = '';
	for (const i in party.members) m += `\n${chars[party.members[i]].name}`;
	if (m === '') m = 'Empty...';

	let b = '';
	for (const i in party.backup) b += `\n${chars[party.backup[i]].name}`;
	if (b === '') b = 'No backup.';

	let p = '';
	for (const i in party.negotiateAllies) {
		let petDefs = party.negotiateAllies[i]
		p += `\n${petDefs.name} - ${petDefs.skill}`;
	}

	if (p === '') p = 'No backup.';

	// Items
	let items = '';
	for (const i in party.items) items += `i: ${party.items[i]}\n`;
	if (items === '') items = 'No items.';

	// Weapons and Armor
	let weapons = '';
	let armor = '';

	if (party.weapons) {
		for (const i in party.weapons) {
			let weaponDefs = party.weapons[i]
			weapons += `${i} - **${weaponDefs.atk ? weaponDefs.atk : '0'}ATK**, **${weaponDefs.mag ? weaponDefs.mag : '0'}MAG**\n`;
		}
	}

	if (party.armors) {
		for (const i in party.armors) {
			let armorDefs = party.armors[i]
			armor += `${i} - **${armorDefs.def ? armorDefs.def : '0'}DEF**\n`;
		}
	}

	if (weapons === '') weapons = 'No weapons.';
	if (armor === '') armor = 'No armor.';

	let embedColor = '#e36b2b';
	let leaderSkill = 'No Leader Skill...?';
	if (chars[party.members[0]]) {
		let char = chars[party.members[0]];
		embedColor = elementColors[char.mainElement] ?? '#e36b2b';
		leaderSkill = `**${[char.leaderskill.name.toUpperCase()]}**\n_${leaderSkillTxt[char.leaderskill.type]}_\n${char.leaderskill.var2}${(usesPercent[char.leaderskill.type] == true) ? '%' : ''} ${char.leaderskill.type} toward ${char.leaderskill.var1.toUpperCase()}`
	}

	return new Discord.MessageEmbed()
		.setColor(embedColor)
		.setTitle(`Team ${party.name}`)
		.setDescription(leaderSkill)
		.addFields(
			{ name: 'Members', value: `${m}\n\n**${party.currency} ${settings.currency}s**`, inline: true },
			{ name: 'Items', value: items, inline: true },
			{ name: 'Backup', value: b, inline: true },
			{ name: 'Pets', value: p, inline: true },
			{ name: 'Weapons', value: weapons, inline: true },
			{ name: 'Armors', value: armor, inline: true }
		)
}