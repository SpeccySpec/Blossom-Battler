// Open Shop
// Can't be done before items are created
// Leave this to me - Spectra
commands.openshop = new Command({
	desc: 'Opens a shop with <Name> at <Channel>, selling all of the <Items> listed!',
	aliases: ['registershop', 'shopopen'],
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		},
		{
			name: "Channel",
			type: "RealChannel",
			forced: true
		},
		{
			name: "Can Sell?",
			type: "YesNo"
		},
		{
			name: "Type, Item #1",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	section: "shops",
	checkban: true,
	admin: "You lack sufficient permissions, I'm so sorry!",
	func: (message, args) => {
		let shopData = setUpFile(`${dataPath}/json/${message.guild.id}/${args[1].id}/shops.json`);
		if (shopData[args[0].toLowerCase()]) return message.channel.send('A shop with the ID of `' + args[0].toLowerCase() + '` already exists!');

		let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`, true);
		let weaponFile = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`, true);
		let armorFile = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`, true);

		let shop = {
			name: args[0],
			cansell: args[2] ?? false,
			items: []
		}

		let itembuild = {};
		for (let i = 3; i <= args.length; i++) {
			if (i%2 == 1) {
				if (!['item', 'weapon', 'armor'].includes(args[i].toLowerCase())) return message.channel.send(`${args[i]} is not a valid item type! Use either ''Item'', ''Weapon'' or ''Armor''.`);
				itembuild.type = args[i].toLowerCase();
			} else {
				switch(itembuild.type) {
					case 'weapon':
						if (!weaponFile[args[i]]) return message.channel.send(`${args[i]} is an invalid Weapon!`);
						itembuild.item = args[i];
						if (weaponFile[args[i]].desc) itembuild.desc = `${(weaponFile[args[i]].desc.length > 100) ? `${weaponFile[args[i]].desc.slice(0, 100)}_..._` : weaponFile[args[i]].desc}`;
						break;

					case 'armor':
						if (!armorFile[args[i]]) return message.channel.send(`${args[i]} is an invalid Armor!`);
						itembuild.item = args[i];
						if (armorFile[args[i]].desc) itembuild.desc = `${(armorFile[args[i]].desc.length > 100) ? `${armorFile[args[i]].desc.slice(0, 100)}_..._` : armorFile[args[i]].desc}`;
						break;

					default:
						if (!itemFile[args[i]]) return message.channel.send(`${args[i]} is an invalid Item!`);
						itembuild.item = args[i];
						if (itemFile[args[i]].desc) itembuild.desc = `${(itemFile[args[i]].desc.length > 100) ? `${itemFile[args[i]].desc.slice(0, 100)}_..._` : itemFile[args[i]].desc}`;
				}
			}

			if (itembuild.type && itembuild.item) {
				shop.items.push(itembuild);
				itembuild = {};
			}
		}

		shopData[args[0].toLowerCase()] = shop;
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${args[1].id}/shops.json`, JSON.stringify(shopData, '	', 4));

		message.channel.send({content: `The shop **${args[0]}** is ready!`, embeds: [getShopData(args[0].toLowerCase())]})
	}
})