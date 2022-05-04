partyDesc = (party, message) => {
	let m = '';
	for (const i in party.members) m += `\n${party.members[i]}`;
	if (m === '') m = 'Empty...';

	let b = '';
	for (const i in party.backup) b += `\n${party.backup[i]}`;
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

	return new Discord.MessageEmbed()
		.setColor('#e36b2b')
		.setTitle(`Team ${arg[1]}`)
		.addFields(
			{ name: 'Members', value: `${m}\n\n**${party.currency} ${settings.currency}s**`, inline: true },
			{ name: 'Items', value: items, inline: true },
			{ name: 'Backup', value: b, inline: true },
			{ name: 'Pets', value: p, inline: true },
			{ name: 'Weapons', value: weapons, inline: true },
			{ name: 'Armors', value: armor, inline: true }
		)
}