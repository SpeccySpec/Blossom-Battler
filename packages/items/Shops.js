getShopData = (shopname) => {
	let shopData = setUpFile(`${dataPath}/json/${message.guild.id}/${args[1].id}/shops.json`);
	let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`, true);
	let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`, true);
	let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`, true);

	let shop = shopData[shopname];

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#7aebff')
		.setTitle(shop.name ?? 'Invalid Shop...')

	if (!shop) return DiscordEmbed;

	return DiscordEmbed;
}